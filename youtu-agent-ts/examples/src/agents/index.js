"use strict";
/**
 * 智能体工厂
 * 负责创建和管理不同类型的智能体
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupAllAgents = exports.removeAgent = exports.getAgentList = exports.getAllAgents = exports.getAgent = exports.createAgent = exports.OrchestraAgent = exports.SimpleAgent = exports.BaseAgent = exports.AgentFactory = void 0;
const SimpleAgent_1 = require("./SimpleAgent");
const OrchestraAgent_1 = require("./OrchestraAgent");
const types_1 = require("../types");
const Logger_1 = require("../utils/Logger");
const logger = new Logger_1.Logger('AgentFactory');
/**
 * 智能体工厂类
 */
class AgentFactory {
    /**
     * 创建智能体
     * @param config 智能体配置
     * @returns 智能体实例
     */
    static async createAgent(config) {
        const agentId = `${config.type}:${config.name}`;
        // 如果智能体已存在，返回现有实例
        if (this.agents.has(agentId)) {
            logger.info(`返回现有智能体: ${agentId}`);
            return this.agents.get(agentId);
        }
        logger.info(`创建新智能体: ${agentId}`);
        let agent;
        try {
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
                    throw new types_1.AgentError(`未知的智能体类型: ${config.type}`, 'UNKNOWN_AGENT_TYPE');
            }
            // 初始化智能体
            await agent.initialize();
            // 缓存智能体实例
            this.agents.set(agentId, agent);
            logger.info(`智能体创建成功: ${agentId}`);
            return agent;
        }
        catch (error) {
            logger.error(`智能体创建失败: ${agentId}`, error, "dsadas");
            throw new types_1.AgentError(`智能体创建失败: ${error instanceof Error ? error.message : '未知错误'}`, 'AGENT_CREATION_FAILED', error);
        }
    }
    /**
     * 获取智能体
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 智能体实例或undefined
     */
    static getAgent(type, name) {
        const agentId = `${type}:${name}`;
        return this.agents.get(agentId);
    }
    /**
     * 获取所有智能体
     * @returns 智能体实例数组
     */
    static getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * 获取智能体列表
     * @returns 智能体信息数组
     */
    static getAgentList() {
        return Array.from(this.agents.entries()).map(([id, agent]) => {
            const [type, name] = id.split(':');
            return {
                type,
                name,
                isReady: agent.isReady()
            };
        });
    }
    /**
     * 移除智能体
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 是否成功移除
     */
    static async removeAgent(type, name) {
        const agentId = `${type}:${name}`;
        const agent = this.agents.get(agentId);
        if (agent) {
            try {
                await agent.cleanup();
                this.agents.delete(agentId);
                logger.info(`智能体已移除: ${agentId}`);
                return true;
            }
            catch (error) {
                logger.error(`智能体移除失败: ${agentId}`, error);
                return false;
            }
        }
        return false;
    }
    /**
     * 清理所有智能体
     */
    static async cleanupAll() {
        logger.info('开始清理所有智能体...');
        const cleanupPromises = Array.from(this.agents.values()).map(agent => agent.cleanup().catch(error => logger.error('智能体清理失败:', error)));
        await Promise.all(cleanupPromises);
        this.agents.clear();
        logger.info('所有智能体清理完成');
    }
    /**
     * 检查智能体是否存在
     * @param type 智能体类型
     * @param name 智能体名称
     * @returns 是否存在
     */
    static hasAgent(type, name) {
        const agentId = `${type}:${name}`;
        return this.agents.has(agentId);
    }
    /**
     * 获取智能体统计信息
     * @returns 统计信息
     */
    static getStats() {
        const agents = Array.from(this.agents.values());
        const byType = {};
        let ready = 0;
        let notReady = 0;
        agents.forEach(agent => {
            const type = agent.getType();
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
            byType,
            ready,
            notReady
        };
    }
}
exports.AgentFactory = AgentFactory;
AgentFactory.agents = new Map();
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
