/**
 * youtu-agent-ts 主入口文件
 * 提供框架的核心功能和API
 */

import { AgentFactory } from './agents';
import { ToolManager } from './core/tool/ToolManager';
import { ConfigManager } from './core/config/ConfigManager';
import { Logger } from './utils/Logger';
import { builtinTools } from './tools';
import { AgentConfig, ModelConfig, ToolConfig } from './types';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
// 导出核心类型
export * from './types';

// 导出核心类
export { BaseAgent } from './core/agent/BaseAgent';
export { ToolManager } from './core/tool/ToolManager';
export { ConfigManager } from './core/config/ConfigManager';
export { Logger } from './utils/Logger';

// 导出智能体
export { SimpleAgent } from './agents/SimpleAgent';
export { AgentFactory } from './agents';

// 导出工具
export * from './tools';

/**
 * youtu-agent-ts 框架类
 * 提供统一的框架接口
 */
export class YoutuAgentTS {
  private readonly logger: Logger;
  private readonly toolManager: ToolManager;
  private readonly configManager: ConfigManager;
  private isInitialized: boolean = false;

  constructor() {
    this.logger = new Logger('YoutuAgentTS');
    this.toolManager = new ToolManager();
    this.configManager = new ConfigManager();
  }

  /**
   * 初始化框架
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('正在初始化youtu-agent-ts框架...');

      // 注册内置工具
      this.toolManager.registerTools(builtinTools);
      this.logger.info(`已注册 ${builtinTools.length} 个内置工具`);

      this.isInitialized = true;
      this.logger.info('youtu-agent-ts框架初始化完成');
    } catch (error) {
      this.logger.error('框架初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建智能体
   * @param config 智能体配置
   * @returns 智能体实例
   */
  async createAgent(config: AgentConfig) {
    await this.initialize();
    return AgentFactory.createAgent(config);
  }

  /**
   * 获取智能体
   * @param type 智能体类型
   * @param name 智能体名称
   * @returns 智能体实例
   */
  getAgent(type: string, name: string) {
    return AgentFactory.getAgent(type, name);
  }

  /**
   * 获取所有智能体
   * @returns 智能体列表
   */
  getAllAgents() {
    return AgentFactory.getAllAgents();
  }

  /**
   * 获取工具管理器
   * @returns 工具管理器实例
   */
  getToolManager(): ToolManager {
    return this.toolManager;
  }

  /**
   * 获取配置管理器
   * @returns 配置管理器实例
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  /**
   * 获取日志器
   * @returns 日志器实例
   */
  getLogger(): Logger {
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
      agents: AgentFactory.getStats(),
      tools: {
        total: this.toolManager.getAllTools().length,
        names: this.toolManager.getToolNames()
      }
    };
  }

  /**
   * 清理框架资源
   */
  async cleanup(): Promise<void> {
    try {
      this.logger.info('正在清理框架资源...');
      
      await AgentFactory.cleanupAll();
      this.toolManager.cleanup();
      
      this.isInitialized = false;
      this.logger.info('框架资源清理完成');
    } catch (error) {
      this.logger.error('框架资源清理失败:', error);
    }
  }
}

// 创建默认实例
const youtuAgent = new YoutuAgentTS();

// 导出默认实例和工厂函数
export default youtuAgent;

// 便捷函数
export const createAgent = youtuAgent.createAgent.bind(youtuAgent);
export const getAgent = youtuAgent.getAgent.bind(youtuAgent);
export const getAllAgents = youtuAgent.getAllAgents.bind(youtuAgent);
export const getToolManager = youtuAgent.getToolManager.bind(youtuAgent);
export const getConfigManager = youtuAgent.getConfigManager.bind(youtuAgent);
export const getLogger = youtuAgent.getLogger.bind(youtuAgent);
export const getInfo = youtuAgent.getInfo.bind(youtuAgent);
export const cleanup = youtuAgent.cleanup.bind(youtuAgent);

// 框架版本信息
export const VERSION = '1.0.0';
export const FRAMEWORK_NAME = 'youtu-agent-ts';
