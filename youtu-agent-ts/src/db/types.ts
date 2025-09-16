/**
 * 数据库相关类型定义
 */

export interface DatabaseConfig {
  url: string;
  poolSize?: number;
  maxOverflow?: number;
  poolTimeout?: number;
  poolPrePing?: boolean;
}

export interface DatasetSample {
  id?: number;
  dataset: string;
  index?: number;
  source: string;
  sourceIndex?: number;
  question: string;
  answer?: string;
  topic?: string;
  level?: number;
  fileName?: string;
  meta?: Record<string, unknown>;
}

export interface EvaluationSample {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  
  // 基础信息
  dataset: string;
  datasetIndex?: number;
  source: string;
  rawQuestion: string;
  level?: number;
  augmentedQuestion?: string;
  correctAnswer?: string;
  fileName?: string;
  meta?: Record<string, unknown>;
  
  // 执行信息
  traceId?: string;
  traceUrl?: string;
  response?: string;
  timeCost?: number;
  trajectory?: string;
  trajectories?: string;
  
  // 评估信息
  extractedFinalAnswer?: string;
  judgedResponse?: string;
  reasoning?: string;
  correct?: boolean;
  confidence?: number;
  
  // 实验信息
  expId: string;
  stage: 'init' | 'rollout' | 'judged';
}

export interface ToolTracingModel {
  id?: number;
  traceId: string;
  spanId: string;
  name: string;
  input?: Record<string, unknown> | undefined;
  output?: Record<string, unknown> | undefined;
  mcpData?: Record<string, unknown> | undefined;
}

export interface GenerationTracingModel {
  id?: number;
  traceId: string;
  spanId: string;
  model: string;
  input?: Record<string, unknown> | undefined;
  output?: Record<string, unknown> | undefined;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined;
}

export interface ToolCacheModel {
  id?: number;
  function: string;
  args?: string;
  kwargs?: string;
  result?: Record<string, unknown>;
  cacheKey: string;
  timestamp: number;
  datetime: string;
  executionTime: number;
}

export interface DatabaseConnection {
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  execute(sql: string, params?: unknown[]): Promise<{ lastInsertRowid?: number; changes?: number }>;
  close(): Promise<void>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
