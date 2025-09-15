/**
 * LLM代理类
 * 封装大语言模型的代理实现
 */
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { TaskRecorder } from './common';
import { ModelConfig } from '../config/ModelConfig';
import { getLogger } from '../utils/logger';

const logger = getLogger('LLMAgent');

/**
 * LLM代理类
 * 封装对大语言模型的调用
 */
export class LLMAgent extends BaseAgent {
  /**
   * 配置信息
   */
  private config: ModelConfig;
  
  /**
   * OpenAI客户端
   */
  private client: OpenAI;
  
  /**
   * 指令内容
   */
  private instructions: string = '';

  /**
   * 构造函数
   * @param config 模型配置
   */
  constructor(config: ModelConfig) {
    super();
    this.name = "LLMAgent";
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL
    });
  }

  /**
   * 设置指令
   * @param instructions 指令内容
   */
  setInstructions(instructions: string): void {
    this.instructions = instructions;
  }

  /**
   * 运行代理
   * @param input 输入内容
   * @param traceId 追踪ID
   */
  async run(input: string | any[], traceId?: string): Promise<TaskRecorder> {
    // 生成追踪ID
    traceId = traceId || uuidv4();
    const taskRecorder = new TaskRecorder(input, traceId);

    try {
      // 准备消息
      const messages = this.prepareMessages(input);
      
      // 调用OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      // 记录结果
      taskRecorder.addRunResult(response);
      taskRecorder.setFinalOutput(response.choices[0]?.message?.content || '');
      
      return taskRecorder;
    } catch (error) {
      logger.error(`LLMAgent运行错误: ${error}`);
      throw error;
    }
  }

  /**
   * 流式运行代理
   * @param input 输入内容
   * @param traceId 追踪ID
   */
  async runStreamed(input: string | any[], traceId?: string): Promise<any> {
    // 生成追踪ID
    traceId = traceId || uuidv4();
    
    try {
      // 准备消息
      const messages = this.prepareMessages(input);
      
      // 调用OpenAI API (流式)
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });
      
      return stream;
    } catch (error) {
      logger.error(`LLMAgent流式运行错误: ${error}`);
      throw error;
    }
  }

  /**
   * 准备消息
   * @param input 输入内容
   */
  private prepareMessages(input: string | any[]): any[] {
    // 如果有指令，添加系统消息
    const messages: any[] = [];
    
    if (this.instructions) {
      messages.push({
        role: 'system',
        content: this.instructions
      });
    }
    
    // 添加用户输入
    if (typeof input === 'string') {
      messages.push({
        role: 'user',
        content: input
      });
    } else if (Array.isArray(input)) {
      // 如果输入是数组，直接添加
      messages.push(...input);
    }
    
    return messages;
  }
}