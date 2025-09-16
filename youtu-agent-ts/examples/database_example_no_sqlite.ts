/**
 * 数据库功能示例（无SQLite依赖版本）
 * 演示当数据库不可用时，智能体如何优雅地处理
 */

import { YoutuAgentTS } from '../src/index';
import { Logger } from '../src/utils/Logger';

const logger = new Logger('DatabaseExample');

async function runDatabaseExample() {
  console.log('🚀 启动数据库功能示例（无SQLite依赖版本）...\n');

  try {
    // 创建框架实例（不设置DATABASE_URL，模拟数据库不可用的情况）
    const framework = new YoutuAgentTS();
    
    // 初始化框架
    await framework.initialize();
    
    console.log('✅ 框架初始化成功');
    console.log('📊 框架信息:', framework.getInfo());
    
    // 创建智能体配置
    const agentConfig = {
      type: 'simple' as const,
      name: 'database_agent',
      model: {
        provider: 'deepseek' as const,
        model: 'deepseek-chat',
        apiKey: process.env['OPENAI_API_KEY'] || 'your-api-key-here',
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.7,
        maxTokens: 2000
      },
      tools: ['database', 'file_read', 'file_write'],
      instructions: `你是一个数据库助手。你可以：
1. 查询数据库表结构
2. 执行SQL查询
3. 插入、更新、删除数据
4. 分析数据

当数据库不可用时，请友好地告知用户并提供替代方案。`
    };

    // 创建智能体
    const agent = await framework.createAgent(agentConfig);
    console.log('✅ 智能体创建成功');
    
    // 测试数据库工具（预期会失败，因为数据库不可用）
    console.log('\n🔍 测试数据库工具...');
    
    const testQueries = [
      '请查询数据库中的表结构',
      '请创建一个测试表',
      '请插入一些测试数据'
    ];

    for (const query of testQueries) {
      console.log(`\n📝 查询: ${query}`);
      
      try {
        const result = await agent.run(query);
        console.log('✅ 结果:', result);
      } catch (error) {
        console.log('❌ 错误:', error instanceof Error ? error.message : error);
      }
    }

    // 测试其他工具（应该正常工作）
    console.log('\n🔍 测试文件工具...');
    
    try {
      const fileResult = await agent.run('请创建一个测试文件 test.txt，内容为 "Hello World"');
      console.log('✅ 文件操作结果:', fileResult);
    } catch (error) {
      console.log('❌ 文件操作错误:', error instanceof Error ? error.message : error);
    }

    // 清理
    await framework.cleanup();
    console.log('\n✅ 示例完成');

  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  runDatabaseExample().catch(console.error);
}

export { runDatabaseExample };

