"use strict";
/**
 * 日志工具类
 * 提供统一的日志记录功能
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston = __importStar(require("winston"));
const path = __importStar(require("path"));
class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.logger = this.createLogger();
    }
    /**
     * 创建Winston日志器
     */
    createLogger() {
        const logFormat = winston.format.combine(winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }), winston.format.errors({ stack: true }), winston.format.printf(({ timestamp, level, message, stack, context }) => {
            const ctx = context || this.context;
            const msg = stack ? `${message}\n${stack}` : message;
            return `[${timestamp}] [${level.toUpperCase()}] [${ctx}] ${msg}`;
        }));
        const transports = [
            // 控制台输出
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: winston.format.combine(winston.format.colorize(), logFormat)
            })
        ];
        // 文件输出
        if (process.env.NODE_ENV === 'production') {
            const logDir = process.env.LOG_DIR || './logs';
            // 错误日志
            transports.push(new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                format: logFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }));
            // 综合日志
            transports.push(new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                format: logFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }));
        }
        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
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
    debug(message, meta) {
        this.logger.debug(message, { context: this.context, ...meta });
    }
    /**
     * 记录信息
     * @param message 消息
     * @param meta 元数据
     */
    info(message, meta) {
        this.logger.info(message, { context: this.context, ...meta });
    }
    /**
     * 记录警告
     * @param message 消息
     * @param meta 元数据
     */
    warn(message, meta) {
        this.logger.warn(message, { context: this.context, ...meta });
    }
    /**
     * 记录错误
     * @param message 消息
     * @param error 错误对象
     * @param meta 元数据
     */
    error(message, error, meta) {
        if (error instanceof Error) {
            this.logger.error(message, {
                context: this.context,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                ...meta
            });
        }
        else {
            this.logger.error(message, { context: this.context, error, ...meta });
        }
    }
    /**
     * 记录性能指标
     * @param operation 操作名称
     * @param duration 持续时间（毫秒）
     * @param meta 元数据
     */
    performance(operation, duration, meta) {
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
    trace(traceId, event, meta) {
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
    child(subContext) {
        return new Logger(`${this.context}:${subContext}`);
    }
    /**
     * 设置日志级别
     * @param level 日志级别
     */
    setLevel(level) {
        this.logger.level = level;
    }
    /**
     * 获取当前日志级别
     * @returns 日志级别
     */
    getLevel() {
        return this.logger.level;
    }
}
exports.Logger = Logger;
