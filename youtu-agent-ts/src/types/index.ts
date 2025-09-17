/**
 * 基础类型定义
 * 定义了整个框架中使用的核心类型和接口
 */

import { z } from 'zod';

// 基础消息类型
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  timestamp?: Date;
}

// 工具调用类型
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// 工具定义类型
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  handler: ToolHandler;
}

// 工具处理器类型
export type ToolHandler = (args: Record<string, any>) => Promise<string>;

// 智能体配置类型
export interface AgentConfig {
  type: 'simple' | 'orchestra' | 'workforce';
  name: string;
  model: ModelConfig;
  instructions?: string;
  tools?: string[];
  maxTurns?: number;
  temperature?: number;
  maxTokens?: number;
  
  // Orchestra智能体配置
  plannerModel?: ModelConfig;
  plannerConfig?: Record<string, any>;
  workers?: Record<string, AgentConfig>;
  workersInfo?: Array<{
    name: string;
    desc: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  reporterModel?: ModelConfig;
  reporterConfig?: Record<string, any>;

  // Workforce智能体配置
  workforcePlannerModel?: ModelConfig;
  workforceAssignerModel?: ModelConfig;
  workforceAnswererModel?: ModelConfig;
  workforceExecutorAgents?: Record<string, AgentConfig>;
  workforceExecutorConfig?: {
    maxTries?: number;
    returnSummary?: boolean;
  };
  workforceExecutorInfos?: Array<{
    name: string;
    description: string;
    strengths?: string[];
    weaknesses?: string[];
  }>;

  // ReAct 配置（可选）
  react?: ReactConfig;
}

// 模型配置类型
export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'local' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

// ReAct 模板配置
export interface ReactPrompts {
  reasoning?: string;        // 自定义“推理”阶段提示词模板
  action?: string;           // 自定义“行动”阶段提示词模板
  nextInputAppend?: string;  // 自定义“下一轮输入拼接”的模板
}

// ReAct 行为配置
export interface ReactConfig {
  maxTurns?: number;                  // 覆盖全局 maxTurns
  maxConsecutiveFailures?: number;    // 连续失败的最大次数
  failureKeywords?: string[];         // 视为失败的关键词（大小写不敏感）
  reminderTurns?: number;             // 从第几轮开始提醒考虑终止
  historyWindow?: number;             // 会话历史在提示词中包含的条目数量
  includeSessionHistory?: boolean;    // 是否在提示词中包含会话历史
  includeCurrentObservations?: boolean; // 是否在提示词中包含当前任务的观察历史
  historyMaxSessions?: number;        // 内存中的会话历史保留上限
  forceJsonAction?: boolean;          // 是否强制行动阶段返回JSON
  prompts?: ReactPrompts;             // 可选的提示词模板
}

// 任务记录器类型
export interface TaskRecorder {
  id: string;
  input: string;
  output?: string;
  messages: Message[];
  toolCalls: ToolCall[];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  
  // ReAct模式相关字段
  reasoning: string[];        // 记录每轮的推理过程
  actions: Action[];          // 记录每轮的行动
  observations: string[];     // 记录每轮的观察结果
  turns: number;              // 当前轮次
  maxTurns: number;           // 最大轮次限制
}

// 行动类型
export interface Action {
  type: 'tool_call' | 'response';
  toolCall?: ToolCall;
  response?: string;
  reasoning?: string;
}

// 工具定义类型（扩展）
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  handler: ToolHandler;
  enabled?: boolean;
  isEnabled?: (context?: Record<string, unknown>) => boolean | Promise<boolean>;
}

// 工作流状态类型
export interface WorkflowState {
  currentStep: number;
  totalSteps: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  data: Record<string, any>;
  errors: string[];
}

// 评估结果类型
export interface EvaluationResult {
  id: string;
  testCase: string;
  expected: string;
  actual: string;
  score: number;
  passed: boolean;
  metrics: {
    accuracy: number;
    latency: number;
    tokenUsage: number;
  };
  timestamp: Date;
}

// 追踪事件类型
export interface TraceEvent {
  id: string;
  traceId: string;
  eventType: 'agent_start' | 'agent_end' | 'tool_call' | 'tool_result' | 'error' | 'plan_created' | 'subtasks_completed' | 'report_generated' | 'subtask_start' | 'subtask_complete' | 'task_recorder';
  timestamp: Date;
  data: Record<string, any>;
  duration?: number;
}

// 配置加载器类型
export interface ConfigLoader {
  loadAgentConfig(name: string): Promise<AgentConfig>;
  loadToolConfig(name: string): Promise<ToolConfig>;
  loadModelConfig(name: string): Promise<ModelConfig>;
}

// 工具配置类型
export interface ToolConfig {
  name: string;
  type: 'builtin' | 'custom' | 'mcp';
  enabled: boolean;
  parameters: Record<string, any>;
}

// 环境配置类型
export interface EnvConfig {
  name: string;
  type: 'docker' | 'local' | 'remote';
  config: Record<string, any>;
}

// 上下文管理器类型
export interface ContextManager {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 错误类型
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class ToolError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

// 导出错误代码
export { ERROR_CODES } from './ErrorCodes';
export type { ErrorCode } from './ErrorCodes';

export class ConfigError extends Error {
  constructor(
    message: string,
    public configPath: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}
