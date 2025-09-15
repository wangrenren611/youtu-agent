/**
 * 基础智能体类
 * 定义了所有智能体的通用接口和行为
 */

import { EventEmitter } from 'events';
import { AgentConfig, TaskRecorder, Message, AgentError } from '../../types';
import { Logger } from '../../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';
import { ToolManager } from '../tool/ToolManager';

export abstract class BaseAgent extends EventEmitter {
  protected readonly config: AgentConfig;
  protected readonly logger: Logger;
  protected readonly toolManager: ToolManager;
  protected readonly configManager: ConfigManager;
  protected isInitialized: boolean = false;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.logger = new Logger(`Agent:${config.name}`);
    this.toolManager = new ToolManager();
    this.configManager = new ConfigManager();
  }

  /**
   * 初始化智能体
   * 子类可以重写此方法来实现特定的初始化逻辑
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('正在初始化智能体...');
      
      // 加载工具
      if (this.config.tools && this.config.tools.length > 0) {
        // 工具加载逻辑 - 暂时跳过，因为ToolManager没有loadTools方法
        // await this.toolManager.loadTools(this.config.tools);
      }

      // 执行子类特定的初始化
      await this.onInitialize();

      this.isInitialized = true;
      this.logger.info('智能体初始化完成');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('智能体初始化失败:', error);
      throw new AgentError(
        `智能体初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'INITIALIZATION_FAILED',
        error
      );
    }
  }

  /**
   * 运行智能体
   * @param input 输入内容
   * @param traceId 追踪ID
   * @returns 任务记录器
   */
  async run(input: string, traceId?: string): Promise<TaskRecorder> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recorder = this.createTaskRecorder(input, traceId);
    
    try {
      this.logger.info(`开始执行任务: ${input}`);
      this.emit('task_start', recorder);

      // 执行子类特定的运行逻辑
      const result = await this.execute(input, recorder);
      
      recorder.output = result;
      recorder.status = 'completed';
      recorder.endTime = new Date();

      this.logger.info('任务执行完成');
      this.emit('task_completed', recorder);
      
      return recorder;
    } catch (error) {
      recorder.status = 'failed';
      recorder.error = error instanceof Error ? error.message : '未知错误';
      recorder.endTime = new Date();

      this.logger.error('任务执行失败:', error);
      this.emit('task_failed', recorder);
      
      throw error;
    }
  }

  /**
   * 流式运行智能体
   * @param input 输入内容
   * @param traceId 追踪ID
   * @returns 异步生成器，产生流式结果
   */
  async* runStream(input: string, traceId?: string): AsyncGenerator<Message, void, unknown> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recorder = this.createTaskRecorder(input, traceId);
    
    try {
      this.logger.info(`开始流式执行任务: ${input}`);
      this.emit('stream_start', recorder);

      // 执行子类特定的流式运行逻辑
      for await (const message of this.executeStream(input, recorder)) {
        recorder.messages.push(message);
        this.emit('stream_message', message);
        yield message;
      }

      recorder.status = 'completed';
      recorder.endTime = new Date();

      this.logger.info('流式任务执行完成');
      this.emit('stream_completed', recorder);
    } catch (error) {
      recorder.status = 'failed';
      recorder.error = error instanceof Error ? error.message : '未知错误';
      recorder.endTime = new Date();

      this.logger.error('流式任务执行失败:', error);
      this.emit('stream_failed', recorder);
      
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      this.logger.info('正在清理智能体资源...');
      await this.onCleanup();
      this.toolManager.cleanup();
      this.isInitialized = false;
      this.logger.info('智能体资源清理完成');
    } catch (error) {
      this.logger.error('智能体资源清理失败:', error);
    }
  }

  /**
   * 获取智能体配置
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * 获取智能体名称
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * 获取智能体类型
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * 检查智能体是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 创建任务记录器
   */
  protected createTaskRecorder(input: string, traceId?: string): TaskRecorder {
    return {
      id: traceId || this.generateTraceId(),
      input,
      messages: [],
      toolCalls: [],
      startTime: new Date(),
      status: 'pending'
    };
  }

  /**
   * 生成追踪ID
   */
  protected generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 子类需要实现的抽象方法
   */
  protected abstract onInitialize(): Promise<void>;
  protected abstract execute(input: string, recorder: TaskRecorder): Promise<string>;
  protected abstract executeStream(input: string, recorder: TaskRecorder): AsyncGenerator<Message, void, unknown>;
  protected abstract onCleanup(): Promise<void>;
}
