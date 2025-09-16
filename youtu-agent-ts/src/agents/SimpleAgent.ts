/**
 * 简单智能体
 * 
 * 基于ReAct模式实现的智能体，支持工具调用和单轮对话。
 * 适用于简单的任务处理，如文件操作、数据查询等。
 * 
 * @example
 * ```typescript
 * const agent = new SimpleAgent({
 *   type: 'simple',
 *   name: 'my_agent',
 *   model: { provider: 'deepseek', model: 'deepseek-chat', apiKey: 'your-key' },
 *   tools: ['file_read', 'file_write']
 * });
 * 
 * const result = await agent.run('创建一个hello.txt文件');
 * ```
 */

import { BaseAgent } from '../core/agent/BaseAgent';
import { AgentConfig, AgentError, ERROR_CODES } from '../types';
import { SimpleLLMClient, SimpleLLMMessage } from '../core/llm/SimpleLLMClient';
import { ToolManager } from '../core/tool/ToolManager';
import { ConfigManager } from '../core/config/ConfigManager';

export class SimpleAgent extends BaseAgent {
  private llm: SimpleLLMClient | null = null;

  constructor(config: AgentConfig, toolManager?: ToolManager, configManager?: ConfigManager) {
    super(config, toolManager, configManager);
    // logger在BaseAgent中已经初始化，这里不需要重新赋值
  }

  /**
   * 初始化简单智能体
   */
  protected override async onInitialize(): Promise<void> {
    try {
      this.logger.info('正在初始化简单智能体...');

      // 检查API密钥
      if (!this.config.model.apiKey || this.config.model.apiKey === 'your-api-key-here') {
        throw new AgentError('API密钥未配置或无效。请检查配置中的apiKey设置。', ERROR_CODES.AGENT.INVALID_API_KEY);
      }

      this.logger.info(`使用模型: ${this.config.model.model}`);
      this.logger.info(`API密钥: ${this.config.model.apiKey.substring(0, 8)}...`);

      // 初始化简化LLM客户端
      this.llm = new SimpleLLMClient({
        provider: this.config.model.provider,
        model: this.config.model.model,
        apiKey: this.config.model.apiKey,
        baseUrl: this.config.model.baseUrl || 'https://api.deepseek.com',
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
        timeout: this.config.model.timeout || 30000
      });

      // 测试连接（失败时不阻止智能体创建）
      try {
        const isConnected = await this.llm.testConnection();
        if (!isConnected) {
          this.logger.warn('LLM连接测试失败，智能体仍可创建但可能无法正常工作');
        } else {
          this.logger.info('LLM连接测试成功');
        }
      } catch (error) {
        this.logger.warn('LLM连接测试异常，智能体仍可创建但可能无法正常工作:', error);
      }

      this.logger.info('简单智能体初始化完成');
    } catch (error) {
      this.logger.error('简单智能体初始化失败:', error);
      this.logger.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          model: this.config.model.model,
          hasApiKey: !!this.config.model.apiKey,
          apiKeyPrefix: this.config.model.apiKey ? this.config.model.apiKey.substring(0, 8) : 'none'
        }
      });
      throw new AgentError(
        `简单智能体初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ERROR_CODES.AGENT.SIMPLE_AGENT_INIT_FAILED,
        error
      );
    }
  }

  /**
   * 调用LLM - 实现BaseAgent的抽象方法
   * @param prompt 提示词
   * @returns LLM响应
   */
  protected async callLLM(prompt: string): Promise<string> {
    if (!this.llm) {
      throw new AgentError('语言模型未初始化', ERROR_CODES.AGENT.LLM_NOT_INITIALIZED);
    }

    try {
      // 构建消息
      const messages: SimpleLLMMessage[] = [];
      
      // 添加系统消息
      if (this.config.instructions) {
        messages.push({
          role: 'system',
          content: this.config.instructions
        });
      }
      
      // 添加用户消息
      messages.push({
        role: 'user',
        content: prompt
      });

      // 调用语言模型
      const response = await this.llm.invoke(messages);
      
      // 记录使用情况
      if (response.usage) {
        this.logger.debug('Token使用情况:', response.usage);
      }

      return response.content;
    } catch (error) {
      this.logger.error('LLM调用失败:', error);
      throw new AgentError(
        `LLM调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ERROR_CODES.AGENT.LLM_CALL_FAILED,
        error
      );
    }
  }

  /**
   * 清理资源
   */
  protected override async onCleanup(): Promise<void> {
    this.logger.info('正在清理简单智能体资源...');
    this.llm = null;
  }

  /**
   * 获取智能体信息
   * @returns 智能体信息
   */
  override getInfo(): Record<string, unknown> {
    return {
      type: 'simple',
      name: this.config.name,
      model: this.config.model.model,
      tools: this.config.tools || [],
      isReady: this.isReady()
    };
  }
}
