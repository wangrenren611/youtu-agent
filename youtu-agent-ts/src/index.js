"use strict";
/**
 * youtu-agent-ts 主入口文件
 * 提供框架的核心功能和API
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAMEWORK_NAME = exports.VERSION = exports.cleanup = exports.getInfo = exports.getLogger = exports.getConfigManager = exports.getToolManager = exports.getAllAgents = exports.getAgent = exports.createAgent = exports.YoutuAgentTS = exports.AgentFactory = exports.SimpleAgent = exports.Logger = exports.ConfigManager = exports.ToolManager = exports.BaseAgent = void 0;
var agents_1 = require("./agents");
var ToolManager_1 = require("./core/tool/ToolManager");
var ConfigManager_1 = require("./core/config/ConfigManager");
var Logger_1 = require("./utils/Logger");
var tools_1 = require("./tools");
var dotenv = require("dotenv");
dotenv.config({ path: ".env" });
// 导出核心类型
__exportStar(require("./types"), exports);
// 导出核心类
var BaseAgent_1 = require("./core/agent/BaseAgent");
Object.defineProperty(exports, "BaseAgent", { enumerable: true, get: function () { return BaseAgent_1.BaseAgent; } });
var ToolManager_2 = require("./core/tool/ToolManager");
Object.defineProperty(exports, "ToolManager", { enumerable: true, get: function () { return ToolManager_2.ToolManager; } });
var ConfigManager_2 = require("./core/config/ConfigManager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return ConfigManager_2.ConfigManager; } });
var Logger_2 = require("./utils/Logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger_2.Logger; } });
// 导出智能体
var SimpleAgent_1 = require("./agents/SimpleAgent");
Object.defineProperty(exports, "SimpleAgent", { enumerable: true, get: function () { return SimpleAgent_1.SimpleAgent; } });
var agents_2 = require("./agents");
Object.defineProperty(exports, "AgentFactory", { enumerable: true, get: function () { return agents_2.AgentFactory; } });
// 导出工具
__exportStar(require("./tools"), exports);
/**
 * youtu-agent-ts 框架类
 * 提供统一的框架接口
 */
var YoutuAgentTS = /** @class */ (function () {
    function YoutuAgentTS() {
        this.isInitialized = false;
        this.logger = new Logger_1.Logger('YoutuAgentTS');
        this.toolManager = new ToolManager_1.ToolManager();
        this.configManager = new ConfigManager_1.ConfigManager();
    }
    /**
     * 初始化框架
     */
    YoutuAgentTS.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.isInitialized) {
                    return [2 /*return*/];
                }
                try {
                    this.logger.info('正在初始化youtu-agent-ts框架...');
                    // 注册内置工具
                    this.toolManager.registerTools(tools_1.builtinTools);
                    this.logger.info("\u5DF2\u6CE8\u518C ".concat(tools_1.builtinTools.length, " \u4E2A\u5185\u7F6E\u5DE5\u5177"));
                    this.isInitialized = true;
                    this.logger.info('youtu-agent-ts框架初始化完成');
                }
                catch (error) {
                    this.logger.error('框架初始化失败:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * 创建智能体
     * @param config 智能体配置
     * @returns 智能体实例
     */
    YoutuAgentTS.prototype.createAgent = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, agents_1.AgentFactory.createAgent(config)];
                }
            });
        });
    };
    /**
     * 获取智能体
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 智能体实例
     */
    YoutuAgentTS.prototype.getAgent = function (type, name) {
        return agents_1.AgentFactory.getAgent(type, name);
    };
    /**
     * 获取所有智能体
     * @returns 智能体列表
     */
    YoutuAgentTS.prototype.getAllAgents = function () {
        return agents_1.AgentFactory.getAllAgents();
    };
    /**
     * 获取工具管理器
     * @returns 工具管理器实例
     */
    YoutuAgentTS.prototype.getToolManager = function () {
        return this.toolManager;
    };
    /**
     * 获取配置管理器
     * @returns 配置管理器实例
     */
    YoutuAgentTS.prototype.getConfigManager = function () {
        return this.configManager;
    };
    /**
     * 获取日志器
     * @returns 日志器实例
     */
    YoutuAgentTS.prototype.getLogger = function () {
        return this.logger;
    };
    /**
     * 获取框架信息
     * @returns 框架信息
     */
    YoutuAgentTS.prototype.getInfo = function () {
        return {
            name: 'youtu-agent-ts',
            version: '1.0.0',
            isInitialized: this.isInitialized,
            agents: agents_1.AgentFactory.getStats(),
            tools: {
                total: this.toolManager.getAllTools().length,
                names: this.toolManager.getToolNames()
            }
        };
    };
    /**
     * 清理框架资源
     */
    YoutuAgentTS.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.logger.info('正在清理框架资源...');
                        return [4 /*yield*/, agents_1.AgentFactory.cleanupAll()];
                    case 1:
                        _a.sent();
                        this.toolManager.cleanup();
                        this.isInitialized = false;
                        this.logger.info('框架资源清理完成');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('框架资源清理失败:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return YoutuAgentTS;
}());
exports.YoutuAgentTS = YoutuAgentTS;
// 创建默认实例
var youtuAgent = new YoutuAgentTS();
// 导出默认实例和工厂函数
exports.default = youtuAgent;
// 便捷函数
exports.createAgent = youtuAgent.createAgent.bind(youtuAgent);
exports.getAgent = youtuAgent.getAgent.bind(youtuAgent);
exports.getAllAgents = youtuAgent.getAllAgents.bind(youtuAgent);
exports.getToolManager = youtuAgent.getToolManager.bind(youtuAgent);
exports.getConfigManager = youtuAgent.getConfigManager.bind(youtuAgent);
exports.getLogger = youtuAgent.getLogger.bind(youtuAgent);
exports.getInfo = youtuAgent.getInfo.bind(youtuAgent);
exports.cleanup = youtuAgent.cleanup.bind(youtuAgent);
// 框架版本信息
exports.VERSION = '1.0.0';
exports.FRAMEWORK_NAME = 'youtu-agent-ts';
