/**
 * Planner Agent
 * 负责任务分解和规划
 */

import { AgentConfig } from '../../types';
import { Logger } from '../../utils/Logger';
import { Subtask, WorkspaceTaskRecorder } from './data';
import { WORKFORCE_PROMPTS, formatPrompt } from './prompts';
import { SimpleAgent } from '../SimpleAgent';

export class PlannerAgent {
  private readonly logger: Logger;
  private readonly llm: SimpleAgent;

  constructor(config: AgentConfig) {
    this.logger = new Logger('PlannerAgent');
    
    // 创建LLM智能体用于规划
    this.llm = new SimpleAgent({
      type: 'simple',
      name: 'planner_llm',
      model: config.workforcePlannerModel || config.model,
      tools: [], // PlannerAgent不需要工具，只需要LLM推理
      instructions: 'You are a task planning specialist.'
    });
  }

  /**
   * 初始化PlannerAgent
   */
  async initialize(): Promise<void> {
    await this.llm.initialize();
  }

  /**
   * 规划任务
   */
  async planTask(recorder: WorkspaceTaskRecorder): Promise<void> {
    this.logger.info('开始规划任务...');
    
    const planPrompt = formatPrompt(WORKFORCE_PROMPTS.planner.TASK_PLAN_PROMPT, {
      overall_task: recorder.overallTask,
      executor_agents_info: recorder.executorAgentsInfo
    });

    // 直接调用LLM，不使用ReAct循环
    const planResult = await this.llm.callLLM(planPrompt);
    recorder.addRunResult(planResult, 'planner');

    // 解析任务
    const tasks = this.parseTasks(planResult);
    recorder.planInit(tasks);
    
    this.logger.info(`任务规划完成，生成了 ${tasks.length} 个子任务`);
  }

  /**
   * 更新任务计划
   */
  async planUpdate(recorder: WorkspaceTaskRecorder, task: Subtask): Promise<string> {
    this.logger.info(`开始更新任务计划，基于任务 ${task.taskId} 的结果`);
    
    const taskPlanList = recorder.formattedTaskPlanListWithTaskResults;
    const lastTaskId = task.taskId;
    const previousTaskPlan = taskPlanList.slice(0, lastTaskId + 1).join('\n');
    const unfinishedTaskPlan = taskPlanList.slice(lastTaskId + 1).join('\n');

    const updatePrompt = formatPrompt(WORKFORCE_PROMPTS.planner.TASK_UPDATE_PLAN_PROMPT, {
      overall_task: recorder.overallTask,
      previous_task_plan: previousTaskPlan,
      unfinished_task_plan: unfinishedTaskPlan
    });

    const updateResult = await this.llm.callLLM(updatePrompt);
    recorder.addRunResult(updateResult, 'planner');
    
    const { choice, updatedPlan } = this.parseUpdateResponse(updateResult);
    
    if (choice === 'update' && updatedPlan) {
      recorder.planUpdate(task, updatedPlan);
      this.logger.info('任务计划已更新');
    }
    
    return choice;
  }

  /**
   * 检查任务完成情况
   */
  async planCheck(recorder: WorkspaceTaskRecorder, task: Subtask): Promise<void> {
    this.logger.info(`检查任务 ${task.taskId} 的完成情况`);
    
    const checkPrompt = formatPrompt(WORKFORCE_PROMPTS.planner.TASK_CHECK_PROMPT, {
      overall_task: recorder.overallTask,
      task_plan: recorder.formattedTaskPlan,
      last_completed_task: task.taskName,
      last_completed_task_id: task.taskId.toString(),
      last_completed_task_description: task.taskDescription || '',
      last_completed_task_result: task.taskResult || ''
    });

    const checkResult = await this.llm.callLLM(checkPrompt);
    recorder.addRunResult(checkResult, 'planner');
    
    const taskStatus = this.parseCheckResponse(checkResult);
    task.taskStatus = taskStatus;
    
    this.logger.info(`任务 ${task.taskId} 状态更新为: ${taskStatus}`);
  }

  /**
   * 解析任务列表
   */
  private parseTasks(response: string): Subtask[] {
    const taskPattern = /<task>(.*?)<\/task>/gs;
    const matches = response.match(taskPattern);
    
    if (!matches) {
      this.logger.warn('未找到任务标签，尝试其他格式');
      return [];
    }

    const tasks: Subtask[] = [];
    matches.forEach((match, index) => {
      const taskContent = match.replace(/<\/?task>/g, '').trim();
      if (taskContent) {
        tasks.push(new Subtask(index + 1, taskContent));
      }
    });

    this.logger.info(`解析到 ${tasks.length} 个任务`);
    return tasks;
  }

  /**
   * 解析更新响应
   */
  private parseUpdateResponse(response: string): { choice: string; updatedPlan: string[] | null } {
    // 解析选择
    const choicePattern = /<choice>(.*?)<\/choice>/s;
    const choiceMatch = response.match(choicePattern);
    let choice = 'continue';
    
    if (choiceMatch) {
      choice = choiceMatch[1]?.trim().toLowerCase() || 'continue';
      if (!['continue', 'update', 'stop'].includes(choice)) {
        this.logger.warn(`意外的选择值: ${choice}，默认为 'continue'`);
        choice = 'continue';
      }
    } else {
      this.logger.warn('未找到选择标签，默认为 "continue"');
    }

    // 解析更新的计划
    let updatedPlan: string[] | null = null;
    if (choice === 'update') {
      const updatedPlanPattern = /<updated_unfinished_task_plan>(.*?)<\/updated_unfinished_task_plan>/s;
      const updatedPlanMatch = response.match(updatedPlanPattern);
      
      if (updatedPlanMatch) {
        const updatedPlanContent = updatedPlanMatch[1]?.trim() || '';
        const taskPattern = /<task>(.*?)<\/task>/gs;
        const taskMatches = updatedPlanContent.match(taskPattern);
        
        if (taskMatches) {
          updatedPlan = taskMatches.map(match => 
            match.replace(/<\/?task>/g, '').trim()
          ).filter(task => task);
        }
        
        if (!updatedPlan || updatedPlan.length === 0) {
          this.logger.warn('未找到更新计划中的任务，默认为 null');
          updatedPlan = null;
        }
      } else {
        this.logger.warn('未找到更新计划标签，默认为 null');
        updatedPlan = null;
      }
    }

    return { choice, updatedPlan };
  }

  /**
   * 解析检查响应
   */
  private parseCheckResponse(response: string): 'success' | 'failed' | 'partial success' {
    const statusPattern = /<task_status>(.*?)<\/task_status>/s;
    const statusMatch = response.match(statusPattern);
    
    if (statusMatch) {
      let taskStatus = statusMatch[1]?.trim().toLowerCase() || 'partial success';
      
      if (taskStatus.includes('partial')) {
        return 'partial success';
      }
      
      if (['success', 'failed', 'partial success'].includes(taskStatus)) {
        return taskStatus as 'success' | 'failed' | 'partial success';
      } else {
        this.logger.warn(`意外的任务状态值: ${taskStatus}，默认为 'partial success'`);
        return 'partial success';
      }
    } else {
      this.logger.warn('未找到任务状态标签，默认为 "partial success"');
      return 'partial success';
    }
  }
}
