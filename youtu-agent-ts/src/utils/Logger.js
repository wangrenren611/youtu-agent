"use strict";
/**
 * 日志工具类
 * 提供统一的日志记录功能
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var winston = require("winston");
var path = require("path");
var Logger = /** @class */ (function () {
    function Logger(context) {
        if (context === void 0) { context = 'App'; }
        this.context = context;
        this.logger = this.createLogger();
    }
    /**
     * 创建Winston日志器
     */
    Logger.prototype.createLogger = function () {
        var _this = this;
        var logFormat = winston.format.combine(winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }), winston.format.errors({ stack: true }), winston.format.printf(function (_a) {
            var timestamp = _a.timestamp, level = _a.level, message = _a.message, stack = _a.stack, context = _a.context;
            var ctx = context || _this.context;
            var msg = stack ? "".concat(message, "\n").concat(stack) : message;
            return "[".concat(timestamp, "] [").concat(level.toUpperCase(), "] [").concat(ctx, "] ").concat(msg);
        }));
        var transports = [
            // 控制台输出
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info',
                format: winston.format.combine(winston.format.colorize(), logFormat)
            })
        ];
        // 文件输出
        if (process.env.NODE_ENV === 'production') {
            var logDir = process.env.LOG_DIR || './logs';
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
            transports: transports,
            exitOnError: false
        });
    };
    /**
     * 记录调试信息
     * @param message 消息
     * @param meta 元数据
     */
    Logger.prototype.debug = function (message, meta) {
        this.logger.debug(message, __assign({ context: this.context }, meta));
    };
    /**
     * 记录信息
     * @param message 消息
     * @param meta 元数据
     */
    Logger.prototype.info = function (message, meta) {
        this.logger.info(message, __assign({ context: this.context }, meta));
    };
    /**
     * 记录警告
     * @param message 消息
     * @param meta 元数据
     */
    Logger.prototype.warn = function (message, meta) {
        this.logger.warn(message, __assign({ context: this.context }, meta));
    };
    /**
     * 记录错误
     * @param message 消息
     * @param error 错误对象
     * @param meta 元数据
     */
    Logger.prototype.error = function (message, error, meta) {
        if (error instanceof Error) {
            this.logger.error(message, __assign({ context: this.context, error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } }, meta));
        }
        else {
            this.logger.error(message, __assign({ context: this.context, error: error }, meta));
        }
    };
    /**
     * 记录性能指标
     * @param operation 操作名称
     * @param duration 持续时间（毫秒）
     * @param meta 元数据
     */
    Logger.prototype.performance = function (operation, duration, meta) {
        this.info("\u6027\u80FD\u6307\u6807: ".concat(operation), __assign({ operation: operation, duration: duration }, meta));
    };
    /**
     * 记录追踪信息
     * @param traceId 追踪ID
     * @param event 事件名称
     * @param meta 元数据
     */
    Logger.prototype.trace = function (traceId, event, meta) {
        this.debug("\u8FFD\u8E2A: ".concat(event), __assign({ traceId: traceId, event: event }, meta));
    };
    /**
     * 创建子日志器
     * @param subContext 子上下文
     * @returns 新的日志器实例
     */
    Logger.prototype.child = function (subContext) {
        return new Logger("".concat(this.context, ":").concat(subContext));
    };
    /**
     * 设置日志级别
     * @param level 日志级别
     */
    Logger.prototype.setLevel = function (level) {
        this.logger.level = level;
    };
    /**
     * 获取当前日志级别
     * @returns 日志级别
     */
    Logger.prototype.getLevel = function () {
        return this.logger.level;
    };
    return Logger;
}());
exports.Logger = Logger;
