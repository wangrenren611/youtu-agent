/**
 * 简单智能体示例（无数据库依赖版本）
 * 演示当数据库不可用时，智能体如何正常工作
 */

import { YoutuAgentTS } from '../src/index';
import { Logger } from '../src/utils/Logger';

const logger = new Logger('SimpleExample');

async function runSimpleExample() {
  console.log('🚀 启动简单智能体示例（无数据库依赖版本）...\n');

  try {
    // 临时禁用DATABASE_URL
    const originalDatabaseUrl = process.env['DATABASE_URL'];
    delete process.env['DATABASE_URL'];
    
    // 创建框架实例
    const framework = new YoutuAgentTS();
    
    // 初始化框架
    await framework.initialize();
    
    console.log('✅ 框架初始化成功');
    console.log('📊 框架信息:', framework.getInfo());
    
    // 创建智能体配置
    const agentConfig = {
      type: 'simple' as const,
      name: 'simple_agent',
      model: {
        provider: 'deepseek' as const,
        model: 'deepseek-chat',
        apiKey: process.env['OPENAI_API_KEY'] || 'your-api-key-here',
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.7,
        maxTokens: 2000
      },
      tools: ['file_read', 'file_write', 'search'],
      instructions: `你是一个智能助手。你可以：
1. 读取和写入文件
2. 搜索信息
3. 回答各种问题

当用户询问数据库相关功能时，请友好地告知用户数据库功能不可用。`
    };

    // 创建智能体
    const agent = await framework.createAgent(agentConfig);
    console.log('✅ 智能体创建成功');
    
    // 开始新会话
    const sessionId = agent.startNewSession();
    console.log(`🎯 开始新会话: ${sessionId}`);
    
    // 测试基本功能
    console.log('\n🔍 测试基本功能...');
    
    const testQueries = [
      '你好，请介绍一下你自己',
      '请创建一个测试文件 hello.txt，内容为 "Hello from youtu-agent-ts!"',
      '请读取刚才创建的文件内容',
      '请搜索一下关于人工智能的最新信息'
    ];

    for (const query of testQueries) {
      console.log(`\n📝 查询: ${query}`);
      
      try {
        // 使用相同的会话ID来保持上下文
        const result = await agent.run(query, undefined, sessionId);
        console.log('✅ 结果:', result.output || '任务完成');
        console.log(`📊 会话历史数量: ${agent.getSessionHistory().length}`);
      } catch (error) {
        console.log('❌ 错误:', error instanceof Error ? error.message : error);
      }
    }

    // 测试数据库工具（预期会失败）
    console.log('\n🔍 测试数据库工具（预期失败）...');
    
    try {
      const dbResult = await agent.run('请查询数据库中的表结构');
      console.log('✅ 数据库结果:', dbResult);
    } catch (error) {
      console.log('❌ 数据库错误（预期）:', error instanceof Error ? error.message : error);
    }

    // 清理
    await framework.cleanup();
    
    // 恢复原始环境变量
    if (originalDatabaseUrl) {
      process.env['DATABASE_URL'] = originalDatabaseUrl;
    }
    
    console.log('\n✅ 示例完成');

  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  runSimpleExample().catch(console.error);
}

export { runSimpleExample };

