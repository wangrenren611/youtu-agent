/**
 * Simple Direct Search Example
 * 直接使用simple agent实现搜索功能
 */

import { SimpleAgent, SimpleAgentConfig } from '../src/agents/SimpleAgent';
import { searchTools } from '../src/tools/SearchTool';

async function runSimpleDirectSearchExample() {
  console.log('=== Simple Direct Search Example ===\n');

  // 使用模拟API密钥
  const apiKey = "sk-1f23a..."; // 模拟API密钥
  console.log('✅ 使用模拟API密钥');

  console.log('创建Simple Direct Search智能体...');
  
  // 创建simple智能体配置
  const simpleAgentConfig: SimpleAgentConfig = {
    name: 'simple_direct_search',
    model: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: apiKey,
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 2000
    },
    tools: searchTools.filter(tool => tool.name === 'web_search'),
    instructions: `你是一个搜索专家，擅长通过搜索工具查找相关信息。
当用户询问问题时，你应该：
1. 使用web_search工具搜索相关信息
2. 直接返回搜索结果，不要添加任何额外的解释或分析
3. 不要尝试多次搜索，只搜索一次即可`
  };

  try {
    // 直接创建SimpleAgent实例
    const agent = new SimpleAgent(simpleAgentConfig);
    await agent.init();
    console.log('Simple Direct Search智能体创建成功!');

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
runSimpleDirectSearchExample().catch(console.error);