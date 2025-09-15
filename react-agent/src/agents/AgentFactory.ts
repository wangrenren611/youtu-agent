/**
 * 代理工厂模块
 * 提供创建各种代理实例的工厂方法
 */
import { BaseAgent } from './BaseAgent';
import { LLMAgent } from './LLMAgent';
import { WebAgent } from './WebAgent';
import { SimpleAgent } from './SimpleAgent';
import { OrchestraAgent } from './OrchestraAgent';
import { getLogger } from '../utils/logger';
import { AgentConfig } from './common';
import { BaseEnv } from '../env/BaseEnv';

const logger = getLogger('AgentFactory');

/**
 * 代理类型枚举
 */
export enum AgentType {
  LLM = 'llm',
  WEB = 'web',
  SIMPLE = 'simple',
  ORCHESTRA = 'orchestra'
}

/**
 * 代理工厂类
 * 负责创建各种类型的代理实例
 */
export class AgentFactory {
  /**
   * 创建代理实例
   * @param type 代理类型
   * @param name 代理名称
   * @param config 代理配置
   * @param env 代理环境
   */
  static async createAgent(type: AgentType, name: string, config: AgentConfig, env?: BaseEnv): Promise<BaseAgent> {
    logger.info(`创建代理: ${type}, 名称: ${name}`);
    
    let agent: BaseAgent;
    
    switch (type) {
      case AgentType.LLM:
        agent = new LLMAgent(config);
        break;
        
      case AgentType.WEB:
        agent = new WebAgent(config);
        break;
        
      case AgentType.SIMPLE:
        agent = new SimpleAgent(name, config, env);
        break;
        
      case AgentType.ORCHESTRA:
        agent = new OrchestraAgent(name, config, env);
        break;
        
      default:
        throw new Error(`未知的代理类型: ${type}`);
    }
    
    // 构建代理
    await agent.build();
    
    return agent;
  }

  /**
   * 创建LLM代理
   * @param config LLM代理配置
   */
  static async createLLMAgent(config: any): Promise<LLMAgent> {
    return await this.createAgent(AgentType.LLM, 'llm-agent', config) as LLMAgent;
  }

  /**
   * 创建Web代理
   * @param config Web代理配置
   */
  static async createWebAgent(config: any): Promise<WebAgent> {
    return await this.createAgent(AgentType.WEB, 'web-agent', config) as WebAgent;
  }
  
  /**
   * 创建简单代理
   * @param name 代理名称
   * @param config 代理配置
   * @param env 代理环境
   */
  static async createSimpleAgent(name: string, config: AgentConfig, env?: BaseEnv): Promise<SimpleAgent> {
    return await this.createAgent(AgentType.SIMPLE, name, config, env) as SimpleAgent;
  }
  
  /**
   * 创建编排代理
   * @param name 代理名称
   * @param config 代理配置
   * @param env 代理环境
   */
  static async createOrchestraAgent(name: string, config: AgentConfig, env?: BaseEnv): Promise<OrchestraAgent> {
    return await this.createAgent(AgentType.ORCHESTRA, name, config, env) as OrchestraAgent;
  }
}