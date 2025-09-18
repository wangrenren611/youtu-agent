/**
 * 工具管理器
 * 负责工具的注册、加载、调用和管理
 */

import { EventEmitter } from 'events';
import { ToolDefinition, ToolError } from '../../types';
import { Logger } from '../../utils/Logger';
import { z } from 'zod';

export class ToolManager extends EventEmitter {
  private tools: Map<string, ToolDefinition> = new Map();
  private readonly logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('ToolManager');
  }

  /**
   * 注册工具
   * @param tool 工具定义
   */
  registerTool(tool: ToolDefinition): void {
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
  registerTools(tools: ToolDefinition[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * 加载工具（从配置或外部源）
   * @param toolName 工具名称
   * @returns 工具定义或null
   */
  async loadTool(toolName: string): Promise<ToolDefinition | null> {
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
    } catch (error) {
      this.logger.error(`加载工具失败: ${toolName}`, error);
      return null;
    }
  }

  /**
   * 批量加载工具
   * @param toolNames 工具名称数组
   */
  async loadTools(toolNames: string[]): Promise<void> {
    const loadPromises = toolNames.map(name => this.loadTool(name));
    await Promise.all(loadPromises);
  }

  /**
   * 获取工具定义
   * @param name 工具名称
   * @returns 工具定义或undefined
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具名称
   * @returns 工具名称数组
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取所有工具定义
   * @returns 工具定义数组
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 检查工具是否存在
   * @param name 工具名称
   * @returns 是否存在
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 调用工具
   * @param name 工具名称
   * @param args 工具参数
   * @returns 工具执行结果
   */
  async callTool(name: string, args: any): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolError(`工具 ${name} 不存在`, name);
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
    } catch (error) {
      this.logger.error(`工具 ${name} 执行失败:`, error);
      this.emit('tool_call_failed', { name, args, error });
      
      if (error instanceof z.ZodError) {
        throw new ToolError(
          `工具 ${name} 参数验证失败: ${error.errors.map(e => e.message).join(', ')}`,
          name,
          'TOOL_VALIDATION_FAILED',
          error.errors
        );
      }
      
      throw new ToolError(
        `工具 ${name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        name,
        'TOOL_EXECUTION_FAILED',
        error
      );
    }
  }

  /**
   * 批量调用工具
   * @param calls 工具调用数组
   * @returns 执行结果数组
   */
  async callTools(calls: Array<{ name: string; args: any }>): Promise<string[]> {
    const results: string[] = [];
    
    for (const call of calls) {
      try {
        const result = await this.callTool(call.name, call.args);
        results.push(result);
      } catch (error) {
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
  async callToolsParallel(calls: Array<{ name: string; args: any }>): Promise<string[]> {
    const promises = calls.map(call => 
      this.callTool(call.name, call.args).catch(error => 
        `错误: ${error instanceof Error ? error.message : '未知错误'}`
      )
    );
    
    return Promise.all(promises);
  }

  /**
   * 获取工具模式定义（用于LangChain）
   * @returns 工具模式数组
   */
  getToolSchemas(): any[] {
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
  getOpenAITools(): any[] {
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
  removeTool(name: string): boolean {
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
  clearTools(): void {
    this.tools.clear();
    this.logger.info('所有工具已清空');
    this.emit('tools_cleared');
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.clearTools();
    this.removeAllListeners();
  }

  /**
   * 从配置加载工具
   * @param toolName 工具名称
   * @returns 工具配置或null
   */
  private async loadToolConfig(_toolName: string): Promise<any | null> {
    // 这里应该从配置管理器加载工具配置
    // 暂时返回null，等待配置管理器实现
    return null;
  }

  /**
   * 从配置创建工具
   * @param config 工具配置
   * @returns 工具定义
   */
  private createToolFromConfig(config: any): ToolDefinition {
    // 这里应该根据配置创建工具定义
    // 暂时返回一个基本的工具定义
    return {
      name: config.name,
      description: config.description || '',
      parameters: z.object({}),
      handler: async () => '工具未实现'
    };
  }

  /**
   * 加载内置工具
   * @param toolName 工具名称
   * @returns 工具定义或null
   */
  private async loadBuiltinTool(toolName: string): Promise<ToolDefinition | null> {
    // 这里应该加载内置工具
    // 暂时返回一些示例工具
    const builtinTools: Record<string, ToolDefinition> = {
      'search': {
        name: 'search',
        description: '搜索网络信息',
        parameters: z.object({
          query: z.string().describe('搜索查询')
        }),
        handler: async (args) => `搜索结果: ${args['query']}`
      },
      'web_search': {
        name: 'web_search',
        description: '在互联网上搜索信息',
        parameters: z.object({
          query: z.string().describe('搜索查询'),
          maxResults: z.number().optional().default(5).describe('最大结果数量'),
          language: z.string().optional().default('zh-CN').describe('搜索语言')
        }),
        handler: async (args) => {
          try {
            const { query, maxResults } = args;
            
            // 使用DuckDuckGo API进行搜索
            const axios = await import('axios');
            const response = await axios.default.get('https://api.duckduckgo.com/', {
              params: {
                q: query,
                format: 'json',
                no_html: '1',
                skip_disambig: '1'
              },
              timeout: 10000
            });

            const results: any[] = [];
            
            // 处理抽象结果
            if (response.data.Abstract) {
              results.push({
                title: response.data.Heading || query,
                content: response.data.Abstract,
                url: response.data.AbstractURL,
                source: 'DuckDuckGo Abstract'
              });
            }

            // 处理相关主题
            if (response.data.RelatedTopics) {
              for (const topic of response.data.RelatedTopics.slice(0, maxResults - results.length)) {
                if (topic.Text && topic.FirstURL) {
                  results.push({
                    title: topic.Text.split(' - ')[0] || topic.Text,
                    content: topic.Text,
                    url: topic.FirstURL,
                    source: 'DuckDuckGo Related'
                  });
                }
              }
            }

            return JSON.stringify({
              success: true,
              query,
              results: results.slice(0, maxResults),
              count: results.length
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : '未知错误'
            });
          }
        }
      },
      'calculator': {
        name: 'calculator',
        description: '执行数学计算',
        parameters: z.object({
          expression: z.string().describe('数学表达式')
        }),
        handler: async (args) => {
          try {
            // 简单的计算器实现（仅用于演示）
            const result = eval(args['expression']);
            return `计算结果: ${result}`;
          } catch (error) {
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
  private zodToJsonSchema(schema: z.ZodSchema): any {
    // 这里需要实现Zod到JSON Schema的转换
    // 可以使用zod-to-json-schema库
    try {
      return schema._def || {};
    } catch {
      return {};
    }
  }
}
