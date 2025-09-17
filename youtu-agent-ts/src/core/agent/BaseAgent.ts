/**
 * 基础智能体类
 * 
 * 定义了所有智能体的通用接口和行为，支持ReAct（Reasoning and Acting）模式。
 * ReAct模式通过推理-行动-观察的循环来实现智能体的决策和执行过程。
 * 
 * @template TContext 智能体上下文类型
 * 
 * @example
 * ```typescript
 * class MyAgent extends BaseAgent {
 *   protected async callLLM(prompt: string): Promise<string> {
 *     // 实现LLM调用逻辑
 *   }
 * }
 * ```
 */

import { EventEmitter } from 'events';
import { AgentConfig, TaskRecorder, Message, AgentError, Action, ToolDefinition, ToolCall, ERROR_CODES } from '../../types';
import { Logger } from '../../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';
import { ToolManager } from '../tool/ToolManager';

export abstract class BaseAgent<TContext = any> extends EventEmitter {
  protected readonly config: AgentConfig;
  protected readonly logger: Logger;
  protected readonly toolManager: ToolManager;
  protected readonly configManager: ConfigManager;
  protected isInitialized: boolean = false;
  
  // ReAct模式相关属性
  protected maxTurns: number = 10;
  protected currentTurn: number = 0;
  protected context?: TContext;
  protected availableTools: Map<string, ToolDefinition> = new Map();
  private cachedToolDescriptions: string | undefined;

  // ReAct 行为与模板配置（由 config.react 规范化而来）
  private react!: {
    maxTurns: number;
    maxConsecutiveFailures: number;
    failureKeywords: string[];
    reminderTurns: number;
    historyWindow: number;
    includeSessionHistory: boolean;
    includeCurrentObservations: boolean;
    historyMaxSessions: number;
    forceJsonAction: boolean;
    prompts: {
      reasoning?: string;
      action?: string;
      nextInputAppend?: string;
    };
  };
  
  // 会话管理
  private sessionHistory: TaskRecorder[] = [];
  private currentSessionId: string | null = null;

  constructor(config: AgentConfig, toolManager?: ToolManager, configManager?: ConfigManager) {
    super();
    this.config = config;
    this.logger = new Logger(`Agent:${config.name}`);
    this.toolManager = toolManager || new ToolManager();
    this.configManager = configManager || new ConfigManager();

    // 规范化 ReAct 配置，减少硬编码
    const r = this.config.react || {} as any;
    this.react = {
      maxTurns: r.maxTurns ?? this.config.maxTurns ?? 10,
      maxConsecutiveFailures: r.maxConsecutiveFailures ?? 3,
      failureKeywords: (r.failureKeywords ?? ['失败', '错误', 'error', 'fail', 'exception']).map((s: string) => String(s).toLowerCase()),
      reminderTurns: r.reminderTurns ?? 3,
      historyWindow: r.historyWindow ?? 3,
      includeSessionHistory: r.includeSessionHistory ?? true,
      includeCurrentObservations: r.includeCurrentObservations ?? true,
      historyMaxSessions: r.historyMaxSessions ?? 10,
      forceJsonAction: r.forceJsonAction ?? true,
      prompts: r.prompts ?? {}
    };
    this.maxTurns = this.react.maxTurns;
  }

  /**
   * 初始化智能体
   * 子类可以重写此方法来实现特定的初始化逻辑
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('正在初始化智能体...');
      
      // 加载工具
      if (this.config.tools && this.config.tools.length > 0) {
        await this.loadTools(this.config.tools);
        this.logger.info(`已加载 ${this.availableTools.size} 个工具`);
      }

      // 执行子类特定的初始化
      await this.onInitialize();

      this.isInitialized = true;
      this.logger.info('智能体初始化完成');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('智能体初始化失败:', error);
      throw new AgentError(
        `智能体初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ERROR_CODES.AGENT.INIT_FAILED,
        error
      );
    }
  }

  /**
   * 运行智能体
   * @param input 输入内容
   * @param traceId 追踪ID
   * @param sessionId 会话ID（可选，用于保持对话上下文）
   * @returns 任务记录器
   */
  async run(input: string, traceId?: string, sessionId?: string): Promise<TaskRecorder> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 处理会话上下文
    if (sessionId && sessionId !== this.currentSessionId) {
      this.currentSessionId = sessionId;
      // 如果是新会话，清空历史记录
      if (!this.sessionHistory.length || this.sessionHistory[this.sessionHistory.length - 1]?.id !== sessionId) {
        // 保持当前会话的历史记录，只有明确切换会话时才清空
      }
    }

    const recorder = this.createTaskRecorder(input, traceId);
    
    try {
      this.logger.info(`开始执行任务: ${input}`);
      this.emit('task_start', recorder);

      // 执行ReAct循环
      const result = await this.reactLoop(input, recorder);
      
      recorder.output = result;
      recorder.status = 'completed';
      recorder.endTime = new Date();

      // 将完成的任务添加到会话历史中
      this.sessionHistory.push(recorder);
      // 限制历史记录长度，避免内存泄漏（可配置）
      if (this.sessionHistory.length > this.react.historyMaxSessions) {
        this.sessionHistory.shift();
      }

      this.logger.info('任务执行完成');
      this.emit('task_completed', recorder);
      
      return recorder;
    } catch (error) {
      recorder.status = 'failed';
      recorder.error = error instanceof Error ? error.message : '未知错误';
      recorder.endTime = new Date();

      // 即使失败也要记录到历史中，以便智能体了解之前的尝试
      this.sessionHistory.push(recorder);
      if (this.sessionHistory.length > this.react.historyMaxSessions) {
        this.sessionHistory.shift();
      }

      this.logger.error('任务执行失败:', {
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        input,
        turns: recorder.turns,
        availableTools: Array.from(this.availableTools.keys())
      });
      this.emit('task_failed', recorder);
      
      throw error;
    }
  }

  /**
   * 流式运行智能体
   * @param input 输入内容
   * @param traceId 追踪ID
   * @returns 异步生成器，产生流式结果
   */
  async* runStream(input: string, traceId?: string): AsyncGenerator<Message, void, unknown> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recorder = this.createTaskRecorder(input, traceId);
    
    try {
      this.logger.info(`开始流式执行任务: ${input}`);
      this.emit('stream_start', recorder);

      // 执行ReAct循环的流式版本
      for await (const message of this.reactLoopStream(input, recorder)) {
        recorder.messages.push(message);
        this.emit('stream_message', message);
        yield message;
      }

      recorder.status = 'completed';
      recorder.endTime = new Date();

      this.logger.info('流式任务执行完成');
      this.emit('stream_completed', recorder);
    } catch (error) {
      recorder.status = 'failed';
      recorder.error = error instanceof Error ? error.message : '未知错误';
      recorder.endTime = new Date();

      this.logger.error('流式任务执行失败:', error);
      this.emit('stream_failed', recorder);
      
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      this.logger.info('正在清理智能体资源...');
      await this.onCleanup();
      this.toolManager.cleanup();
      this.isInitialized = false;
      this.logger.info('智能体资源清理完成');
    } catch (error) {
      this.logger.error('智能体资源清理失败:', error);
    }
  }

  /**
   * 获取智能体配置
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * 获取智能体名称
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * 获取智能体类型
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * 检查智能体是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 创建任务记录器
   */
  protected createTaskRecorder(input: string, traceId?: string): TaskRecorder {
    return {
      id: traceId || this.generateTraceId(),
      input,
      messages: [],
      toolCalls: [],
      startTime: new Date(),
      status: 'pending',
      // ReAct模式相关字段
      reasoning: [],
      actions: [],
      observations: [],
      turns: 0,
      maxTurns: this.maxTurns
    };
  }

  /**
   * 生成追踪ID
   */
  protected generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ReAct循环核心方法
   */
  protected async reactLoop(input: string, recorder: TaskRecorder): Promise<string> {
    let currentInput = input;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = this.react.maxConsecutiveFailures;
    
    for (recorder.turns = 0; recorder.turns < recorder.maxTurns; recorder.turns++) {
      this.logger.info(`ReAct循环 - 第 ${recorder.turns + 1} 轮`);
      
      try {
        // 1. Reasoning: 分析当前情况
        const reasoning = await this.reason(currentInput, recorder);
        recorder.reasoning.push(reasoning);
        
        // 2. Acting: 决定行动（工具调用或生成响应）
        const action = await this.act(reasoning, recorder);
        recorder.actions.push(action);
        
        if (action.type === 'tool_call' && action.toolCall) {
          // 3. Observation: 执行工具并观察结果
          const observation = await this.observe(action.toolCall, recorder);
          recorder.observations.push(observation);
          
          // 检查工具执行是否成功（可配置的失败关键词）
          if (this.isFailureObservation(observation)) {
            consecutiveFailures++;
            this.logger.warn(`工具执行失败，连续失败次数: ${consecutiveFailures}`);
            
            if (consecutiveFailures >= maxConsecutiveFailures) {
              this.logger.error('连续工具执行失败次数过多，终止循环');
              return `任务执行失败：连续${maxConsecutiveFailures}次工具调用失败。最后错误：${observation}`;
            }
          } else {
            consecutiveFailures = 0; // 重置失败计数
          }
          
          // 构建下一轮的输入
          currentInput = this.buildNextInput(currentInput, observation, recorder);
        } else if (action.type === 'response' && action.response) {
          // 直接返回响应
          this.logger.info('智能体返回最终响应');
          return action.response;
        }
      } catch (error) {
        this.logger.error(`ReAct循环第${recorder.turns + 1}轮执行失败:`, error);
        consecutiveFailures++;
        
        if (consecutiveFailures >= maxConsecutiveFailures) {
          throw new AgentError(
            `ReAct循环执行失败：连续${maxConsecutiveFailures}轮执行失败`,
            ERROR_CODES.AGENT.REACT_LOOP_FAILED,
            error
          );
        }
        
        // 继续下一轮
        currentInput = `${currentInput}\n\n上一轮执行失败，请重新尝试。`;
      }
    }
    
    throw new AgentError('达到最大轮次限制', ERROR_CODES.AGENT.MAX_TURNS_EXCEEDED);
  }

  /**
   * ReAct循环的流式版本
   */
  protected async* reactLoopStream(input: string, recorder: TaskRecorder): AsyncGenerator<Message, void, unknown> {
    let currentInput = input;
    
    for (recorder.turns = 0; recorder.turns < recorder.maxTurns; recorder.turns++) {
      this.logger.info(`ReAct循环 - 第 ${recorder.turns + 1} 轮`);
      
      // 1. Reasoning: 分析当前情况
      const reasoning = await this.reason(currentInput, recorder);
      recorder.reasoning.push(reasoning);
      
      // 发送推理消息
      yield {
        role: 'assistant',
        content: `思考: ${reasoning}`,
        timestamp: new Date()
      };
      
      // 2. Acting: 决定行动
      const action = await this.act(reasoning, recorder);
      recorder.actions.push(action);
      
      if (action.type === 'tool_call' && action.toolCall) {
        // 发送工具调用消息
        yield {
          role: 'assistant',
          content: `调用工具: ${action.toolCall.function.name}`,
          tool_calls: [action.toolCall],
          timestamp: new Date()
        };
        
        // 3. Observation: 执行工具并观察结果
        const observation = await this.observe(action.toolCall, recorder);
        recorder.observations.push(observation);
        
        // 发送工具结果消息
        yield {
          role: 'tool',
          content: observation,
          tool_call_id: action.toolCall.id,
          timestamp: new Date()
        };
        
        // 构建下一轮的输入
        currentInput = this.buildNextInput(currentInput, observation, recorder);
      } else if (action.type === 'response' && action.response) {
        // 发送最终响应
        yield {
          role: 'assistant',
          content: action.response,
          timestamp: new Date()
        };
        return;
      }
    }
    
    throw new AgentError('达到最大轮次限制', ERROR_CODES.AGENT.MAX_TURNS_EXCEEDED);
  }

  /**
   * 推理阶段 - 分析当前情况
   */
  protected async reason(input: string, recorder: TaskRecorder): Promise<string> {
    const prompt = this.buildReasoningPrompt(input, recorder);
    const response = await this.callLLM(prompt);
    return response;
  }

  /**
   * 行动阶段 - 决定下一步行动
   */
  protected async act(reasoning: string, recorder: TaskRecorder): Promise<Action> {
    const prompt = this.buildActionPrompt(reasoning, recorder);
    const response = await this.callLLM(prompt);
    
    this.logger.debug('LLM行动响应:', JSON.stringify(response));
    
    // 解析是否包含工具调用
    const toolCall = this.parseToolCall(response);
    if (toolCall) {
      return { type: 'tool_call', toolCall, reasoning };
    } else {
      return { type: 'response', response, reasoning };
    }
  }

  /**
   * 观察阶段 - 执行工具并观察结果
   */
  protected async observe(toolCall: ToolCall, recorder: TaskRecorder): Promise<string> {
    this.logger.debug('执行工具调用:', JSON.stringify(toolCall, null, 2));
    
    const tool = this.availableTools.get(toolCall.function.name);
    if (!tool) {
      throw new AgentError(`工具 ${toolCall.function.name} 不存在`, ERROR_CODES.TOOL.NOT_FOUND);
    }
    
    try {
      this.logger.debug('原始工具参数:', toolCall.function.arguments);
      
      let args: Record<string, unknown>;
      
      // 处理参数解析
      if (typeof toolCall.function.arguments === 'string') {
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          this.logger.error('JSON解析失败:', parseError);
          return `参数解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`;
        }
      } else if (typeof toolCall.function.arguments === 'object' && toolCall.function.arguments !== null) {
        args = toolCall.function.arguments as Record<string, unknown>;
      } else {
        return `无效的参数类型: ${typeof toolCall.function.arguments}`;
      }
      
      this.logger.debug('解析后的参数:', JSON.stringify(args, null, 2));
      
      // 验证参数不为null或undefined
      if (!args || Object.keys(args).length === 0) {
        this.logger.warn('参数为空或无效');
        return '工具调用参数为空或无效';
      }
      
      const result = await tool.handler(args);
      recorder.toolCalls.push(toolCall);
      this.logger.debug('工具执行结果:', result);
      return result;
    } catch (error) {
      const errorMsg = `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
      this.logger.error(errorMsg, {
        toolName: toolCall.function.name,
        arguments: toolCall.function.arguments,
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined
      });
      return errorMsg;
    }
  }

  /**
   * 构建下一轮的输入
   */
  protected buildNextInput(currentInput: string, observation: string, recorder: TaskRecorder): string {
    const turnCount = recorder.turns;
    const hasSuccessfulToolCalls = recorder.toolCalls.length > 0;

    // 优先使用自定义模板
    if (this.react.prompts.nextInputAppend) {
      const append = this.applyTemplate(this.react.prompts.nextInputAppend, {
        observation,
        toolCallCount: recorder.toolCalls.length,
        turn: turnCount + 1,
        maxTurns: this.react.maxTurns
      });
      return `${currentInput}\n\n${append}`;
    }

    let context = `\n\n工具执行结果: ${observation}`;
    
    // 如果已经有成功的工具调用，提示智能体考虑是否完成任务
    if (hasSuccessfulToolCalls) {
      context += `\n\n注意：你已经成功执行了${recorder.toolCalls.length}个工具调用。请评估是否已经完成了用户的任务。如果任务已完成，请提供最终答案而不是继续调用工具。`;
    }
    
    // 如果轮次较多，提醒智能体考虑终止（可配置）
    if (turnCount >= this.react.reminderTurns) {
      context += `\n\n提醒：当前已经是第${turnCount + 1}轮，请考虑是否已经获得足够的信息来完成任务。`;
    }
    
    return `${currentInput}${context}`;
  }

  /**
   * 构建推理提示词（可配置模板）
   */
  protected buildReasoningPrompt(input: string, recorder: TaskRecorder): string {
    const toolsList = Array.from(this.availableTools.values())
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    // 组装会话历史（可选、窗口大小可配）
    let sessionHistoryBlock = '';
    if (this.react.includeSessionHistory && this.sessionHistory.length > 0) {
      sessionHistoryBlock += `\n\n会话历史:`;
      this.sessionHistory.slice(-this.react.historyWindow).forEach((task, i) => {
        sessionHistoryBlock += `\n${i + 1}. 任务: ${task.input}`;
        if (task.status === 'completed') {
          sessionHistoryBlock += ` -> 已完成`;
          if (task.toolCalls.length > 0) {
            const lastToolCall = task.toolCalls[task.toolCalls.length - 1];
            if (lastToolCall) {
              sessionHistoryBlock += ` (使用了${lastToolCall.function.name}工具)`;
            }
          }
        } else if (task.status === 'failed') {
          sessionHistoryBlock += ` -> 失败: ${task.error}`;
        }
      });
    }

    // 当前任务观察历史（可选）
    let obsBlock = '';
    if (this.react.includeCurrentObservations && recorder.observations.length > 0) {
      obsBlock += `\n\n当前任务历史记录:\n${recorder.observations.map((obs, i) => `第${i+1}轮结果: ${obs}`).join('\n')}`;
    }

    // 优先使用自定义模板
    if (this.react.prompts.reasoning) {
      return this.applyTemplate(this.react.prompts.reasoning, {
        input,
        tools: toolsList,
        sessionHistory: sessionHistoryBlock,
        observations: obsBlock,
        turn: recorder.turns + 1,
        maxTurns: this.react.maxTurns,
        toolCallCount: recorder.toolCalls.length
      });
    }

    // 默认模板（与原逻辑等价，减少硬编码且受配置控制）
    let prompt = `请分析当前情况并决定下一步行动。\n\n当前输入: ${input}\n\n可用工具:\n${toolsList}`;

    if (sessionHistoryBlock) {
      prompt += sessionHistoryBlock;
    }
    if (obsBlock) {
      prompt += obsBlock;
    }

    prompt += `\n\n请分析当前情况，考虑是否需要使用工具来完成任务。`;
    return prompt;
  }

  /**
   * 构建行动提示词（可配置模板）
   */
  protected buildActionPrompt(reasoning: string, _recorder: TaskRecorder): string {
    // 使用缓存的工具描述
    if (!this.cachedToolDescriptions) {
      this.cachedToolDescriptions = Array.from(this.availableTools.values())
        .map(tool => {
          // 获取工具参数schema（保持兼容，必要时可被模板覆盖）
          const params = (tool as any).parameters?._def || {};
          const paramDesc = Object.keys(params).length > 0 ? 
            `参数: ${JSON.stringify(params, null, 2)}` : '无参数';
          return `- ${tool.name}: ${tool.description}\n  ${paramDesc}`;
        })
        .join('\n\n');
    }
    
    const availableTools = this.cachedToolDescriptions;

    // 优先使用自定义模板
    if (this.react.prompts.action) {
      return this.applyTemplate(this.react.prompts.action, {
        reasoning,
        tools: availableTools
      });
    }
    
    // 默认模板（受 forceJsonAction 控制）
    let base = `基于以下分析，请决定下一步行动:\n\n分析: ${reasoning}\n\n可用工具:\n${availableTools}`;

    if (this.react.forceJsonAction) {
      base += `\n\n如果需要使用工具，请严格按照以下JSON格式调用:\n{\n  "name": "工具名称",\n  "arguments": "{\"参数名\": \"参数值\"}"\n}\n\n示例:\n{\n  "name": "file_write",\n  "arguments": "{\"filePath\": \"hello.txt\", \"content\": \"Hello World\"}"\n}\n\n如果任务已经完成，或者不需要更多工具调用，请直接提供最终答案，不要调用工具。\n\n重要：必须返回有效的JSON格式，不要包含其他文字。`;
    } else {
      base += `\n\n如果需要使用工具，请明确说明要调用的工具及其参数；如果任务已完成，请直接给出最终答案。`;
    }

    return base;
  }

  /**
   * 解析工具调用
   */
  protected parseToolCall(response: string): ToolCall | null {
    try {
      this.logger.debug('解析工具调用响应:', JSON.stringify(response));
      
      // 清理响应文本，移除可能的markdown代码块标记
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // 尝试解析JSON格式的工具调用
      const match = cleanResponse.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        this.logger.debug('解析的JSON:', parsed);
        
        if (parsed.name) {
          // 处理arguments参数
          let processedArguments: string;
          
          if (parsed.arguments) {
            if (typeof parsed.arguments === 'string') {
              // 如果已经是字符串，验证是否为有效JSON
              try {
                JSON.parse(parsed.arguments);
                processedArguments = parsed.arguments;
              } catch {
                // 如果不是有效JSON，将其包装为对象
                processedArguments = JSON.stringify({ value: parsed.arguments });
              }
            } else if (typeof parsed.arguments === 'object') {
              processedArguments = JSON.stringify(parsed.arguments);
            } else {
              // 其他类型转换为字符串并包装
              processedArguments = JSON.stringify({ value: parsed.arguments });
            }
          } else {
            // 如果没有arguments，提供空对象
            processedArguments = '{}';
          }
          
          const toolCall: ToolCall = {
            id: this.generateTraceId(),
            type: 'function' as const,
            function: {
              name: parsed.name,
              arguments: processedArguments
            }
          };
          
          this.logger.debug('生成的工具调用:', JSON.stringify(toolCall, null, 2));
          return toolCall;
        }
      }
    } catch (error) {
      this.logger.debug('工具调用解析失败:', error);
    }
    return null;
  }

  /**
   * 加载工具
   */
  protected async loadTools(toolNames: string[]): Promise<void> {
    for (const toolName of toolNames) {
      try {
        // 首先尝试从已注册的工具中获取
        let tool = this.toolManager.getTool(toolName);
        
        // 如果工具不存在，尝试加载
        if (!tool) {
          const loadedTool = await this.toolManager.loadTool(toolName);
          tool = loadedTool || undefined;
        }
        
        if (tool) {
          this.availableTools.set(toolName, tool);
          this.cachedToolDescriptions = undefined; // 清除缓存
          this.logger.info(`已加载工具: ${toolName}`);
        } else {
          this.logger.warn(`工具不存在: ${toolName}`);
        }
      } catch (error) {
        this.logger.warn(`加载工具失败: ${toolName}`, error);
      }
    }
  }

  /**
   * 调用LLM - 子类需要实现
   */
  protected abstract callLLM(prompt: string): Promise<string>;

  /**
   * 获取智能体信息 - 子类可以重写
   */
  getInfo(): Record<string, unknown> {
    return {
      type: this.config.type,
      name: this.config.name,
      isReady: this.isReady(),
      maxTurns: this.maxTurns,
      toolsCount: this.availableTools.size,
      tools: Array.from(this.availableTools.keys()),
      sessionHistory: this.sessionHistory.length,
      currentSessionId: this.currentSessionId
    };
  }

  /**
   * 开始新会话
   */
  startNewSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSessionId = sessionId;
    this.sessionHistory = [];
    this.logger.info(`开始新会话: ${sessionId}`);
    return sessionId;
  }

  /**
   * 清除会话历史
   */
  clearSessionHistory(): void {
    this.sessionHistory = [];
    this.currentSessionId = null;
    this.logger.info('会话历史已清除');
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(): TaskRecorder[] {
    return [...this.sessionHistory];
  }

  /**
   * 子类需要实现的抽象方法
   */
  // 可配置的失败检测
  private isFailureObservation(text: string): boolean {
    const lower = String(text ?? '').toLowerCase();
    return this.react.failureKeywords.some((k) => lower.includes(k));
  }

  // 简单模板渲染：支持 {{var}}
  private applyTemplate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
      const v = (vars as any)[key];
      return v === undefined || v === null ? '' : String(v);
    });
  }

  protected abstract onInitialize(): Promise<void>;
  protected abstract onCleanup(): Promise<void>;
}
