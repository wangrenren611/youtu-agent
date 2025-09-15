/**
 * 追踪系统模块
 * 提供代理执行过程的追踪和记录功能
 */
import { getLogger } from '../utils/logger';

const logger = getLogger('Tracer');

/**
 * 追踪事件类型
 */
export enum TraceEventType {
  AGENT_START = 'agent_start',
  AGENT_END = 'agent_end',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  LLM_CALL = 'llm_call',
  LLM_RESULT = 'llm_result',
  ENV_ACTION = 'env_action',
  ENV_OBSERVATION = 'env_observation',
  ERROR = 'error',
  INFO = 'info'
}

/**
 * 追踪事件接口
 */
export interface TraceEvent {
  /**
   * 事件类型
   */
  type: TraceEventType;
  
  /**
   * 事件时间戳
   */
  timestamp: number;
  
  /**
   * 事件来源
   */
  source: string;
  
  /**
   * 事件数据
   */
  data: any;
}

/**
 * 追踪器配置接口
 */
export interface TracerConfig {
  /**
   * 是否启用追踪
   */
  enabled: boolean;
  
  /**
   * 是否保存到文件
   */
  saveToFile: boolean;
  
  /**
   * 文件保存路径
   */
  filePath?: string;
  
  /**
   * 是否记录LLM调用内容
   */
  recordLLMContent: boolean;
}

/**
 * 默认追踪器配置
 */
const DEFAULT_CONFIG: TracerConfig = {
  enabled: true,
  saveToFile: false,
  recordLLMContent: true
};

/**
 * 追踪器类
 */
export class Tracer {
  /**
   * 追踪器配置
   */
  private config: TracerConfig;
  
  /**
   * 追踪事件列表
   */
  private events: TraceEvent[] = [];
  
  /**
   * 会话ID
   */
  private sessionId: string;

  /**
   * 构造函数
   * @param config 追踪器配置
   */
  constructor(config: Partial<TracerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    logger.info(`追踪器已初始化，会话ID: ${this.sessionId}`);
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 记录追踪事件
   * @param type 事件类型
   * @param source 事件来源
   * @param data 事件数据
   */
  record(type: TraceEventType, source: string, data: any): void {
    if (!this.config.enabled) {
      return;
    }
    
    // 如果不记录LLM内容，则过滤掉LLM调用的详细内容
    if (!this.config.recordLLMContent && 
        (type === TraceEventType.LLM_CALL || type === TraceEventType.LLM_RESULT)) {
      data = { ...data };
      
      if (data.messages) {
        data.messages = '[已过滤]';
      }
      
      if (data.content) {
        data.content = '[已过滤]';
      }
    }
    
    const event: TraceEvent = {
      type,
      timestamp: Date.now(),
      source,
      data
    };
    
    this.events.push(event);
    
    // 记录到日志
    logger.debug(`追踪事件: ${type} - ${source}`);
    
    // 保存到文件
    if (this.config.saveToFile && this.config.filePath) {
      this.saveToFile();
    }
  }

  /**
   * 保存追踪事件到文件
   */
  private saveToFile(): void {
    // 实际实现中，这里应该将事件保存到文件
    // 为简化示例，这里只记录日志
    logger.info(`追踪事件已保存到文件: ${this.config.filePath}`);
  }

  /**
   * 获取所有追踪事件
   */
  getEvents(): TraceEvent[] {
    return [...this.events];
  }

  /**
   * 清除所有追踪事件
   */
  clear(): void {
    this.events = [];
    logger.info('追踪事件已清除');
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * 全局追踪器实例
 */
let globalTracer: Tracer | null = null;

/**
 * 获取全局追踪器
 */
export function getTracer(): Tracer {
  if (!globalTracer) {
    globalTracer = new Tracer();
  }
  
  return globalTracer;
}

/**
 * 设置全局追踪器
 * @param tracer 追踪器实例
 */
export function setTracer(tracer: Tracer): void {
  globalTracer = tracer;
}