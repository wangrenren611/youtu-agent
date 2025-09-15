/**
 * 插件加载器模块
 * 提供动态加载和管理工具插件的功能
 */
import * as path from 'path';
import * as fs from 'fs';
import { BaseTool } from './BaseTool.js';
import { ToolRegistry } from './ToolRegistry';
import { getLogger } from '../utils/logger';

// 声明Node.js全局变量类型
declare const process: {
  cwd(): string;
  [key: string]: any;
};

const logger = getLogger('PluginLoader');

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /**
   * 插件名称
   */
  name: string;
  
  /**
   * 插件版本
   */
  version: string;
  
  /**
   * 插件描述
   */
  description: string;
  
  /**
   * 插件入口文件
   */
  entry: string;
  
  /**
   * 插件配置
   */
  config?: Record<string, any>;
}

/**
 * 插件加载器配置接口
 */
export interface PluginLoaderConfig {
  /**
   * 插件目录路径
   */
  pluginDir: string;
  
  /**
   * 是否自动加载插件
   */
  autoLoad: boolean;
  
  /**
   * 插件配置文件名
   */
  configFileName: string;
}

/**
 * 默认插件加载器配置
 */
const DEFAULT_CONFIG: PluginLoaderConfig = {
  pluginDir: path.join(process.cwd(), 'plugins'),
  autoLoad: true,
  configFileName: 'plugin.json'
};

/**
 * 插件加载器类
 * 负责动态加载和管理工具插件
 */
export class PluginLoader {
  /**
   * 插件加载器配置
   */
  private config: PluginLoaderConfig;
  
  /**
   * 工具注册表
   */
  private registry: ToolRegistry;
  
  /**
   * 已加载的插件
   */
  private loadedPlugins: Map<string, PluginConfig> = new Map();

  /**
   * 构造函数
   * @param config 插件加载器配置
   */
  constructor(config: Partial<PluginLoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = ToolRegistry.getInstance();
    
    // 确保插件目录存在
    if (!fs.existsSync(this.config.pluginDir)) {
      fs.mkdirSync(this.config.pluginDir, { recursive: true });
    }
    
    // 自动加载插件
    if (this.config.autoLoad) {
      this.loadAllPlugins();
    }
  }

  /**
   * 加载所有插件
   */
  async loadAllPlugins(): Promise<void> {
    try {
      // 获取插件目录列表
      const dirs = fs.readdirSync(this.config.pluginDir, { withFileTypes: true })
        .filter((dirent: fs.Dirent) => dirent.isDirectory())
        .map((dirent: fs.Dirent) => dirent.name);
      
      // 加载每个插件
      for (const dir of dirs) {
        await this.loadPlugin(dir);
      }
      
      logger.info(`已加载 ${this.loadedPlugins.size} 个插件`);
    } catch (error) {
      logger.error(`加载插件失败: ${error}`);
    }
  }

  /**
   * 加载单个插件
   * @param pluginName 插件名称或目录名
   */
  async loadPlugin(pluginName: string): Promise<boolean> {
    try {
      // 构建插件目录路径
      const pluginDir = path.join(this.config.pluginDir, pluginName);
      
      // 检查插件目录是否存在
      if (!fs.existsSync(pluginDir)) {
        logger.error(`插件目录不存在: ${pluginDir}`);
        return false;
      }
      
      // 读取插件配置文件
      const configPath = path.join(pluginDir, this.config.configFileName);
      
      if (!fs.existsSync(configPath)) {
        logger.error(`插件配置文件不存在: ${configPath}`);
        return false;
      }
      
      // 解析插件配置
      const configContent = fs.readFileSync(configPath, 'utf8');
      const pluginConfig: PluginConfig = JSON.parse(configContent);
      
      // 验证插件配置
      if (!this.validatePluginConfig(pluginConfig)) {
        logger.error(`插件配置无效: ${pluginName}`);
        return false;
      }
      
      // 构建插件入口文件路径
      const entryPath = path.join(pluginDir, pluginConfig.entry);
      
      if (!fs.existsSync(entryPath)) {
        logger.error(`插件入口文件不存在: ${entryPath}`);
        return false;
      }
      
      // 动态导入插件模块
      const pluginModule = await import(entryPath);
      
      // 检查插件模块是否导出了工具类
      if (!pluginModule.default || !(pluginModule.default.prototype instanceof BaseTool)) {
        logger.error(`插件未导出有效的工具类: ${pluginName}`);
        return false;
      }
      
      // 创建工具实例
      const ToolClass = pluginModule.default;
      const toolInstance = new ToolClass(pluginConfig.config || {});
      
      // 注册工具
      this.registry.register(pluginConfig.name, toolInstance);
      
      // 记录已加载的插件
      this.loadedPlugins.set(pluginConfig.name, pluginConfig);
      
      logger.info(`插件加载成功: ${pluginConfig.name} v${pluginConfig.version}`);
      return true;
    } catch (error) {
      logger.error(`加载插件失败: ${pluginName} - ${error}`);
      return false;
    }
  }

  /**
   * 卸载插件
   * @param pluginName 插件名称
   */
  unloadPlugin(pluginName: string): boolean {
    // 检查插件是否已加载
    if (!this.loadedPlugins.has(pluginName)) {
      logger.warn(`插件未加载: ${pluginName}`);
      return false;
    }
    
    // 从注册表中注销工具
    const result = this.registry.unregister(pluginName);
    
    if (result) {
      // 从已加载插件列表中移除
      this.loadedPlugins.delete(pluginName);
      logger.info(`插件已卸载: ${pluginName}`);
    }
    
    return result;
  }

  /**
   * 获取已加载的插件列表
   */
  getLoadedPlugins(): Map<string, PluginConfig> {
    return new Map(this.loadedPlugins);
  }

  /**
   * 验证插件配置
   * @param config 插件配置
   */
  private validatePluginConfig(config: any): config is PluginConfig {
    return typeof config === 'object' &&
           typeof config.name === 'string' &&
           typeof config.version === 'string' &&
           typeof config.description === 'string' &&
           typeof config.entry === 'string';
  }
}