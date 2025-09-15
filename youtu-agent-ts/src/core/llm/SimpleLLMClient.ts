/**
 * 简化的LLM客户端
 * 直接使用axios进行HTTP调用，避免复杂的模块依赖
 */

import axios, { AxiosResponse } from 'axios';
import { Logger } from '../../utils/Logger';

export interface SimpleLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SimpleLLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface SimpleLLMConfig {
  provider: 'openai' | 'deepseek' | 'anthropic' | 'google' | 'custom' | 'local';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export class SimpleLLMClient {
  private readonly logger: Logger;
  private readonly config: SimpleLLMConfig;

  constructor(config: SimpleLLMConfig) {
    this.logger = new Logger('SimpleLLMClient');
    this.config = config;
    this.logger.info(`SimpleLLM客户端初始化: ${config.provider}/${config.model}`);
  }

  /**
   * 调用LLM
   */
  async invoke(messages: SimpleLLMMessage[]): Promise<SimpleLLMResponse> {
    try {
      this.logger.debug(`调用LLM: ${this.config.provider}/${this.config.model}`);
      
      const requestData = this.buildRequestData(messages);
      const response = await this.makeRequest(requestData);
      
      return this.parseResponse(response);
    } catch (error) {
      this.logger.error('LLM调用失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 流式调用LLM
   */
  async* invokeStream(messages: SimpleLLMMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      this.logger.debug(`流式调用LLM: ${this.config.provider}/${this.config.model}`);
      
      const requestData = this.buildRequestData(messages, true);
      const response = await this.makeRequest(requestData, true);

      for await (const chunk of this.parseStreamResponse(response)) {
        yield chunk;
      }
    } catch (error) {
      this.logger.error('LLM流式调用失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 构建请求数据
   */
  private buildRequestData(messages: SimpleLLMMessage[], stream: boolean = false): any {
    const temperature = this.config.temperature ?? 0.7;
    const maxTokens = this.config.maxTokens ?? 4000;

    return {
      model: this.config.model,
      messages: messages,
      temperature,
      max_tokens: maxTokens,
      stream: stream
    };
  }

  /**
   * 发送HTTP请求
   */
  private async makeRequest(data: any, stream: boolean = false): Promise<AxiosResponse> {
    const baseURL = this.getBaseUrl();
    const endpoint = this.getEndpoint();
    const headers = this.getHeaders();

    const config = {
      baseURL,
      url: endpoint,
      method: 'POST',
      headers,
      data,
      timeout: this.config.timeout || 30000
    };

    if (stream) {
      (config as any).responseType = 'stream';
    }

    return await axios(config);
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
        return 'https://api.openai.com/v1';
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
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (this.config.provider) {
      case 'openai':
      case 'deepseek':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = this.config.apiKey;
        break;
      case 'google':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      default:
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * 解析响应
   */
  private parseResponse(response: AxiosResponse): SimpleLLMResponse {
    const data = response.data;

    return {
      content: data.choices?.[0]?.message?.content || data.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || data.usage.input_tokens || 0,
        completionTokens: data.usage.completion_tokens || data.usage.output_tokens || 0,
        totalTokens: data.usage.total_tokens || (data.usage.input_tokens + data.usage.output_tokens) || 0
      } : undefined,
      model: data.model || this.config.model,
      finishReason: data.choices?.[0]?.finish_reason || data.stop_reason
    };
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
            const content = parsed.choices?.[0]?.delta?.content || '';
            
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
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: SimpleLLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      
      await this.invoke(testMessages);
      return true;
    } catch (error) {
      this.logger.error('连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(): SimpleLLMConfig {
    return { ...this.config };
  }
}
