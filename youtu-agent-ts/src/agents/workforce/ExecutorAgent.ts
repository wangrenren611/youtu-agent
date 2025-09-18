/**
 * Executor Agent
 * 负责任务执行
 */

import { AgentConfig } from '../../types';
import { Logger } from '../../utils/Logger';
import { Subtask, WorkspaceTaskRecorder } from './data';
import { WORKFORCE_PROMPTS, formatPrompt } from './prompts';
import { SimpleAgent } from '../SimpleAgent';

export class ExecutorAgent {
  private readonly logger: Logger;
  private readonly executorAgent: SimpleAgent;
  private readonly maxTries: number;
  private readonly returnSummary: boolean;
  private reflectionHistory: string[] = [];

  constructor(config: AgentConfig, workforceConfig: AgentConfig) {
    this.logger = new Logger('ExecutorAgent');
    
    // 创建执行器智能体
    this.executorAgent = new SimpleAgent(config);
    
    // 获取执行器配置
    const executorConfig = workforceConfig.workforceExecutorConfig || {};
    this.maxTries = executorConfig.maxTries || 1;
    this.returnSummary = executorConfig.returnSummary || false;
  }

  /**
   * 执行任务
   */
  async executeTask(recorder: WorkspaceTaskRecorder, task: Subtask): Promise<void> {
    this.logger.info(`开始执行任务: ${task.taskName}`);
    
    task.taskStatus = 'in progress';
    
    let tries = 1;
    let finalResult: string | undefined;
    let executorRes: any;
    
    while (tries <= this.maxTries) {
      try {
        this.logger.info(`执行尝试 ${tries}/${this.maxTries}`);
        
        // 构建用户提示
        let userPrompt: string;
        if (tries === 1) {
          userPrompt = formatPrompt(WORKFORCE_PROMPTS.executor.TASK_EXECUTE_USER_PROMPT, {
            overall_task: recorder.overallTask,
            overall_plan: recorder.formattedTaskPlan,
            task_name: task.taskName,
            task_description: task.taskDescription || ''
          });
        } else {
          userPrompt = formatPrompt(WORKFORCE_PROMPTS.executor.TASK_EXECUTE_WITH_REFLECTION_USER_PROMPT, {
            overall_task: recorder.overallTask,
            overall_plan: recorder.formattedTaskPlan,
            task_name: task.taskName,
            task_description: task.taskDescription || '',
            previous_attempts: this.reflectionHistory[this.reflectionHistory.length - 1] || ''
          });
        }
        
        // 执行任务
        executorRes = await this.executorAgent.run(userPrompt); // 执行任务
        finalResult = executorRes.output;
        
        // 检查任务完成情况
        const taskCheckPrompt = formatPrompt(WORKFORCE_PROMPTS.executor.TASK_CHECK_PROMPT, {
          task_name: task.taskName,
          task_description: task.taskDescription || ''
        });
        
        const checkResponse = await this.executorAgent.run(taskCheckPrompt); // 检查任务完成情况
        const isCompleted = this.parseTaskCheckResult(checkResponse.output || '');
        
        if (isCompleted) {
          this.logger.info(`任务 "${task.taskName}" 执行成功`);
          break;
        }
        
        // 任务反思
        const reflectionPrompt = formatPrompt(WORKFORCE_PROMPTS.executor.TASK_REFLECTION_PROMPT, {
          task_name: task.taskName,
          task_description: task.taskDescription || ''
        });
        
        const reflectionRes = await this.executorAgent.run(reflectionPrompt); // 任务反思
        this.reflectionHistory.push(reflectionRes.output || '');
        
        this.logger.warn(`任务 "${task.taskName}" 未完成，准备重试... (尝试 ${tries}/${this.maxTries})`);
        tries++;
        
      } catch (error) {
        this.logger.error(`执行任务 "${task.taskName}" 时发生错误 (尝试 ${tries}):`, error);
        tries++;
        
        if (tries > this.maxTries) {
          finalResult = `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
          break;
        }
      }
    }
    
    if (!executorRes) {
      this.logger.error(`任务 "${task.taskName}" 执行失败，已尝试 ${tries} 次`);
      task.taskResult = finalResult || '任务执行失败';
      task.taskStatus = 'failed';
      return;
    }
    
    // 记录执行结果
    recorder.addRunResult(executorRes, 'executor');
    task.taskResult = finalResult || '';
    task.taskStatus = 'completed';
    
    // 如果需要返回摘要
    if (this.returnSummary) {
      this.logger.info('生成任务执行摘要...');
      
      const summaryPrompt = formatPrompt(WORKFORCE_PROMPTS.executor.TASK_SUMMARY_USER_PROMPT, {
        task_name: task.taskName,
        task_description: task.taskDescription || ''
      });
      
      const summaryResponse = await this.executorAgent.run(summaryPrompt);
      recorder.addRunResult(summaryResponse, 'executor_summary');
      
      task.taskResultDetailed = summaryResponse.output || '';
      task.taskResult = summaryResponse.output || '';
      
      this.logger.info(`任务结果已摘要: ${task.taskResult}`);
    }
  }

  /**
   * 解析任务检查结果
   */
  private parseTaskCheckResult(response: string): boolean {
    const checkPattern = /<task_check>(.*?)<\/task_check>/s;
    const checkMatch = response.match(checkPattern);
    
    if (checkMatch) {
      const result = checkMatch[1]?.trim().toLowerCase() || 'no';
      return result === 'yes';
    }
    
    return false;
  }
}