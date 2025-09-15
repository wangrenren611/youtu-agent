"use strict";
/**
 * 简单智能体
 * 基于LangChain实现的单轮对话智能体
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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAgent = void 0;
var BaseAgent_1 = require("../core/agent/BaseAgent");
var SimpleLLMClient_1 = require("../core/llm/SimpleLLMClient");
var types_1 = require("../types");
var SimpleAgent = /** @class */ (function (_super) {
    __extends(SimpleAgent, _super);
    function SimpleAgent(config) {
        var _this = _super.call(this, config) || this;
        _this.llm = null;
        return _this;
        // logger在BaseAgent中已经初始化，这里不需要重新赋值
    }
    /**
     * 初始化简单智能体
     */
    SimpleAgent.prototype.onInitialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isConnected, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.logger.info('正在初始化简单智能体...');
                        // 检查API密钥
                        if (!this.config.model.apiKey || this.config.model.apiKey === 'your-api-key-here') {
                            throw new Error('OpenAI API密钥未配置或无效。请检查.env文件中的OPENAI_API_KEY设置。');
                        }
                        this.logger.info("\u4F7F\u7528\u6A21\u578B: ".concat(this.config.model.model));
                        this.logger.info("API\u5BC6\u94A5: ".concat(this.config.model.apiKey.substring(0, 8), "..."));
                        // 初始化简化LLM客户端
                        this.llm = new SimpleLLMClient_1.SimpleLLMClient({
                            provider: this.config.model.provider,
                            model: this.config.model.model,
                            apiKey: this.config.model.apiKey,
                            baseUrl: this.config.model.baseUrl,
                            temperature: this.config.temperature || 0.7,
                            maxTokens: this.config.maxTokens || 4000,
                            timeout: this.config.model.timeout || 30000
                        });
                        return [4 /*yield*/, this.llm.testConnection()];
                    case 1:
                        isConnected = _a.sent();
                        if (!isConnected) {
                            throw new Error('LLM连接测试失败，请检查API密钥和网络连接');
                        }
                        // 如果有工具，记录工具信息
                        if (this.config.tools && this.config.tools.length > 0) {
                            this.logger.info("\u53EF\u7528\u5DE5\u5177: ".concat(this.config.tools.join(', ')));
                        }
                        this.logger.info('简单智能体初始化完成');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('简单智能体初始化失败:', error_1);
                        this.logger.error('错误详情:', {
                            message: error_1 instanceof Error ? error_1.message : '未知错误',
                            stack: error_1 instanceof Error ? error_1.stack : undefined,
                            config: {
                                model: this.config.model.model,
                                hasApiKey: !!this.config.model.apiKey,
                                apiKeyPrefix: this.config.model.apiKey ? this.config.model.apiKey.substring(0, 8) : 'none'
                            }
                        });
                        throw new types_1.AgentError("\u7B80\u5355\u667A\u80FD\u4F53\u521D\u59CB\u5316\u5931\u8D25: ".concat(error_1 instanceof Error ? error_1.message : '未知错误'), 'SIMPLE_AGENT_INIT_FAILED', error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 执行任务
     * @param input 输入内容
     * @param recorder 任务记录器
     * @returns 执行结果
     */
    SimpleAgent.prototype.execute = function (input, recorder) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.llm) {
                            throw new types_1.AgentError('语言模型未初始化', 'LLM_NOT_INITIALIZED');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.logger.info('开始执行简单智能体任务', { input: input });
                        messages = this.buildMessages(input, recorder);
                        return [4 /*yield*/, this.llm.invoke(messages)];
                    case 2:
                        response = _a.sent();
                        // 记录消息
                        recorder.messages.push({
                            role: 'user',
                            content: input,
                            timestamp: new Date()
                        });
                        recorder.messages.push({
                            role: 'assistant',
                            content: response.content,
                            timestamp: new Date()
                        });
                        // 记录使用情况
                        if (response.usage) {
                            this.logger.info('Token使用情况:', response.usage);
                        }
                        this.logger.info('简单智能体任务执行完成');
                        return [2 /*return*/, response.content];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('简单智能体任务执行失败:', error_2);
                        throw new types_1.AgentError("\u7B80\u5355\u667A\u80FD\u4F53\u4EFB\u52A1\u6267\u884C\u5931\u8D25: ".concat(error_2 instanceof Error ? error_2.message : '未知错误'), 'SIMPLE_AGENT_EXECUTION_FAILED', error_2);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 流式执行任务
     * @param input 输入内容
     * @param recorder 任务记录器
     * @returns 异步生成器
     */
    SimpleAgent.prototype.executeStream = function (input, recorder) {
        return __asyncGenerator(this, arguments, function executeStream_1() {
            var messages, userMessage, stream, assistantMessage, _a, stream_1, stream_1_1, chunk, e_1_1, error_3;
            var _b, e_1, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.llm) {
                            throw new types_1.AgentError('语言模型未初始化', 'LLM_NOT_INITIALIZED');
                        }
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 20, , 21]);
                        this.logger.info('开始流式执行简单智能体任务', { input: input });
                        messages = this.buildMessages(input, recorder);
                        userMessage = {
                            role: 'user',
                            content: input,
                            timestamp: new Date()
                        };
                        recorder.messages.push(userMessage);
                        return [4 /*yield*/, __await(userMessage)];
                    case 2: return [4 /*yield*/, _e.sent()];
                    case 3:
                        _e.sent();
                        stream = this.llm.invokeStream(messages);
                        assistantMessage = {
                            role: 'assistant',
                            content: '',
                            timestamp: new Date()
                        };
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 11, 12, 17]);
                        _a = true, stream_1 = __asyncValues(stream);
                        _e.label = 5;
                    case 5: return [4 /*yield*/, __await(stream_1.next())];
                    case 6:
                        if (!(stream_1_1 = _e.sent(), _b = stream_1_1.done, !_b)) return [3 /*break*/, 10];
                        _d = stream_1_1.value;
                        _a = false;
                        chunk = _d;
                        assistantMessage.content += chunk;
                        return [4 /*yield*/, __await(__assign(__assign({}, assistantMessage), { content: chunk }))];
                    case 7: 
                    // 发送部分内容
                    return [4 /*yield*/, _e.sent()];
                    case 8:
                        // 发送部分内容
                        _e.sent();
                        _e.label = 9;
                    case 9:
                        _a = true;
                        return [3 /*break*/, 5];
                    case 10: return [3 /*break*/, 17];
                    case 11:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 17];
                    case 12:
                        _e.trys.push([12, , 15, 16]);
                        if (!(!_a && !_b && (_c = stream_1.return))) return [3 /*break*/, 14];
                        return [4 /*yield*/, __await(_c.call(stream_1))];
                    case 13:
                        _e.sent();
                        _e.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 16: return [7 /*endfinally*/];
                    case 17:
                        // 记录完整的助手消息
                        recorder.messages.push(assistantMessage);
                        return [4 /*yield*/, __await(assistantMessage)];
                    case 18: return [4 /*yield*/, _e.sent()];
                    case 19:
                        _e.sent();
                        this.logger.info('简单智能体流式任务执行完成');
                        return [3 /*break*/, 21];
                    case 20:
                        error_3 = _e.sent();
                        this.logger.error('简单智能体流式任务执行失败:', error_3);
                        throw new types_1.AgentError("\u7B80\u5355\u667A\u80FD\u4F53\u6D41\u5F0F\u4EFB\u52A1\u6267\u884C\u5931\u8D25: ".concat(error_3 instanceof Error ? error_3.message : '未知错误'), 'SIMPLE_AGENT_STREAM_EXECUTION_FAILED', error_3);
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 构建消息列表
     * @param input 输入内容
     * @param recorder 任务记录器
     * @returns 消息列表
     */
    SimpleAgent.prototype.buildMessages = function (input, recorder) {
        var messages = [];
        // 添加系统消息
        if (this.config.instructions) {
            messages.push({
                role: 'system',
                content: this.config.instructions
            });
        }
        // 添加历史消息
        for (var _i = 0, _a = recorder.messages; _i < _a.length; _i++) {
            var msg = _a[_i];
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }
        // 添加当前输入
        messages.push({
            role: 'user',
            content: input
        });
        return messages;
    };
    /**
     * 清理资源
     */
    SimpleAgent.prototype.onCleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.info('正在清理简单智能体资源...');
                this.llm = null;
                return [2 /*return*/];
            });
        });
    };
    /**
     * 获取智能体信息
     * @returns 智能体信息
     */
    SimpleAgent.prototype.getInfo = function () {
        return {
            type: 'simple',
            name: this.config.name,
            model: this.config.model.model,
            tools: this.config.tools || [],
            isReady: this.isReady()
        };
    };
    return SimpleAgent;
}(BaseAgent_1.BaseAgent));
exports.SimpleAgent = SimpleAgent;
