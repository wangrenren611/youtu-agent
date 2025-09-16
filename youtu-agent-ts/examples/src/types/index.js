"use strict";
/**
 * 基础类型定义
 * 定义了整个框架中使用的核心类型和接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = exports.ToolError = exports.AgentError = void 0;
// 错误类型
class AgentError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AgentError';
    }
}
exports.AgentError = AgentError;
class ToolError extends Error {
    constructor(message, toolName, details) {
        super(message);
        this.toolName = toolName;
        this.details = details;
        this.name = 'ToolError';
    }
}
exports.ToolError = ToolError;
class ConfigError extends Error {
    constructor(message, configPath, details) {
        super(message);
        this.configPath = configPath;
        this.details = details;
        this.name = 'ConfigError';
    }
}
exports.ConfigError = ConfigError;
