/**
 * 数据库追踪处理器
 * 将追踪数据存储到数据库中
 */

import { DatabaseManager } from './DatabaseManager';
import { Logger } from '../utils/Logger';

export interface TraceEvent {
  id: string;
  traceId: string;
  eventType: string;
  timestamp: Date;
  data: Record<string, unknown>;
  duration?: number;
}

export interface SpanData {
  id: string;
  traceId: string;
  spanId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  data: Record<string, unknown>;
  type: 'function' | 'generation' | 'tool';
}

export class DBTracingProcessor {
  private readonly logger: Logger;
  private readonly dbManager: DatabaseManager;
  private enabled: boolean = false;

  constructor(dbManager: DatabaseManager) {
    this.logger = new Logger('DBTracingProcessor');
    this.dbManager = dbManager;
    this.initialize();
  }

  /**
   * 初始化追踪处理器
   */
  private async initialize(): Promise<void> {
    try {
      const isConnected = await this.dbManager.checkConnection();
      if (!isConnected) {
        this.logger.warn('数据库连接不可用，追踪数据将不会存储到数据库');
        this.enabled = false;
      } else {
        this.enabled = true;
        this.logger.info('数据库追踪处理器已启用');
      }
    } catch (error) {
      this.logger.error('数据库追踪处理器初始化失败:', error);
      this.enabled = false;
    }
  }

  /**
   * 处理追踪开始事件
   */
  async onTraceStart(traceId: string, _data: Record<string, unknown>): Promise<void> {
    if (!this.enabled) return;

    try {
      this.logger.debug(`追踪开始: ${traceId}`);
      // 可以在这里记录追踪开始的信息
    } catch (error) {
      this.logger.error('处理追踪开始事件失败:', error);
    }
  }

  /**
   * 处理追踪结束事件
   */
  async onTraceEnd(traceId: string, _data: Record<string, unknown>): Promise<void> {
    if (!this.enabled) return;

    try {
      this.logger.debug(`追踪结束: ${traceId}`);
      // 可以在这里记录追踪结束的信息
    } catch (error) {
      this.logger.error('处理追踪结束事件失败:', error);
    }
  }

  /**
   * 处理Span开始事件
   */
  async onSpanStart(spanData: SpanData): Promise<void> {
    if (!this.enabled) return;

    try {
      this.logger.debug(`Span开始: ${spanData.name} (${spanData.spanId})`);
      // Span开始通常不需要存储，只在结束时存储
    } catch (error) {
      this.logger.error('处理Span开始事件失败:', error);
    }
  }

  /**
   * 处理Span结束事件
   */
  async onSpanEnd(spanData: SpanData): Promise<void> {
    if (!this.enabled) return;

    try {
      this.logger.debug(`Span结束: ${spanData.name} (${spanData.spanId})`);

      switch (spanData.type) {
        case 'function':
        case 'tool':
          await this.storeToolTracing(spanData);
          break;
        case 'generation':
          await this.storeGenerationTracing(spanData);
          break;
        default:
          this.logger.warn(`未知的Span类型: ${spanData.type}`);
      }
    } catch (error) {
      this.logger.error('处理Span结束事件失败:', error);
    }
  }

  /**
   * 存储工具追踪数据
   */
  private async storeToolTracing(spanData: SpanData): Promise<void> {
    try {
      const input = spanData.data['input'] as Record<string, unknown> | undefined;
      const output = spanData.data['output'] as Record<string, unknown> | undefined;
      const mcpData = spanData.data['mcp_data'] as Record<string, unknown> | undefined;

      await this.dbManager.insertToolTracing({
        traceId: spanData.traceId,
        spanId: spanData.spanId,
        name: spanData.name,
        input: input || undefined,
        output: output || undefined,
        mcpData: mcpData || undefined
      });

      this.logger.debug(`工具追踪数据已存储: ${spanData.name}`);
    } catch (error) {
      this.logger.error('存储工具追踪数据失败:', error);
    }
  }

  /**
   * 存储生成追踪数据
   */
  private async storeGenerationTracing(spanData: SpanData): Promise<void> {
    try {
      const input = spanData.data['input'] as Record<string, unknown> | undefined;
      const output = spanData.data['output'] as Record<string, unknown> | undefined;
      const usage = spanData.data['usage'] as {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      } | undefined;
      const model = spanData.data['model'] as string || 'unknown';

      await this.dbManager.insertGenerationTracing({
        traceId: spanData.traceId,
        spanId: spanData.spanId,
        model,
        input: input || undefined,
        output: output || undefined,
        usage: usage || undefined
      });

      this.logger.debug(`生成追踪数据已存储: ${spanData.name}`);
    } catch (error) {
      this.logger.error('存储生成追踪数据失败:', error);
    }
  }

  /**
   * 处理工具缓存
   */
  async onToolCache(
    functionName: string,
    args: unknown[],
    kwargs: Record<string, unknown>,
    result: unknown,
    executionTime: number
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const cacheKey = this.generateCacheKey(functionName, args, kwargs);
      const timestamp = Date.now();
      const datetime = new Date().toISOString();

      await this.dbManager.insertToolCache({
        function: functionName,
        args: JSON.stringify(args),
        kwargs: JSON.stringify(kwargs),
        result: result as Record<string, unknown>,
        cacheKey,
        timestamp,
        datetime,
        executionTime
      });

      this.logger.debug(`工具缓存已存储: ${functionName}`);
    } catch (error) {
      this.logger.error('存储工具缓存失败:', error);
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(functionName: string, args: unknown[], kwargs: Record<string, unknown>): string {
    const argsStr = JSON.stringify(args);
    const kwargsStr = JSON.stringify(kwargs);
    return `${functionName}:${argsStr}:${kwargsStr}`;
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 启用追踪
   */
  enable(): void {
    this.enabled = true;
    this.logger.info('数据库追踪已启用');
  }

  /**
   * 禁用追踪
   */
  disable(): void {
    this.enabled = false;
    this.logger.info('数据库追踪已禁用');
  }
}
