/**
 * 工具管理器
 * 负责工具的注册、加载、调用和管理
 */

import { EventEmitter } from 'events';
import { ToolDefinition, ToolHandler, ToolError } from '../../types';
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
          error.errors
        );
      }
      
      throw new ToolError(
        `工具 ${name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        name,
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
