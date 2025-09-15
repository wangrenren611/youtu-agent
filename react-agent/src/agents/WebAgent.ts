/**
 * Web代理模块
 * 提供Web浏览和交互功能的代理
 */
import { BaseAgent } from './BaseAgent';
import { LLMAgent } from './LLMAgent';
import { BrowserEnv } from '../env/BrowserEnv';
import { WebTool } from '../tools/WebTool';
import { TaskRecorder } from './common';
import { getLogger } from '../utils/logger';
import { getTracer, TraceEventType } from '../tracing/Tracer';

const logger = getLogger('WebAgent');
const tracer = getTracer();

/**
 * Web代理配置接口
 */
export interface WebAgentConfig {
  /**
   * 代理名称
   */
  name?: string;
  
  /**
   * LLM代理配置
   */
  llmConfig: any;
  
  /**
   * 浏览器环境配置
   */
  browserConfig?: any;
  
  /**
   * Web工具配置
   */
  webToolConfig?: any;
  
  /**
   * 最大步骤数
   */
  maxSteps?: number;
}

/**
 * Web代理类
 * 结合LLM和浏览器环境，提供Web浏览和交互功能
 */
export class WebAgent extends BaseAgent {
  /**
   * LLM代理
   */
  private llmAgent: LLMAgent;
  
  /**
   * 浏览器环境
   */
  private browserEnv: BrowserEnv;
  
  /**
   * Web工具
   */
  private webTool: WebTool;
  
  /**
   * 任务记录器
   */
  private taskRecorder: TaskRecorder;
  
  /**
   * 最大步骤数
   */
  private maxSteps: number;

  /**
   * 构造函数
   * @param config Web代理配置
   */
  constructor(config: WebAgentConfig) {
    super(config.name || 'WebAgent');
    
    // 创建LLM代理
    this.llmAgent = new LLMAgent(config.llmConfig);
    
    // 创建浏览器环境
    this.browserEnv = new BrowserEnv(config.browserConfig);
    
    // 创建Web工具
    this.webTool = new WebTool(config.webToolConfig);
    
    // 创建任务记录器
    this.taskRecorder = new TaskRecorder();
    
    // 设置最大步骤数
    this.maxSteps = config.maxSteps || 10;
    
    logger.info('Web代理已初始化');
  }

  /**
   * 构建代理
   */
  async build(): Promise<void> {
    try {
      // 构建LLM代理
      await this.llmAgent.build();
      
      // 构建浏览器环境
      await this.browserEnv.build();
      
      // 构建Web工具
      await this.webTool.build();
      
      // 初始化任务记录器
      this.taskRecorder.init();
      
      this.isBuilt = true;
    } catch (error) {
      throw new Error(`构建Web代理失败: ${error}`);
    }
  }

  /**
   * 清理代理
   */
  async cleanup(): Promise<void> {
    // 清理浏览器环境
    await this.browserEnv.cleanup();
    
    // 清理LLM代理
    await this.llmAgent.cleanup();
    
    await super.cleanup();
    
    logger.info('Web代理已清理');
  }

  /**
   * 执行任务
   * @param task 任务描述
   * @param options 执行选项
   */
  async run(task: string, options: WebAgentRunOptions = {}): Promise<WebAgentResult> {
    if (!this.isBuilt) {
      throw new Error('Web代理尚未构建，请先调用build()方法');
    }
    
    logger.info(`开始执行任务: ${task}`);
    tracer.record(TraceEventType.AGENT_START, this.name, { task });
    
    try {
      // 开始任务记录
      const taskId = this.taskRecorder.recordTaskStart(task);
      
      // 设置最大步骤数
      const maxSteps = options.maxSteps || this.maxSteps;
      let currentStep = 0;
      
      // 导航到初始URL（如果提供）
      if (options.initialUrl) {
        await this.browserEnv.navigate(options.initialUrl);
        
        // 记录观察
        const observation = await this.browserEnv.getObservation();
        this.taskRecorder.recordObservation(taskId, observation);
      }
      
      // 设置LLM代理指令
      await this.llmAgent.setInstructions(`
        你是一个Web浏览代理，可以通过浏览器环境执行各种Web任务。
        你可以访问网页、点击元素、填写表单、提取信息等。
        请根据用户的任务要求，规划并执行必要的步骤。
        
        当前任务: ${task}
      `);
      
      // 执行任务步骤
      let isDone = false;
      
      while (currentStep < maxSteps && !isDone) {
        currentStep++;
        logger.info(`执行步骤 ${currentStep}/${maxSteps}`);
        
        // 获取当前观察
        const observation = await this.browserEnv.observe();
        
        // 记录观察
        this.taskRecorder.recordObservation(taskId, observation);
        tracer.record(TraceEventType.ENV_OBSERVATION, this.name, observation);
        
        // 让LLM代理决定下一步行动
        const llmResponse = await this.llmAgent.run(
          JSON.stringify({
            task,
            step: currentStep,
            maxSteps: maxSteps,
            currentUrl: observation.url,
            pageTitle: observation.title,
            // 不包含完整内容和截图，避免token过多
            contentSummary: `页面内容长度: ${observation.content.length} 字符`
          })
        );
        
        // 解析LLM响应
        let action;
        try {
          action = JSON.parse(llmResponse);
        } catch (error) {
          logger.error(`解析LLM响应失败: ${error}`);
          action = { type: 'error', message: '无法解析响应' };
        }
        
        // 记录行动
        this.taskRecorder.recordAction(taskId, action);
        tracer.record(TraceEventType.ENV_ACTION, this.name, action);
        
        // 检查是否完成任务
        if (action.type === 'done') {
          isDone = true;
          this.taskRecorder.setFinalOutput(taskId, action.result || '任务完成');
          continue;
        }
        
        // 执行行动
        try {
          await this.browserEnv.executeAction(action);
        } catch (error) {
          logger.error(`执行行动失败: ${error}`);
          this.taskRecorder.recordError(taskId, `执行行动失败: ${error}`);
          
          // 如果配置了失败时停止，则中断执行
          if (options.stopOnError) {
            break;
          }
        }
      }
      
      // 检查是否达到最大步骤数
      if (currentStep >= maxSteps && !isDone) {
        logger.warn('达到最大步骤数，任务未完成');
        this.taskRecorder.setFinalOutput(taskId, '达到最大步骤数，任务未完成');
      }
      
      // 完成任务
      this.taskRecorder.recordTaskEnd(taskId);
      
      // 返回任务结果
      return this.taskRecorder.getTaskResult(taskId);
    } catch (error) {
      logger.error(`任务执行失败: ${error}`);
      tracer.record(TraceEventType.ERROR, this.name, { error: error.message });
      throw error;
    } finally {
      tracer.record(TraceEventType.AGENT_END, this.name, { task });
    }
  }
}