/**
 * youtu-agent-ts 主入口文件
 * 提供框架的核心功能和API
 */

import { AgentFactory } from './agents';
import { ToolManager } from './core/tool/ToolManager';
import { ConfigManager } from './core/config/ConfigManager';
import { DatabaseManager } from './db/DatabaseManager';
import { DBTracingProcessor } from './db/DBTracingProcessor';
import { Logger } from './utils/Logger';
import { builtinTools } from './tools';
import { AgentConfig } from './types';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
// 导出核心类型
export * from './types';

// 导出核心类
export { BaseAgent } from './core/agent/BaseAgent';
export { ToolManager } from './core/tool/ToolManager';
export { ConfigManager } from './core/config/ConfigManager';
export { DatabaseManager } from './db/DatabaseManager';
export { DBTracingProcessor } from './db/DBTracingProcessor';
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
  private readonly dbManager: DatabaseManager | null;
  private readonly dbTracingProcessor: DBTracingProcessor | null;
  private isInitialized: boolean = false;

  constructor() {
    this.logger = new Logger('YoutuAgentTS');
    this.toolManager = new ToolManager();
    this.configManager = new ConfigManager();
    
    // 初始化数据库管理器（如果配置了DATABASE_URL）
    // const databaseUrl = process.env['DATABASE_URL'];
    // if (databaseUrl) {
    //   try {
    //     this.dbManager = DatabaseManager.getInstance({
    //       url: databaseUrl,
    //       poolSize: 10,
    //       maxOverflow: 20,
    //       poolTimeout: 30,
    //       poolPrePing: true
    //     });
    //     this.dbTracingProcessor = new DBTracingProcessor(this.dbManager);
    //     this.logger.info('数据库支持已启用');
    //   } catch (error) {
    //     this.logger.warn('数据库初始化失败，数据库支持已禁用:', error);
    //     this.dbManager = null;
    //     this.dbTracingProcessor = null;
    //   }
    // } else {
    //   this.dbManager = null;
    //   this.dbTracingProcessor = null;
    //   this.logger.info('未配置DATABASE_URL，数据库支持已禁用');
    // }
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

      // 初始化数据库（如果可用）
      if (this.dbManager) {
        await this.dbManager.initialize();
        this.logger.info('数据库初始化完成');
      }

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
    return AgentFactory.createAgent(config, this.toolManager, this.configManager);
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
      },
      database: {
        enabled: this.dbManager !== null,
        tracingEnabled: this.dbTracingProcessor?.isEnabled() || false
      }
    };
  }

  /**
   * 获取数据库管理器
   * @returns 数据库管理器实例或null
   */
  getDatabaseManager(): DatabaseManager | null {
    return this.dbManager;
  }

  /**
   * 获取数据库追踪处理器
   * @returns 数据库追踪处理器实例或null
   */
  getDBTracingProcessor(): DBTracingProcessor | null {
    return this.dbTracingProcessor;
  }

  /**
   * 清理框架资源
   */
  async cleanup(): Promise<void> {
    try {
      this.logger.info('正在清理框架资源...');
      
      await AgentFactory.cleanupAll();
      this.toolManager.cleanup();
      
      // 关闭数据库连接
      if (this.dbManager) {
        await this.dbManager.close();
        this.logger.info('数据库连接已关闭');
      }
      
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
export { youtuAgent };

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
