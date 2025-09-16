/**
 * Glob文件操作示例
 * 演示如何使用glob模式进行文件搜索和批量操作
 */

import { YoutuAgentTS } from '../src/index';
import { AgentConfig } from '../src/types';

async function main() {
  console.log('🚀 启动Glob文件操作示例...\n');

  // 创建框架实例
  const framework = new YoutuAgentTS();
  
  try {
    // 初始化框架
    await framework.initialize();
    console.log('✅ 框架初始化成功');

    // 配置智能体
    const agentConfig: AgentConfig = {
      type: 'simple',
      name: 'glob_agent',
      model: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env['OPENAI_API_KEY'] || 'your-api-key-here',
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.7,
        maxTokens: 2000
      },
      tools: ['file_glob', 'file_batch', 'file_read', 'file_write', 'file_list'],
      instructions: `你是一个文件操作助手，专门处理glob模式的文件搜索和批量操作。你可以：
      - 使用glob模式搜索文件（如 "**/*.txt", "src/**/*.js"）
      - 批量读取、写入、删除文件
      - 获取文件信息
      - 列出目录内容
      
      请根据用户的需求，使用合适的工具来完成任务。`
    };

    // 创建智能体
    const agent = await framework.createAgent(agentConfig);
    console.log('✅ 智能体创建成功');

    // 开始新会话
    const sessionId = agent.startNewSession();
    console.log(`🎯 开始新会话: ${sessionId}\n`);

    // 示例1: 搜索所有TypeScript文件
    console.log('📝 示例1: 搜索所有TypeScript文件');
    try {
      const result1 = await agent.run(
        '请搜索当前目录下所有的TypeScript文件（.ts和.tsx文件）',
        undefined,
        sessionId
      );
      console.log('✅ 结果:', result1.output || '任务完成');
    } catch (error) {
      console.log('❌ 错误:', error instanceof Error ? error.message : error);
    }

    // 示例2: 搜索配置文件
    console.log('\n📝 示例2: 搜索配置文件');
    try {
      const result2 = await agent.run(
        '请搜索所有的配置文件（package.json, tsconfig.json, .env等）',
        undefined,
        sessionId
      );
      console.log('✅ 结果:', result2.output || '任务完成');
    } catch (error) {
      console.log('❌ 错误:', error instanceof Error ? error.message : error);
    }

    // 示例3: 批量创建测试文件
    console.log('\n📝 示例3: 批量创建测试文件');
    try {
      const result3 = await agent.run(
        '请在temp目录下创建3个测试文件：test1.txt, test2.txt, test3.txt，内容分别为"测试文件1", "测试文件2", "测试文件3"',
        undefined,
        sessionId
      );
      console.log('✅ 结果:', result3.output || '任务完成');
    } catch (error) {
      console.log('❌ 错误:', error instanceof Error ? error.message : error);
    }

    // 示例4: 批量读取刚创建的文件
    console.log('\n📝 示例4: 批量读取测试文件');
    try {
      const result4 = await agent.run(
        '请批量读取temp目录下所有的.txt文件内容',
        undefined,
        sessionId
      );
      console.log('✅ 结果:', result4.output || '任务完成');
    } catch (error) {
      console.log('❌ 错误:', error instanceof Error ? error.message : error);
    }

    // 示例5: 搜索并获取文件信息
    console.log('\n📝 示例5: 搜索并获取文件信息');
    try {
      const result5 = await agent.run(
        '请搜索所有的README文件，并获取它们的基本信息（大小、修改时间等）',
        undefined,
        sessionId
      );
      console.log('✅ 结果:', result5.output || '任务完成');
    } catch (error) {
      console.log('❌ 错误:', error instanceof Error ? error.message : error);
    }

    // 示例6: 清理测试文件
    console.log('\n📝 示例6: 清理测试文件');
    try {
      const result6 = await agent.run(
        '请删除temp目录下所有的测试文件（test*.txt）',
        undefined,
        sessionId
      );
      console.log('✅ 结果:', result6.output || '任务完成');
    } catch (error) {
      console.log('❌ 错误:', error instanceof Error ? error.message : error);
    }

    // 显示会话历史
    console.log(`\n📊 会话历史数量: ${agent.getSessionHistory().length}`);
    console.log('🎉 Glob文件操作示例完成！');

  } catch (error) {
    console.error('❌ 示例运行失败:', error);
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

export { main as globExample };
