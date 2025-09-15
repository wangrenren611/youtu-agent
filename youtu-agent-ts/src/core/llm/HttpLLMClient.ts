/**
 * HTTP LLM客户端
 * 基于axios的HTTP请求客户端，支持多种模型提供商
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Logger } from '../../utils/Logger';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface LLMConfig {
  provider: 'openai' | 'deepseek' | 'anthropic' | 'google' | 'local' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export class HttpLLMClient {
  private readonly logger: Logger;
  private readonly config: LLMConfig;
  private readonly httpClient: AxiosInstance;

  constructor(config: LLMConfig) {
    this.logger = new Logger('HttpLLMClient');
    this.config = config;
    
    // 创建HTTP客户端
    this.httpClient = axios.create({
      baseURL: this.getBaseUrl(),
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthorizationHeader(),
        ...config.headers
      }
    });

    this.logger.info(`HTTP LLM客户端初始化完成: ${config.provider}/${config.model}`);
  }

  /**
   * 调用LLM
   * @param messages 消息列表
   * @param options 调用选项
   * @returns LLM响应
   */
  async invoke(messages: LLMMessage[], options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}): Promise<LLMResponse> {
    try {
      this.logger.debug(`调用LLM: ${this.config.provider}/${this.config.model}`);
      
      const requestData = this.buildRequestData(messages, options);
      const response = await this.httpClient.post(this.getEndpoint(), requestData);
      
      return this.parseResponse(response);
    } catch (error) {
      this.logger.error('LLM调用失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 流式调用LLM
   * @param messages 消息列表
   * @param options 调用选项
   * @returns 异步生成器
   */
  async* invokeStream(messages: LLMMessage[], options: {
    temperature?: number;
    maxTokens?: number;
  } = {}): AsyncGenerator<string, void, unknown> {
    try {
      this.logger.debug(`流式调用LLM: ${this.config.provider}/${this.config.model}`);
      
      const requestData = this.buildRequestData(messages, { ...options, stream: true });
      
      const response = await this.httpClient.post(this.getEndpoint(), requestData, {
        responseType: 'stream'
      });

      for await (const chunk of this.parseStreamResponse(response)) {
        yield chunk;
      }
    } catch (error) {
      this.logger.error('LLM流式调用失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取基础URL
   */
  private getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }

    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'deepseek':
        return 'https://api.deepseek.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'google':
        return 'https://generativelanguage.googleapis.com/v1';
      default:
        throw new Error(`不支持的提供商: ${this.config.provider}`);
    }
  }

  /**
   * 获取授权头
   */
  private getAuthorizationHeader(): string {
    switch (this.config.provider) {
      case 'openai':
      case 'deepseek':
        return `Bearer ${this.config.apiKey}`;
      case 'anthropic':
        return `x-api-key: ${this.config.apiKey}`;
      case 'google':
        return `Bearer ${this.config.apiKey}`;
      default:
        return `Bearer ${this.config.apiKey}`;
    }
  }

  /**
   * 获取API端点
   */
  private getEndpoint(): string {
    switch (this.config.provider) {
      case 'openai':
      case 'deepseek':
        return '/chat/completions';
      case 'anthropic':
        return '/messages';
      case 'google':
        return `/models/${this.config.model}:generateContent`;
      default:
        return '/chat/completions';
    }
  }

  /**
   * 构建请求数据
   */
  private buildRequestData(messages: LLMMessage[], options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }): any {
    const temperature = options.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? this.config.maxTokens ?? 4000;

    switch (this.config.provider) {
      case 'openai':
      case 'deepseek':
        return {
          model: this.config.model,
          messages: messages,
          temperature,
          max_tokens: maxTokens,
          stream: options.stream || false
        };

      case 'anthropic':
        return {
          model: this.config.model,
          max_tokens: maxTokens,
          temperature,
          messages: messages,
          stream: options.stream || false
        };

      case 'google':
        return {
          contents: this.convertToGoogleFormat(messages),
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        };

      default:
        return {
          model: this.config.model,
          messages: messages,
          temperature,
          max_tokens: maxTokens,
          stream: options.stream || false
        };
    }
  }

  /**
   * 解析响应
   */
  private parseResponse(response: AxiosResponse): LLMResponse {
    const data = response.data;

    switch (this.config.provider) {
      case 'openai':
      case 'deepseek':
        return {
          content: data.choices[0]?.message?.content || '',
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined,
          model: data.model,
          finishReason: data.choices[0]?.finish_reason
        };

      case 'anthropic':
        return {
          content: data.content[0]?.text || '',
          usage: data.usage ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens
          } : undefined,
          model: data.model,
          finishReason: data.stop_reason
        };

      case 'google':
        return {
          content: data.candidates[0]?.content?.parts[0]?.text || '',
          model: this.config.model,
          finishReason: data.candidates[0]?.finishReason
        };

      default:
        return {
          content: data.choices?.[0]?.message?.content || data.content || '',
          model: data.model || this.config.model
        };
    }
  }

  /**
   * 解析流式响应
   */
  private async* parseStreamResponse(response: AxiosResponse): AsyncGenerator<string, void, unknown> {
    const stream = response.data;
    
    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = this.extractStreamContent(parsed);
            
            if (content) {
              yield content;
            }
          } catch (error) {
            // 忽略解析错误
          }
        }
      }
    }
  }

  /**
   * 提取流式内容
   */
  private extractStreamContent(data: any): string {
    switch (this.config.provider) {
      case 'openai':
      case 'deepseek':
        return data.choices?.[0]?.delta?.content || '';
      case 'anthropic':
        return data.delta?.text || '';
      default:
        return data.choices?.[0]?.delta?.content || data.delta?.text || '';
    }
  }

  /**
   * 转换为Google格式
   */
  private convertToGoogleFormat(messages: LLMMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
  }

  /**
   * 处理错误
   */
  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      let message = `HTTP ${status}: ${data?.error?.message || data?.message || '请求失败'}`;
      
      switch (status) {
        case 401:
          message = 'API密钥无效或未授权';
          break;
        case 429:
          message = '请求频率限制，请稍后重试';
          break;
        case 500:
          message = '服务器内部错误';
          break;
      }
      
      return new Error(message);
    } else if (error.request) {
      return new Error('网络请求失败，请检查网络连接');
    } else {
      return new Error(error.message || '未知错误');
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      
      await this.invoke(testMessages, { maxTokens: 10 });
      return true;
    } catch (error) {
      this.logger.error('连接测试失败:', error);
      return false;
    }
  }
}
