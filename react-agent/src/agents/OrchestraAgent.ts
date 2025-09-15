/**
 * 编排代理类
 * 实现多代理编排功能，协调多个代理完成复杂任务
 */
import { BaseAgent } from './BaseAgent';
import { TaskRecorder, AgentConfig, Message, MessageType, RunOptions } from './common';
import { BaseEnv } from '../env/BaseEnv';
import { v4 as uuidv4 } from 'uuid';
import { SimpleAgent } from './SimpleAgent';

/**
 * 编排代理类
 * 实现多代理编排功能，协调多个代理完成复杂任务
 */
export class OrchestraAgent extends BaseAgent {
  /**
   * 子代理映射表
   */
  private subAgents: Map<string, BaseAgent> = new Map();

  /**
   * 构造函数
   * @param name 代理名称
   * @param config 代理配置
   * @param env 代理环境
   */
  constructor(name: string, config: AgentConfig, env?: BaseEnv) {
    super(name, config, env);
    this.description = '编排代理，协调多个代理完成复杂任务';
  }

  /**
   * 构建代理
   * 在代理使用前进行初始化
   */
  async build(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('orchestraAgent.build', { agentName: this.name });
    }

    // 初始化工具
    await this.initTools();
    
    // 初始化子代理
    await this.initSubAgents();

    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }

  /**
   * 初始化子代理
   */
  private async initSubAgents(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('orchestraAgent.initSubAgents', { agentName: this.name });
    }

    // 这里应该根据配置初始化子代理
    // 实际实现需要根据配置进行适配
    // 这里仅作为示例，创建一个默认的简单代理
    const defaultAgent = new SimpleAgent('default', this.config, this.env);
    await defaultAgent.build();
    this.addSubAgent(defaultAgent);

    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }

  /**
   * 添加子代理
   * @param agent 代理实例
   */
  addSubAgent(agent: BaseAgent): void {
    this.subAgents.set(agent.name, agent);
  }

  /**
   * 获取子代理
   * @param name 代理名称
   */
  getSubAgent(name: string): BaseAgent | undefined {
    return this.subAgents.get(name);
  }

  /**
   * 运行代理
   * @param input 输入数据
   * @param traceId 追踪ID
   * @param options 运行选项
   */
  async run(input: any, traceId?: string, options?: RunOptions): Promise<TaskRecorder> {
    // 生成追踪ID
    const runTraceId = traceId || uuidv4();
    
    // 创建任务记录器
    const recorder = new TaskRecorder(input, runTraceId);
    recorder.start();

    try {
      if (this.tracer) {
        await this.tracer.startSpan('orchestraAgent.run', { 
          agentName: this.name,
          traceId: runTraceId
        });
      }

      // 解析任务，确定执行计划
      const plan = await this.planExecution(input);
      
      // 记录执行计划
      recorder.addRunResult({ type: 'plan', plan });
      
      // 执行计划
      const result = await this.executePlan(plan, runTraceId, options);
      
      // 记录结果
      recorder.addRunResult(result);
      recorder.setFinalOutput(result);

      if (this.tracer) {
        await this.tracer.endSpan();
      }

      return recorder;
    } catch (error) {
      if (this.tracer) {
        await this.tracer.recordError(error as Error);
        await this.tracer.endSpan();
      }

      recorder.setError(error as Error);
      return recorder;
    }
  }

  /**
   * 规划执行计划
   * @param input 输入数据
   */
  private async planExecution(input: any): Promise<any> {
    // 这里应该实现任务分解和规划逻辑
    // 实际实现可能需要调用规划模型或使用预定义的规则
    // 这里仅作为示例，返回一个简单的执行计划
    
    // 如果输入是字符串，尝试解析为JSON
    let parsedInput = input;
    if (typeof input === 'string') {
      try {
        parsedInput = JSON.parse(input);
      } catch (e) {
        // 解析失败，保持原始输入
      }
    }
    
    // 如果输入包含明确的执行计划，直接使用
    if (parsedInput && typeof parsedInput === 'object' && parsedInput.plan) {
      return parsedInput.plan;
    }
    
    // 否则，创建默认计划
    return {
      steps: [
        {
          agentName: 'default',
          input: input,
          description: '使用默认代理处理任务'
        }
      ]
    };
  }

  /**
   * 执行计划
   * @param plan 执行计划
   * @param traceId 追踪ID
   * @param options 运行选项
   */
  private async executePlan(plan: any, traceId: string, options?: RunOptions): Promise<any> {
    const results: any[] = [];
    
    // 执行每个步骤
    for (const step of plan.steps) {
      if (this.tracer) {
        await this.tracer.startSpan('orchestraAgent.executeStep', { 
          step: step.description || step.agentName,
          traceId
        });
      }
      
      // 获取执行代理
      const agent = this.getSubAgent(step.agentName);
      if (!agent) {
        throw new Error(`找不到代理: ${step.agentName}`);
      }
      
      // 准备输入
      const stepInput = this.prepareStepInput(step, results);
      
      // 执行代理
      const stepRecorder = await agent.run(stepInput, `${traceId}-${results.length}`, options);
      
      // 记录结果
      const stepResult = {
        step: step.description || step.agentName,
        output: stepRecorder.finalOutput,
        status: stepRecorder.status,
        duration: stepRecorder.getDuration()
      };
      
      results.push(stepResult);
      
      if (this.tracer) {
        await this.tracer.endSpan();
      }
      
      // 如果步骤执行失败，中断执行
      if (stepRecorder.status === 'failed') {
        throw new Error(`步骤执行失败: ${step.description || step.agentName}`);
      }
    }
    
    // 合并结果
    return this.mergeResults(results);
  }

  /**
   * 准备步骤输入
   * @param step 执行步骤
   * @param previousResults 之前步骤的结果
   */
  private prepareStepInput(step: any, previousResults: any[]): any {
    // 如果步骤定义了明确的输入，直接使用
    if (step.input !== undefined) {
      return step.input;
    }
    
    // 如果步骤定义了依赖的步骤，使用依赖步骤的输出
    if (step.dependsOn !== undefined) {
      const dependencyIndex = typeof step.dependsOn === 'number' 
        ? step.dependsOn 
        : previousResults.findIndex((r: any) => r.step === step.dependsOn);
      
      if (dependencyIndex >= 0 && dependencyIndex < previousResults.length) {
        return previousResults[dependencyIndex].output;
      }
    }
    
    // 默认使用最后一个步骤的输出
    if (previousResults.length > 0) {
      return previousResults[previousResults.length - 1].output;
    }
    
    // 没有可用的输入
    return null;
  }

  /**
   * 合并结果
   * @param results 所有步骤的结果
   */
  private mergeResults(results: any[]): any {
    // 这里应该实现结果合并逻辑
    // 实际实现可能需要根据任务类型进行不同的合并
    // 这里仅作为示例，返回所有结果的数组
    
    // 如果只有一个结果，直接返回
    if (results.length === 1) {
      return results[0].output;
    }
    
    // 否则，返回所有结果的数组
    return {
      steps: results.map(r => ({
        step: r.step,
        output: r.output,
        status: r.status,
        duration: r.duration
      })),
      finalOutput: results[results.length - 1].output
    };
  }

  /**
   * 清理代理资源
   */
  async cleanup(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('orchestraAgent.cleanup', { agentName: this.name });
    }
    
    // 清理子代理资源
    for (const agent of this.subAgents.values()) {
      await agent.cleanup();
    }
    
    // 清空子代理映射表
    this.subAgents.clear();
    
    // 调用父类清理方法
    await super.cleanup();
    
    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }
}