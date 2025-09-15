"use strict";
/**
 * 基础类型定义
 * 定义了整个框架中使用的核心类型和接口
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = exports.ToolError = exports.AgentError = void 0;
// 错误类型
var AgentError = /** @class */ (function (_super) {
    __extends(AgentError, _super);
    function AgentError(message, code, details) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.details = details;
        _this.name = 'AgentError';
        return _this;
    }
    return AgentError;
}(Error));
exports.AgentError = AgentError;
var ToolError = /** @class */ (function (_super) {
    __extends(ToolError, _super);
    function ToolError(message, toolName, details) {
        var _this = _super.call(this, message) || this;
        _this.toolName = toolName;
        _this.details = details;
        _this.name = 'ToolError';
        return _this;
    }
    return ToolError;
}(Error));
exports.ToolError = ToolError;
var ConfigError = /** @class */ (function (_super) {
    __extends(ConfigError, _super);
    function ConfigError(message, configPath, details) {
        var _this = _super.call(this, message) || this;
        _this.configPath = configPath;
        _this.details = details;
        _this.name = 'ConfigError';
        return _this;
    }
    return ConfigError;
}(Error));
exports.ConfigError = ConfigError;
