/**
 * 数据库功能示例
 * 展示如何使用数据库工具进行数据操作
 */

import { YoutuAgentTS } from '../src/index';
import { AgentConfig } from '../src/types';

async function main() {
  console.log('🚀 启动数据库功能示例...\n');

  // 初始化框架
  const framework = new YoutuAgentTS();
  await framework.initialize();

  console.log('📊 框架信息:');
  console.log(JSON.stringify(framework.getInfo(), null, 2));
  console.log('');

  // 检查数据库是否可用
  const dbManager = framework.getDatabaseManager();
  if (!dbManager) {
    console.log('❌ 数据库未配置，请在.env文件中设置DATABASE_URL');
    console.log('例如: DATABASE_URL=sqlite:./data/youtu-agent.db');
    return;
  }

  console.log('✅ 数据库已配置');

  // 创建智能体配置
  const agentConfig: AgentConfig = {
    type: 'simple',
    name: 'database_agent',
    model: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.7,
        maxTokens: 2000
      },
    tools: ['database', 'file_read', 'file_write'],
    instructions: `你是一个数据库助手。你可以：
1. 执行SQL查询来获取数据
2. 插入新数据到数据库
3. 更新现有数据
4. 删除数据
5. 分析数据并生成报告

请根据用户的需求执行相应的数据库操作。

使用SQLite时请遵循以下规则：
- 列出所有表名：SELECT name FROM sqlite_master WHERE type='table';
- 查看某个表的结构：PRAGMA table_info('表名');
- 严禁使用“.tables”等SQLite命令行专用指令，只能使用标准SQL/PRAGMA。
- insert/update/delete 时可仅提供表名与数据，由工具自动构建参数化SQL。
- query/execute 操作必须提供完整的SQL字符串。
`,
    maxTurns: 6,
    react: {
      maxTurns: 6,
      maxConsecutiveFailures: 2,
      historyWindow: 5,
      failureKeywords: ['"success":false', '"error"', 'SQLITE_ERROR', 'SQLITE_BUSY', 'SQLITE_LOCKED', 'SQLITE_CONSTRAINT', 'no such table', 'syntax error']
    }
  };

  try {
    // 创建智能体
    const agent = await framework.createAgent(agentConfig);
    console.log('✅ 智能体创建成功');

    // 示例1: 查询数据库表结构
    console.log('\n📋 示例1: 查询数据库表结构');
    const result1 = await agent.run('请查询数据库中所有的表名，并显示每个表的结构');
    console.log('智能体响应:', result1.output);
    console.log('');
    // 为了加快调试，仅运行示例1
    return;
    // 示例2: 插入测试数据
    console.log('📝 示例2: 插入测试数据');
    const result2 = await agent.run('请在evaluation_data表中插入一条测试数据，包含以下信息：dataset="test", raw_question="什么是人工智能？", correct_answer="人工智能是计算机科学的一个分支", exp_id="demo_001"');
    console.log('智能体响应:', result2.output);
    console.log('');

    // 示例3: 插入更多测试数据
    console.log('📝 示例3: 插入更多测试数据');
    const result3 = await agent.run('请在evaluation_data表中再插入两条数据：1) dataset="test", raw_question="什么是机器学习？", correct_answer="机器学习是人工智能的一个子领域", exp_id="demo_001" 2) dataset="test", raw_question="什么是深度学习？", correct_answer="深度学习是机器学习的一个分支", exp_id="demo_001"');
    console.log('智能体响应:', result3.output);
    console.log('');

    // 示例4: 查询数据
    console.log('🔍 示例4: 查询数据');
    const result4 = await agent.run('请查询evaluation_data表中所有的数据，按dataset分组显示');
    console.log('智能体响应:', result4.output);
    console.log('');

    // 示例5: 数据分析
    console.log('📊 示例5: 数据分析');
    const result5 = await agent.run('请分析evaluation_data表中的数据，统计不同数据集的数量，并生成一个简单的报告');
    console.log('智能体响应:', result5.output);
    console.log('');

    // 示例6: 更新数据
    console.log('✏️ 示例6: 更新数据');
    const result6 = await agent.run('请将evaluation_data表中dataset为"test"的所有记录的stage字段更新为"rollout"');
    console.log('智能体响应:', result6.output);
    console.log('');

    // 示例7: 最终查询
    console.log('🔍 示例7: 最终查询');
    const result7 = await agent.run('请查询evaluation_data表中stage为"rollout"的所有记录');
    console.log('智能体响应:', result7.output);
    console.log('');

  } catch (error) {
    console.error('❌ 示例执行失败:', error);
  } finally {
    // 清理资源
    await framework.cleanup();
    console.log('🧹 资源清理完成');
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}

export { main as runDatabaseExample };
