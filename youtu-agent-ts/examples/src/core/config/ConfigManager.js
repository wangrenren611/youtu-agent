"use strict";
/**
 * 配置管理器
 * 负责配置文件的加载、解析和管理
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const types_1 = require("../../types");
const Logger_1 = require("../../utils/Logger");
class ConfigManager {
    constructor(configPath = './configs') {
        this.cache = new Map();
        this.logger = new Logger_1.Logger('ConfigManager');
        this.configPath = path.resolve(configPath);
    }
    /**
     * 加载智能体配置
     * @param name 配置名称
     * @returns 智能体配置
     */
    async loadAgentConfig(name) {
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
        }
        catch (error) {
            throw new types_1.ConfigError(`加载智能体配置失败: ${name}`, `agents/${name}.yaml`, error);
        }
    }
    /**
     * 加载模型配置
     * @param name 配置名称
     * @returns 模型配置
     */
    async loadModelConfig(name) {
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
        }
        catch (error) {
            throw new types_1.ConfigError(`加载模型配置失败: ${name}`, `model/${name}.yaml`, error);
        }
    }
    /**
     * 加载工具配置
     * @param name 配置名称
     * @returns 工具配置
     */
    async loadToolConfig(name) {
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
        }
        catch (error) {
            throw new types_1.ConfigError(`加载工具配置失败: ${name}`, `tools/${name}.yaml`, error);
        }
    }
    /**
     * 加载YAML配置文件
     * @param filePath 文件路径
     * @returns 配置对象
     */
    async loadYamlConfig(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const config = yaml.parse(content);
            // 处理环境变量替换
            return this.processEnvironmentVariables(config);
        }
        catch (error) {
            throw new types_1.ConfigError(`读取配置文件失败: ${filePath}`, filePath, error);
        }
    }
    /**
     * 处理环境变量替换
     * @param config 配置对象
     * @returns 处理后的配置对象
     */
    processEnvironmentVariables(config) {
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
            const result = {};
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
    validateAgentConfig(config) {
        const required = ['type', 'name', 'model'];
        for (const field of required) {
            if (!config[field]) {
                throw new types_1.ConfigError(`智能体配置缺少必需字段: ${field}`, 'agent config', { field, config });
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
            maxTokens: config.maxTokens || 4000
        };
    }
    /**
     * 验证模型配置
     * @param config 原始配置
     * @returns 验证后的配置
     */
    validateModelConfig(config) {
        const required = ['provider', 'model'];
        for (const field of required) {
            if (!config[field]) {
                throw new types_1.ConfigError(`模型配置缺少必需字段: ${field}`, 'model config', { field, config });
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
    validateToolConfig(config) {
        const required = ['name', 'type'];
        for (const field of required) {
            if (!config[field]) {
                throw new types_1.ConfigError(`工具配置缺少必需字段: ${field}`, 'tool config', { field, config });
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
    async getConfigList(type) {
        try {
            const dirPath = path.join(this.configPath, type);
            const files = await fs.readdir(dirPath);
            return files
                .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
                .map(file => path.basename(file, path.extname(file)));
        }
        catch (error) {
            this.logger.error(`获取配置列表失败: ${type}`, error);
            return [];
        }
    }
    /**
     * 清除缓存
     * @param key 可选的缓存键
     */
    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        }
        else {
            this.cache.clear();
        }
        this.logger.info(`配置缓存已清除${key ? `: ${key}` : ''}`);
    }
    /**
     * 重新加载配置
     * @param name 配置名称
     * @param type 配置类型
     */
    async reloadConfig(name, type) {
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
exports.ConfigManager = ConfigManager;
