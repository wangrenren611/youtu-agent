/**
 * 追踪管理器
 * 负责智能体执行过程的追踪、监控和记录
 */

import { EventEmitter } from 'events';
import { TraceEvent, TaskRecorder } from '../types';
import { Logger } from '../utils/Logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TraceSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed';
  events: TraceEvent[];
  metadata: Record<string, any>;
}

export interface TraceFilter {
  traceId?: string;
  eventType?: string;
  startTime?: Date;
  endTime?: Date;
  agentName?: string;
  status?: string;
}

export interface TraceStats {
  totalTraces: number;
  activeTraces: number;
  completedTraces: number;
  failedTraces: number;
  averageDuration: number;
  totalEvents: number;
  eventTypeStats: Record<string, number>;
}

export class TraceManager extends EventEmitter {
  private readonly logger: Logger;
  private readonly tracesDir: string;
  private sessions: Map<string, TraceSession> = new Map();
  private events: Map<string, TraceEvent[]> = new Map();

  constructor(tracesDir: string = './traces') {
    super();
    this.logger = new Logger('TraceManager');
    this.tracesDir = tracesDir;
  }

  /**
   * 开始新的追踪会话
   * @param name 会话名称
   * @param metadata 元数据
   * @returns 追踪ID
   */
  startTrace(name: string, metadata: Record<string, any> = {}): string {
    const traceId = uuidv4();
    const session: TraceSession = {
      id: traceId,
      name,
      startTime: new Date(),
      status: 'active',
      events: [],
      metadata
    };

    this.sessions.set(traceId, session);
    this.events.set(traceId, []);

    this.logger.info(`开始追踪会话: ${name} (${traceId})`);
    this.emit('trace_start', session);

    return traceId;
  }

  /**
   * 结束追踪会话
   * @param traceId 追踪ID
   * @param status 结束状态
   */
  endTrace(traceId: string, status: 'completed' | 'failed' = 'completed'): void {
    const session = this.sessions.get(traceId);
    if (!session) {
      this.logger.warn(`追踪会话不存在: ${traceId}`);
      return;
    }

    session.endTime = new Date();
    session.status = status;

    this.logger.info(`结束追踪会话: ${session.name} (${traceId}), 状态: ${status}`);
    this.emit('trace_end', session);

    // 异步保存追踪数据
    this.saveTrace(traceId).catch(error => {
      this.logger.error(`保存追踪数据失败: ${traceId}`, error);
    });
  }

  /**
   * 记录追踪事件
   * @param traceId 追踪ID
   * @param eventType 事件类型
   * @param data 事件数据
   * @param duration 持续时间（毫秒）
   */
  recordEvent(
    traceId: string,
    eventType: 'agent_start' | 'agent_end' | 'tool_call' | 'tool_result' | 'error' | 'plan_created' | 'subtasks_completed' | 'report_generated' | 'subtask_start' | 'subtask_complete' | 'task_recorder',
    data: Record<string, any> = {},
    duration?: number
  ): void {
    const session = this.sessions.get(traceId);
    if (!session) {
      this.logger.warn(`追踪会话不存在: ${traceId}`);
      return;
    }

    const event: TraceEvent = {
      id: uuidv4(),
      traceId,
      eventType,
      timestamp: new Date(),
      data,
      duration: duration || 0
    };

    session.events.push(event);
    this.events.get(traceId)?.push(event);

    this.logger.debug(`记录事件: ${eventType} (${traceId})`);
    this.emit('event_recorded', event);
  }

  /**
   * 记录智能体开始事件
   * @param traceId 追踪ID
   * @param agentName 智能体名称
   * @param input 输入内容
   */
  recordAgentStart(traceId: string, agentName: string, input: string): void {
    this.recordEvent(traceId, 'agent_start', {
      agentName,
      input: input.substring(0, 200) // 限制输入长度
    });
  }

  /**
   * 记录智能体结束事件
   * @param traceId 追踪ID
   * @param agentName 智能体名称
   * @param output 输出内容
   * @param duration 执行时间
   */
  recordAgentEnd(traceId: string, agentName: string, output: string, duration: number): void {
    this.recordEvent(traceId, 'agent_end', {
      agentName,
      output: output.substring(0, 200), // 限制输出长度
      duration
    }, duration);
  }

  /**
   * 记录工具调用事件
   * @param traceId 追踪ID
   * @param toolName 工具名称
   * @param args 工具参数
   * @param result 工具结果
   * @param duration 执行时间
   */
  recordToolCall(
    traceId: string,
    toolName: string,
    args: any,
    result: string,
    duration: number
  ): void {
    this.recordEvent(traceId, 'tool_call', {
      toolName,
      args: this.sanitizeData(args),
      result: result.substring(0, 200), // 限制结果长度
      duration
    }, duration);
  }

  /**
   * 记录错误事件
   * @param traceId 追踪ID
   * @param error 错误信息
   * @param context 错误上下文
   */
  recordError(traceId: string, error: Error, context: Record<string, any> = {}): void {
    this.recordEvent(traceId, 'error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    });
  }

  /**
   * 记录任务记录器
   * @param traceId 追踪ID
   * @param recorder 任务记录器
   */
  recordTaskRecorder(traceId: string, recorder: TaskRecorder): void {
    this.recordEvent(traceId, 'task_recorder', {
      taskId: recorder.id,
      input: recorder.input,
      output: recorder.output,
      status: recorder.status,
      messageCount: recorder.messages.length,
      toolCallCount: recorder.toolCalls.length,
      startTime: recorder.startTime,
      endTime: recorder.endTime,
      duration: recorder.endTime ? 
        recorder.endTime.getTime() - recorder.startTime.getTime() : undefined
    });
  }

  /**
   * 获取追踪会话
   * @param traceId 追踪ID
   * @returns 追踪会话
   */
  getTrace(traceId: string): TraceSession | undefined {
    return this.sessions.get(traceId);
  }

  /**
   * 获取追踪事件
   * @param traceId 追踪ID
   * @returns 事件列表
   */
  getTraceEvents(traceId: string): TraceEvent[] {
    return this.events.get(traceId) || [];
  }

  /**
   * 查询追踪数据
   * @param filter 查询过滤器
   * @returns 追踪会话列表
   */
  queryTraces(filter: TraceFilter = {}): TraceSession[] {
    let results = Array.from(this.sessions.values());

    if (filter.traceId) {
      results = results.filter(session => session.id === filter.traceId);
    }

    if (filter.agentName) {
      results = results.filter(session => 
        session.events.some(event => 
          event.data['agentName'] === filter.agentName
        )
      );
    }

    if (filter.status) {
      results = results.filter(session => session.status === filter.status);
    }

    if (filter.startTime) {
      results = results.filter(session => session.startTime >= filter.startTime!);
    }

    if (filter.endTime) {
      results = results.filter(session => 
        !session.endTime || session.endTime <= filter.endTime!
      );
    }

    if (filter.eventType) {
      results = results.filter(session =>
        session.events.some(event => event.eventType === filter.eventType)
      );
    }

    return results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * 获取追踪统计信息
   * @returns 统计信息
   */
  getStats(): TraceStats {
    const sessions = Array.from(this.sessions.values());
    const totalTraces = sessions.length;
    const activeTraces = sessions.filter(s => s.status === 'active').length;
    const completedTraces = sessions.filter(s => s.status === 'completed').length;
    const failedTraces = sessions.filter(s => s.status === 'failed').length;

    const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);
    
    const eventTypeStats: Record<string, number> = {};
    sessions.forEach(session => {
      session.events.forEach(event => {
        eventTypeStats[event.eventType] = (eventTypeStats[event.eventType] || 0) + 1;
      });
    });

    const completedSessions = sessions.filter(s => s.endTime);
    const averageDuration = completedSessions.length > 0 ?
      completedSessions.reduce((sum, s) => 
        sum + (s.endTime!.getTime() - s.startTime.getTime()), 0
      ) / completedSessions.length : 0;

    return {
      totalTraces,
      activeTraces,
      completedTraces,
      failedTraces,
      averageDuration,
      totalEvents,
      eventTypeStats
    };
  }

  /**
   * 保存追踪数据
   * @param traceId 追踪ID
   */
  private async saveTrace(traceId: string): Promise<void> {
    try {
      const session = this.sessions.get(traceId);
      if (!session) {
        return;
      }

      await fs.mkdir(this.tracesDir, { recursive: true });
      
      const filename = `trace_${traceId}_${Date.now()}.json`;
      const filepath = path.join(this.tracesDir, filename);
      
      const data = {
        session,
        events: this.events.get(traceId) || [],
        savedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
      this.logger.debug(`追踪数据已保存: ${filepath}`);
      
    } catch (error) {
      this.logger.error(`保存追踪数据失败: ${traceId}`, error);
    }
  }

  /**
   * 清理敏感数据
   * @param data 原始数据
   * @returns 清理后的数据
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // 过滤敏感字段
      if (['password', 'token', 'key', 'secret'].some(sensitive => 
        key.toLowerCase().includes(sensitive)
      )) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  /**
   * 清理旧的追踪数据
   * @param maxAge 最大保存时间（毫秒）
   */
  async cleanupOldTraces(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - maxAge);
      const oldSessions = Array.from(this.sessions.values())
        .filter(session => session.startTime < cutoffTime);

      for (const session of oldSessions) {
        this.sessions.delete(session.id);
        this.events.delete(session.id);
      }

      this.logger.info(`清理了 ${oldSessions.length} 个旧追踪会话`);
      
    } catch (error) {
      this.logger.error('清理旧追踪数据失败:', error);
    }
  }

  /**
   * 导出追踪数据
   * @param traceId 追踪ID
   * @param format 导出格式
   * @returns 导出的数据
   */
  async exportTrace(traceId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const session = this.sessions.get(traceId);
    if (!session) {
      throw new Error(`追踪会话不存在: ${traceId}`);
    }

    const events = this.events.get(traceId) || [];

    if (format === 'json') {
      return JSON.stringify({
        session,
        events,
        exportedAt: new Date().toISOString()
      }, null, 2);
    } else if (format === 'csv') {
      let csv = 'timestamp,eventType,data\n';
      events.forEach(event => {
        const dataStr = JSON.stringify(event.data).replace(/"/g, '""');
        csv += `${event.timestamp.toISOString()},"${event.eventType}","${dataStr}"\n`;
      });
      return csv;
    }

    throw new Error(`不支持的导出格式: ${format}`);
  }
}
