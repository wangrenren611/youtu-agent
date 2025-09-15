"use strict";
/**
 * 编排智能体
 * 负责多智能体协作编排，任务分解和结果聚合
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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
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
exports.OrchestraAgent = void 0;
var BaseAgent_1 = require("../core/agent/BaseAgent");
var index_1 = require("./index");
var TraceManager_1 = require("../tracing/TraceManager");
var OrchestraAgent = /** @class */ (function (_super) {
    __extends(OrchestraAgent, _super);
    function OrchestraAgent(config) {
        var _this = _super.call(this, config) || this;
        _this.workerAgents = new Map();
        _this.traceManager = new TraceManager_1.TraceManager();
        // 初始化规划智能体
        _this.plannerAgent = null; // 将在onInitialize中初始化
        // 初始化报告智能体
        _this.reporterAgent = null; // 将在onInitialize中初始化
        return _this;
    }
    /**
     * 初始化编排智能体
     */
    OrchestraAgent.prototype.onInitialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 7]);
                        this.logger.info('正在初始化编排智能体...');
                        if (!this.config.plannerModel) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, index_1.AgentFactory.createAgent({
                                type: 'simple',
                                name: "".concat(this.config.name, "_planner"),
                                model: this.config.plannerModel,
                                instructions: this.getPlannerInstructions(),
                                tools: ['web_search', 'file_read']
                            })];
                    case 1:
                        _a.plannerAgent = _c.sent();
                        _c.label = 2;
                    case 2:
                        if (!this.config.reporterModel) return [3 /*break*/, 4];
                        _b = this;
                        return [4 /*yield*/, index_1.AgentFactory.createAgent({
                                type: 'simple',
                                name: "".concat(this.config.name, "_reporter"),
                                model: this.config.reporterModel,
                                instructions: this.getReporterInstructions(),
                                tools: ['file_write']
                            })];
                    case 3:
                        _b.reporterAgent = _c.sent();
                        _c.label = 4;
                    case 4: 
                    // 初始化工作智能体
                    return [4 /*yield*/, this.initializeWorkerAgents()];
                    case 5:
                        // 初始化工作智能体
                        _c.sent();
                        this.logger.info('编排智能体初始化完成');
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _c.sent();
                        this.logger.error('编排智能体初始化失败:', error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 执行编排任务
     * @param input 输入内容
     * @param recorder 任务记录器
     * @returns 执行结果
     */
    OrchestraAgent.prototype.execute = function (input, recorder) {
        return __awaiter(this, void 0, void 0, function () {
            var traceId, plan, results, finalResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        traceId = this.traceManager.startTrace('orchestra_execution', {
                            input: input,
                            agentName: this.config.name
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        this.logger.info('开始执行编排任务', { input: input });
                        this.traceManager.recordAgentStart(traceId, this.config.name, input);
                        return [4 /*yield*/, this.plan(input, recorder)];
                    case 2:
                        plan = _a.sent();
                        this.traceManager.recordEvent(traceId, 'plan_created', { plan: plan });
                        return [4 /*yield*/, this.executeSubtasks(plan, traceId)];
                    case 3:
                        results = _a.sent();
                        this.traceManager.recordEvent(traceId, 'subtasks_completed', { results: results });
                        return [4 /*yield*/, this.report(plan, results, traceId)];
                    case 4:
                        finalResult = _a.sent();
                        this.traceManager.recordEvent(traceId, 'report_generated', { finalResult: finalResult });
                        this.traceManager.recordAgentEnd(traceId, this.config.name, finalResult, Date.now() - recorder.startTime.getTime());
                        this.traceManager.endTrace(traceId, 'completed');
                        this.logger.info('编排任务执行完成');
                        return [2 /*return*/, finalResult];
                    case 5:
                        error_2 = _a.sent();
                        this.logger.error('编排任务执行失败:', error_2);
                        this.traceManager.recordError(traceId, error_2);
                        this.traceManager.endTrace(traceId, 'failed');
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 流式执行编排任务
     * @param input 输入内容
     * @param recorder 任务记录器
     * @returns 异步生成器
     */
    OrchestraAgent.prototype.executeStream = function (input, recorder) {
        return __asyncGenerator(this, arguments, function executeStream_1() {
            var traceId, plan, _loop_1, this_1, _i, _a, subtaskId, finalResult, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        traceId = this.traceManager.startTrace('orchestra_stream', {
                            input: input,
                            agentName: this.config.name
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 16, , 19]);
                        return [4 /*yield*/, __await({
                                role: 'assistant',
                                content: '开始分析任务并制定执行计划...',
                                timestamp: new Date()
                            })];
                    case 2: 
                    // 发送开始消息
                    return [4 /*yield*/, _b.sent()];
                    case 3:
                        // 发送开始消息
                        _b.sent();
                        return [4 /*yield*/, __await(this.plan(input, recorder))];
                    case 4:
                        plan = _b.sent();
                        return [4 /*yield*/, __await({
                                role: 'assistant',
                                content: "\u4EFB\u52A1\u89C4\u5212\u5B8C\u6210\uFF0C\u5171\u5206\u89E3\u4E3A ".concat(plan.subtasks.length, " \u4E2A\u5B50\u4EFB\u52A1"),
                                timestamp: new Date()
                            })];
                    case 5: return [4 /*yield*/, _b.sent()];
                    case 6:
                        _b.sent();
                        _loop_1 = function (subtaskId) {
                            var subtask, result;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        subtask = plan.subtasks.find(function (s) { return s.id === subtaskId; });
                                        if (!subtask)
                                            return [2 /*return*/, "continue"];
                                        return [4 /*yield*/, __await({
                                                role: 'assistant',
                                                content: "\u6B63\u5728\u6267\u884C\u5B50\u4EFB\u52A1: ".concat(subtask.name),
                                                timestamp: new Date()
                                            })];
                                    case 1: return [4 /*yield*/, _c.sent()];
                                    case 2:
                                        _c.sent();
                                        return [4 /*yield*/, __await(this_1.executeSubtask(subtask, traceId))];
                                    case 3:
                                        result = _c.sent();
                                        return [4 /*yield*/, __await({
                                                role: 'assistant',
                                                content: "\u5B50\u4EFB\u52A1\u5B8C\u6210: ".concat(subtask.name, "\n\u7ED3\u679C: ").concat(result.substring(0, 200), "..."),
                                                timestamp: new Date()
                                            })];
                                    case 4: return [4 /*yield*/, _c.sent()];
                                    case 5:
                                        _c.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = plan.executionOrder;
                        _b.label = 7;
                    case 7:
                        if (!(_i < _a.length)) return [3 /*break*/, 10];
                        subtaskId = _a[_i];
                        return [5 /*yield**/, _loop_1(subtaskId)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 7];
                    case 10: return [4 /*yield*/, __await({
                            role: 'assistant',
                            content: '正在生成最终报告...',
                            timestamp: new Date()
                        })];
                    case 11: 
                    // 3. 生成最终报告
                    return [4 /*yield*/, _b.sent()];
                    case 12:
                        // 3. 生成最终报告
                        _b.sent();
                        return [4 /*yield*/, __await(this.report(plan, new Map(), traceId))];
                    case 13:
                        finalResult = _b.sent();
                        return [4 /*yield*/, __await({
                                role: 'assistant',
                                content: finalResult,
                                timestamp: new Date()
                            })];
                    case 14: return [4 /*yield*/, _b.sent()];
                    case 15:
                        _b.sent();
                        this.traceManager.endTrace(traceId, 'completed');
                        return [3 /*break*/, 19];
                    case 16:
                        error_3 = _b.sent();
                        this.logger.error('流式编排任务执行失败:', error_3);
                        this.traceManager.recordError(traceId, error_3);
                        this.traceManager.endTrace(traceId, 'failed');
                        return [4 /*yield*/, __await({
                                role: 'assistant',
                                content: "\u6267\u884C\u5931\u8D25: ".concat(error_3 instanceof Error ? error_3.message : '未知错误'),
                                timestamp: new Date()
                            })];
                    case 17: return [4 /*yield*/, _b.sent()];
                    case 18:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 任务规划
     * @param input 输入内容
     * @param _recorder 任务记录器
     * @returns 执行计划
     */
    OrchestraAgent.prototype.plan = function (input, _recorder) {
        return __awaiter(this, void 0, void 0, function () {
            var planningPrompt, planningResult, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.plannerAgent) {
                            throw new Error('规划智能体未初始化');
                        }
                        planningPrompt = this.buildPlanningPrompt(input);
                        return [4 /*yield*/, this.plannerAgent.run(planningPrompt)];
                    case 1:
                        planningResult = _a.sent();
                        plan = this.parsePlanningResult(planningResult.output, input);
                        this.logger.info("\u4EFB\u52A1\u89C4\u5212\u5B8C\u6210\uFF0C\u5171 ".concat(plan.subtasks.length, " \u4E2A\u5B50\u4EFB\u52A1"));
                        return [2 /*return*/, plan];
                }
            });
        });
    };
    /**
     * 执行子任务
     * @param plan 执行计划
     * @param traceId 追踪ID
     * @returns 执行结果
     */
    OrchestraAgent.prototype.executeSubtasks = function (plan, traceId) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _loop_2, this_2, _i, _a, subtaskId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        results = new Map();
                        _loop_2 = function (subtaskId) {
                            var subtask, dependenciesMet, result;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        subtask = plan.subtasks.find(function (s) { return s.id === subtaskId; });
                                        if (!subtask)
                                            return [2 /*return*/, "continue"];
                                        dependenciesMet = subtask.dependencies.every(function (depId) { var _a; return results.has(depId) && ((_a = plan.subtasks.find(function (s) { return s.id === depId; })) === null || _a === void 0 ? void 0 : _a.status) === 'completed'; });
                                        if (!dependenciesMet) {
                                            this_2.logger.warn("\u5B50\u4EFB\u52A1 ".concat(subtask.name, " \u7684\u4F9D\u8D56\u672A\u6EE1\u8DB3\uFF0C\u8DF3\u8FC7\u6267\u884C"));
                                            return [2 /*return*/, "continue"];
                                        }
                                        return [4 /*yield*/, this_2.executeSubtask(subtask, traceId)];
                                    case 1:
                                        result = _c.sent();
                                        results.set(subtaskId, result);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, _a = plan.executionOrder;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        subtaskId = _a[_i];
                        return [5 /*yield**/, _loop_2(subtaskId)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * 执行单个子任务
     * @param subtask 子任务
     * @param traceId 追踪ID
     * @returns 执行结果
     */
    OrchestraAgent.prototype.executeSubtask = function (subtask, traceId) {
        return __awaiter(this, void 0, void 0, function () {
            var worker, _a, result, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        worker = this.workerAgents.get(subtask.assignedAgent);
                        if (!worker) {
                            throw new Error("\u5DE5\u4F5C\u667A\u80FD\u4F53\u4E0D\u5B58\u5728: ".concat(subtask.assignedAgent));
                        }
                        if (!!worker.instance) return [3 /*break*/, 2];
                        _a = worker;
                        return [4 /*yield*/, index_1.AgentFactory.createAgent(worker.config)];
                    case 1:
                        _a.instance = _b.sent();
                        _b.label = 2;
                    case 2:
                        subtask.status = 'in_progress';
                        subtask.startTime = new Date();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        this.logger.info("\u6267\u884C\u5B50\u4EFB\u52A1: ".concat(subtask.name, " (").concat(subtask.assignedAgent, ")"));
                        this.traceManager.recordEvent(traceId, 'subtask_start', { subtask: subtask });
                        return [4 /*yield*/, worker.instance.run(subtask.description)];
                    case 4:
                        result = _b.sent();
                        subtask.status = 'completed';
                        subtask.endTime = new Date();
                        subtask.result = result.output;
                        this.traceManager.recordEvent(traceId, 'subtask_complete', {
                            subtask: subtask,
                            result: result.output
                        });
                        return [2 /*return*/, result.output];
                    case 5:
                        error_4 = _b.sent();
                        subtask.status = 'failed';
                        subtask.endTime = new Date();
                        subtask.error = error_4 instanceof Error ? error_4.message : '未知错误';
                        this.logger.error("\u5B50\u4EFB\u52A1\u6267\u884C\u5931\u8D25: ".concat(subtask.name), error_4);
                        this.traceManager.recordError(traceId, error_4, { subtask: subtask });
                        throw error_4;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 生成最终报告
     * @param plan 执行计划
     * @param results 执行结果
     * @param traceId 追踪ID
     * @returns 最终报告
     */
    OrchestraAgent.prototype.report = function (plan, results, traceId) {
        return __awaiter(this, void 0, void 0, function () {
            var reportPrompt, reportResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.reporterAgent) {
                            // 如果没有报告智能体，直接聚合结果
                            return [2 /*return*/, this.aggregateResults(plan, results)];
                        }
                        reportPrompt = this.buildReportPrompt(plan, results);
                        return [4 /*yield*/, this.reporterAgent.run(reportPrompt)];
                    case 1:
                        reportResult = _a.sent();
                        this.traceManager.recordEvent(traceId, 'report_generated', {
                            report: reportResult.output
                        });
                        return [2 /*return*/, reportResult.output];
                }
            });
        });
    };
    /**
     * 聚合结果
     * @param plan 执行计划
     * @param _results 执行结果
     * @returns 聚合后的结果
     */
    OrchestraAgent.prototype.aggregateResults = function (plan, _results) {
        var report = "# \u4EFB\u52A1\u6267\u884C\u62A5\u544A\n\n";
        report += "**\u539F\u59CB\u4EFB\u52A1**: ".concat(plan.overallTask, "\n\n");
        report += "**\u6267\u884C\u65F6\u95F4**: ".concat(new Date().toLocaleString(), "\n\n");
        report += "## \u5B50\u4EFB\u52A1\u6267\u884C\u7ED3\u679C\n\n";
        for (var _i = 0, _a = plan.subtasks; _i < _a.length; _i++) {
            var subtask = _a[_i];
            report += "### ".concat(subtask.name, "\n");
            report += "- **\u72B6\u6001**: ".concat(subtask.status, "\n");
            report += "- **\u6267\u884C\u667A\u80FD\u4F53**: ".concat(subtask.assignedAgent, "\n");
            if (subtask.result) {
                report += "- **\u7ED3\u679C**: ".concat(subtask.result, "\n");
            }
            if (subtask.error) {
                report += "- **\u9519\u8BEF**: ".concat(subtask.error, "\n");
            }
            report += "\n";
        }
        return report;
    };
    /**
     * 初始化工作智能体
     */
    OrchestraAgent.prototype.initializeWorkerAgents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, workerInfo, workerConfig, worker;
            return __generator(this, function (_b) {
                if (!this.config.workers || !this.config.workersInfo) {
                    return [2 /*return*/];
                }
                for (_i = 0, _a = this.config.workersInfo; _i < _a.length; _i++) {
                    workerInfo = _a[_i];
                    workerConfig = this.config.workers[workerInfo.name];
                    if (!workerConfig) {
                        this.logger.warn("\u5DE5\u4F5C\u667A\u80FD\u4F53\u914D\u7F6E\u4E0D\u5B58\u5728: ".concat(workerInfo.name));
                        continue;
                    }
                    worker = {
                        name: workerInfo.name,
                        description: workerInfo.desc,
                        strengths: workerInfo.strengths,
                        weaknesses: workerInfo.weaknesses,
                        config: workerConfig
                    };
                    this.workerAgents.set(workerInfo.name, worker);
                    this.logger.info("\u5DE5\u4F5C\u667A\u80FD\u4F53\u5DF2\u6CE8\u518C: ".concat(workerInfo.name));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * 构建规划提示
     * @param input 输入内容
     * @returns 规划提示
     */
    OrchestraAgent.prototype.buildPlanningPrompt = function (input) {
        var workers = Array.from(this.workerAgents.values());
        var workerDescriptions = workers.map(function (w) {
            return "- ".concat(w.name, ": ").concat(w.description, " (\u4F18\u52BF: ").concat(w.strengths.join(', '), ")");
        }).join('\n');
        return "\u8BF7\u5206\u6790\u4EE5\u4E0B\u4EFB\u52A1\u5E76\u5C06\u5176\u5206\u89E3\u4E3A\u591A\u4E2A\u5B50\u4EFB\u52A1\uFF1A\n\n**\u4EFB\u52A1**: ".concat(input, "\n\n**\u53EF\u7528\u5DE5\u4F5C\u667A\u80FD\u4F53**:\n").concat(workerDescriptions, "\n\n\u8BF7\u6309\u7167\u4EE5\u4E0BJSON\u683C\u5F0F\u8FD4\u56DE\u4EFB\u52A1\u5206\u89E3\u7ED3\u679C\uFF1A\n{\n  \"subtasks\": [\n    {\n      \"id\": \"task_1\",\n      \"name\": \"\u5B50\u4EFB\u52A1\u540D\u79F0\",\n      \"description\": \"\u8BE6\u7EC6\u63CF\u8FF0\",\n      \"assignedAgent\": \"\u667A\u80FD\u4F53\u540D\u79F0\",\n      \"dependencies\": []\n    }\n  ],\n  \"executionOrder\": [\"task_1\", \"task_2\", ...]\n}\n\n\u8981\u6C42\uFF1A\n1. \u6BCF\u4E2A\u5B50\u4EFB\u52A1\u5E94\u8BE5\u5206\u914D\u7ED9\u6700\u9002\u5408\u7684\u667A\u80FD\u4F53\n2. \u8003\u8651\u4EFB\u52A1\u4E4B\u95F4\u7684\u4F9D\u8D56\u5173\u7CFB\n3. \u786E\u4FDD\u4EFB\u52A1\u5206\u89E3\u7684\u5B8C\u6574\u6027\u548C\u903B\u8F91\u6027\n4. \u5B50\u4EFB\u52A1\u6570\u91CF\u63A7\u5236\u57283-8\u4E2A\u4E4B\u95F4");
    };
    /**
     * 构建报告提示
     * @param plan 执行计划
     * @param results 执行结果
     * @returns 报告提示
     */
    OrchestraAgent.prototype.buildReportPrompt = function (plan, results) {
        var subtaskResults = plan.subtasks.map(function (subtask) { return ({
            name: subtask.name,
            status: subtask.status,
            result: results.get(subtask.id) || subtask.result || '',
            error: subtask.error
        }); });
        return "\u8BF7\u57FA\u4E8E\u4EE5\u4E0B\u4FE1\u606F\u751F\u6210\u6700\u7EC8\u7684\u4EFB\u52A1\u6267\u884C\u62A5\u544A\uFF1A\n\n**\u539F\u59CB\u4EFB\u52A1**: ".concat(plan.overallTask, "\n\n**\u5B50\u4EFB\u52A1\u6267\u884C\u7ED3\u679C**:\n").concat(JSON.stringify(subtaskResults, null, 2), "\n\n\u8BF7\u751F\u6210\u4E00\u4E2A\u7ED3\u6784\u6E05\u6670\u3001\u5185\u5BB9\u5B8C\u6574\u7684\u62A5\u544A\uFF0C\u5305\u62EC\uFF1A\n1. \u4EFB\u52A1\u6982\u8FF0\n2. \u6267\u884C\u8FC7\u7A0B\u603B\u7ED3\n3. \u4E3B\u8981\u6210\u679C\n4. \u9047\u5230\u7684\u95EE\u9898\u548C\u89E3\u51B3\u65B9\u6848\n5. \u7ED3\u8BBA\u548C\u5EFA\u8BAE");
    };
    /**
     * 解析规划结果
     * @param planningResult 规划结果
     * @param originalTask 原始任务
     * @returns 执行计划
     */
    OrchestraAgent.prototype.parsePlanningResult = function (planningResult, originalTask) {
        try {
            // 尝试从结果中提取JSON
            var jsonMatch = planningResult.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法从规划结果中提取JSON');
            }
            var planData = JSON.parse(jsonMatch[0]);
            var subtasks = planData.subtasks.map(function (task, index) { return ({
                id: task.id || "task_".concat(index + 1),
                name: task.name || "\u5B50\u4EFB\u52A1".concat(index + 1),
                description: task.description || '',
                assignedAgent: task.assignedAgent || 'default',
                dependencies: task.dependencies || [],
                status: 'pending'
            }); });
            return {
                id: "plan_".concat(Date.now()),
                overallTask: originalTask,
                subtasks: subtasks,
                executionOrder: planData.executionOrder || subtasks.map(function (s) { return s.id; }),
                estimatedDuration: subtasks.length * 30000, // 估算每个任务30秒
                createdAt: new Date()
            };
        }
        catch (error) {
            this.logger.error('解析规划结果失败:', error);
            // 创建默认计划
            return {
                id: "plan_".concat(Date.now()),
                overallTask: originalTask,
                subtasks: [{
                        id: 'task_1',
                        name: '默认任务',
                        description: originalTask,
                        assignedAgent: 'default',
                        dependencies: [],
                        status: 'pending'
                    }],
                executionOrder: ['task_1'],
                estimatedDuration: 30000,
                createdAt: new Date()
            };
        }
    };
    /**
     * 获取规划智能体指令
     * @returns 指令文本
     */
    OrchestraAgent.prototype.getPlannerInstructions = function () {
        return "\u4F60\u662F\u4E00\u4E2A\u4EFB\u52A1\u89C4\u5212\u4E13\u5BB6\uFF0C\u64C5\u957F\u5C06\u590D\u6742\u4EFB\u52A1\u5206\u89E3\u4E3A\u591A\u4E2A\u53EF\u6267\u884C\u7684\u5B50\u4EFB\u52A1\u3002\n\u4F60\u7684\u804C\u8D23\u662F\uFF1A\n1. \u5206\u6790\u7528\u6237\u8F93\u5165\u7684\u4EFB\u52A1\n2. \u8BC6\u522B\u4EFB\u52A1\u7684\u5173\u952E\u7EC4\u6210\u90E8\u5206\n3. \u5C06\u4EFB\u52A1\u5206\u89E3\u4E3A\u903B\u8F91\u6E05\u6670\u7684\u5B50\u4EFB\u52A1\n4. \u4E3A\u6BCF\u4E2A\u5B50\u4EFB\u52A1\u5206\u914D\u5408\u9002\u7684\u6267\u884C\u667A\u80FD\u4F53\n5. \u786E\u5B9A\u4EFB\u52A1\u6267\u884C\u7684\u4F9D\u8D56\u5173\u7CFB\u548C\u987A\u5E8F\n\n\u8BF7\u59CB\u7EC8\u4EE5\u7ED3\u6784\u5316\u7684\u65B9\u5F0F\u601D\u8003\uFF0C\u786E\u4FDD\u4EFB\u52A1\u5206\u89E3\u7684\u5B8C\u6574\u6027\u548C\u53EF\u6267\u884C\u6027\u3002";
    };
    /**
     * 获取报告智能体指令
     * @returns 指令文本
     */
    OrchestraAgent.prototype.getReporterInstructions = function () {
        return "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u62A5\u544A\u751F\u6210\u4E13\u5BB6\uFF0C\u64C5\u957F\u5C06\u4EFB\u52A1\u6267\u884C\u7ED3\u679C\u6574\u7406\u6210\u6E05\u6670\u3001\u5B8C\u6574\u7684\u62A5\u544A\u3002\n\u4F60\u7684\u804C\u8D23\u662F\uFF1A\n1. \u5206\u6790\u4EFB\u52A1\u6267\u884C\u8FC7\u7A0B\u548C\u7ED3\u679C\n2. \u8BC6\u522B\u5173\u952E\u6210\u679C\u548C\u95EE\u9898\n3. \u751F\u6210\u7ED3\u6784\u5316\u7684\u6267\u884C\u62A5\u544A\n4. \u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u603B\u7ED3\u548C\u5EFA\u8BAE\n\n\u8BF7\u786E\u4FDD\u62A5\u544A\u5185\u5BB9\u51C6\u786E\u3001\u5B8C\u6574\uFF0C\u683C\u5F0F\u6E05\u6670\u6613\u8BFB\u3002";
    };
    /**
     * 清理资源
     */
    OrchestraAgent.prototype.onCleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, worker;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger.info('正在清理编排智能体资源...');
                        _i = 0, _a = Array.from(this.workerAgents.values());
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        worker = _a[_i];
                        if (!worker.instance) return [3 /*break*/, 3];
                        return [4 /*yield*/, worker.instance.cleanup()];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (!this.plannerAgent) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.plannerAgent.cleanup()];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        if (!this.reporterAgent) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.reporterAgent.cleanup()];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 获取智能体信息
     * @returns 智能体信息
     */
    OrchestraAgent.prototype.getInfo = function () {
        return {
            type: 'orchestra',
            name: this.config.name,
            workerCount: this.workerAgents.size,
            workers: Array.from(this.workerAgents.keys()),
            hasPlanner: !!this.plannerAgent,
            hasReporter: !!this.reporterAgent,
            isReady: this.isReady()
        };
    };
    return OrchestraAgent;
}(BaseAgent_1.BaseAgent));
exports.OrchestraAgent = OrchestraAgent;
