"use strict";
/**
 * 智能体工厂
 * 负责创建和管理不同类型的智能体
 */
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
exports.cleanupAllAgents = exports.removeAgent = exports.getAgentList = exports.getAllAgents = exports.getAgent = exports.createAgent = exports.OrchestraAgent = exports.SimpleAgent = exports.BaseAgent = exports.AgentFactory = void 0;
var SimpleAgent_1 = require("./SimpleAgent");
var OrchestraAgent_1 = require("./OrchestraAgent");
var types_1 = require("../types");
var Logger_1 = require("../utils/Logger");
var logger = new Logger_1.Logger('AgentFactory');
/**
 * 智能体工厂类
 */
var AgentFactory = /** @class */ (function () {
    function AgentFactory() {
    }
    /**
     * 创建智能体
     * @param config 智能体配置
     * @returns 智能体实例
     */
    AgentFactory.createAgent = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var agentId, agent, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        agentId = "".concat(config.type, ":").concat(config.name);
                        // 如果智能体已存在，返回现有实例
                        if (this.agents.has(agentId)) {
                            logger.info("\u8FD4\u56DE\u73B0\u6709\u667A\u80FD\u4F53: ".concat(agentId));
                            return [2 /*return*/, this.agents.get(agentId)];
                        }
                        logger.info("\u521B\u5EFA\u65B0\u667A\u80FD\u4F53: ".concat(agentId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        switch (config.type) {
                            case 'simple':
                                agent = new SimpleAgent_1.SimpleAgent(config);
                                break;
                            case 'orchestra':
                                agent = new OrchestraAgent_1.OrchestraAgent(config);
                                break;
                            case 'workforce':
                                // TODO: 实现WorkforceAgent
                                throw new types_1.AgentError('WorkforceAgent尚未实现', 'NOT_IMPLEMENTED');
                            default:
                                throw new types_1.AgentError("\u672A\u77E5\u7684\u667A\u80FD\u4F53\u7C7B\u578B: ".concat(config.type), 'UNKNOWN_AGENT_TYPE');
                        }
                        // 初始化智能体
                        return [4 /*yield*/, agent.initialize()];
                    case 2:
                        // 初始化智能体
                        _a.sent();
                        // 缓存智能体实例
                        this.agents.set(agentId, agent);
                        logger.info("\u667A\u80FD\u4F53\u521B\u5EFA\u6210\u529F: ".concat(agentId));
                        return [2 /*return*/, agent];
                    case 3:
                        error_1 = _a.sent();
                        logger.error("\u667A\u80FD\u4F53\u521B\u5EFA\u5931\u8D25: ".concat(agentId), error_1, "dsadas");
                        throw new types_1.AgentError("\u667A\u80FD\u4F53\u521B\u5EFA\u5931\u8D25: ".concat(error_1 instanceof Error ? error_1.message : '未知错误'), 'AGENT_CREATION_FAILED', error_1);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 获取智能体
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 智能体实例或undefined
     */
    AgentFactory.getAgent = function (type, name) {
        var agentId = "".concat(type, ":").concat(name);
        return this.agents.get(agentId);
    };
    /**
     * 获取所有智能体
     * @returns 智能体实例数组
     */
    AgentFactory.getAllAgents = function () {
        return Array.from(this.agents.values());
    };
    /**
     * 获取智能体列表
     * @returns 智能体信息数组
     */
    AgentFactory.getAgentList = function () {
        return Array.from(this.agents.entries()).map(function (_a) {
            var id = _a[0], agent = _a[1];
            var _b = id.split(':'), type = _b[0], name = _b[1];
            return {
                type: type,
                name: name,
                isReady: agent.isReady()
            };
        });
    };
    /**
     * 移除智能体
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 是否成功移除
     */
    AgentFactory.removeAgent = function (type, name) {
        return __awaiter(this, void 0, void 0, function () {
            var agentId, agent, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        agentId = "".concat(type, ":").concat(name);
                        agent = this.agents.get(agentId);
                        if (!agent) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, agent.cleanup()];
                    case 2:
                        _a.sent();
                        this.agents.delete(agentId);
                        logger.info("\u667A\u80FD\u4F53\u5DF2\u79FB\u9664: ".concat(agentId));
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        logger.error("\u667A\u80FD\u4F53\u79FB\u9664\u5931\u8D25: ".concat(agentId), error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * 清理所有智能体
     */
    AgentFactory.cleanupAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cleanupPromises;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info('开始清理所有智能体...');
                        cleanupPromises = Array.from(this.agents.values()).map(function (agent) {
                            return agent.cleanup().catch(function (error) {
                                return logger.error('智能体清理失败:', error);
                            });
                        });
                        return [4 /*yield*/, Promise.all(cleanupPromises)];
                    case 1:
                        _a.sent();
                        this.agents.clear();
                        logger.info('所有智能体清理完成');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 检查智能体是否存在
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 是否存在
     */
    AgentFactory.hasAgent = function (type, name) {
        var agentId = "".concat(type, ":").concat(name);
        return this.agents.has(agentId);
    };
    /**
     * 获取智能体统计信息
     * @returns 统计信息
     */
    AgentFactory.getStats = function () {
        var agents = Array.from(this.agents.values());
        var byType = {};
        var ready = 0;
        var notReady = 0;
        agents.forEach(function (agent) {
            var type = agent.getType();
            byType[type] = (byType[type] || 0) + 1;
            if (agent.isReady()) {
                ready++;
            }
            else {
                notReady++;
            }
        });
        return {
            total: agents.length,
            byType: byType,
            ready: ready,
            notReady: notReady
        };
    };
    AgentFactory.agents = new Map();
    return AgentFactory;
}());
exports.AgentFactory = AgentFactory;
// 导出智能体类
var BaseAgent_1 = require("../core/agent/BaseAgent");
Object.defineProperty(exports, "BaseAgent", { enumerable: true, get: function () { return BaseAgent_1.BaseAgent; } });
var SimpleAgent_2 = require("./SimpleAgent");
Object.defineProperty(exports, "SimpleAgent", { enumerable: true, get: function () { return SimpleAgent_2.SimpleAgent; } });
var OrchestraAgent_2 = require("./OrchestraAgent");
Object.defineProperty(exports, "OrchestraAgent", { enumerable: true, get: function () { return OrchestraAgent_2.OrchestraAgent; } });
// 导出工厂函数
exports.createAgent = AgentFactory.createAgent.bind(AgentFactory);
exports.getAgent = AgentFactory.getAgent.bind(AgentFactory);
exports.getAllAgents = AgentFactory.getAllAgents.bind(AgentFactory);
exports.getAgentList = AgentFactory.getAgentList.bind(AgentFactory);
exports.removeAgent = AgentFactory.removeAgent.bind(AgentFactory);
exports.cleanupAllAgents = AgentFactory.cleanupAll.bind(AgentFactory);
