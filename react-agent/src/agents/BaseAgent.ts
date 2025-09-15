/**
 * 基础代理类
 * 所有代理类型都应该继承这个基类
 */
import { TaskRecorder, AgentContext, AgentConfig, Tool, Message, RunOptions } from './common';
import { BaseTool } from '../tools/BaseTool';
import { BaseEnv } from '../env/BaseEnv';
import { BaseConfig } from '../config/BaseConfig';
import { Tracer } from '../tracing/Tracer';

/**
 * 基础代理抽象类
 */
export abstract class BaseAgent {
  /**
   * 代理名称
   */
  name: string;
  
  /**
   * 代理描述
   */
  description?: string;
  
  /**
   * 代理配置
   */
  config: AgentConfig;
  
  /**
   * 代理环境
   */
  env?: BaseEnv;
  
  /**
   * 代理工具集
   */
  tools: Map<string, BaseTool> = new Map();
  
  /**
   * 代理上下文
   */
  context: AgentContext = { messages: [], memory: new Map() };
  
  /**
   * 追踪器
   */
  tracer?: Tracer;

  /**
   * 构造函数
   * @param name 代理名称
   * @param config 代理配置
   * @param env 代理环境
   */
  constructor(name: string, config: AgentConfig, env?: BaseEnv) {
    this.name = name;
    this.config = config;
    this.env = env;
  }

  /**
   * 运行代理
   * @param input 输入数据
   * @param traceId 追踪ID
   * @param options 运行选项
   */
  abstract async run(input: any, traceId?: string, options?: RunOptions): Promise<TaskRecorder>;

  /**
   * 构建代理
   * 在代理使用前进行初始化
   */
  async build(): Promise<void> {
    // 默认实现为空，子类可以覆盖
    if (this.tracer) {
      await this.tracer.startSpan('agent.build', { agentName: this.name });
    }
    
    // 初始化工具
    await this.initTools();
    
    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }

  /**
   * 清理代理资源
   * 在代理使用后进行清理
   */
  async cleanup(): Promise<void> {
    // 默认实现为空，子类可以覆盖
    if (this.tracer) {
      await this.tracer.startSpan('agent.cleanup', { agentName: this.name });
    }
    
    // 清理工具资源
    for (const tool of this.tools.values()) {
      await tool.cleanup();
    }
    
    // 清理上下文
    this.context.messages = [];
    this.context.memory.clear();
    
    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }
  
  /**
   * 初始化工具
   */
  protected async initTools(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('agent.initTools', { agentName: this.name });
    }
    
    // 子类应该实现具体的工具初始化逻辑
    
    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }
  
  /**
   * 添加工具
   * @param tool 工具实例
   */
  addTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }
  
  /**
   * 获取工具
   * @param name 工具名称
   */
  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * 添加消息到上下文
   * @param message 消息对象
   */
  addMessage(message: Message): void {
    this.context.messages.push(message);
  }
  
  /**
   * 获取上下文消息
   * @param limit 限制返回的消息数量
   */
  getMessages(limit?: number): Message[] {
    if (limit && limit > 0) {
      return this.context.messages.slice(-limit);
    }
    return [...this.context.messages];
  }
  
  /**
   * 设置上下文记忆
   * @param key 键
   * @param value 值
   */
  setMemory(key: string, value: any): void {
    this.context.memory.set(key, value);
  }
  
  /**
   * 获取上下文记忆
   * @param key 键
   */
  getMemory(key: string): any {
    return this.context.memory.get(key);
  }
  
  /**
   * 设置追踪器
   * @param tracer 追踪器实例
   */
  setTracer(tracer: Tracer): void {
    this.tracer = tracer;
  }
}