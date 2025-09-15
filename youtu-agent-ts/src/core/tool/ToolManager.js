"use strict";
/**
 * 工具管理器
 * 负责工具的注册、加载、调用和管理
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
var events_1 = require("events");
var types_1 = require("../../types");
var Logger_1 = require("../../utils/Logger");
var zod_1 = require("zod");
var ToolManager = /** @class */ (function (_super) {
    __extends(ToolManager, _super);
    function ToolManager() {
        var _this = _super.call(this) || this;
        _this.tools = new Map();
        _this.logger = new Logger_1.Logger('ToolManager');
        return _this;
    }
    /**
     * 注册工具
     * @param tool 工具定义
     */
    ToolManager.prototype.registerTool = function (tool) {
        if (this.tools.has(tool.name)) {
            this.logger.warn("\u5DE5\u5177 ".concat(tool.name, " \u5DF2\u5B58\u5728\uFF0C\u5C06\u88AB\u8986\u76D6"));
        }
        this.tools.set(tool.name, tool);
        this.logger.info("\u5DE5\u5177 ".concat(tool.name, " \u6CE8\u518C\u6210\u529F"));
        this.emit('tool_registered', tool);
    };
    /**
     * 批量注册工具
     * @param tools 工具定义数组
     */
    ToolManager.prototype.registerTools = function (tools) {
        var _this = this;
        tools.forEach(function (tool) { return _this.registerTool(tool); });
    };
    /**
     * 获取工具定义
     * @param name 工具名称
     * @returns 工具定义或undefined
     */
    ToolManager.prototype.getTool = function (name) {
        return this.tools.get(name);
    };
    /**
     * 获取所有工具名称
     * @returns 工具名称数组
     */
    ToolManager.prototype.getToolNames = function () {
        return Array.from(this.tools.keys());
    };
    /**
     * 获取所有工具定义
     * @returns 工具定义数组
     */
    ToolManager.prototype.getAllTools = function () {
        return Array.from(this.tools.values());
    };
    /**
     * 检查工具是否存在
     * @param name 工具名称
     * @returns 是否存在
     */
    ToolManager.prototype.hasTool = function (name) {
        return this.tools.has(name);
    };
    /**
     * 调用工具
     * @param name 工具名称
     * @param args 工具参数
     * @returns 工具执行结果
     */
    ToolManager.prototype.callTool = function (name, args) {
        return __awaiter(this, void 0, void 0, function () {
            var tool, validatedArgs, startTime, result, duration, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tool = this.tools.get(name);
                        if (!tool) {
                            throw new types_1.ToolError("\u5DE5\u5177 ".concat(name, " \u4E0D\u5B58\u5728"), name);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.logger.info("\u8C03\u7528\u5DE5\u5177: ".concat(name), { args: args });
                        this.emit('tool_call_start', { name: name, args: args });
                        validatedArgs = tool.parameters.parse(args);
                        startTime = Date.now();
                        return [4 /*yield*/, tool.handler(validatedArgs)];
                    case 2:
                        result = _a.sent();
                        duration = Date.now() - startTime;
                        this.logger.info("\u5DE5\u5177 ".concat(name, " \u6267\u884C\u5B8C\u6210"), { duration: duration, result: result });
                        this.emit('tool_call_completed', { name: name, args: args, result: result, duration: duration });
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error("\u5DE5\u5177 ".concat(name, " \u6267\u884C\u5931\u8D25:"), error_1);
                        this.emit('tool_call_failed', { name: name, args: args, error: error_1 });
                        if (error_1 instanceof zod_1.z.ZodError) {
                            throw new types_1.ToolError("\u5DE5\u5177 ".concat(name, " \u53C2\u6570\u9A8C\u8BC1\u5931\u8D25: ").concat(error_1.errors.map(function (e) { return e.message; }).join(', ')), name, error_1.errors);
                        }
                        throw new types_1.ToolError("\u5DE5\u5177 ".concat(name, " \u6267\u884C\u5931\u8D25: ").concat(error_1 instanceof Error ? error_1.message : '未知错误'), name, error_1);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 批量调用工具
     * @param calls 工具调用数组
     * @returns 执行结果数组
     */
    ToolManager.prototype.callTools = function (calls) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, calls_1, call, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        _i = 0, calls_1 = calls;
                        _a.label = 1;
                    case 1:
                        if (!(_i < calls_1.length)) return [3 /*break*/, 6];
                        call = calls_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.callTool(call.name, call.args)];
                    case 3:
                        result = _a.sent();
                        results.push(result);
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        this.logger.error("\u6279\u91CF\u8C03\u7528\u5DE5\u5177\u5931\u8D25: ".concat(call.name), error_2);
                        results.push("\u9519\u8BEF: ".concat(error_2 instanceof Error ? error_2.message : '未知错误'));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * 并行调用工具
     * @param calls 工具调用数组
     * @returns 执行结果数组
     */
    ToolManager.prototype.callToolsParallel = function (calls) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                promises = calls.map(function (call) {
                    return _this.callTool(call.name, call.args).catch(function (error) {
                        return "\u9519\u8BEF: ".concat(error instanceof Error ? error.message : '未知错误');
                    });
                });
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    };
    /**
     * 获取工具模式定义（用于LangChain）
     * @returns 工具模式数组
     */
    ToolManager.prototype.getToolSchemas = function () {
        return this.getAllTools().map(function (tool) { return ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }); });
    };
    /**
     * 获取OpenAI格式的工具定义
     * @returns OpenAI工具定义数组
     */
    ToolManager.prototype.getOpenAITools = function () {
        var _this = this;
        return this.getAllTools().map(function (tool) { return ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: _this.zodToJsonSchema(tool.parameters)
            }
        }); });
    };
    /**
     * 移除工具
     * @param name 工具名称
     * @returns 是否成功移除
     */
    ToolManager.prototype.removeTool = function (name) {
        var removed = this.tools.delete(name);
        if (removed) {
            this.logger.info("\u5DE5\u5177 ".concat(name, " \u5DF2\u79FB\u9664"));
            this.emit('tool_removed', name);
        }
        return removed;
    };
    /**
     * 清空所有工具
     */
    ToolManager.prototype.clearTools = function () {
        this.tools.clear();
        this.logger.info('所有工具已清空');
        this.emit('tools_cleared');
    };
    /**
     * 清理资源
     */
    ToolManager.prototype.cleanup = function () {
        this.clearTools();
        this.removeAllListeners();
    };
    /**
     * 将Zod模式转换为JSON Schema
     * @param schema Zod模式
     * @returns JSON Schema
     */
    ToolManager.prototype.zodToJsonSchema = function (schema) {
        // 这里需要实现Zod到JSON Schema的转换
        // 可以使用zod-to-json-schema库
        try {
            return schema._def || {};
        }
        catch (_a) {
            return {};
        }
    };
    return ToolManager;
}(events_1.EventEmitter));
exports.ToolManager = ToolManager;
