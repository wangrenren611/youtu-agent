/**
 * 配置管理器
 * 负责配置文件的加载、解析和管理
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { AgentConfig, ModelConfig, ToolConfig, ConfigError } from '../../types';
import { Logger } from '../../utils/Logger';

export class ConfigManager {
  private readonly logger: Logger;
  private readonly configPath: string;
  private cache: Map<string, any> = new Map();

  constructor(configPath: string = './configs') {
    this.logger = new Logger('ConfigManager');
    this.configPath = path.resolve(configPath);
  }

  /**
   * 加载智能体配置
   * @param name 配置名称
   * @returns 智能体配置
   */
  async loadAgentConfig(name: string): Promise<AgentConfig> {
    const cacheKey = `agent:${name}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = path.join(this.configPath, 'agents', `${name}.yaml`);
      const config = await this.loadYamlConfig(configPath);
      
      // 验证和转换配置
      const agentConfig = this.validateAgentConfig(config);
      
      this.cache.set(cacheKey, agentConfig);
      this.logger.info(`智能体配置 ${name} 加载成功`);
      
      return agentConfig;
    } catch (error) {
      throw new ConfigError(
        `加载智能体配置失败: ${name}`,
        `agents/${name}.yaml`,
        error
      );
    }
  }

  /**
   * 加载模型配置
   * @param name 配置名称
   * @returns 模型配置
   */
  async loadModelConfig(name: string): Promise<ModelConfig> {
    const cacheKey = `model:${name}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = path.join(this.configPath, 'model', `${name}.yaml`);
      const config = await this.loadYamlConfig(configPath);
      
      // 验证和转换配置
      const modelConfig = this.validateModelConfig(config);
      
      this.cache.set(cacheKey, modelConfig);
      this.logger.info(`模型配置 ${name} 加载成功`);
      
      return modelConfig;
    } catch (error) {
      throw new ConfigError(
        `加载模型配置失败: ${name}`,
        `model/${name}.yaml`,
        error
      );
    }
  }

  /**
   * 加载工具配置
   * @param name 配置名称
   * @returns 工具配置
   */
  async loadToolConfig(name: string): Promise<ToolConfig> {
    const cacheKey = `tool:${name}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = path.join(this.configPath, 'tools', `${name}.yaml`);
      const config = await this.loadYamlConfig(configPath);
      
      // 验证和转换配置
      const toolConfig = this.validateToolConfig(config);
      
      this.cache.set(cacheKey, toolConfig);
      this.logger.info(`工具配置 ${name} 加载成功`);
      
      return toolConfig;
    } catch (error) {
      throw new ConfigError(
        `加载工具配置失败: ${name}`,
        `tools/${name}.yaml`,
        error
      );
    }
  }

  /**
   * 加载YAML配置文件
   * @param filePath 文件路径
   * @returns 配置对象
   */
  private async loadYamlConfig(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = yaml.parse(content);
      
      // 处理环境变量替换
      return this.processEnvironmentVariables(config);
    } catch (error) {
      throw new ConfigError(
        `读取配置文件失败: ${filePath}`,
        filePath,
        error
      );
    }
  }

  /**
   * 处理环境变量替换
   * @param config 配置对象
   * @returns 处理后的配置对象
   */
  private processEnvironmentVariables(config: any): any {
    if (typeof config === 'string') {
      // 替换 ${VAR} 格式的环境变量
      return config.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        const value = process.env[varName];
        if (value === undefined) {
          this.logger.warn(`环境变量 ${varName} 未定义`);
          return match;
        }
        return value;
      });
    }
    
    if (Array.isArray(config)) {
      return config.map(item => this.processEnvironmentVariables(item));
    }
    
    if (config && typeof config === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(config)) {
        result[key] = this.processEnvironmentVariables(value);
      }
      return result;
    }
    
    return config;
  }

  /**
   * 验证智能体配置
   * @param config 原始配置
   * @returns 验证后的配置
   */
  private validateAgentConfig(config: any): AgentConfig {
    const required = ['type', 'name', 'model'];
    for (const field of required) {
      if (!config[field]) {
        throw new ConfigError(
          `智能体配置缺少必需字段: ${field}`,
          'agent config',
          { field, config }
        );
      }
    }

    return {
      type: config.type,
      name: config.name,
      model: this.validateModelConfig(config.model),
      instructions: config.instructions,
      tools: config.tools || [],
      maxTurns: config.maxTurns || 20,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      // 透传可选的 ReAct 配置，具体规范由 BaseAgent 进行归一化
      react: config.react
    } as AgentConfig;
  }

  /**
   * 验证模型配置
   * @param config 原始配置
   * @returns 验证后的配置
   */
  private validateModelConfig(config: any): ModelConfig {
    const required = ['provider', 'model'];
    for (const field of required) {
      if (!config[field]) {
        throw new ConfigError(
          `模型配置缺少必需字段: ${field}`,
          'model config',
          { field, config }
        );
      }
    }

    return {
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey || process.env[`${config.provider.toUpperCase()}_API_KEY`],
      baseUrl: config.baseUrl,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      timeout: config.timeout || 30000
    };
  }

  /**
   * 验证工具配置
   * @param config 原始配置
   * @returns 验证后的配置
   */
  private validateToolConfig(config: any): ToolConfig {
    const required = ['name', 'type'];
    for (const field of required) {
      if (!config[field]) {
        throw new ConfigError(
          `工具配置缺少必需字段: ${field}`,
          'tool config',
          { field, config }
        );
      }
    }

    return {
      name: config.name,
      type: config.type,
      enabled: config.enabled !== false,
      parameters: config.parameters || {}
    };
  }

  /**
   * 获取配置列表
   * @param type 配置类型
   * @returns 配置名称列表
   */
  async getConfigList(type: 'agents' | 'tools' | 'model'): Promise<string[]> {
    try {
      const dirPath = path.join(this.configPath, type);
      const files = await fs.readdir(dirPath);
      
      return files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.basename(file, path.extname(file)));
    } catch (error) {
      this.logger.error(`获取配置列表失败: ${type}`, error);
      return [];
    }
  }

  /**
   * 清除缓存
   * @param key 可选的缓存键
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
    this.logger.info(`配置缓存已清除${key ? `: ${key}` : ''}`);
  }

  /**
   * 重新加载配置
   * @param name 配置名称
   * @param type 配置类型
   */
  async reloadConfig(name: string, type: 'agent' | 'model' | 'tool'): Promise<void> {
    const cacheKey = `${type}:${name}`;
    this.cache.delete(cacheKey);
    
    switch (type) {
      case 'agent':
        await this.loadAgentConfig(name);
        break;
      case 'model':
        await this.loadModelConfig(name);
        break;
      case 'tool':
        await this.loadToolConfig(name);
        break;
    }
    
    this.logger.info(`配置 ${type}:${name} 已重新加载`);
  }
}
