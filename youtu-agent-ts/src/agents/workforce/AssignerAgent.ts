/**
 * Assigner Agent
 * 负责任务分配
 */

import { AgentConfig } from '../../types';
import { Logger } from '../../utils/Logger';
import { Subtask, WorkspaceTaskRecorder } from './data';
import { WORKFORCE_PROMPTS, formatPrompt } from './prompts';
import { SimpleAgent } from '../SimpleAgent';

export class AssignerAgent {
  private readonly logger: Logger;
  private readonly llm: SimpleAgent;

  constructor(config: AgentConfig) {
    this.logger = new Logger('AssignerAgent');
    
    // 创建LLM智能体用于分配
    this.llm = new SimpleAgent({
      type: 'simple',
      name: 'assigner_llm',
      model: config.workforceAssignerModel || config.model,
      tools: [], // AssignerAgent不需要工具，只需要LLM推理
      instructions: 'You are a task assignment specialist.'
    });
  }

  /**
   * 初始化AssignerAgent
   */
  async initialize(): Promise<void> {
    try {
      await this.llm.initialize();
      this.logger.info('AssignerAgent LLM 初始化成功');
    } catch (error) {
      this.logger.error('AssignerAgent LLM 初始化失败:', error);
      throw new Error(`AssignerAgent LLM 初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 分配任务
   */
  async assignTask(recorder: WorkspaceTaskRecorder): Promise<Subtask> {
    this.logger.info('开始分配任务...');
    
    // 检查 LLM 是否已初始化
    if (!this.llm.isReady()) {
      throw new Error('AssignerAgent LLM 未初始化');
    }
    
    const nextTask = recorder.getNextTask();
    
    const systemPrompt = formatPrompt(WORKFORCE_PROMPTS.assigner.TASK_ASSIGN_SYS_PROMPT, {
      overall_task: recorder.overallTask,
      task_plan: recorder.formattedTaskPlanListWithTaskResults.join('\n'),
      executor_agents_info: recorder.executorAgentsInfo
    });

    const userPrompt = formatPrompt(WORKFORCE_PROMPTS.assigner.TASK_ASSIGN_USER_PROMPT, {
      next_task: nextTask.taskName,
      executor_agents_names: recorder.executorAgentsNames
    });

    // 组合系统指令和用户提示
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    try {
      const assignResultObj = await this.llm.run(fullPrompt);
      const assignResult = assignResultObj.output || '';
      recorder.addRunResult(assignResult, 'assigner');

      // 解析分配结果
      const parsedResult = this.parseAssignResult(assignResult);
      nextTask.taskDescription = parsedResult.assignTask;
      nextTask.assignedAgent = parsedResult.assignAgent;
      
      this.logger.info(`任务 ${nextTask.taskId} 已分配给: ${nextTask.assignedAgent}`);
      return nextTask;
    } catch (error) {
      this.logger.error('任务分配失败:', error);
      throw new Error(`任务分配失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 解析分配结果
   */
  private parseAssignResult(response: string): { assignAgent: string; assignTask: string } {
    try {
      const agentPattern = /<selected_agent>(.*?)<\/selected_agent>/s;
      const taskPattern = /<detailed_task_description>(.*?)<\/detailed_task_description>/s;
      
      const agentMatch = response.match(agentPattern);
      const taskMatch = response.match(taskPattern);
      
      if (!agentMatch || !taskMatch) {
        throw new Error('无法找到分配结果标签');
      }
      
      const selectedAgent = agentMatch[1]?.trim() || '';
      const detailedTask = taskMatch[1]?.trim() || '';
      
      if (!selectedAgent || !detailedTask) {
        throw new Error('分配结果为空');
      }
      
      return {
        assignAgent: selectedAgent,
        assignTask: detailedTask
      };
    } catch (error) {
      this.logger.error('解析分配结果失败:', error);
      this.logger.error('响应内容:', response);
      throw new Error(`解析分配结果失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}