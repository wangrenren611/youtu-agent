/**
 * Workforce Agent Data Structures
 * 定义了workforce智能体使用的核心数据结构
 */

import { TaskRecorder } from '../../types';

/**
 * 子任务状态类型
 */
export type TaskStatus = 'not started' | 'in progress' | 'completed' | 'success' | 'failed' | 'partial success';

/**
 * 子任务类
 */
export class Subtask {
  taskId: number;
  taskName: string;
  taskDescription?: string;
  taskStatus: TaskStatus = 'not started';
  taskResult?: string;
  taskResultDetailed?: string;
  assignedAgent?: string;

  constructor(taskId: number, taskName: string, taskDescription?: string) {
    if (taskId < 0) {
      throw new Error('Task ID must be a non-negative integer');
    }
    
    if (!taskName || taskName.trim() === '') {
      throw new Error('Task name cannot be empty');
    }
    
    this.taskId = taskId;
    this.taskName = taskName.trim();
    if (taskDescription !== undefined && taskDescription !== null) {
      this.taskDescription = taskDescription.trim();
    }
  }

  /**
   * 获取带结果的格式化字符串
   */
  get formattedWithResult(): string {
    const infos = [
      `<task_id:${this.taskId}>${this.taskName}</task_id:${this.taskId}>`,
      `<task_status>${this.taskStatus}</task_status>`
    ];
    
    if (this.taskResult !== undefined && this.taskResult !== null) {
      infos.push(`<task_result>${this.taskResult}</task_result>`);
    }
    
    return infos.join('\n');
  }
}

/**
 * 执行器智能体信息
 */
export interface ExecutorAgentInfo {
  name: string;
  description: string;
  strengths?: string[];
  weaknesses?: string[];
}

/**
 * 工作空间任务记录器
 * 继承自TaskRecorder，添加了workforce特定的功能
 */
export class WorkspaceTaskRecorder implements TaskRecorder {
  id: string;
  input: string;
  output?: string;
  messages: any[] = [];
  toolCalls: any[] = [];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
  error?: string;
  
  // ReAct模式相关字段
  reasoning: string[] = [];
  actions: any[] = [];
  observations: string[] = [];
  turns: number = 0;
  maxTurns: number = 10;

  // Workforce特定字段
  overallTask: string = '';
  executorAgentKwargsList: ExecutorAgentInfo[] = [];
  taskPlan: Subtask[] = [];

  constructor(overallTask: string, executorAgentKwargsList: ExecutorAgentInfo[], traceId?: string) {
    if (!overallTask || overallTask.trim() === '') {
      throw new Error('Overall task cannot be empty');
    }
    
    this.id = traceId || this.generateTraceId();
    this.input = overallTask.trim();
    this.overallTask = this.input;
    this.executorAgentKwargsList = executorAgentKwargsList || [];
    this.startTime = new Date();
  }

  /**
   * 生成追踪ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取执行器智能体信息字符串
   */
  get executorAgentsInfo(): string {
    return this.executorAgentKwargsList
      .map(agent => `- ${agent.name}: ${agent.description}`)
      .join('\n');
  }

  /**
   * 获取执行器智能体名称列表
   */
  get executorAgentsNames(): string {
    return JSON.stringify(this.executorAgentKwargsList.map(agent => agent.name));
  }

  /**
   * 获取带任务结果的格式化任务计划列表
   */
  get formattedTaskPlanListWithTaskResults(): string[] {
    return this.taskPlan.map(task => task.formattedWithResult);
  }

  /**
   * 获取格式化的任务计划
   */
  get formattedTaskPlan(): string {
    return this.taskPlan
      .map(task => `${task.taskId}. ${task.taskName} - Status: ${task.taskStatus}`)
      .join('\n');
  }

  /**
   * 初始化任务计划
   */
  planInit(planList: Subtask[]): void {
    if (!Array.isArray(planList)) {
      throw new Error('Plan list must be an array');
    }
    
    this.taskPlan = planList;
  }

  /**
   * 更新任务计划
   */
  planUpdate(task: Subtask, updatedPlan: string[]): void {
    if (!task) {
      throw new Error('Task cannot be null or undefined');
    }
    
    if (!Array.isArray(updatedPlan)) {
      throw new Error('Updated plan must be an array');
    }
    
    const finishedTasks = this.taskPlan.slice(0, task.taskId);
    const newTasks = updatedPlan.map((taskName, i) => 
      new Subtask(task.taskId + i + 1, taskName)
    );
    this.taskPlan = [...finishedTasks, ...newTasks];
  }

  /**
   * 检查是否有未完成的任务
   */
  get hasUncompletedTasks(): boolean {
    if (!this.taskPlan || this.taskPlan.length === 0) {
      return false;
    }
    return this.taskPlan.some(task => task.taskStatus === 'not started');
  }

  /**
   * 获取下一个任务
   */
  getNextTask(): Subtask {
    if (!this.taskPlan || this.taskPlan.length === 0) {
      throw new Error('No task plan available.');
    }
    
    const nextTask = this.taskPlan.find(task => task.taskStatus === 'not started');
    if (!nextTask) {
      throw new Error('No uncompleted tasks.');
    }
    
    return nextTask;
  }

  /**
   * 设置最终输出
   */
  setFinalOutput(output: string): void {
    this.output = output ? output.trim() : '';
    this.status = 'completed';
    this.endTime = new Date();
  }

  /**
   * 添加运行结果
   */
  addRunResult(runResult: any, agentType: string): void {
    // 这里可以根据需要实现运行结果的记录逻辑
    // 暂时简化实现
    this.messages.push({
      role: 'assistant',
      content: runResult,
      agentType,
      timestamp: new Date()
    });
  }
}