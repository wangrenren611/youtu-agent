/**
 * 编排智能体
 * 负责多智能体协作编排，任务分解和结果聚合
 */

import { BaseAgent } from '../core/agent/BaseAgent';
import { AgentConfig, TaskRecorder, Message } from '../types';
import { AgentFactory } from './index';
import { TraceManager } from '../tracing/TraceManager';

export interface Subtask {
  id: string;
  name: string;
  description: string;
  assignedAgent: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface OrchestraPlan {
  id: string;
  overallTask: string;
  subtasks: Subtask[];
  executionOrder: string[];
  estimatedDuration: number;
  createdAt: Date;
}

export interface WorkerAgent {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  config: AgentConfig;
  instance?: any;
}

export class OrchestraAgent extends BaseAgent {
  private readonly traceManager: TraceManager;
  private readonly workerAgents: Map<string, WorkerAgent> = new Map();
  private plannerAgent: any;
  private reporterAgent: any;

  constructor(config: AgentConfig) {
    super(config);
    this.traceManager = new TraceManager();
    
    // 初始化规划智能体
    this.plannerAgent = null; // 将在onInitialize中初始化
    
    // 初始化报告智能体
    this.reporterAgent = null; // 将在onInitialize中初始化
  }

  /**
   * 初始化编排智能体
   */
  protected override async onInitialize(): Promise<void> {
    try {
      this.logger.info('正在初始化编排智能体...');

      // 初始化规划智能体
      if (this.config.plannerModel) {
        this.plannerAgent = await AgentFactory.createAgent({
          type: 'simple',
          name: `${this.config.name}_planner`,
          model: this.config.plannerModel,
          instructions: this.getPlannerInstructions(),
          tools: ['web_search', 'file_read']
        });
      }

      // 初始化报告智能体
      if (this.config.reporterModel) {
        this.reporterAgent = await AgentFactory.createAgent({
          type: 'simple',
          name: `${this.config.name}_reporter`,
          model: this.config.reporterModel,
          instructions: this.getReporterInstructions(),
          tools: ['file_write']
        });
      }

      // 初始化工作智能体
      await this.initializeWorkerAgents();

      this.logger.info('编排智能体初始化完成');
    } catch (error) {
      this.logger.error('编排智能体初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行编排任务
   * @param input 输入内容
   * @param recorder 任务记录器
   * @returns 执行结果
   */
  protected async execute(input: string, recorder: TaskRecorder): Promise<string> {
    const traceId = this.traceManager.startTrace('orchestra_execution', {
      input,
      agentName: this.config.name
    });

    try {
      this.logger.info('开始执行编排任务', { input });
      this.traceManager.recordAgentStart(traceId, this.config.name, input);

      // 1. 任务规划
      const plan = await this.plan(input, recorder);
      this.traceManager.recordEvent(traceId, 'plan_created', { plan });

      // 2. 执行子任务
      const results = await this.executeSubtasks(plan, traceId);
      this.traceManager.recordEvent(traceId, 'subtasks_completed', { results });

      // 3. 生成最终报告
      const finalResult = await this.report(plan, results, traceId);
      this.traceManager.recordEvent(traceId, 'report_generated', { finalResult });

      this.traceManager.recordAgentEnd(traceId, this.config.name, finalResult, 
        Date.now() - recorder.startTime.getTime());
      this.traceManager.endTrace(traceId, 'completed');

      this.logger.info('编排任务执行完成');
      return finalResult;

    } catch (error) {
      this.logger.error('编排任务执行失败:', error);
      this.traceManager.recordError(traceId, error as Error);
      this.traceManager.endTrace(traceId, 'failed');
      throw error;
    }
  }

  /**
   * 流式执行编排任务
   * @param input 输入内容
   * @param recorder 任务记录器
   * @returns 异步生成器
   */
  protected async* executeStream(input: string, recorder: TaskRecorder): AsyncGenerator<Message, void, unknown> {
    const traceId = this.traceManager.startTrace('orchestra_stream', {
      input,
      agentName: this.config.name
    });

    try {
      // 发送开始消息
      yield {
        role: 'assistant',
        content: '开始分析任务并制定执行计划...',
        timestamp: new Date()
      };

      // 1. 任务规划
      const plan = await this.plan(input, recorder);
      yield {
        role: 'assistant',
        content: `任务规划完成，共分解为 ${plan.subtasks.length} 个子任务`,
        timestamp: new Date()
      };

      // 2. 执行子任务
      for (const subtaskId of plan.executionOrder) {
        const subtask = plan.subtasks.find(s => s.id === subtaskId);
        if (!subtask) continue;

        yield {
          role: 'assistant',
          content: `正在执行子任务: ${subtask.name}`,
          timestamp: new Date()
        };

        const result = await this.executeSubtask(subtask, traceId);
        
        yield {
          role: 'assistant',
          content: `子任务完成: ${subtask.name}\n结果: ${result.substring(0, 200)}...`,
          timestamp: new Date()
        };
      }

      // 3. 生成最终报告
      yield {
        role: 'assistant',
        content: '正在生成最终报告...',
        timestamp: new Date()
      };

      const finalResult = await this.report(plan, new Map(), traceId);
      
      yield {
        role: 'assistant',
        content: finalResult,
        timestamp: new Date()
      };

      this.traceManager.endTrace(traceId, 'completed');

    } catch (error) {
      this.logger.error('流式编排任务执行失败:', error);
      this.traceManager.recordError(traceId, error as Error);
      this.traceManager.endTrace(traceId, 'failed');
      
      yield {
        role: 'assistant',
        content: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * 任务规划
   * @param input 输入内容
   * @param _recorder 任务记录器
   * @returns 执行计划
   */
  private async plan(input: string, _recorder: TaskRecorder): Promise<OrchestraPlan> {
    if (!this.plannerAgent) {
      throw new Error('规划智能体未初始化');
    }

    const planningPrompt = this.buildPlanningPrompt(input);
    const planningResult = await this.plannerAgent.run(planningPrompt);
    
    // 解析规划结果
    const plan = this.parsePlanningResult(planningResult.output, input);
    
    this.logger.info(`任务规划完成，共 ${plan.subtasks.length} 个子任务`);
    return plan;
  }

  /**
   * 执行子任务
   * @param plan 执行计划
   * @param traceId 追踪ID
   * @returns 执行结果
   */
  private async executeSubtasks(
    plan: OrchestraPlan,
    traceId: string
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const subtaskId of plan.executionOrder) {
      const subtask = plan.subtasks.find(s => s.id === subtaskId);
      if (!subtask) continue;

      // 检查依赖
      const dependenciesMet = subtask.dependencies.every(depId => 
        results.has(depId) && plan.subtasks.find(s => s.id === depId)?.status === 'completed'
      );

      if (!dependenciesMet) {
        this.logger.warn(`子任务 ${subtask.name} 的依赖未满足，跳过执行`);
        continue;
      }

        const result = await this.executeSubtask(subtask, traceId);
      results.set(subtaskId, result);
    }

    return results;
  }

  /**
   * 执行单个子任务
   * @param subtask 子任务
   * @param traceId 追踪ID
   * @returns 执行结果
   */
  private async executeSubtask(
    subtask: Subtask,
    traceId: string
  ): Promise<string> {
    const worker = this.workerAgents.get(subtask.assignedAgent);
    if (!worker) {
      throw new Error(`工作智能体不存在: ${subtask.assignedAgent}`);
    }

    if (!worker.instance) {
      worker.instance = await AgentFactory.createAgent(worker.config);
    }

    subtask.status = 'in_progress';
    subtask.startTime = new Date();

    try {
      this.logger.info(`执行子任务: ${subtask.name} (${subtask.assignedAgent})`);
      this.traceManager.recordEvent(traceId, 'subtask_start', { subtask });

      const result = await worker.instance.run(subtask.description);
      
      subtask.status = 'completed';
      subtask.endTime = new Date();
      subtask.result = result.output;

      this.traceManager.recordEvent(traceId, 'subtask_complete', { 
        subtask,
        result: result.output 
      });

      return result.output;

    } catch (error) {
      subtask.status = 'failed';
      subtask.endTime = new Date();
      subtask.error = error instanceof Error ? error.message : '未知错误';

      this.logger.error(`子任务执行失败: ${subtask.name}`, error);
      this.traceManager.recordError(traceId, error as Error, { subtask });

      throw error;
    }
  }

  /**
   * 生成最终报告
   * @param plan 执行计划
   * @param results 执行结果
   * @param traceId 追踪ID
   * @returns 最终报告
   */
  private async report(
    plan: OrchestraPlan,
    results: Map<string, string>,
    traceId: string
  ): Promise<string> {
    if (!this.reporterAgent) {
      // 如果没有报告智能体，直接聚合结果
      return this.aggregateResults(plan, results);
    }

    const reportPrompt = this.buildReportPrompt(plan, results);
    const reportResult = await this.reporterAgent.run(reportPrompt);
    
    this.traceManager.recordEvent(traceId, 'report_generated', { 
      report: reportResult.output 
    });

    return reportResult.output;
  }

  /**
   * 聚合结果
   * @param plan 执行计划
   * @param _results 执行结果
   * @returns 聚合后的结果
   */
  private aggregateResults(plan: OrchestraPlan, _results: Map<string, string>): string {
    let report = `# 任务执行报告\n\n`;
    report += `**原始任务**: ${plan.overallTask}\n\n`;
    report += `**执行时间**: ${new Date().toLocaleString()}\n\n`;
    
    report += `## 子任务执行结果\n\n`;
    
    for (const subtask of plan.subtasks) {
      report += `### ${subtask.name}\n`;
      report += `- **状态**: ${subtask.status}\n`;
      report += `- **执行智能体**: ${subtask.assignedAgent}\n`;
      
      if (subtask.result) {
        report += `- **结果**: ${subtask.result}\n`;
      }
      
      if (subtask.error) {
        report += `- **错误**: ${subtask.error}\n`;
      }
      
      report += `\n`;
    }
    
    return report;
  }

  /**
   * 初始化工作智能体
   */
  private async initializeWorkerAgents(): Promise<void> {
    if (!this.config.workers || !this.config.workersInfo) {
      return;
    }

    for (const workerInfo of this.config.workersInfo) {
      const workerConfig = this.config.workers[workerInfo.name];
      if (!workerConfig) {
        this.logger.warn(`工作智能体配置不存在: ${workerInfo.name}`);
        continue;
      }

      const worker: WorkerAgent = {
        name: workerInfo.name,
        description: workerInfo.desc,
        strengths: workerInfo.strengths,
        weaknesses: workerInfo.weaknesses,
        config: workerConfig
      };

      this.workerAgents.set(workerInfo.name, worker);
      this.logger.info(`工作智能体已注册: ${workerInfo.name}`);
    }
  }

  /**
   * 构建规划提示
   * @param input 输入内容
   * @returns 规划提示
   */
  private buildPlanningPrompt(input: string): string {
    const workers = Array.from(this.workerAgents.values());
    const workerDescriptions = workers.map(w => 
      `- ${w.name}: ${w.description} (优势: ${w.strengths.join(', ')})`
    ).join('\n');

    return `请分析以下任务并将其分解为多个子任务：

**任务**: ${input}

**可用工作智能体**:
${workerDescriptions}

请按照以下JSON格式返回任务分解结果：
{
  "subtasks": [
    {
      "id": "task_1",
      "name": "子任务名称",
      "description": "详细描述",
      "assignedAgent": "智能体名称",
      "dependencies": []
    }
  ],
  "executionOrder": ["task_1", "task_2", ...]
}

要求：
1. 每个子任务应该分配给最适合的智能体
2. 考虑任务之间的依赖关系
3. 确保任务分解的完整性和逻辑性
4. 子任务数量控制在3-8个之间`;
  }

  /**
   * 构建报告提示
   * @param plan 执行计划
   * @param results 执行结果
   * @returns 报告提示
   */
  private buildReportPrompt(plan: OrchestraPlan, results: Map<string, string>): string {
    const subtaskResults = plan.subtasks.map(subtask => ({
      name: subtask.name,
      status: subtask.status,
      result: results.get(subtask.id) || subtask.result || '',
      error: subtask.error
    }));

    return `请基于以下信息生成最终的任务执行报告：

**原始任务**: ${plan.overallTask}

**子任务执行结果**:
${JSON.stringify(subtaskResults, null, 2)}

请生成一个结构清晰、内容完整的报告，包括：
1. 任务概述
2. 执行过程总结
3. 主要成果
4. 遇到的问题和解决方案
5. 结论和建议`;
  }

  /**
   * 解析规划结果
   * @param planningResult 规划结果
   * @param originalTask 原始任务
   * @returns 执行计划
   */
  private parsePlanningResult(planningResult: string, originalTask: string): OrchestraPlan {
    try {
      // 尝试从结果中提取JSON
      const jsonMatch = planningResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从规划结果中提取JSON');
      }

      const planData = JSON.parse(jsonMatch[0]);
      
      const subtasks: Subtask[] = planData.subtasks.map((task: any, index: number) => ({
        id: task.id || `task_${index + 1}`,
        name: task.name || `子任务${index + 1}`,
        description: task.description || '',
        assignedAgent: task.assignedAgent || 'default',
        dependencies: task.dependencies || [],
        status: 'pending' as const
      }));

      return {
        id: `plan_${Date.now()}`,
        overallTask: originalTask,
        subtasks,
        executionOrder: planData.executionOrder || subtasks.map(s => s.id),
        estimatedDuration: subtasks.length * 30000, // 估算每个任务30秒
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('解析规划结果失败:', error);
      
      // 创建默认计划
      return {
        id: `plan_${Date.now()}`,
        overallTask: originalTask,
        subtasks: [{
          id: 'task_1',
          name: '默认任务',
          description: originalTask,
          assignedAgent: 'default',
          dependencies: [],
          status: 'pending'
        }],
        executionOrder: ['task_1'],
        estimatedDuration: 30000,
        createdAt: new Date()
      };
    }
  }

  /**
   * 获取规划智能体指令
   * @returns 指令文本
   */
  private getPlannerInstructions(): string {
    return `你是一个任务规划专家，擅长将复杂任务分解为多个可执行的子任务。
你的职责是：
1. 分析用户输入的任务
2. 识别任务的关键组成部分
3. 将任务分解为逻辑清晰的子任务
4. 为每个子任务分配合适的执行智能体
5. 确定任务执行的依赖关系和顺序

请始终以结构化的方式思考，确保任务分解的完整性和可执行性。`;
  }

  /**
   * 获取报告智能体指令
   * @returns 指令文本
   */
  private getReporterInstructions(): string {
    return `你是一个专业的报告生成专家，擅长将任务执行结果整理成清晰、完整的报告。
你的职责是：
1. 分析任务执行过程和结果
2. 识别关键成果和问题
3. 生成结构化的执行报告
4. 提供有价值的总结和建议

请确保报告内容准确、完整，格式清晰易读。`;
  }

  /**
   * 清理资源
   */
  protected override async onCleanup(): Promise<void> {
    this.logger.info('正在清理编排智能体资源...');
    
    // 清理工作智能体
    for (const worker of Array.from(this.workerAgents.values())) {
      if (worker.instance) {
        await worker.instance.cleanup();
      }
    }
    
    // 清理规划智能体
    if (this.plannerAgent) {
      await this.plannerAgent.cleanup();
    }
    
    // 清理报告智能体
    if (this.reporterAgent) {
      await this.reporterAgent.cleanup();
    }
  }

  /**
   * 获取智能体信息
   * @returns 智能体信息
   */
  getInfo(): any {
    return {
      type: 'orchestra',
      name: this.config.name,
      workerCount: this.workerAgents.size,
      workers: Array.from(this.workerAgents.keys()),
      hasPlanner: !!this.plannerAgent,
      hasReporter: !!this.reporterAgent,
      isReady: this.isReady()
    };
  }
}
