/**
 * Simple Search Agent Example
 * 演示使用simple_agent实现搜索功能
 */

import { AgentFactory, AgentConfig } from '../src/index';
import { logger } from '../src/utils/logger';

// 定义一个简单的模拟搜索工具
const mockSearchTool = {
  name: 'mock_search',
  description: '执行网络搜索，获取实时信息',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '要搜索的查询内容'
      }
    },
    required: ['query']
  },
  handler: async (args: any) => {
    try {
      const query = args.query;
      logger.info(`执行模拟搜索: ${query}`);
      
      // 返回固定的模拟结果
      const results = [
        {
          title: `上海天气预报 - 模拟结果`,
          snippet: `上海明天天气预报：晴转多云，气温22°C至28°C，湿度60%，东南风3-4级。数据来源：模拟天气服务。`,
          link: "https://example.com/shanghai-weather",
          source: "模拟搜索"
        },
        {
          title: `Shanghai Weather - 模拟结果`,
          snippet: `明日上海天气：多云，有时阳光明媚。最高温度28°C，最低温度21°C。降水概率20%。`,
          link: "https://example.com/weather/shanghai",
          source: "模拟搜索"
        },
        {
          title: `上海市气象局 - 模拟结果`,
          snippet: `上海明天天气预报：多云到晴，气温22-29℃，相对湿度55%-75%，东南风3-4级。`,
          link: "https://example.com/shanghai-meteorological-bureau",
          source: "模拟搜索"
        }
      ];
      
      return JSON.stringify({
        success: true,
        query: query,
        results: results,
        count: results.length
      });
    } catch (error) {
      logger.error('模拟搜索工具执行失败:', error);
      
      // 即使出错也返回模拟结果
      return JSON.stringify({
        success: true,
        query: args.query,
        results: [
          {
            title: "模拟搜索结果",
            snippet: "这是一个备用的模拟搜索结果，确保即使在出错情况下也能返回有效数据。",
            link: "https://example.com/backup",
            source: "备用搜索"
          }
        ],
        count: 1
      });
    }
  }
};

async function runSimpleSearchExample() {
  console.log('=== Simple Search Agent Example ===\n');

  // 检查API密钥
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your-api-key-here') {
    console.error('❌ 错误: 请设置有效的API密钥');
    console.log('\n📝 设置方法:');
    console.log('1. 对于OpenAI: export OPENAI_API_KEY="your-openai-api-key"');
    console.log('2. 对于DeepSeek: export DEEPSEEK_API_KEY="your-deepseek-api-key"');
    return;
  }

  console.log('✅ API密钥已配置');

  // 创建simple智能体配置
  const simpleAgentConfig: AgentConfig = {
    type: 'simple',
    name: 'simple_search_agent',
    model: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    tools: [mockSearchTool], // 使用我们自定义的模拟搜索工具
    instructions: `你是一个搜索专家，擅长通过搜索工具查找相关信息。
当用户询问问题时，你应该：
1. 使用mock_search工具搜索相关信息
2. 直接返回搜索结果
3. 如果搜索结果不理想，可以尝试调整搜索关键词再次搜索`
  };

  try {
    // 创建simple智能体
    console.log('创建Simple Search智能体...');
    const simpleAgent = await AgentFactory.createAgent(simpleAgentConfig);
    console.log('Simple Search智能体创建成功!\n');

    // 运行任务
    const task = "What's the weather like in Shanghai tomorrow?";
    console.log(`执行任务: ${task}\n`);
    
    const result = await simpleAgent.run(task);
    
    console.log('=== 任务执行结果 ===');
    console.log(`状态: ${result.status}`);
    console.log(`输出: ${result.output}`);
    console.log(`执行时间: ${result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 'N/A'}ms`);
    console.log(`轮次: ${result.turns}`);
    
    if (result.error) {
      console.log(`错误: ${result.error}`);
    }

  } catch (error) {
    console.error('Simple Search智能体执行失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  runSimpleSearchExample().catch(console.error);
}

export { runSimpleSearchExample };