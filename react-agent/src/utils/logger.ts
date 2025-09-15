/**
 * 日志工具模块
 * 提供统一的日志记录功能
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /**
   * 日志级别
   */
  level: LogLevel;
  
  /**
   * 是否在控制台输出
   */
  console: boolean;
  
  /**
   * 是否包含时间戳
   */
  timestamp: boolean;
  
  /**
   * 是否包含日志级别
   */
  showLevel: boolean;
  
  /**
   * 是否包含模块名称
   */
  showModule: boolean;
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  console: true,
  timestamp: true,
  showLevel: true,
  showModule: true
};

/**
 * 全局日志配置
 */
let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * 日志记录器类
 */
export class Logger {
  /**
   * 模块名称
   */
  private module: string;
  
  /**
   * 日志配置
   */
  private config: LoggerConfig;

  /**
   * 构造函数
   * @param module 模块名称
   * @param config 日志配置
   */
  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.config = { ...globalConfig, ...(config || {}) };
  }

  /**
   * 格式化日志消息
   * @param level 日志级别
   * @param message 日志消息
   */
  private format(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    // 添加时间戳
    if (this.config.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    // 添加日志级别
    if (this.config.showLevel) {
      parts.push(`[${LogLevel[level]}]`);
    }
    
    // 添加模块名称
    if (this.config.showModule) {
      parts.push(`[${this.module}]`);
    }
    
    // 添加消息
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   */
  private log(level: LogLevel, message: string): void {
    // 检查日志级别
    if (level < this.config.level) {
      return;
    }
    
    const formattedMessage = this.format(level, message);
    
    // 输出到控制台
    if (this.config.console) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }
  }

  /**
   * 记录调试日志
   * @param message 日志消息
   */
  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  /**
   * 记录信息日志
   * @param message 日志消息
   */
  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  /**
   * 记录警告日志
   * @param message 日志消息
   */
  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  /**
   * 记录错误日志
   * @param message 日志消息
   */
  error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }
}

/**
 * 设置全局日志配置
 * @param config 日志配置
 */
export function setGlobalLogConfig(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * 获取日志记录器
 * @param module 模块名称
 * @param config 日志配置
 */
export function getLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(module, config);
}