"use strict";
/**
 * 简化的LLM客户端
 * 直接使用axios进行HTTP调用，避免复杂的模块依赖
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
exports.SimpleLLMClient = void 0;
var axios_1 = require("axios");
var Logger_1 = require("../../utils/Logger");
var SimpleLLMClient = /** @class */ (function () {
    function SimpleLLMClient(config) {
        this.logger = new Logger_1.Logger('SimpleLLMClient');
        this.config = config;
        this.logger.info("SimpleLLM\u5BA2\u6237\u7AEF\u521D\u59CB\u5316: ".concat(config.provider, "/").concat(config.model));
    }
    /**
     * 调用LLM
     */
    SimpleLLMClient.prototype.invoke = function (messages) {
        return __awaiter(this, void 0, void 0, function () {
            var requestData, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.logger.debug("\u8C03\u7528LLM: ".concat(this.config.provider, "/").concat(this.config.model));
                        requestData = this.buildRequestData(messages);
                        return [4 /*yield*/, this.makeRequest(requestData)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, this.parseResponse(response)];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('LLM调用失败:', error_1);
                        throw this.handleError(error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 流式调用LLM
     */
    SimpleLLMClient.prototype.invokeStream = function (messages) {
        return __asyncGenerator(this, arguments, function invokeStream_1() {
            var requestData, response, _a, _b, _c, chunk, e_1_1, error_2;
            var _d, e_1, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 16, , 17]);
                        this.logger.debug("\u6D41\u5F0F\u8C03\u7528LLM: ".concat(this.config.provider, "/").concat(this.config.model));
                        requestData = this.buildRequestData(messages, true);
                        return [4 /*yield*/, __await(this.makeRequest(requestData, true))];
                    case 1:
                        response = _g.sent();
                        _g.label = 2;
                    case 2:
                        _g.trys.push([2, 9, 10, 15]);
                        _a = true, _b = __asyncValues(this.parseStreamResponse(response));
                        _g.label = 3;
                    case 3: return [4 /*yield*/, __await(_b.next())];
                    case 4:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 8];
                        _f = _c.value;
                        _a = false;
                        chunk = _f;
                        return [4 /*yield*/, __await(chunk)];
                    case 5: return [4 /*yield*/, _g.sent()];
                    case 6:
                        _g.sent();
                        _g.label = 7;
                    case 7:
                        _a = true;
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 15];
                    case 9:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 15];
                    case 10:
                        _g.trys.push([10, , 13, 14]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 12];
                        return [4 /*yield*/, __await(_e.call(_b))];
                    case 11:
                        _g.sent();
                        _g.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 14: return [7 /*endfinally*/];
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        error_2 = _g.sent();
                        this.logger.error('LLM流式调用失败:', error_2);
                        throw this.handleError(error_2);
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 构建请求数据
     */
    SimpleLLMClient.prototype.buildRequestData = function (messages, stream) {
        var _a, _b;
        if (stream === void 0) { stream = false; }
        var temperature = (_a = this.config.temperature) !== null && _a !== void 0 ? _a : 0.7;
        var maxTokens = (_b = this.config.maxTokens) !== null && _b !== void 0 ? _b : 4000;
        return {
            model: this.config.model,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens,
            stream: stream
        };
    };
    /**
     * 发送HTTP请求
     */
    SimpleLLMClient.prototype.makeRequest = function (data_1) {
        return __awaiter(this, arguments, void 0, function (data, stream) {
            var baseURL, endpoint, headers, config;
            if (stream === void 0) { stream = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        baseURL = this.getBaseUrl();
                        endpoint = this.getEndpoint();
                        headers = this.getHeaders();
                        config = {
                            baseURL: baseURL,
                            url: endpoint,
                            method: 'POST',
                            headers: headers,
                            data: data,
                            timeout: this.config.timeout || 30000
                        };
                        if (stream) {
                            config.responseType = 'stream';
                        }
                        return [4 /*yield*/, (0, axios_1.default)(config)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 获取基础URL
     */
    SimpleLLMClient.prototype.getBaseUrl = function () {
        if (this.config.baseUrl) {
            return this.config.baseUrl;
        }
        switch (this.config.provider) {
            case 'openai':
                return 'https://api.openai.com/v1';
            case 'deepseek':
                return 'https://api.deepseek.com/v1';
            case 'anthropic':
                return 'https://api.anthropic.com/v1';
            case 'google':
                return 'https://generativelanguage.googleapis.com/v1';
            default:
                return 'https://api.openai.com/v1';
        }
    };
    /**
     * 获取API端点
     */
    SimpleLLMClient.prototype.getEndpoint = function () {
        switch (this.config.provider) {
            case 'openai':
            case 'deepseek':
                return '/chat/completions';
            case 'anthropic':
                return '/messages';
            case 'google':
                return "/models/".concat(this.config.model, ":generateContent");
            default:
                return '/chat/completions';
        }
    };
    /**
     * 获取请求头
     */
    SimpleLLMClient.prototype.getHeaders = function () {
        var headers = {
            'Content-Type': 'application/json'
        };
        switch (this.config.provider) {
            case 'openai':
            case 'deepseek':
                headers['Authorization'] = "Bearer ".concat(this.config.apiKey);
                break;
            case 'anthropic':
                headers['x-api-key'] = this.config.apiKey;
                break;
            case 'google':
                headers['Authorization'] = "Bearer ".concat(this.config.apiKey);
                break;
            default:
                headers['Authorization'] = "Bearer ".concat(this.config.apiKey);
        }
        return headers;
    };
    /**
     * 解析响应
     */
    SimpleLLMClient.prototype.parseResponse = function (response) {
        var _a, _b, _c, _d, _e;
        var data = response.data;
        return {
            content: ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || data.content || '',
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens || data.usage.input_tokens || 0,
                completionTokens: data.usage.completion_tokens || data.usage.output_tokens || 0,
                totalTokens: data.usage.total_tokens || (data.usage.input_tokens + data.usage.output_tokens) || 0
            } : undefined,
            model: data.model || this.config.model,
            finishReason: ((_e = (_d = data.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.finish_reason) || data.stop_reason
        };
    };
    /**
     * 解析流式响应
     */
    SimpleLLMClient.prototype.parseStreamResponse = function (response) {
        return __asyncGenerator(this, arguments, function parseStreamResponse_1() {
            var stream, _a, stream_1, stream_1_1, chunk, lines, _i, lines_1, line, data, parsed, content, error_3, e_2_1;
            var _b, e_2, _c, _d;
            var _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        stream = response.data;
                        _h.label = 1;
                    case 1:
                        _h.trys.push([1, 14, 15, 20]);
                        _a = true, stream_1 = __asyncValues(stream);
                        _h.label = 2;
                    case 2: return [4 /*yield*/, __await(stream_1.next())];
                    case 3:
                        if (!(stream_1_1 = _h.sent(), _b = stream_1_1.done, !_b)) return [3 /*break*/, 13];
                        _d = stream_1_1.value;
                        _a = false;
                        chunk = _d;
                        lines = chunk.toString().split('\n');
                        _i = 0, lines_1 = lines;
                        _h.label = 4;
                    case 4:
                        if (!(_i < lines_1.length)) return [3 /*break*/, 12];
                        line = lines_1[_i];
                        if (!line.startsWith('data: ')) return [3 /*break*/, 11];
                        data = line.slice(6);
                        if (!(data === '[DONE]')) return [3 /*break*/, 6];
                        return [4 /*yield*/, __await(void 0)];
                    case 5: return [2 /*return*/, _h.sent()];
                    case 6:
                        _h.trys.push([6, 10, , 11]);
                        parsed = JSON.parse(data);
                        content = ((_g = (_f = (_e = parsed.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.delta) === null || _g === void 0 ? void 0 : _g.content) || '';
                        if (!content) return [3 /*break*/, 9];
                        return [4 /*yield*/, __await(content)];
                    case 7: return [4 /*yield*/, _h.sent()];
                    case 8:
                        _h.sent();
                        _h.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_3 = _h.sent();
                        return [3 /*break*/, 11];
                    case 11:
                        _i++;
                        return [3 /*break*/, 4];
                    case 12:
                        _a = true;
                        return [3 /*break*/, 2];
                    case 13: return [3 /*break*/, 20];
                    case 14:
                        e_2_1 = _h.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 20];
                    case 15:
                        _h.trys.push([15, , 18, 19]);
                        if (!(!_a && !_b && (_c = stream_1.return))) return [3 /*break*/, 17];
                        return [4 /*yield*/, __await(_c.call(stream_1))];
                    case 16:
                        _h.sent();
                        _h.label = 17;
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 19: return [7 /*endfinally*/];
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 处理错误
     */
    SimpleLLMClient.prototype.handleError = function (error) {
        var _a;
        if (error.response) {
            var status_1 = error.response.status;
            var data = error.response.data;
            var message = "HTTP ".concat(status_1, ": ").concat(((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message) || (data === null || data === void 0 ? void 0 : data.message) || '请求失败');
            switch (status_1) {
                case 401:
                    message = 'API密钥无效或未授权';
                    break;
                case 429:
                    message = '请求频率限制，请稍后重试';
                    break;
                case 500:
                    message = '服务器内部错误';
                    break;
            }
            return new Error(message);
        }
        else if (error.request) {
            return new Error('网络请求失败，请检查网络连接');
        }
        else {
            return new Error(error.message || '未知错误');
        }
    };
    /**
     * 测试连接
     */
    SimpleLLMClient.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testMessages, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        testMessages = [
                            { role: 'user', content: 'Hello' }
                        ];
                        return [4 /*yield*/, this.invoke(testMessages)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_4 = _a.sent();
                        this.logger.error('连接测试失败:', error_4);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 获取配置信息
     */
    SimpleLLMClient.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    return SimpleLLMClient;
}());
exports.SimpleLLMClient = SimpleLLMClient;
