/**
 * Simple Workforce Search Example
 * 使用workforce中的simple类型实现搜索功能
 */

import { AgentFactory, AgentConfig, WorkforceConfig } from '../src/index';

async function runSimpleWorkforceSearchExample() {
  console.log('=== Simple Workforce Search Example ===\n');

  // 检查API密钥
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置OPENAI_API_KEY或DEEPSEEK_API_KEY环境变量');
    process.exit(1);
  }
  console.log('✅ API密钥已配置');

  // 创建workforce配置
  const workforceConfig: WorkforceConfig = {
    assignerModel: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    answererModel: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    executorAgents: {
      SearchAgent: {
        type: 'simple',
        model: {
          provider: 'deepseek',
          model: 'deepseek-chat',
          apiKey: apiKey,
          baseUrl: 'https://api.deepseek.com',
          temperature: 0.7,
          maxTokens: 2000
        },
        tools: ['web_search'],
        instructions: `你是一个搜索专家，擅长通过搜索工具查找相关信息。
当用户询问问题时，你应该：
1. 使用web_search工具搜索相关信息
2. 直接返回搜索结果，不要添加任何额外的解释或分析
3. 不要尝试多次搜索，只搜索一次即可`,
        maxRetries: 0
      }
    },
    executorConfig: {
      maxTries: 1,
      returnSummary: true
    },
    executorInfos: {
      SearchAgent: '搜索代理，可以搜索互联网上的信息'
    }
  };

  try {
    // 创建workforce
    console.log('创建Workforce...');
    const workforce = await AgentFactory.createWorkforce(workforceConfig);
    console.log('Workforce创建成功!');

    // 运行任务
    console.log('\n执行任务: What\'s the weather like in Shanghai tomorrow?');
    const result = await workforce.run('What\'s the weather like in Shanghai tomorrow?');
    
    // 处理结果
    console.log('\n任务结果:');
    console.log(result);
    
  } catch (error) {
    console.error('执行失败:', error);
  }
}

// 运行示例
runSimpleWorkforceSearchExample().catch(console.error);