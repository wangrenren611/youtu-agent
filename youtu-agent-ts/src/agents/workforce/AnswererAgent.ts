/**
 * Answerer Agent
 * 负责最终答案提取
 */

import { AgentConfig } from '../../types';
import { Logger } from '../../utils/Logger';
import { WorkspaceTaskRecorder } from './data';
import { WORKFORCE_PROMPTS, formatPrompt } from './prompts';
import { SimpleAgent } from '../SimpleAgent';

export class AnswererAgent {
  private readonly logger: Logger;
  private readonly llm: SimpleAgent;

  constructor(config: AgentConfig) {
    this.logger = new Logger('AnswererAgent');
    
    // 创建LLM智能体用于答案提取
    this.llm = new SimpleAgent({
      type: 'simple',
      name: 'answerer_llm',
      model: config.workforceAnswererModel || config.model,
      tools: [], // AnswererAgent不需要工具，只需要LLM推理
      instructions: 'You are a final answer extraction specialist.'
    });
  }

  /**
   * 初始化AnswererAgent
   */
  async initialize(): Promise<void> {
    try {
      await this.llm.initialize();
      this.logger.info('AnswererAgent LLM 初始化成功');
    } catch (error) {
      this.logger.error('AnswererAgent LLM 初始化失败:', error);
      throw new Error(`AnswererAgent LLM 初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 提取最终答案
   */
  async extractFinalAnswer(recorder: WorkspaceTaskRecorder): Promise<string> {
    this.logger.info('开始提取最终答案...');
    
    // 检查 LLM 是否已初始化
    if (!this.llm.isReady()) {
      throw new Error('AnswererAgent LLM 未初始化');
    }
    
    const finalPrompt = formatPrompt(WORKFORCE_PROMPTS.answerer.FINAL_ANSWER_PROMPT, {
      question: recorder.overallTask,
      task_results: recorder.formattedTaskPlanListWithTaskResults.join('\n')
    });

    try {
      const finalResultObj = await this.llm.run(finalPrompt);
      const finalResult = finalResultObj.output || '';
      recorder.addRunResult(finalResult, 'answerer');
      
      const finalAnswer = this.parseFinalResponse(finalResult);
      
      this.logger.info(`最终答案提取完成: ${finalAnswer}`);
      return finalAnswer;
    } catch (error) {
      this.logger.error('最终答案提取失败:', error);
      throw new Error(`最终答案提取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查答案
   */
  async answerCheck(question: string, modelAnswer: string, groundTruth: string): Promise<boolean> {
    this.logger.info('开始检查答案...');
    
    // 检查 LLM 是否已初始化
    if (!this.llm.isReady()) {
      throw new Error('AnswererAgent LLM 未初始化');
    }
    
    const checkPrompt = formatPrompt(WORKFORCE_PROMPTS.answerer.ANSWER_CHECK_PROMPT, {
      question,
      model_answer: modelAnswer,
      ground_truth: groundTruth
    });

    try {
      const checkResultObj = await this.llm.run(checkPrompt);
      const checkResult = checkResultObj.output || '';
      const isEquivalent = this.parseAnswerCheckResponse(checkResult);
      
      this.logger.info(`答案检查完成，是否等价: ${isEquivalent}`);
      return isEquivalent;
    } catch (error) {
      this.logger.error('答案检查失败:', error);
      throw new Error(`答案检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 解析最终响应
   */
  private parseFinalResponse(response: string): string {
    const answerPattern = /<answer>(.*?)<\/answer>/s;
    const answerMatch = response.match(answerPattern);
    
    if (answerMatch) {
      return answerMatch[1]?.trim() || '';
    }
    
    this.logger.warn('未找到答案标签，返回原始响应');
    return response.trim();
  }

  /**
   * 解析答案检查响应
   */
  private parseAnswerCheckResponse(response: string): boolean {
    const equivalentPattern = /<equivalent>(.*?)<\/equivalent>/s;
    const equivalentMatch = response.match(equivalentPattern);
    
    if (equivalentMatch) {
      const result = equivalentMatch[1]?.trim().toLowerCase() || 'no';
      return result === 'yes';
    }
    
    this.logger.warn('未找到等价性标签，默认为 false');
    return false;
  }
}