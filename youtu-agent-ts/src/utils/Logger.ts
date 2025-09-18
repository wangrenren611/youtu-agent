/**
 * 日志工具类
 * 提供统一的日志记录功能
 */

import * as winston from 'winston';
import * as path from 'path';
import { inspect } from 'util';

export class Logger {
  private readonly logger: winston.Logger;
  private readonly context: string;

  constructor(context: string = 'App') {
    this.context = context;
    this.logger = this.createLogger();
  }

  /**
   * 创建Winston日志器
   */
  private createLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, context, meta, error }) => {
        const ctx = context || this.context;
        let msg = message;
        
        // 如果有错误堆栈，添加到消息中
        if (stack) {
          msg = `${msg}\n${stack}`;
        }
        
        // 如果有错误对象，格式化并添加到消息中
        if (error) {
          const errorStr = typeof error === 'object' ? inspect(error, { depth: 5, colors: false }) : String(error);
          msg = `${msg} ${errorStr}`;
        }
        
        // 如果有meta数据，将其格式化并添加到消息中
        if (meta) {
          const metaStr = typeof meta === 'object' ? inspect(meta, { depth: 3, colors: false }) : String(meta);
          msg = `${msg} ${metaStr}`;
        }
        
        return `[${timestamp}] [${level.toUpperCase()}] [${ctx}] ${msg}`;
      })
    );

    const transports: winston.transport[] = [
      // 控制台输出
      new winston.transports.Console({
        level: process.env['LOG_LEVEL'] || 'info',
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      })
    ];

    // 文件输出
    if (process.env['NODE_ENV'] === 'production') {
      const logDir = process.env['LOG_DIR'] || './logs';
      
      // 错误日志
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        })
      );

      // 综合日志
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        })
      );
    }

    return winston.createLogger({
      level: process.env['LOG_LEVEL'] || 'info',
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  /**
   * 记录调试信息
   * @param message 消息
   * @param meta 元数据
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, { context: this.context, meta });
  }

  /**
   * 记录信息
   * @param message 消息
   * @param meta 元数据
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, { context: this.context, meta });
  }

  /**
   * 记录警告
   * @param message 消息
   * @param meta 元数据
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, { context: this.context, meta });
  }

  /**
   * 记录错误
   * @param message 消息
   * @param error 错误对象
   * @param meta 元数据
   */
  error(message: string, error?: any, meta?: any): void {
    const logData: any = { context: this.context, meta };
    
    if (error instanceof Error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (error) {
      logData.error = error;
    }
    
    this.logger.error(message, logData);
  }

  /**
   * 记录性能指标
   * @param operation 操作名称
   * @param duration 持续时间（毫秒）
   * @param meta 元数据
   */
  performance(operation: string, duration: number, meta?: any): void {
    this.info(`性能指标: ${operation}`, {
      operation,
      duration,
      ...meta
    });
  }

  /**
   * 记录追踪信息
   * @param traceId 追踪ID
   * @param event 事件名称
   * @param meta 元数据
   */
  trace(traceId: string, event: string, meta?: any): void {
    this.debug(`追踪: ${event}`, {
      traceId,
      event,
      ...meta
    });
  }

  /**
   * 创建子日志器
   * @param subContext 子上下文
   * @returns 新的日志器实例
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`);
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  setLevel(level: string): void {
    this.logger.level = level;
  }

  /**
   * 获取当前日志级别
   * @returns 日志级别
   */
  getLevel(): string {
    return this.logger.level;
  }
}