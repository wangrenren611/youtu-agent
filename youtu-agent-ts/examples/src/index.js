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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAMEWORK_NAME = exports.VERSION = exports.cleanup = exports.getInfo = exports.getLogger = exports.getConfigManager = exports.getToolManager = exports.getAllAgents = exports.getAgent = exports.createAgent = exports.YoutuAgentTS = exports.AgentFactory = exports.SimpleAgent = exports.Logger = exports.ConfigManager = exports.ToolManager = exports.BaseAgent = void 0;
const agents_1 = require("./agents");
const ToolManager_1 = require("./core/tool/ToolManager");
const ConfigManager_1 = require("./core/config/ConfigManager");
const Logger_1 = require("./utils/Logger");
const tools_1 = require("./tools");
const dotenv = __importStar(require("dotenv"));
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
class YoutuAgentTS {
    constructor() {
        this.isInitialized = false;
        this.logger = new Logger_1.Logger('YoutuAgentTS');
        this.toolManager = new ToolManager_1.ToolManager();
        this.configManager = new ConfigManager_1.ConfigManager();
    }
    /**
     * 初始化框架
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            this.logger.info('正在初始化youtu-agent-ts框架...');
            // 注册内置工具
            this.toolManager.registerTools(tools_1.builtinTools);
            this.logger.info(`已注册 ${tools_1.builtinTools.length} 个内置工具`);
            this.isInitialized = true;
            this.logger.info('youtu-agent-ts框架初始化完成');
        }
        catch (error) {
            this.logger.error('框架初始化失败:', error);
            throw error;
        }
    }
    /**
     * 创建智能体
     * @param config 智能体配置
     * @returns 智能体实例
     */
    async createAgent(config) {
        await this.initialize();
        return agents_1.AgentFactory.createAgent(config);
    }
    /**
     * 获取智能体
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 智能体实例
     */
    getAgent(type, name) {
        return agents_1.AgentFactory.getAgent(type, name);
    }
    /**
     * 获取所有智能体
     * @returns 智能体列表
     */
    getAllAgents() {
        return agents_1.AgentFactory.getAllAgents();
    }
    /**
     * 获取工具管理器
     * @returns 工具管理器实例
     */
    getToolManager() {
        return this.toolManager;
    }
    /**
     * 获取配置管理器
     * @returns 配置管理器实例
     */
    getConfigManager() {
        return this.configManager;
    }
    /**
     * 获取日志器
     * @returns 日志器实例
     */
    getLogger() {
        return this.logger;
    }
    /**
     * 获取框架信息
     * @returns 框架信息
     */
    getInfo() {
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
    }
    /**
     * 清理框架资源
     */
    async cleanup() {
        try {
            this.logger.info('正在清理框架资源...');
            await agents_1.AgentFactory.cleanupAll();
            this.toolManager.cleanup();
            this.isInitialized = false;
            this.logger.info('框架资源清理完成');
        }
        catch (error) {
            this.logger.error('框架资源清理失败:', error);
        }
    }
}
exports.YoutuAgentTS = YoutuAgentTS;
// 创建默认实例
const youtuAgent = new YoutuAgentTS();
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
