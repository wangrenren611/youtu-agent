/**
 * 代理系统通用类和工具
 */

/**
 * 消息类型枚举
 */
export enum MessageType {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
  FUNCTION = 'function'
}

/**
 * 消息接口
 */
export interface Message {
  /**
   * 消息类型
   */
  type: MessageType;
  
  /**
   * 消息内容
   */
  content: string;
  
  /**
   * 消息ID
   */
  id?: string;
  
  /**
   * 消息创建时间
   */
  createdAt?: Date;
  
  /**
   * 消息元数据
   */
  metadata?: Record<string, any>;
  
  /**
   * 工具调用信息
   */
  toolCalls?: ToolCall[];
  
  /**
   * 工具调用ID
   */
  toolCallId?: string;
  
  /**
   * 工具名称
   */
  toolName?: string;
}

/**
 * 工具调用接口
 */
export interface ToolCall {
  /**
   * 工具调用ID
   */
  id: string;
  
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具参数
   */
  arguments: Record<string, any>;
  
  /**
   * 工具调用结果
   */
  result?: any;
}

/**
 * 工具接口
 */
export interface Tool {
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具描述
   */
  description: string;
  
  /**
   * 工具参数模式
   */
  parameterSchema?: Record<string, any>;
  
  /**
   * 执行工具
   * @param args 工具参数
   * @param context 执行上下文
   */
  execute(args: Record<string, any>, context?: any): Promise<any>;
}

/**
 * 代理上下文接口
 */
export interface AgentContext {
  /**
   * 消息历史
   */
  messages: Message[];
  
  /**
   * 记忆存储
   */
  memory: Map<string, any>;
}

/**
 * 代理配置接口
 */
export interface AgentConfig {
  /**
   * 模型配置
   */
  model?: {
    /**
     * 模型名称
     */
    name: string;
    
    /**
     * 模型提供商
     */
    provider: string;
    
    /**
     * 模型参数
     */
    parameters?: Record<string, any>;
  };
  
  /**
   * 工具配置
   */
  tools?: {
    /**
     * 是否启用工具
     */
    enabled: boolean;
    
    /**
     * 允许的工具列表
     */
    allowedTools?: string[];
  };
  
  /**
   * 环境配置
   */
  env?: Record<string, any>;
  
  /**
   * 追踪配置
   */
  tracing?: {
    /**
     * 是否启用追踪
     */
    enabled: boolean;
    
    /**
     * 追踪级别
     */
    level?: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * 运行选项接口
 */
export interface RunOptions {
  /**
   * 超时时间（毫秒）
   */
  timeout?: number;
  
  /**
   * 是否流式输出
   */
  stream?: boolean;
  
  /**
   * 是否缓存结果
   */
  cache?: boolean;
  
  /**
   * 其他选项
   */
  [key: string]: any;
}

/**
 * 任务记录器
 * 用于记录任务执行过程和结果
 */
export class TaskRecorder {
  /**
   * 输入数据
   */
  input: any;
  
  /**
   * 追踪ID
   */
  traceId: string;
  
  /**
   * 运行结果列表
   */
  runResults: any[] = [];
  
  /**
   * 最终输出
   */
  finalOutput: any = null;
  
  /**
   * 开始时间
   */
  startTime: Date;
  
  /**
   * 结束时间
   */
  endTime?: Date;
  
  /**
   * 任务状态
   */
  status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
  
  /**
   * 错误信息
   */
  error?: Error;

  /**
   * 构造函数
   * @param input 输入数据
   * @param traceId 追踪ID
   */
  constructor(input: any, traceId: string) {
    this.input = input;
    this.traceId = traceId;
    this.startTime = new Date();
  }

  /**
   * 添加运行结果
   * @param result 运行结果
   */
  addRunResult(result: any): void {
    this.runResults.push(result);
  }

  /**
   * 设置最终输出
   * @param output 最终输出
   */
  setFinalOutput(output: any): void {
    this.finalOutput = output;
    this.endTime = new Date();
    this.status = 'completed';
  }
  
  /**
   * 设置错误
   * @param error 错误对象
   */
  setError(error: Error): void {
    this.error = error;
    this.endTime = new Date();
    this.status = 'failed';
  }
  
  /**
   * 开始任务
   */
  start(): void {
    this.status = 'running';
  }
  
  /**
   * 获取任务执行时间（毫秒）
   */
  getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }
}