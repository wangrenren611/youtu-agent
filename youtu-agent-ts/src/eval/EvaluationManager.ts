/**
 * 评估管理器
 * 负责智能体性能评估、测试用例管理和结果分析
 */

import { EventEmitter } from 'events';
import { EvaluationResult, AgentConfig, TaskRecorder } from '../types';
import { Logger } from '../utils/Logger';
import { BaseAgent } from '../core/agent/BaseAgent';
import { AgentFactory } from '../agents';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedOutput?: string;
  expectedKeywords?: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface EvaluationConfig {
  name: string;
  description: string;
  testCases: TestCase[];
  agentConfig: AgentConfig;
  metrics: {
    accuracy: boolean;
    latency: boolean;
    tokenUsage: boolean;
    cost: boolean;
  };
  timeout: number;
  maxRetries: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  averageLatency: number;
  totalTokenUsage: number;
  totalCost: number;
  passRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

export class EvaluationManager extends EventEmitter {
  private readonly logger: Logger;
  private readonly resultsDir: string;
  private evaluations: Map<string, EvaluationResult[]> = new Map();

  constructor(resultsDir: string = './eval_results') {
    super();
    this.logger = new Logger('EvaluationManager');
    this.resultsDir = resultsDir;
  }

  /**
   * 运行评估
   * @param config 评估配置
   * @returns 评估结果
   */
  async runEvaluation(config: EvaluationConfig): Promise<EvaluationResult[]> {
    this.logger.info(`开始运行评估: ${config.name}`);
    this.emit('evaluation_start', config);

    const results: EvaluationResult[] = [];
    let agent: BaseAgent | null = null;

    try {
      // 创建智能体
      agent = await AgentFactory.createAgent(config.agentConfig);
      this.logger.info(`智能体创建成功: ${config.agentConfig.name}`);

      // 运行测试用例
      for (const testCase of config.testCases) {
        this.logger.info(`运行测试用例: ${testCase.name}`);
        this.emit('test_case_start', testCase);

        const result = await this.runTestCase(agent, testCase, config);
        results.push(result);

        this.emit('test_case_complete', result);
        this.logger.info(`测试用例完成: ${testCase.name}, 得分: ${result.score}`);
      }

      // 保存结果
      await this.saveResults(config.name, results);

      // 计算总体指标
      const metrics = this.calculateMetrics(results);
      this.logger.info(`评估完成: ${config.name}`, metrics);

      this.emit('evaluation_complete', { config, results, metrics });

      return results;

    } catch (error) {
      this.logger.error(`评估失败: ${config.name}`, error);
      this.emit('evaluation_failed', { config, error });
      throw error;
    } finally {
      if (agent) {
        await agent.cleanup();
      }
    }
  }

  /**
   * 运行单个测试用例
   * @param agent 智能体实例
   * @param testCase 测试用例
   * @param config 评估配置
   * @returns 测试结果
   */
  private async runTestCase(
    agent: BaseAgent,
    testCase: TestCase,
    config: EvaluationConfig
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    let actualOutput = '';
    let error: string | undefined;
    let tokenUsage = 0;

    try {
      // 运行智能体
      const result = await Promise.race([
        agent.run(testCase.input),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('超时')), config.timeout)
        )
      ]);

      actualOutput = result.output || '';
      tokenUsage = this.estimateTokenUsage(testCase.input + actualOutput);

    } catch (err) {
      error = err instanceof Error ? err.message : '未知错误';
      this.logger.error(`测试用例执行失败: ${testCase.name}`, err);
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    // 计算得分
    const score = this.calculateScore(testCase, actualOutput, error);

    return {
      id: `${testCase.id}_${Date.now()}`,
      testCase: testCase.name,
      expected: testCase.expectedOutput || '',
      actual: actualOutput,
      score,
      passed: score >= 0.8, // 80%以上认为通过
      metrics: {
        accuracy: score,
        latency,
        tokenUsage,
      },
      timestamp: new Date()
    };
  }

  /**
   * 计算测试得分
   * @param testCase 测试用例
   * @param actualOutput 实际输出
   * @param error 错误信息
   * @returns 得分 (0-1)
   */
  private calculateScore(testCase: TestCase, actualOutput: string, error?: string): number {
    if (error) {
      return 0;
    }

    let score = 0;

    // 基于期望输出计算相似度
    if (testCase.expectedOutput) {
      const similarity = this.calculateSimilarity(testCase.expectedOutput, actualOutput);
      score += similarity * 0.6; // 60%权重
    }

    // 基于关键词匹配
    if (testCase.expectedKeywords && testCase.expectedKeywords.length > 0) {
      const keywordScore = this.calculateKeywordScore(testCase.expectedKeywords, actualOutput);
      score += keywordScore * 0.4; // 40%权重
    }

    // 如果没有期望输出和关键词，基于输出质量评分
    if (!testCase.expectedOutput && (!testCase.expectedKeywords || testCase.expectedKeywords.length === 0)) {
      score = this.calculateQualityScore(actualOutput);
    }

    return Math.min(score, 1);
  }

  /**
   * 计算文本相似度
   * @param expected 期望文本
   * @param actual 实际文本
   * @returns 相似度 (0-1)
   */
  private calculateSimilarity(expected: string, actual: string): number {
    // 简单的Jaccard相似度计算
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));
    const actualWords = new Set(actual.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...expectedWords].filter(x => actualWords.has(x)));
    const union = new Set([...expectedWords, ...actualWords]);
    
    return intersection.size / union.size;
  }

  /**
   * 计算关键词得分
   * @param keywords 关键词列表
   * @param text 文本
   * @returns 关键词得分 (0-1)
   */
  private calculateKeywordScore(keywords: string[], text: string): number {
    const textLower = text.toLowerCase();
    const foundKeywords = keywords.filter(keyword => 
      textLower.includes(keyword.toLowerCase())
    );
    
    return foundKeywords.length / keywords.length;
  }

  /**
   * 计算输出质量得分
   * @param output 输出文本
   * @returns 质量得分 (0-1)
   */
  private calculateQualityScore(output: string): number {
    if (!output || output.trim().length === 0) {
      return 0;
    }

    let score = 0.5; // 基础分

    // 长度评分
    if (output.length > 50) score += 0.1;
    if (output.length > 200) score += 0.1;

    // 结构评分
    if (output.includes('\n')) score += 0.1; // 有换行
    if (output.includes('。') || output.includes('.')) score += 0.1; // 有句号
    if (output.includes('：') || output.includes(':')) score += 0.1; // 有冒号

    return Math.min(score, 1);
  }

  /**
   * 估算token使用量
   * @param text 文本
   * @returns token数量
   */
  private estimateTokenUsage(text: string): number {
    // 简单的token估算：中文字符按1.5个token计算，英文按0.75个token计算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishChars = text.length - chineseChars;
    
    return Math.ceil(chineseChars * 1.5 + englishChars * 0.75);
  }

  /**
   * 计算总体指标
   * @param results 评估结果
   * @returns 总体指标
   */
  private calculateMetrics(results: EvaluationResult[]): EvaluationMetrics {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    const accuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / totalTests;
    const averageLatency = results.reduce((sum, r) => sum + r.metrics.latency, 0) / totalTests;
    const totalTokenUsage = results.reduce((sum, r) => sum + r.metrics.tokenUsage, 0);
    const passRate = passedTests / totalTests;

    return {
      accuracy,
      averageLatency,
      totalTokenUsage,
      totalCost: totalTokenUsage * 0.0001, // 假设每token成本0.0001元
      passRate,
      totalTests,
      passedTests,
      failedTests
    };
  }

  /**
   * 保存评估结果
   * @param evaluationName 评估名称
   * @param results 评估结果
   */
  private async saveResults(evaluationName: string, results: EvaluationResult[]): Promise<void> {
    try {
      await fs.mkdir(this.resultsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${evaluationName}_${timestamp}.json`;
      const filepath = path.join(this.resultsDir, filename);
      
      const data = {
        evaluationName,
        timestamp: new Date().toISOString(),
        results,
        metrics: this.calculateMetrics(results)
      };
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
      this.logger.info(`评估结果已保存: ${filepath}`);
      
    } catch (error) {
      this.logger.error('保存评估结果失败:', error);
    }
  }

  /**
   * 加载评估结果
   * @param evaluationName 评估名称
   * @returns 评估结果
   */
  async loadResults(evaluationName: string): Promise<EvaluationResult[]> {
    try {
      const files = await fs.readdir(this.resultsDir);
      const matchingFiles = files.filter(file => file.startsWith(evaluationName));
      
      if (matchingFiles.length === 0) {
        return [];
      }
      
      // 获取最新的文件
      const latestFile = matchingFiles.sort().pop()!;
      const filepath = path.join(this.resultsDir, latestFile);
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);
      
      return data.results || [];
      
    } catch (error) {
      this.logger.error(`加载评估结果失败: ${evaluationName}`, error);
      return [];
    }
  }

  /**
   * 获取评估历史
   * @returns 评估历史列表
   */
  async getEvaluationHistory(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.resultsDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/, ''));
    } catch (error) {
      this.logger.error('获取评估历史失败:', error);
      return [];
    }
  }

  /**
   * 生成评估报告
   * @param results 评估结果
   * @returns 报告文本
   */
  generateReport(results: EvaluationResult[]): string {
    const metrics = this.calculateMetrics(results);
    
    let report = `# 评估报告\n\n`;
    report += `## 总体指标\n`;
    report += `- 总测试数: ${metrics.totalTests}\n`;
    report += `- 通过数: ${metrics.passedTests}\n`;
    report += `- 失败数: ${metrics.failedTests}\n`;
    report += `- 通过率: ${(metrics.passRate * 100).toFixed(2)}%\n`;
    report += `- 平均准确率: ${(metrics.accuracy * 100).toFixed(2)}%\n`;
    report += `- 平均延迟: ${metrics.averageLatency.toFixed(2)}ms\n`;
    report += `- 总Token使用: ${metrics.totalTokenUsage}\n`;
    report += `- 估算成本: ¥${metrics.totalCost.toFixed(4)}\n\n`;
    
    report += `## 详细结果\n\n`;
    results.forEach((result, index) => {
      report += `### ${index + 1}. ${result.testCase}\n`;
      report += `- 得分: ${(result.score * 100).toFixed(2)}%\n`;
      report += `- 状态: ${result.passed ? '✅ 通过' : '❌ 失败'}\n`;
      report += `- 延迟: ${result.metrics.latency}ms\n`;
      report += `- 期望: ${result.expected}\n`;
      report += `- 实际: ${result.actual}\n\n`;
    });
    
    return report;
  }
}
