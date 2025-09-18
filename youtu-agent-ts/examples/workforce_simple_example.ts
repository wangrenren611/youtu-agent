/**
 * Workforce Agent 简化版示例
 * 演示如何使用修复后的 Workforce Agent 执行简单任务
 */

import youtuAgent from '../src/index';
import { AgentConfig } from '../src/types';

// 检查环境变量
function checkEnvVars() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey || deepseekKey === 'your-actual-deepseek-api-key-here') {
    console.warn('⚠️  警告: DEEPSEEK_API_KEY 未设置或使用默认值');
    console.warn('   请在 .env 文件中设置实际的 API 密钥以获得最佳体验');
  } else {
    console.log('✅ DEEPSEEK_API_KEY 已设置');
  }
}

async function main() {
  try {
    console.log('🚀 启动 Workforce Agent 简化版示例程序...');
    
    // 检查环境变量
    checkEnvVars();

    // 创建 Workforce Agent 配置
    const agentConfig: AgentConfig = {
      type: 'workforce',
      name: 'demo_workforce_agent',
      model: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here',
        baseUrl: 'https://api.deepseek.com',
        temperature: 0.7,
        maxTokens: 4000
      },
      workforcePlannerModel: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here',
        temperature: 0.3,
        maxTokens: 2000
      },
      workforceAssignerModel: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here',
        temperature: 0.5,
        maxTokens: 2000
      },
      workforceAnswererModel: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here',
        temperature: 0.5,
        maxTokens: 3000
      },
      workforceExecutorInfos: [
        {
          name: "researcher",
          description: "信息研究员，负责收集和整理信息",
          strengths: ["网络搜索", "信息整理", "事实核查"],
          weaknesses: ["数据分析", "内容创作"]
        },
        {
          name: "writer",
          description: "内容写作者，负责撰写和编辑内容",
          strengths: ["内容创作", "文案编辑", "结构化写作"],
          weaknesses: ["数据分析", "技术实现"]
        }
      ],
      workforceExecutorAgents: {
        researcher: {
          type: 'simple',
          name: 'researcher',
          model: {
            provider: 'deepseek',
            model: 'deepseek-chat',
            apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here'
          },
          tools: ['web_search'],
          instructions: '你是一个专业的研究员，擅长收集和分析信息。'
        },
        writer: {
          type: 'simple',
          name: 'writer',
          model: {
            provider: 'deepseek',
            model: 'deepseek-chat',
            apiKey: process.env.DEEPSEEK_API_KEY || 'your-api-key-here'
          },
          tools: [],
          instructions: '你是一个专业的写作者，擅长整理和撰写内容。'
        }
      },
      workforceExecutorConfig: {
        maxTries: 2,
        returnSummary: true
      },
      instructions: '你是一个协调多个专业智能体完成复杂任务的协调者。',
      tools: ['web_search'],
      maxTurns: 20
    };

    // 初始化框架
    console.log('🔧 初始化框架...');
    await youtuAgent.initialize();
    console.log('✅ 框架初始化完成');

    // 创建 Workforce Agent
    console.log('📝 创建 Workforce Agent...');
    const agent = await youtuAgent.createAgent(agentConfig);
    console.log('✅ Workforce Agent 创建成功');

    // 获取智能体信息
    const agentInfo = agent.getInfo();
    console.log('📊 智能体信息:', agentInfo);

    // 检查智能体是否就绪
    if (!agentInfo.isReady) {
      console.warn('⚠️  警告: 智能体未就绪');
    }

    // 运行 Workforce Agent
    console.log('🤖 开始与 Workforce Agent 对话...');
    
    const task = "请告诉我当前人工智能技术的主要发展趋势是什么？";
    console.log('📋 执行任务:', task);
    
    const result = await agent.run(task);
    
    console.log('\n📋 任务执行结果:');
    console.log('输入任务:', result.input);
    console.log('最终输出:', result.output);
    console.log('执行状态:', result.status);
    console.log('执行时间:', result.endTime ? 
      `${(result.endTime.getTime() - result.startTime.getTime()) / 1000} 秒` : 
      '未知');

    // 获取框架信息
    const frameworkInfo = youtuAgent.getInfo();
    console.log('\n📈 框架信息:', frameworkInfo);

    // 清理资源
    console.log('\n🧹 清理资源...');
    await youtuAgent.cleanup();
    console.log('✅ 资源清理完成');

  } catch (error) {
    console.error('❌ 程序执行失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行示例
if (require.main === module) {
  main();
}