/**
 * Simple Search Example with String Tool
 * 使用字符串形式的工具名称实现简单搜索
 */

import { AgentFactory, AgentConfig } from '../src/index';

async function runSimpleSearchExample() {
  console.log('=== Simple Search Example (String Tool) ===\n');

  // 检查API密钥
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置OPENAI_API_KEY或DEEPSEEK_API_KEY环境变量');
    process.exit(1);
  }
  console.log('✅ API密钥已配置');

  console.log('创建Simple Search智能体...');
  
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
    tools: ['web_search'], // 使用字符串形式的工具名称
    instructions: `你是一个搜索专家，擅长通过搜索工具查找相关信息。
当用户询问问题时，你应该：
1. 使用web_search工具搜索相关信息
2. 直接返回搜索结果，不要添加任何额外的解释或分析
3. 不要尝试多次搜索，只搜索一次即可`
  };

  try {
    // 创建智能体
    const agent = await AgentFactory.createAgent(simpleAgentConfig);
    console.log('Simple Search智能体创建成功!');

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
runSimpleSearchExample().catch(console.error);