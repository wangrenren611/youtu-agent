/**
 * Simple Mock Search Example
 * 使用simple_agent实现简单搜索
 */

import { AgentFactory, AgentConfig } from '../src/index';

async function runSimpleMockSearchExample() {
  console.log('=== Simple Mock Search Example ===\n');

  // 检查API密钥
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置OPENAI_API_KEY或DEEPSEEK_API_KEY环境变量');
    process.exit(1);
  }
  console.log('✅ API密钥已配置');

  console.log('创建Simple Mock Search智能体...');
  
  // 创建simple智能体配置
  const simpleAgentConfig: AgentConfig = {
    type: 'simple',
    name: 'simple_mock_search',
    model: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    tools: [{
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
        console.log(`执行模拟搜索: ${args.query}`);
        
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
          }
        ];
        
        return JSON.stringify({
          success: true,
          query: args.query,
          results: results,
          count: results.length
        });
      }
    }],
    instructions: `你是一个搜索专家，擅长通过搜索工具查找相关信息。
当用户询问问题时，你应该：
1. 使用mock_search工具搜索相关信息
2. 直接返回搜索结果，不要添加任何额外的解释或分析
3. 不要尝试多次搜索，只搜索一次即可`
  };

  try {
    // 创建智能体
    const agent = await AgentFactory.createAgent(simpleAgentConfig);
    console.log('Simple Mock Search智能体创建成功!');

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
runSimpleMockSearchExample().catch(console.error);