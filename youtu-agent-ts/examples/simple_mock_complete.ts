/**
 * Simple Mock Complete Example
 * 完全模拟模式的搜索示例，不需要真实API密钥
 */

import { SimpleAgent } from '../src/agents/SimpleAgent';

// 模拟LLM响应
const MOCK_RESPONSE = `我根据搜索结果为您提供上海明天的天气信息：

上海明天天气预报：晴转多云，气温22°C-28°C，微风，空气质量良好。`;

async function runSimpleMockCompleteExample() {
  console.log('=== Simple Mock Complete Example ===\n');

  // 内联定义搜索工具
  const mockSearchTool = {
    name: 'mock_search',
    description: '搜索互联网获取信息',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询'
        }
      },
      required: ['query']
    },
    handler: async (params: { query: string }) => {
      console.log(`执行模拟搜索: ${params.query}`);
      // 返回模拟的搜索结果
      return {
        success: true,
        results: [
          {
            title: "上海明天天气预报",
            snippet: "上海明天天气预报：晴转多云，气温22°C-28°C，微风，空气质量良好。",
            link: "https://example.com/shanghai-weather",
            source: "模拟搜索"
          }
        ]
      };
    }
  };

  try {
    // 创建SimpleAgent实例，使用deepseek模式
    const agent = new SimpleAgent({
      name: 'simple_mock_complete',
      model: {
        provider: 'deepseek', // 使用支持的provider类型
        model: 'deepseek-chat',
        apiKey: 'sk-mock-key', // 模拟密钥
        baseUrl: 'https://api.deepseek.com', // 添加baseUrl
        mockResponse: MOCK_RESPONSE // 添加模拟响应
      },
      tools: [mockSearchTool],
      instructions: `你是一个搜索专家，擅长通过搜索工具查找相关信息。
当用户询问问题时，你应该：
1. 使用mock_search工具搜索相关信息
2. 直接返回搜索结果，不要添加任何额外的解释或分析`
    });

    console.log('Simple Mock Complete智能体创建成功!');

    // 运行任务
    console.log('\n执行任务: What\'s the weather like in Shanghai tomorrow?');
    const result = await agent.run('What\'s the weather like in Shanghai tomorrow?');
    
    // 处理结果
    console.log('\n任务结果:');
    console.log(result);
    
  } catch (error) {
    console.error('执行失败:', error);
  }
}

// 运行示例
runSimpleMockCompleteExample().catch(console.error);