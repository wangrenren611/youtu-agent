/**
 * 工具注册表模块
 * 提供工具注册和管理功能
 */
import { BaseTool } from './BaseTool';
import { getLogger } from '../utils/logger';

const logger = getLogger('ToolRegistry');

/**
 * 工具注册表类
 * 管理所有可用的工具
 */
export class ToolRegistry {
  /**
   * 工具映射表
   */
  private tools: Map<string, BaseTool> = new Map();
  
  /**
   * 单例实例
   */
  private static instance: ToolRegistry;

  /**
   * 获取单例实例
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    
    return ToolRegistry.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    logger.info('工具注册表已初始化');
  }

  /**
   * 注册工具
   * @param name 工具名称
   * @param tool 工具实例
   */
  register(name: string, tool: BaseTool): void {
    if (this.tools.has(name)) {
      logger.warn(`工具 ${name} 已存在，将被覆盖`);
    }
    
    this.tools.set(name, tool);
    logger.info(`工具 ${name} 已注册`);
  }

  /**
   * 注销工具
   * @param name 工具名称
   */
  unregister(name: string): boolean {
    if (!this.tools.has(name)) {
      logger.warn(`工具 ${name} 不存在，无法注销`);
      return false;
    }
    
    this.tools.delete(name);
    logger.info(`工具 ${name} 已注销`);
    return true;
  }

  /**
   * 获取工具
   * @param name 工具名称
   */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  getAll(): Map<string, BaseTool> {
    return new Map(this.tools);
  }

  /**
   * 获取所有工具名称
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取所有工具描述
   */
  getDescriptions(): Record<string, string> {
    const descriptions: Record<string, string> = {};
    
    for (const [name, tool] of this.tools.entries()) {
      descriptions[name] = tool.getDescription();
    }
    
    return descriptions;
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this.tools.clear();
    logger.info('所有工具已清空');
  }

  /**
   * 构建所有工具
   */
  async buildAll(): Promise<void> {
    for (const [name, tool] of this.tools.entries()) {
      try {
        await tool.build();
        logger.info(`工具 ${name} 构建成功`);
      } catch (error) {
        logger.error(`工具 ${name} 构建失败: ${error}`);
      }
    }
  }

  /**
   * 清理所有工具
   */
  async cleanupAll(): Promise<void> {
    for (const [name, tool] of this.tools.entries()) {
      try {
        await tool.cleanup();
        logger.info(`工具 ${name} 清理成功`);
      } catch (error) {
        logger.error(`工具 ${name} 清理失败: ${error}`);
      }
    }
  }
}