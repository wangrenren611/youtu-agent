"use strict";
/**
 * 追踪管理器
 * 负责智能体执行过程的追踪、监控和记录
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
exports.TraceManager = void 0;
var events_1 = require("events");
var Logger_1 = require("../utils/Logger");
var fs = require("fs/promises");
var path = require("path");
var uuid_1 = require("uuid");
var TraceManager = /** @class */ (function (_super) {
    __extends(TraceManager, _super);
    function TraceManager(tracesDir) {
        if (tracesDir === void 0) { tracesDir = './traces'; }
        var _this = _super.call(this) || this;
        _this.sessions = new Map();
        _this.events = new Map();
        _this.logger = new Logger_1.Logger('TraceManager');
        _this.tracesDir = tracesDir;
        return _this;
    }
    /**
     * 开始新的追踪会话
     * @param name 会话名称
     * @param metadata 元数据
     * @returns 追踪ID
     */
    TraceManager.prototype.startTrace = function (name, metadata) {
        if (metadata === void 0) { metadata = {}; }
        var traceId = (0, uuid_1.v4)();
        var session = {
            id: traceId,
            name: name,
            startTime: new Date(),
            status: 'active',
            events: [],
            metadata: metadata
        };
        this.sessions.set(traceId, session);
        this.events.set(traceId, []);
        this.logger.info("\u5F00\u59CB\u8FFD\u8E2A\u4F1A\u8BDD: ".concat(name, " (").concat(traceId, ")"));
        this.emit('trace_start', session);
        return traceId;
    };
    /**
     * 结束追踪会话
     * @param traceId 追踪ID
     * @param status 结束状态
     */
    TraceManager.prototype.endTrace = function (traceId, status) {
        var _this = this;
        if (status === void 0) { status = 'completed'; }
        var session = this.sessions.get(traceId);
        if (!session) {
            this.logger.warn("\u8FFD\u8E2A\u4F1A\u8BDD\u4E0D\u5B58\u5728: ".concat(traceId));
            return;
        }
        session.endTime = new Date();
        session.status = status;
        this.logger.info("\u7ED3\u675F\u8FFD\u8E2A\u4F1A\u8BDD: ".concat(session.name, " (").concat(traceId, "), \u72B6\u6001: ").concat(status));
        this.emit('trace_end', session);
        // 异步保存追踪数据
        this.saveTrace(traceId).catch(function (error) {
            _this.logger.error("\u4FDD\u5B58\u8FFD\u8E2A\u6570\u636E\u5931\u8D25: ".concat(traceId), error);
        });
    };
    /**
     * 记录追踪事件
     * @param traceId 追踪ID
     * @param eventType 事件类型
     * @param data 事件数据
     * @param duration 持续时间（毫秒）
     */
    TraceManager.prototype.recordEvent = function (traceId, eventType, data, duration) {
        var _a;
        if (data === void 0) { data = {}; }
        var session = this.sessions.get(traceId);
        if (!session) {
            this.logger.warn("\u8FFD\u8E2A\u4F1A\u8BDD\u4E0D\u5B58\u5728: ".concat(traceId));
            return;
        }
        var event = {
            id: (0, uuid_1.v4)(),
            traceId: traceId,
            eventType: eventType,
            timestamp: new Date(),
            data: data,
            duration: duration
        };
        session.events.push(event);
        (_a = this.events.get(traceId)) === null || _a === void 0 ? void 0 : _a.push(event);
        this.logger.debug("\u8BB0\u5F55\u4E8B\u4EF6: ".concat(eventType, " (").concat(traceId, ")"));
        this.emit('event_recorded', event);
    };
    /**
     * 记录智能体开始事件
     * @param traceId 追踪ID
     * @param agentName 智能体名称
     * @param input 输入内容
     */
    TraceManager.prototype.recordAgentStart = function (traceId, agentName, input) {
        this.recordEvent(traceId, 'agent_start', {
            agentName: agentName,
            input: input.substring(0, 200) // 限制输入长度
        });
    };
    /**
     * 记录智能体结束事件
     * @param traceId 追踪ID
     * @param agentName 智能体名称
     * @param output 输出内容
     * @param duration 执行时间
     */
    TraceManager.prototype.recordAgentEnd = function (traceId, agentName, output, duration) {
        this.recordEvent(traceId, 'agent_end', {
            agentName: agentName,
            output: output.substring(0, 200), // 限制输出长度
            duration: duration
        }, duration);
    };
    /**
     * 记录工具调用事件
     * @param traceId 追踪ID
     * @param toolName 工具名称
     * @param args 工具参数
     * @param result 工具结果
     * @param duration 执行时间
     */
    TraceManager.prototype.recordToolCall = function (traceId, toolName, args, result, duration) {
        this.recordEvent(traceId, 'tool_call', {
            toolName: toolName,
            args: this.sanitizeData(args),
            result: result.substring(0, 200), // 限制结果长度
            duration: duration
        }, duration);
    };
    /**
     * 记录错误事件
     * @param traceId 追踪ID
     * @param error 错误信息
     * @param context 错误上下文
     */
    TraceManager.prototype.recordError = function (traceId, error, context) {
        if (context === void 0) { context = {}; }
        this.recordEvent(traceId, 'error', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: context
        });
    };
    /**
     * 记录任务记录器
     * @param traceId 追踪ID
     * @param recorder 任务记录器
     */
    TraceManager.prototype.recordTaskRecorder = function (traceId, recorder) {
        this.recordEvent(traceId, 'task_recorder', {
            taskId: recorder.id,
            input: recorder.input,
            output: recorder.output,
            status: recorder.status,
            messageCount: recorder.messages.length,
            toolCallCount: recorder.toolCalls.length,
            startTime: recorder.startTime,
            endTime: recorder.endTime,
            duration: recorder.endTime ?
                recorder.endTime.getTime() - recorder.startTime.getTime() : undefined
        });
    };
    /**
     * 获取追踪会话
     * @param traceId 追踪ID
     * @returns 追踪会话
     */
    TraceManager.prototype.getTrace = function (traceId) {
        return this.sessions.get(traceId);
    };
    /**
     * 获取追踪事件
     * @param traceId 追踪ID
     * @returns 事件列表
     */
    TraceManager.prototype.getTraceEvents = function (traceId) {
        return this.events.get(traceId) || [];
    };
    /**
     * 查询追踪数据
     * @param filter 查询过滤器
     * @returns 追踪会话列表
     */
    TraceManager.prototype.queryTraces = function (filter) {
        if (filter === void 0) { filter = {}; }
        var results = Array.from(this.sessions.values());
        if (filter.traceId) {
            results = results.filter(function (session) { return session.id === filter.traceId; });
        }
        if (filter.agentName) {
            results = results.filter(function (session) {
                return session.events.some(function (event) {
                    return event.data.agentName === filter.agentName;
                });
            });
        }
        if (filter.status) {
            results = results.filter(function (session) { return session.status === filter.status; });
        }
        if (filter.startTime) {
            results = results.filter(function (session) { return session.startTime >= filter.startTime; });
        }
        if (filter.endTime) {
            results = results.filter(function (session) {
                return !session.endTime || session.endTime <= filter.endTime;
            });
        }
        if (filter.eventType) {
            results = results.filter(function (session) {
                return session.events.some(function (event) { return event.eventType === filter.eventType; });
            });
        }
        return results.sort(function (a, b) { return b.startTime.getTime() - a.startTime.getTime(); });
    };
    /**
     * 获取追踪统计信息
     * @returns 统计信息
     */
    TraceManager.prototype.getStats = function () {
        var sessions = Array.from(this.sessions.values());
        var totalTraces = sessions.length;
        var activeTraces = sessions.filter(function (s) { return s.status === 'active'; }).length;
        var completedTraces = sessions.filter(function (s) { return s.status === 'completed'; }).length;
        var failedTraces = sessions.filter(function (s) { return s.status === 'failed'; }).length;
        var totalEvents = sessions.reduce(function (sum, s) { return sum + s.events.length; }, 0);
        var eventTypeStats = {};
        sessions.forEach(function (session) {
            session.events.forEach(function (event) {
                eventTypeStats[event.eventType] = (eventTypeStats[event.eventType] || 0) + 1;
            });
        });
        var completedSessions = sessions.filter(function (s) { return s.endTime; });
        var averageDuration = completedSessions.length > 0 ?
            completedSessions.reduce(function (sum, s) {
                return sum + (s.endTime.getTime() - s.startTime.getTime());
            }, 0) / completedSessions.length : 0;
        return {
            totalTraces: totalTraces,
            activeTraces: activeTraces,
            completedTraces: completedTraces,
            failedTraces: failedTraces,
            averageDuration: averageDuration,
            totalEvents: totalEvents,
            eventTypeStats: eventTypeStats
        };
    };
    /**
     * 保存追踪数据
     * @param traceId 追踪ID
     */
    TraceManager.prototype.saveTrace = function (traceId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, filename, filepath, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        session = this.sessions.get(traceId);
                        if (!session) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fs.mkdir(this.tracesDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        filename = "trace_".concat(traceId, "_").concat(Date.now(), ".json");
                        filepath = path.join(this.tracesDir, filename);
                        data = {
                            session: session,
                            events: this.events.get(traceId) || [],
                            savedAt: new Date().toISOString()
                        };
                        return [4 /*yield*/, fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')];
                    case 2:
                        _a.sent();
                        this.logger.debug("\u8FFD\u8E2A\u6570\u636E\u5DF2\u4FDD\u5B58: ".concat(filepath));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error("\u4FDD\u5B58\u8FFD\u8E2A\u6570\u636E\u5931\u8D25: ".concat(traceId), error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 清理敏感数据
     * @param data 原始数据
     * @returns 清理后的数据
     */
    TraceManager.prototype.sanitizeData = function (data) {
        var _this = this;
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map(function (item) { return _this.sanitizeData(item); });
        }
        var sanitized = {};
        var _loop_1 = function (key, value) {
            // 过滤敏感字段
            if (['password', 'token', 'key', 'secret'].some(function (sensitive) {
                return key.toLowerCase().includes(sensitive);
            })) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = this_1.sanitizeData(value);
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _loop_1(key, value);
        }
        return sanitized;
    };
    /**
     * 清理旧的追踪数据
     * @param maxAge 最大保存时间（毫秒）
     */
    TraceManager.prototype.cleanupOldTraces = function () {
        return __awaiter(this, arguments, void 0, function (maxAge) {
            var cutoffTime_1, oldSessions, _i, oldSessions_1, session;
            if (maxAge === void 0) { maxAge = 7 * 24 * 60 * 60 * 1000; }
            return __generator(this, function (_a) {
                try {
                    cutoffTime_1 = new Date(Date.now() - maxAge);
                    oldSessions = Array.from(this.sessions.values())
                        .filter(function (session) { return session.startTime < cutoffTime_1; });
                    for (_i = 0, oldSessions_1 = oldSessions; _i < oldSessions_1.length; _i++) {
                        session = oldSessions_1[_i];
                        this.sessions.delete(session.id);
                        this.events.delete(session.id);
                    }
                    this.logger.info("\u6E05\u7406\u4E86 ".concat(oldSessions.length, " \u4E2A\u65E7\u8FFD\u8E2A\u4F1A\u8BDD"));
                }
                catch (error) {
                    this.logger.error('清理旧追踪数据失败:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * 导出追踪数据
     * @param traceId 追踪ID
     * @param format 导出格式
     * @returns 导出的数据
     */
    TraceManager.prototype.exportTrace = function (traceId_1) {
        return __awaiter(this, arguments, void 0, function (traceId, format) {
            var session, events, csv_1;
            if (format === void 0) { format = 'json'; }
            return __generator(this, function (_a) {
                session = this.sessions.get(traceId);
                if (!session) {
                    throw new Error("\u8FFD\u8E2A\u4F1A\u8BDD\u4E0D\u5B58\u5728: ".concat(traceId));
                }
                events = this.events.get(traceId) || [];
                if (format === 'json') {
                    return [2 /*return*/, JSON.stringify({
                            session: session,
                            events: events,
                            exportedAt: new Date().toISOString()
                        }, null, 2)];
                }
                else if (format === 'csv') {
                    csv_1 = 'timestamp,eventType,data\n';
                    events.forEach(function (event) {
                        var dataStr = JSON.stringify(event.data).replace(/"/g, '""');
                        csv_1 += "".concat(event.timestamp.toISOString(), ",\"").concat(event.eventType, "\",\"").concat(dataStr, "\"\n");
                    });
                    return [2 /*return*/, csv_1];
                }
                throw new Error("\u4E0D\u652F\u6301\u7684\u5BFC\u51FA\u683C\u5F0F: ".concat(format));
            });
        });
    };
    return TraceManager;
}(events_1.EventEmitter));
exports.TraceManager = TraceManager;
