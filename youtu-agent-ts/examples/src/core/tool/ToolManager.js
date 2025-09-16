"use strict";
/**
 * 工具管理器
 * 负责工具的注册、加载、调用和管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const events_1 = require("events");
const types_1 = require("../../types");
const Logger_1 = require("../../utils/Logger");
const zod_1 = require("zod");
class ToolManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.tools = new Map();
        this.logger = new Logger_1.Logger('ToolManager');
    }
    /**
     * 注册工具
     * @param tool 工具定义
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            this.logger.warn(`工具 ${tool.name} 已存在，将被覆盖`);
        }
        this.tools.set(tool.name, tool);
        this.logger.info(`工具 ${tool.name} 注册成功`);
        this.emit('tool_registered', tool);
    }
    /**
     * 批量注册工具
     * @param tools 工具定义数组
     */
    registerTools(tools) {
        tools.forEach(tool => this.registerTool(tool));
    }
    /**
     * 加载工具（从配置或外部源）
     * @param toolName 工具名称
     * @returns 工具定义或null
     */
    async loadTool(toolName) {
        try {
            // 首先检查是否已经注册
            const existingTool = this.tools.get(toolName);
            if (existingTool) {
                return existingTool;
            }
            // 尝试从配置管理器加载
            const config = await this.loadToolConfig(toolName);
            if (config) {
                const tool = this.createToolFromConfig(config);
                this.registerTool(tool);
                return tool;
            }
            // 尝试从内置工具加载
            const builtinTool = await this.loadBuiltinTool(toolName);
            if (builtinTool) {
                this.registerTool(builtinTool);
                return builtinTool;
            }
            this.logger.warn(`无法加载工具: ${toolName}`);
            return null;
        }
        catch (error) {
            this.logger.error(`加载工具失败: ${toolName}`, error);
            return null;
        }
    }
    /**
     * 批量加载工具
     * @param toolNames 工具名称数组
     */
    async loadTools(toolNames) {
        const loadPromises = toolNames.map(name => this.loadTool(name));
        await Promise.all(loadPromises);
    }
    /**
     * 获取工具定义
     * @param name 工具名称
     * @returns 工具定义或undefined
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * 获取所有工具名称
     * @returns 工具名称数组
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    /**
     * 获取所有工具定义
     * @returns 工具定义数组
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * 检查工具是否存在
     * @param name 工具名称
     * @returns 是否存在
     */
    hasTool(name) {
        return this.tools.has(name);
    }
    /**
     * 调用工具
     * @param name 工具名称
     * @param args 工具参数
     * @returns 工具执行结果
     */
    async callTool(name, args) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new types_1.ToolError(`工具 ${name} 不存在`, name);
        }
        try {
            this.logger.info(`调用工具: ${name}`, { args });
            this.emit('tool_call_start', { name, args });
            // 验证参数
            const validatedArgs = tool.parameters.parse(args);
            // 执行工具
            const startTime = Date.now();
            const result = await tool.handler(validatedArgs);
            const duration = Date.now() - startTime;
            this.logger.info(`工具 ${name} 执行完成`, { duration, result });
            this.emit('tool_call_completed', { name, args, result, duration });
            return result;
        }
        catch (error) {
            this.logger.error(`工具 ${name} 执行失败:`, error);
            this.emit('tool_call_failed', { name, args, error });
            if (error instanceof zod_1.z.ZodError) {
                throw new types_1.ToolError(`工具 ${name} 参数验证失败: ${error.errors.map(e => e.message).join(', ')}`, name, error.errors);
            }
            throw new types_1.ToolError(`工具 ${name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`, name, error);
        }
    }
    /**
     * 批量调用工具
     * @param calls 工具调用数组
     * @returns 执行结果数组
     */
    async callTools(calls) {
        const results = [];
        for (const call of calls) {
            try {
                const result = await this.callTool(call.name, call.args);
                results.push(result);
            }
            catch (error) {
                this.logger.error(`批量调用工具失败: ${call.name}`, error);
                results.push(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }
        return results;
    }
    /**
     * 并行调用工具
     * @param calls 工具调用数组
     * @returns 执行结果数组
     */
    async callToolsParallel(calls) {
        const promises = calls.map(call => this.callTool(call.name, call.args).catch(error => `错误: ${error instanceof Error ? error.message : '未知错误'}`));
        return Promise.all(promises);
    }
    /**
     * 获取工具模式定义（用于LangChain）
     * @returns 工具模式数组
     */
    getToolSchemas() {
        return this.getAllTools().map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }));
    }
    /**
     * 获取OpenAI格式的工具定义
     * @returns OpenAI工具定义数组
     */
    getOpenAITools() {
        return this.getAllTools().map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: this.zodToJsonSchema(tool.parameters)
            }
        }));
    }
    /**
     * 移除工具
     * @param name 工具名称
     * @returns 是否成功移除
     */
    removeTool(name) {
        const removed = this.tools.delete(name);
        if (removed) {
            this.logger.info(`工具 ${name} 已移除`);
            this.emit('tool_removed', name);
        }
        return removed;
    }
    /**
     * 清空所有工具
     */
    clearTools() {
        this.tools.clear();
        this.logger.info('所有工具已清空');
        this.emit('tools_cleared');
    }
    /**
     * 清理资源
     */
    cleanup() {
        this.clearTools();
        this.removeAllListeners();
    }
    /**
     * 从配置加载工具
     * @param toolName 工具名称
     * @returns 工具配置或null
     */
    async loadToolConfig(toolName) {
        // 这里应该从配置管理器加载工具配置
        // 暂时返回null，等待配置管理器实现
        return null;
    }
    /**
     * 从配置创建工具
     * @param config 工具配置
     * @returns 工具定义
     */
    createToolFromConfig(config) {
        // 这里应该根据配置创建工具定义
        // 暂时返回一个基本的工具定义
        return {
            name: config.name,
            description: config.description || '',
            parameters: zod_1.z.object({}),
            handler: async () => '工具未实现'
        };
    }
    /**
     * 加载内置工具
     * @param toolName 工具名称
     * @returns 工具定义或null
     */
    async loadBuiltinTool(toolName) {
        // 这里应该加载内置工具
        // 暂时返回一些示例工具
        const builtinTools = {
            'search': {
                name: 'search',
                description: '搜索网络信息',
                parameters: zod_1.z.object({
                    query: zod_1.z.string().describe('搜索查询')
                }),
                handler: async (args) => `搜索结果: ${args.query}`
            },
            'calculator': {
                name: 'calculator',
                description: '执行数学计算',
                parameters: zod_1.z.object({
                    expression: zod_1.z.string().describe('数学表达式')
                }),
                handler: async (args) => {
                    try {
                        // 简单的计算器实现（仅用于演示）
                        const result = eval(args.expression);
                        return `计算结果: ${result}`;
                    }
                    catch (error) {
                        return `计算错误: ${error instanceof Error ? error.message : '未知错误'}`;
                    }
                }
            }
        };
        return builtinTools[toolName] || null;
    }
    /**
     * 将Zod模式转换为JSON Schema
     * @param schema Zod模式
     * @returns JSON Schema
     */
    zodToJsonSchema(schema) {
        // 这里需要实现Zod到JSON Schema的转换
        // 可以使用zod-to-json-schema库
        try {
            return schema._def || {};
        }
        catch {
            return {};
        }
    }
}
exports.ToolManager = ToolManager;
