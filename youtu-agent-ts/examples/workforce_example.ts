/**
 * Workforce Agent Example
 * 演示workforce智能体的使用
 */

import { AgentFactory, AgentConfig } from '../src/index';

async function runWorkforceExample() {
  console.log('=== Workforce Agent Example ===\n');

  // 检查API密钥
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your-api-key-here') {
    console.error('❌ 错误: 请设置有效的API密钥');
    console.log('\n📝 设置方法:');
    console.log('1. 对于OpenAI: export OPENAI_API_KEY="your-openai-api-key"');
    console.log('2. 对于DeepSeek: export DEEPSEEK_API_KEY="your-deepseek-api-key"');
    console.log('\n💡 提示: 你可以从以下网站获取API密钥:');
    console.log('   - OpenAI: https://platform.openai.com/api-keys');
    console.log('   - DeepSeek: https://platform.deepseek.com/api_keys');
    console.log('\n🔧 临时测试 (不推荐在生产环境使用):');
    console.log('   export OPENAI_API_KEY="sk-test-key-for-demo"');
    return;
  }

  console.log('✅ API密钥已配置');

  // 创建workforce智能体配置
  const workforceConfig: AgentConfig = {
    type: 'workforce',
    name: 'workforce_example',
    model: {
      provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: apiKey,
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.7,
        maxTokens: 2000
    },
    
    // Workforce特定配置
    workforcePlannerModel: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    workforceAssignerModel: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    workforceAnswererModel: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    
    // 执行器智能体配置
    workforceExecutorAgents: {
      SearchAgent: {
        type: 'simple',
        name: 'search_agent',
        model: {
          provider: 'deepseek',
          model: 'deepseek-chat',
          apiKey: apiKey,
          baseUrl: 'https://api.deepseek.com',
          temperature: 0.7,
          maxTokens: 2000
        },
        tools: ['web_search'],
        instructions: 'You are a web search specialist that excels at finding relevant information through search tools.'
      }
    },
    
    // 执行器配置
    workforceExecutorConfig: {
      maxTries: 2,
      returnSummary: true
    },
    
    // 执行器信息
    workforceExecutorInfos: [
      {
        name: 'SearchAgent',
        description: 'A web information search specialist that excels at finding relevant information through search tools (Google, Wikipedia, archived pages) and extracting webpage content for understanding. Focuses on information discovery and identifying authoritative sources.'
      }
    ]
  };

  try {
    // 创建workforce智能体
    console.log('创建Workforce智能体...');
    const workforceAgent = await AgentFactory.createAgent(workforceConfig);
    console.log('Workforce智能体创建成功!\n');

    // 运行任务
    const task = "What's the weather like in Shanghai tomorrow?";
    console.log(`执行任务: ${task}\n`);
    
    const result = await workforceAgent.run(task);
    
    console.log('=== 任务执行结果 ===');
    console.log(`状态: ${result.status}`);
    console.log(`输出: ${result.output}`);
    console.log(`执行时间: ${result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 'N/A'}ms`);
    console.log(`轮次: ${result.turns}`);
    
    if (result.error) {
      console.log(`错误: ${result.error}`);
    }

  } catch (error) {
    console.error('Workforce智能体执行失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  runWorkforceExample().catch(console.error);
}

export { runWorkforceExample };
