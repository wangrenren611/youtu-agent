/**
 * 简单代理类
 * 实现单一代理功能，直接与LLM交互
 */
import { BaseAgent } from './BaseAgent';
import { TaskRecorder, AgentConfig, Message, MessageType, RunOptions, ToolCall } from './common';
import { BaseEnv } from '../env/BaseEnv';
import { v4 as uuidv4 } from 'uuid';
import { BaseTool } from '../tools/BaseTool';

/**
 * 简单代理类
 * 实现单一代理功能，直接与LLM交互
 */
export class SimpleAgent extends BaseAgent {
  /**
   * 模型客户端
   */
  private modelClient: any;

  /**
   * 构造函数
   * @param name 代理名称
   * @param config 代理配置
   * @param env 代理环境
   */
  constructor(name: string, config: AgentConfig, env?: BaseEnv) {
    super(name, config, env);
    this.description = '简单代理，直接与LLM交互执行任务';
  }

  /**
   * 构建代理
   * 在代理使用前进行初始化
   */
  async build(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('simpleAgent.build', { agentName: this.name });
    }

    // 初始化模型客户端
    await this.initModelClient();
    
    // 初始化工具
    await this.initTools();

    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }

  /**
   * 初始化模型客户端
   */
  private async initModelClient(): Promise<void> {
    if (!this.config.model) {
      throw new Error('模型配置缺失');
    }

    // 根据配置的模型提供商初始化对应的客户端
    // 这里仅作为示例，实际实现需要根据不同的模型提供商进行适配
    switch (this.config.model.provider.toLowerCase()) {
      case 'openai':
        // 初始化 OpenAI 客户端
        // this.modelClient = new OpenAIClient(this.config.model.parameters);
        this.modelClient = { name: 'openai-mock' }; // 临时模拟
        break;
      case 'anthropic':
        // 初始化 Anthropic 客户端
        // this.modelClient = new AnthropicClient(this.config.model.parameters);
        this.modelClient = { name: 'anthropic-mock' }; // 临时模拟
        break;
      default:
        throw new Error(`不支持的模型提供商: ${this.config.model.provider}`);
    }
  }

  /**
   * 初始化工具
   */
  protected async initTools(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('simpleAgent.initTools', { agentName: this.name });
    }

    // 如果配置了工具，则初始化工具
    if (this.config.tools?.enabled) {
      // 这里应该从工具注册表中获取工具并初始化
      // 实际实现需要根据工具注册表进行适配
      if (this.config.tools.allowedTools && this.config.tools.allowedTools.length > 0) {
        // 根据允许的工具列表初始化工具
        // 这里仅作为示例
        for (const toolName of this.config.tools.allowedTools) {
          // 从工具注册表中获取工具
          // const tool = ToolRegistry.getTool(toolName);
          // if (tool) {
          //   this.addTool(tool);
          // }
        }
      }
    }

    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }

  /**
   * 运行代理
   * @param input 输入数据
   * @param traceId 追踪ID
   * @param options 运行选项
   */
  async run(input: any, traceId?: string, options?: RunOptions): Promise<TaskRecorder> {
    // 生成追踪ID
    const runTraceId = traceId || uuidv4();
    
    // 创建任务记录器
    const recorder = new TaskRecorder(input, runTraceId);
    recorder.start();

    try {
      if (this.tracer) {
        await this.tracer.startSpan('simpleAgent.run', { 
          agentName: this.name,
          traceId: runTraceId
        });
      }

      // 将输入转换为消息
      const userMessage = this.createUserMessage(input);
      this.addMessage(userMessage);

      // 准备系统消息
      if (this.context.messages.length === 1) { // 只有用户消息，添加系统消息
        const systemMessage = this.createSystemMessage();
        this.context.messages.unshift(systemMessage);
      }

      // 准备发送给模型的消息
      const messages = this.prepareMessages();

      // 准备工具定义
      const tools = this.prepareTools();

      // 调用模型
      const response = await this.callModel(messages, tools, options);

      // 处理模型响应
      const result = await this.handleModelResponse(response);

      // 记录结果
      recorder.addRunResult(result);
      recorder.setFinalOutput(result);

      if (this.tracer) {
        await this.tracer.endSpan();
      }

      return recorder;
    } catch (error) {
      if (this.tracer) {
        await this.tracer.recordError(error as Error);
        await this.tracer.endSpan();
      }

      recorder.setError(error as Error);
      return recorder;
    }
  }

  /**
   * 创建用户消息
   * @param input 输入数据
   */
  private createUserMessage(input: any): Message {
    return {
      type: MessageType.USER,
      content: typeof input === 'string' ? input : JSON.stringify(input),
      id: uuidv4(),
      createdAt: new Date()
    };
  }

  /**
   * 创建系统消息
   */
  private createSystemMessage(): Message {
    // 系统消息内容可以从配置中获取
    const systemContent = '你是一个智能助手，可以帮助用户完成各种任务。';
    
    return {
      type: MessageType.SYSTEM,
      content: systemContent,
      id: uuidv4(),
      createdAt: new Date()
    };
  }

  /**
   * 准备发送给模型的消息
   */
  private prepareMessages(): any[] {
    // 将内部消息格式转换为模型所需的格式
    // 这里仅作为示例，实际实现需要根据不同的模型提供商进行适配
    return this.context.messages.map(msg => {
      return {
        role: msg.type,
        content: msg.content,
        ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
        ...(msg.toolName ? { name: msg.toolName } : {})
      };
    });
  }

  /**
   * 准备工具定义
   */
  private prepareTools(): any[] {
    if (!this.config.tools?.enabled || this.tools.size === 0) {
      return [];
    }

    // 将内部工具格式转换为模型所需的格式
    // 这里仅作为示例，实际实现需要根据不同的模型提供商进行适配
    return Array.from(this.tools.values()).map((tool: BaseTool) => {
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameterSchema || {}
        }
      };
    });
  }

  /**
   * 调用模型
   * @param messages 消息列表
   * @param tools 工具定义
   * @param options 运行选项
   */
  private async callModel(messages: any[], tools: any[], options?: RunOptions): Promise<any> {
    // 这里仅作为示例，实际实现需要根据不同的模型提供商进行适配
    // 模拟调用模型
    return {
      id: uuidv4(),
      model: this.config.model?.name || 'unknown',
      choices: [
        {
          message: {
            role: 'assistant',
            content: '这是一个模拟的模型响应。',
            tool_calls: []
          }
        }
      ]
    };
  }

  /**
   * 处理模型响应
   * @param response 模型响应
   */
  private async handleModelResponse(response: any): Promise<any> {
    // 从响应中提取助手消息
    const assistantMessage = response.choices[0].message;
    
    // 创建内部消息格式
    const message: Message = {
      type: MessageType.ASSISTANT,
      content: assistantMessage.content || '',
      id: uuidv4(),
      createdAt: new Date()
    };

    // 处理工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCalls: ToolCall[] = assistantMessage.tool_calls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      }));
      
      message.toolCalls = toolCalls;
      
      // 添加助手消息到上下文
      this.addMessage(message);
      
      // 执行工具调用
      for (const toolCall of toolCalls) {
        const result = await this.executeToolCall(toolCall);
        
        // 添加工具响应消息到上下文
        const toolResponseMessage: Message = {
          type: MessageType.TOOL,
          content: JSON.stringify(result),
          id: uuidv4(),
          createdAt: new Date(),
          toolCallId: toolCall.id,
          toolName: toolCall.name
        };
        
        this.addMessage(toolResponseMessage);
        
        // 更新工具调用结果
        toolCall.result = result;
      }
      
      // 再次调用模型，包含工具响应
      const followUpMessages = this.prepareMessages();
      const followUpTools = this.prepareTools();
      const followUpResponse = await this.callModel(followUpMessages, followUpTools);
      
      // 递归处理响应
      return this.handleModelResponse(followUpResponse);
    } else {
      // 没有工具调用，直接添加助手消息到上下文
      this.addMessage(message);
      
      // 返回最终结果
      return {
        content: message.content,
        messageId: message.id
      };
    }
  }

  /**
   * 执行工具调用
   * @param toolCall 工具调用
   */
  private async executeToolCall(toolCall: ToolCall): Promise<any> {
    const tool = this.getTool(toolCall.name);
    
    if (!tool) {
      throw new Error(`找不到工具: ${toolCall.name}`);
    }
    
    try {
      if (this.tracer) {
        await this.tracer.startSpan('simpleAgent.executeToolCall', {
          toolName: toolCall.name,
          toolCallId: toolCall.id
        });
      }
      
      // 执行工具
      const result = await tool.execute(toolCall.arguments, {
        agent: this,
        env: this.env
      });
      
      if (this.tracer) {
        await this.tracer.endSpan();
      }
      
      return result;
    } catch (error) {
      if (this.tracer) {
        await this.tracer.recordError(error as Error);
        await this.tracer.endSpan();
      }
      
      return {
        error: (error as Error).message
      };
    }
  }

  /**
   * 清理代理资源
   */
  async cleanup(): Promise<void> {
    if (this.tracer) {
      await this.tracer.startSpan('simpleAgent.cleanup', { agentName: this.name });
    }
    
    // 清理模型客户端资源
    this.modelClient = null;
    
    // 调用父类清理方法
    await super.cleanup();
    
    if (this.tracer) {
      await this.tracer.endSpan();
    }
  }
}