/**
 * 简单智能体
 * 基于LangChain实现的单轮对话智能体
 */

import { BaseAgent } from '../core/agent/BaseAgent';
import { AgentConfig, TaskRecorder, Message } from '../types';
import { SimpleLLMClient, SimpleLLMMessage } from '../core/llm/SimpleLLMClient';
import { AgentError } from '../types';

export class SimpleAgent extends BaseAgent {
  private llm: SimpleLLMClient | null = null;

  constructor(config: AgentConfig) {
    super(config);
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
        throw new Error('OpenAI API密钥未配置或无效。请检查.env文件中的OPENAI_API_KEY设置。');
      }

      this.logger.info(`使用模型: ${this.config.model.model}`);
      this.logger.info(`API密钥: ${this.config.model.apiKey.substring(0, 8)}...`);

      // 初始化简化LLM客户端
      this.llm = new SimpleLLMClient({
        provider: this.config.model.provider,
        model: this.config.model.model,
        apiKey: this.config.model.apiKey,
        baseUrl: this.config.model.baseUrl,
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
        timeout: this.config.model.timeout || 30000
      });

      // 测试连接
      const isConnected = await this.llm.testConnection();
      if (!isConnected) {
        throw new Error('LLM连接测试失败，请检查API密钥和网络连接');
      }

      // 如果有工具，记录工具信息
      if (this.config.tools && this.config.tools.length > 0) {
        this.logger.info(`可用工具: ${this.config.tools.join(', ')}`);
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
        'SIMPLE_AGENT_INIT_FAILED',
        error
      );
    }
  }

  /**
   * 执行任务
   * @param input 输入内容
   * @param recorder 任务记录器
   * @returns 执行结果
   */
  protected async execute(input: string, recorder: TaskRecorder): Promise<string> {
    if (!this.llm) {
      throw new AgentError('语言模型未初始化', 'LLM_NOT_INITIALIZED');
    }

    try {
      this.logger.info('开始执行简单智能体任务', { input });

      // 构建消息
      const messages = this.buildMessages(input, recorder);
      
      // 调用语言模型
      const response = await this.llm.invoke(messages);
      
      // 记录消息
      recorder.messages.push({
        role: 'user',
        content: input,
        timestamp: new Date()
      });

      recorder.messages.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      });

      // 记录使用情况
      if (response.usage) {
        this.logger.info('Token使用情况:', response.usage);
      }

      this.logger.info('简单智能体任务执行完成');
      return response.content;

    } catch (error) {
      this.logger.error('简单智能体任务执行失败:', error);
      throw new AgentError(
        `简单智能体任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'SIMPLE_AGENT_EXECUTION_FAILED',
        error
      );
    }
  }

  /**
   * 流式执行任务
   * @param input 输入内容
   * @param recorder 任务记录器
   * @returns 异步生成器
   */
  protected async* executeStream(input: string, recorder: TaskRecorder): AsyncGenerator<Message, void, unknown> {
    if (!this.llm) {
      throw new AgentError('语言模型未初始化', 'LLM_NOT_INITIALIZED');
    }

    try {
      this.logger.info('开始流式执行简单智能体任务', { input });

      // 构建消息
      const messages = this.buildMessages(input, recorder);
      
      // 记录用户消息
      const userMessage: Message = {
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      recorder.messages.push(userMessage);
      yield userMessage;

      // 流式调用语言模型
      const stream = this.llm.invokeStream(messages);
      
      let assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      for await (const chunk of stream) {
        assistantMessage.content += chunk;
        
        // 发送部分内容
        yield {
          ...assistantMessage,
          content: chunk
        };
      }

      // 记录完整的助手消息
      recorder.messages.push(assistantMessage);
      yield assistantMessage;

      this.logger.info('简单智能体流式任务执行完成');

    } catch (error) {
      this.logger.error('简单智能体流式任务执行失败:', error);
      throw new AgentError(
        `简单智能体流式任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'SIMPLE_AGENT_STREAM_EXECUTION_FAILED',
        error
      );
    }
  }

  /**
   * 构建消息列表
   * @param input 输入内容
   * @param recorder 任务记录器
   * @returns 消息列表
   */
  private buildMessages(input: string, recorder: TaskRecorder): SimpleLLMMessage[] {
    const messages: SimpleLLMMessage[] = [];

    // 添加系统消息
    if (this.config.instructions) {
      messages.push({
        role: 'system',
        content: this.config.instructions
      });
    }

    // 添加历史消息
    for (const msg of recorder.messages) {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      });
    }

    // 添加当前输入
    messages.push({
      role: 'user',
      content: input
    });

    return messages;
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
  getInfo(): any {
    return {
      type: 'simple',
      name: this.config.name,
      model: this.config.model.model,
      tools: this.config.tools || [],
      isReady: this.isReady()
    };
  }
}
