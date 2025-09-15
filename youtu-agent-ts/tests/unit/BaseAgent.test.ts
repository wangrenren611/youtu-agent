/**
 * BaseAgent 单元测试
 */

import { BaseAgent } from '../../src/core/agent/BaseAgent';
import { AgentConfig, TaskRecorder } from '../../src/types';

// 测试用的简单智能体实现
class TestAgent extends BaseAgent {
  protected async onInitialize(): Promise<void> {
    // 测试初始化
  }

  protected async execute(input: string, recorder: TaskRecorder): Promise<string> {
    return `测试响应: ${input}`;
  }

  protected async* executeStream(input: string, recorder: TaskRecorder): AsyncGenerator<any, void, unknown> {
    yield { role: 'assistant', content: `流式响应: ${input}` };
  }

  protected async onCleanup(): Promise<void> {
    // 测试清理
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let config: AgentConfig;

  beforeEach(() => {
    config = {
      type: 'simple',
      name: 'test_agent',
      model: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key'
      }
    };
    agent = new TestAgent(config);
  });

  afterEach(async () => {
    await agent.cleanup();
  });

  describe('初始化', () => {
    test('应该正确初始化智能体', async () => {
      expect(agent.isReady()).toBe(false);
      
      await agent.initialize();
      
      expect(agent.isReady()).toBe(true);
    });

    test('应该获取正确的配置', () => {
      const agentConfig = agent.getConfig();
      expect(agentConfig.name).toBe('test_agent');
      expect(agentConfig.type).toBe('simple');
    });

    test('应该获取正确的名称和类型', () => {
      expect(agent.getName()).toBe('test_agent');
      expect(agent.getType()).toBe('simple');
    });
  });

  describe('任务执行', () => {
    beforeEach(async () => {
      await agent.initialize();
    });

    test('应该正确执行任务', async () => {
      const result = await agent.run('测试输入');
      
      expect(result.input).toBe('测试输入');
      expect(result.output).toBe('测试响应: 测试输入');
      expect(result.status).toBe('completed');
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
    });

    test('应该生成唯一的追踪ID', async () => {
      const result1 = await agent.run('输入1');
      const result2 = await agent.run('输入2');
      
      expect(result1.id).not.toBe(result2.id);
    });

    test('应该处理执行错误', async () => {
      // 创建一个会抛出错误的测试智能体
      class ErrorAgent extends TestAgent {
        protected async execute(): Promise<string> {
          throw new Error('测试错误');
        }
      }

      const errorAgent = new ErrorAgent(config);
      await errorAgent.initialize();

      await expect(errorAgent.run('测试')).rejects.toThrow('测试错误');
      
      await errorAgent.cleanup();
    });
  });

  describe('流式执行', () => {
    beforeEach(async () => {
      await agent.initialize();
    });

    test('应该正确执行流式任务', async () => {
      const messages: any[] = [];
      
      for await (const message of agent.runStream('流式输入')) {
        messages.push(message);
      }
      
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('流式响应: 流式输入');
    });
  });

  describe('清理', () => {
    test('应该正确清理资源', async () => {
      await agent.initialize();
      expect(agent.isReady()).toBe(true);
      
      await agent.cleanup();
      expect(agent.isReady()).toBe(false);
    });
  });
});
