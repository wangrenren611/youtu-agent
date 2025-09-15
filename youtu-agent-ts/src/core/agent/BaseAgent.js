"use strict";
/**
 * 基础智能体类
 * 定义了所有智能体的通用接口和行为
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
exports.BaseAgent = void 0;
var events_1 = require("events");
var types_1 = require("../../types");
var Logger_1 = require("../../utils/Logger");
var ConfigManager_1 = require("../config/ConfigManager");
var ToolManager_1 = require("../tool/ToolManager");
var BaseAgent = /** @class */ (function (_super) {
    __extends(BaseAgent, _super);
    function BaseAgent(config) {
        var _this = _super.call(this) || this;
        _this.isInitialized = false;
        _this.config = config;
        _this.logger = new Logger_1.Logger("Agent:".concat(config.name));
        _this.toolManager = new ToolManager_1.ToolManager();
        _this.configManager = new ConfigManager_1.ConfigManager();
        return _this;
    }
    /**
     * 初始化智能体
     * 子类可以重写此方法来实现特定的初始化逻辑
     */
    BaseAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.logger.info('正在初始化智能体...');
                        // 加载工具
                        if (this.config.tools && this.config.tools.length > 0) {
                            // 工具加载逻辑 - 暂时跳过，因为ToolManager没有loadTools方法
                            // await this.toolManager.loadTools(this.config.tools);
                        }
                        // 执行子类特定的初始化
                        return [4 /*yield*/, this.onInitialize()];
                    case 2:
                        // 执行子类特定的初始化
                        _a.sent();
                        this.isInitialized = true;
                        this.logger.info('智能体初始化完成');
                        this.emit('initialized');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error('智能体初始化失败:', error_1);
                        throw new types_1.AgentError("\u667A\u80FD\u4F53\u521D\u59CB\u5316\u5931\u8D25: ".concat(error_1 instanceof Error ? error_1.message : '未知错误'), 'INITIALIZATION_FAILED', error_1);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 运行智能体
     * @param input 输入内容
     * @param traceId 追踪ID
     * @returns 任务记录器
     */
    BaseAgent.prototype.run = function (input, traceId) {
        return __awaiter(this, void 0, void 0, function () {
            var recorder, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        recorder = this.createTaskRecorder(input, traceId);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        this.logger.info("\u5F00\u59CB\u6267\u884C\u4EFB\u52A1: ".concat(input));
                        this.emit('task_start', recorder);
                        return [4 /*yield*/, this.execute(input, recorder)];
                    case 4:
                        result = _a.sent();
                        recorder.output = result;
                        recorder.status = 'completed';
                        recorder.endTime = new Date();
                        this.logger.info('任务执行完成');
                        this.emit('task_completed', recorder);
                        return [2 /*return*/, recorder];
                    case 5:
                        error_2 = _a.sent();
                        recorder.status = 'failed';
                        recorder.error = error_2 instanceof Error ? error_2.message : '未知错误';
                        recorder.endTime = new Date();
                        this.logger.error('任务执行失败:', error_2);
                        this.emit('task_failed', recorder);
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 流式运行智能体
     * @param input 输入内容
     * @param traceId 追踪ID
     * @returns 异步生成器，产生流式结果
     */
    BaseAgent.prototype.runStream = function (input, traceId) {
        return __asyncGenerator(this, arguments, function runStream_1() {
            var recorder, _a, _b, _c, message, e_1_1, error_3;
            var _d, e_1, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        if (!!this.isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, __await(this.initialize())];
                    case 1:
                        _g.sent();
                        _g.label = 2;
                    case 2:
                        recorder = this.createTaskRecorder(input, traceId);
                        _g.label = 3;
                    case 3:
                        _g.trys.push([3, 18, , 19]);
                        this.logger.info("\u5F00\u59CB\u6D41\u5F0F\u6267\u884C\u4EFB\u52A1: ".concat(input));
                        this.emit('stream_start', recorder);
                        _g.label = 4;
                    case 4:
                        _g.trys.push([4, 11, 12, 17]);
                        _a = true, _b = __asyncValues(this.executeStream(input, recorder));
                        _g.label = 5;
                    case 5: return [4 /*yield*/, __await(_b.next())];
                    case 6:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 10];
                        _f = _c.value;
                        _a = false;
                        message = _f;
                        recorder.messages.push(message);
                        this.emit('stream_message', message);
                        return [4 /*yield*/, __await(message)];
                    case 7: return [4 /*yield*/, _g.sent()];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9:
                        _a = true;
                        return [3 /*break*/, 5];
                    case 10: return [3 /*break*/, 17];
                    case 11:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 17];
                    case 12:
                        _g.trys.push([12, , 15, 16]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 14];
                        return [4 /*yield*/, __await(_e.call(_b))];
                    case 13:
                        _g.sent();
                        _g.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 16: return [7 /*endfinally*/];
                    case 17:
                        recorder.status = 'completed';
                        recorder.endTime = new Date();
                        this.logger.info('流式任务执行完成');
                        this.emit('stream_completed', recorder);
                        return [3 /*break*/, 19];
                    case 18:
                        error_3 = _g.sent();
                        recorder.status = 'failed';
                        recorder.error = error_3 instanceof Error ? error_3.message : '未知错误';
                        recorder.endTime = new Date();
                        this.logger.error('流式任务执行失败:', error_3);
                        this.emit('stream_failed', recorder);
                        throw error_3;
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 清理资源
     */
    BaseAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.logger.info('正在清理智能体资源...');
                        return [4 /*yield*/, this.onCleanup()];
                    case 1:
                        _a.sent();
                        this.toolManager.cleanup();
                        this.isInitialized = false;
                        this.logger.info('智能体资源清理完成');
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        this.logger.error('智能体资源清理失败:', error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 获取智能体配置
     */
    BaseAgent.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * 获取智能体名称
     */
    BaseAgent.prototype.getName = function () {
        return this.config.name;
    };
    /**
     * 获取智能体类型
     */
    BaseAgent.prototype.getType = function () {
        return this.config.type;
    };
    /**
     * 检查智能体是否已初始化
     */
    BaseAgent.prototype.isReady = function () {
        return this.isInitialized;
    };
    /**
     * 创建任务记录器
     */
    BaseAgent.prototype.createTaskRecorder = function (input, traceId) {
        return {
            id: traceId || this.generateTraceId(),
            input: input,
            messages: [],
            toolCalls: [],
            startTime: new Date(),
            status: 'pending'
        };
    };
    /**
     * 生成追踪ID
     */
    BaseAgent.prototype.generateTraceId = function () {
        return "trace_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    return BaseAgent;
}(events_1.EventEmitter));
exports.BaseAgent = BaseAgent;
