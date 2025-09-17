/**
 * 基础工具处理器
 * 
 * 提供通用的错误处理和日志记录功能，为所有工具处理器提供统一的基类。
 * 包含标准化的响应格式、错误处理和日志记录方法。
 * 
 * @example
 * ```typescript
 * class MyToolHandler extends BaseToolHandler {
 *   constructor() {
 *     super('MyTool');
 *   }
 *   
 *   async handle(args: Record<string, unknown>): Promise<string> {
 *     return this.wrapHandler(async (args) => {
 *       // 工具逻辑
 *       return this.createSuccessResponse(result);
 *     })(args);
 *   }
 * }
 * ```
 */

import { ToolHandler } from '../types';
import { Logger } from '../utils/Logger';

export abstract class BaseToolHandler {
  protected readonly logger: Logger;

  constructor(toolName: string) {
    this.logger = new Logger(toolName);
  }

  /**
   * 包装工具处理器，提供统一的错误处理和日志记录
   */
  protected wrapHandler(handler: (args: Record<string, unknown>) => Promise<string>): ToolHandler {
    return async (args: Record<string, unknown>) => {
      try {
        this.logger.debug('工具调用开始:', args);
        const result = await handler(args);
        this.logger.debug('工具调用成功');
        return result;
      } catch (error) {
        this.logger.error('工具调用失败:', error, {
          args: args
        });
        // 额外输出错误信息到控制台，确保能看到
        console.error('工具调用详细错误:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          args: args
        });
        return this.createErrorResponse(error);
      }
    };
  }

  /**
   * 创建标准化的错误响应
   */
  protected createErrorResponse(error: unknown): string {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 创建标准化的成功响应
   */
  protected createSuccessResponse(data: unknown): string {
    return JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录操作开始
   */
  protected logOperationStart(operation: string, details?: unknown): void {
    this.logger.info(`${operation}开始`, details);
  }

  /**
   * 记录操作成功
   */
  protected logOperationSuccess(operation: string, details?: unknown): void {
    this.logger.info(`${operation}成功`, details);
  }

  /**
   * 记录操作失败
   */
  protected logOperationError(operation: string, error: unknown, details?: unknown): void {
    this.logger.error(`${operation}失败`, { error, details });
  }
}
