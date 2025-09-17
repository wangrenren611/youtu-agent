/**
 * 智能体工厂
 * 负责创建和管理不同类型的智能体
 */

import { BaseAgent } from '../core/agent/BaseAgent';
import { SimpleAgent } from './SimpleAgent';
import { OrchestraAgent } from './OrchestraAgent';
import { WorkforceAgent } from './workforce/WorkforceAgent';
import { AgentConfig, AgentError } from '../types';
import { Logger } from '../utils/Logger';

const logger = new Logger('AgentFactory');

/**
 * 智能体工厂类
 */
export class AgentFactory {
  private static agents: Map<string, BaseAgent> = new Map();

  /**
   * 创建智能体
   * @param config 智能体配置
   * @param toolManager 工具管理器实例
   * @param configManager 配置管理器实例
   * @returns 智能体实例
   */
  static async createAgent(config: AgentConfig, toolManager?: any, configManager?: any): Promise<BaseAgent> {
    const agentId = `${config.type}:${config.name}`;
    
    // 如果智能体已存在，返回现有实例
    if (this.agents.has(agentId)) {
      logger.info(`返回现有智能体: ${agentId}`);
      return this.agents.get(agentId)!;
    }

    logger.info(`创建新智能体: ${agentId}`);

    let agent: BaseAgent;

    try {
      switch (config.type) {
        case 'simple':
          agent = new SimpleAgent(config, toolManager, configManager);
          break;
        case 'orchestra':
          agent = new OrchestraAgent(config, toolManager, configManager);
          break;
        case 'workforce':
          agent = new WorkforceAgent(config, toolManager, configManager);
          break;
        default:
          throw new AgentError(`未知的智能体类型: ${config.type}`, 'UNKNOWN_AGENT_TYPE');
      }

      // 初始化智能体
      await agent.initialize();

      // 缓存智能体实例
      this.agents.set(agentId, agent);

      logger.info(`智能体创建成功: ${agentId}`);
      return agent;

    } catch (error) {
      logger.error(`智能体创建失败: ${agentId}`, error,"dsadas");
      throw new AgentError(
        `智能体创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'AGENT_CREATION_FAILED',
        error
      );
    }
  }

  /**
   * 获取智能体
   * @param type 智能体类型
   * @param name 智能体名称
   * @returns 智能体实例或undefined
   */
  static getAgent(type: string, name: string): BaseAgent | undefined {
    const agentId = `${type}:${name}`;
    return this.agents.get(agentId);
  }

  /**
   * 获取所有智能体
   * @returns 智能体实例数组
   */
  static getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 获取智能体列表
   * @returns 智能体信息数组
   */
  static getAgentList(): Array<{ type: string; name: string; isReady: boolean }> {
    return Array.from(this.agents.entries()).map(([id, agent]) => {
      const [type, name] = id.split(':');
      return {
        type: type || 'unknown',
        name: name || 'unknown',
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
  static async removeAgent(type: string, name: string): Promise<boolean> {
    const agentId = `${type}:${name}`;
    const agent = this.agents.get(agentId);
    
    if (agent) {
      try {
        await agent.cleanup();
        this.agents.delete(agentId);
        logger.info(`智能体已移除: ${agentId}`);
        return true;
      } catch (error) {
        logger.error(`智能体移除失败: ${agentId}`, error);
        return false;
      }
    }
    
    return false;
  }

  /**
   * 清理所有智能体
   */
  static async cleanupAll(): Promise<void> {
    logger.info('开始清理所有智能体...');
    
    const cleanupPromises = Array.from(this.agents.values()).map(agent => 
      agent.cleanup().catch(error => 
        logger.error('智能体清理失败:', error)
      )
    );
    
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
  static hasAgent(type: string, name: string): boolean {
    const agentId = `${type}:${name}`;
    return this.agents.has(agentId);
  }

  /**
   * 获取智能体统计信息
   * @returns 统计信息
   */
  static getStats(): {
    total: number;
    byType: Record<string, number>;
    ready: number;
    notReady: number;
  } {
    const agents = Array.from(this.agents.values());
    const byType: Record<string, number> = {};
    let ready = 0;
    let notReady = 0;

    agents.forEach(agent => {
      const type = agent.getType();
      byType[type] = (byType[type] || 0) + 1;
      
      if (agent.isReady()) {
        ready++;
      } else {
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

// 导出智能体类
export { BaseAgent } from '../core/agent/BaseAgent';
export { SimpleAgent } from './SimpleAgent';
export { OrchestraAgent } from './OrchestraAgent';
export { WorkforceAgent } from './workforce/WorkforceAgent';

// 导出工厂函数
export const createAgent = AgentFactory.createAgent.bind(AgentFactory);
export const getAgent = AgentFactory.getAgent.bind(AgentFactory);
export const getAllAgents = AgentFactory.getAllAgents.bind(AgentFactory);
export const getAgentList = AgentFactory.getAgentList.bind(AgentFactory);
export const removeAgent = AgentFactory.removeAgent.bind(AgentFactory);
export const cleanupAllAgents = AgentFactory.cleanupAll.bind(AgentFactory);
