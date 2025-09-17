/**
 * Workforce Agent
 * 主要的workforce智能体，协调所有子智能体
 */

import { BaseAgent } from '../../core/agent/BaseAgent';
import { AgentConfig, TaskRecorder } from '../../types';
import { WorkspaceTaskRecorder } from './data';
import { PlannerAgent } from './PlannerAgent';
import { AssignerAgent } from './AssignerAgent';
import { ExecutorAgent } from './ExecutorAgent';
import { AnswererAgent } from './AnswererAgent';

export class WorkforceAgent extends BaseAgent {
  private plannerAgent!: PlannerAgent;
  private assignerAgent!: AssignerAgent;
  private answererAgent!: AnswererAgent;
  private executorAgentGroup: Map<string, ExecutorAgent> = new Map();

  constructor(config: AgentConfig, toolManager?: any, configManager?: any) {
    super(config, toolManager, configManager);
  }

  /**
   * 初始化智能体
   */
  protected async onInitialize(): Promise<void> {
    this.logger.info('初始化workforce智能体...');
    
    // 初始化子智能体
    this.plannerAgent = new PlannerAgent(this.config);
    this.assignerAgent = new AssignerAgent(this.config);
    this.answererAgent = new AnswererAgent(this.config);
    
    // 初始化子智能体的LLM
    await this.plannerAgent.initialize();
    await this.assignerAgent.initialize();
    await this.answererAgent.initialize();
    
    // 初始化执行器智能体组
    if (this.config.workforceExecutorAgents) {
      for (const [name, executorConfig] of Object.entries(this.config.workforceExecutorAgents)) {
        const executorAgent = new ExecutorAgent(executorConfig, this.config);
        this.executorAgentGroup.set(name, executorAgent);
        this.logger.info(`已初始化执行器智能体: ${name}`);
      }
    }
    
    this.logger.info('Workforce智能体初始化完成');
  }

  /**
   * 清理资源
   */
  protected async onCleanup(): Promise<void> {
    this.logger.info('清理workforce智能体资源...');
    // 清理执行器智能体组
    this.executorAgentGroup.clear();
  }

  /**
   * 运行workforce智能体
   */
  override async run(input: string, traceId?: string, _sessionId?: string): Promise<TaskRecorder> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recorder = new WorkspaceTaskRecorder(
      input,
      this.config.workforceExecutorInfos || [],
      traceId
    );

    try {
      this.logger.info(`开始执行workforce任务: ${input}`);
      this.emit('task_start', recorder);

      // 1. 生成计划
      this.logger.info('生成任务计划...');
      await this.plannerAgent.planTask(recorder);
      this.logger.info(`计划: ${recorder.formattedTaskPlan}`);

      // 2. 执行任务循环
      while (recorder.hasUncompletedTasks) {
        // 分配任务
        const nextTask = await this.assignerAgent.assignTask(recorder);
        this.logger.info(`分配任务: ${nextTask.taskId} 分配给 ${nextTask.assignedAgent}`);

        // 执行任务
        this.logger.info(`执行任务: ${nextTask.taskId}`);
        const executorAgent = this.executorAgentGroup.get(nextTask.assignedAgent!);
        if (!executorAgent) {
          throw new Error(`执行器智能体不存在: ${nextTask.assignedAgent}`);
        }

        await executorAgent.executeTask(recorder, nextTask);
        this.logger.info(`任务 ${nextTask.taskId} 结果: ${nextTask.taskResult}`);

        // 检查任务
        await this.plannerAgent.planCheck(recorder, nextTask);
        this.logger.info(`任务 ${nextTask.taskId} 检查完成: ${nextTask.taskStatus}`);

        // 更新计划
        if (!recorder.hasUncompletedTasks) {
          break; // 提前停止
        }

        const planUpdateChoice = await this.plannerAgent.planUpdate(recorder, nextTask);
        this.logger.info(`计划更新选择: ${planUpdateChoice}`);
        
        if (planUpdateChoice === 'stop') {
          this.logger.info('规划器确定整体任务已完成，停止执行');
          break;
        } else if (planUpdateChoice === 'update') {
          this.logger.info(`任务计划已更新: ${recorder.formattedTaskPlan}`);
        }
      }

      // 3. 提取最终答案
      const finalAnswer = await this.answererAgent.extractFinalAnswer(recorder);
      this.logger.info(`提取的最终答案: ${finalAnswer}`);
      recorder.setFinalOutput(finalAnswer);

      this.logger.info('Workforce任务执行完成');
      this.emit('task_completed', recorder);
      
      return recorder;
    } catch (error) {
      recorder.status = 'failed';
      recorder.error = error instanceof Error ? error.message : '未知错误';
      recorder.endTime = new Date();

      this.logger.error('Workforce任务执行失败:', error);
      this.emit('task_failed', recorder);
      
      throw error;
    }
  }

  /**
   * 调用LLM - 继承自BaseAgent，但workforce智能体不直接使用
   */
  protected async callLLM(_prompt: string): Promise<string> {
    // Workforce智能体不直接调用LLM，而是通过子智能体调用
    throw new Error('WorkforceAgent does not directly call LLM');
  }

  /**
   * 获取智能体信息
   */
  override getInfo(): Record<string, unknown> {
    return {
      type: this.config.type,
      name: this.config.name,
      isReady: this.isReady(),
      executorAgents: Array.from(this.executorAgentGroup.keys()),
      executorAgentsCount: this.executorAgentGroup.size
    };
  }
}
