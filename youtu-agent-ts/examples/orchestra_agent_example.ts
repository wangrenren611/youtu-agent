/**
 * 编排智能体使用示例
 * 演示如何使用OrchestraAgent进行多智能体协作
 */

import youtuAgent, { AgentConfig } from '../src/index';
import { EvaluationManager, EvaluationConfig, TestCase } from '../src/eval/EvaluationManager';
import { TraceManager } from '../src/tracing/TraceManager';

async function main() {
  try {
    console.log('🚀 启动youtu-agent-ts扩展功能示例...');

    // 1. 演示编排智能体
    await demonstrateOrchestraAgent();

    // 2. 演示评估系统
    await demonstrateEvaluationSystem();

    // 3. 演示追踪系统
    await demonstrateTraceSystem();

    // 4. 演示新工具
    await demonstrateNewTools();

    console.log('✅ 扩展功能示例运行完成');

  } catch (error) {
    console.error('❌ 示例程序执行失败:', error);
    process.exit(1);
  }
}

/**
 * 演示编排智能体
 */
async function demonstrateOrchestraAgent() {
  console.log('\n📋 演示编排智能体...');

  try {
    // 创建编排智能体配置
    const orchestraConfig: AgentConfig = {
      type: 'orchestra',
      name: 'demo_orchestra',
      model: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      },
      plannerModel: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      },
      reporterModel: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      },
      workers: {
        researcher: {
          type: 'simple',
          name: 'researcher',
          model: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
          },
          tools: ['web_search', 'file_read'],
          instructions: '你是一个专业的研究员，擅长收集和分析信息。'
        },
        writer: {
          type: 'simple',
          name: 'writer',
          model: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
          },
          tools: ['file_write', 'file_read'],
          instructions: '你是一个专业的写作者，擅长整理和撰写内容。'
        }
      },
      workersInfo: [
        {
          name: 'researcher',
          desc: '信息研究员，负责收集和整理信息',
          strengths: ['网络搜索', '信息整理', '事实核查'],
          weaknesses: ['数据分析', '内容创作']
        },
        {
          name: 'writer',
          desc: '内容写作者，负责撰写和编辑内容',
          strengths: ['内容创作', '文案编辑', '结构化写作'],
          weaknesses: ['数据分析', '技术实现']
        }
      ],
      tools: ['web_search', 'file_read', 'file_write']
    };

    // 创建编排智能体
    const orchestraAgent = await youtuAgent.createAgent(orchestraConfig);
    console.log('✅ 编排智能体创建成功');

    // 运行复杂任务
    const complexTask = '请研究一下人工智能在教育领域的应用，并写一份详细的分析报告';
    console.log(`📝 执行复杂任务: ${complexTask}`);

    const result = await orchestraAgent.run(complexTask);
    console.log('📊 任务执行结果:');
    console.log(result.output);

    // 获取智能体信息
    const info = orchestraAgent.getInfo();
    console.log('📈 编排智能体信息:', info);

  } catch (error) {
    console.error('❌ 编排智能体演示失败:', error);
  }
}

/**
 * 演示评估系统
 */
async function demonstrateEvaluationSystem() {
  console.log('\n📊 演示评估系统...');

  try {
    const evaluationManager = new EvaluationManager();

    // 创建测试用例
    const testCases: TestCase[] = [
      {
        id: 'test_1',
        name: '基础对话测试',
        description: '测试智能体的基本对话能力',
        input: '你好，请介绍一下你自己',
        expectedKeywords: ['智能体', '助手', '帮助'],
        category: 'conversation',
        difficulty: 'easy',
        tags: ['basic', 'greeting']
      },
      {
        id: 'test_2',
        name: '文件操作测试',
        description: '测试智能体的文件操作能力',
        input: '请创建一个名为test.txt的文件，内容是"Hello World"',
        expectedKeywords: ['创建', '文件', 'Hello World'],
        category: 'file_operation',
        difficulty: 'medium',
        tags: ['file', 'creation']
      },
      {
        id: 'test_3',
        name: '搜索功能测试',
        description: '测试智能体的搜索能力',
        input: '搜索一下最新的AI技术发展',
        expectedKeywords: ['AI', '技术', '发展'],
        category: 'search',
        difficulty: 'medium',
        tags: ['search', 'ai']
      }
    ];

    // 创建评估配置
    const evaluationConfig: EvaluationConfig = {
      name: 'demo_evaluation',
      description: '演示评估系统功能',
      testCases,
      agentConfig: {
        type: 'simple',
        name: 'test_agent',
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
        },
        tools: ['file_read', 'file_write', 'web_search']
      },
      metrics: {
        accuracy: true,
        latency: true,
        tokenUsage: true,
        cost: true
      },
      timeout: 30000,
      maxRetries: 2
    };

    // 运行评估
    console.log('🔄 开始运行评估...');
    const results = await evaluationManager.runEvaluation(evaluationConfig);

    // 显示评估结果
    console.log('📈 评估结果:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testCase}: ${(result.score * 100).toFixed(2)}% (${result.passed ? '通过' : '失败'})`);
    });

    // 生成评估报告
    const report = evaluationManager.generateReport(results);
    console.log('\n📋 评估报告:');
    console.log(report);

  } catch (error) {
    console.error('❌ 评估系统演示失败:', error);
  }
}

/**
 * 演示追踪系统
 */
async function demonstrateTraceSystem() {
  console.log('\n🔍 演示追踪系统...');

  try {
    const traceManager = new TraceManager();

    // 开始追踪会话
    const traceId = traceManager.startTrace('demo_trace', {
      user: 'demo_user',
      session: 'demo_session'
    });
    console.log(`📝 开始追踪会话: ${traceId}`);

    // 记录一些事件
    traceManager.recordAgentStart(traceId, 'demo_agent', '测试输入');
    
    // 模拟一些处理时间
    await new Promise(resolve => setTimeout(resolve, 100));
    
    traceManager.recordToolCall(traceId, 'web_search', { query: 'AI技术' }, '搜索结果', 500);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    traceManager.recordAgentEnd(traceId, 'demo_agent', '测试输出', 800);

    // 结束追踪会话
    traceManager.endTrace(traceId, 'completed');
    console.log('✅ 追踪会话完成');

    // 获取追踪统计
    const stats = traceManager.getStats();
    console.log('📊 追踪统计:', stats);

    // 查询追踪数据
    const traces = traceManager.queryTraces({ status: 'completed' });
    console.log(`🔍 找到 ${traces.length} 个已完成的追踪会话`);

  } catch (error) {
    console.error('❌ 追踪系统演示失败:', error);
  }
}

/**
 * 演示新工具
 */
async function demonstrateNewTools() {
  console.log('\n🔧 演示新工具...');

  try {
    const toolManager = youtuAgent.getToolManager();

    // 演示图像工具
    console.log('🖼️ 演示图像工具...');
    try {
      const imageResult = await toolManager.callTool('image_generate', {
        prompt: '一只可爱的小猫',
        width: 512,
        height: 512,
        style: 'cartoon'
      });
      console.log('✅ 图像生成结果:', JSON.parse(imageResult));
    } catch (error) {
      console.log('⚠️ 图像工具演示跳过（需要图像生成API）');
    }

    // 演示数据处理工具
    console.log('📊 演示数据处理工具...');
    try {
      // 创建测试CSV数据
      const csvData = [
        { name: 'Alice', age: 25, city: 'New York' },
        { name: 'Bob', age: 30, city: 'London' },
        { name: 'Charlie', age: 35, city: 'Tokyo' }
      ];

      const csvResult = await toolManager.callTool('csv_process', {
        filePath: './test_data.csv',
        operation: 'write',
        parameters: { data: csvData }
      });
      console.log('✅ CSV写入结果:', JSON.parse(csvResult));

      // 读取CSV数据
      const readResult = await toolManager.callTool('csv_process', {
        filePath: './test_data.csv',
        operation: 'read'
      });
      console.log('✅ CSV读取结果:', JSON.parse(readResult));

    } catch (error) {
      console.log('⚠️ 数据处理工具演示跳过（文件权限问题）');
    }

    // 显示所有可用工具
    const allTools = toolManager.getAllTools();
    console.log(`🔧 当前共有 ${allTools.length} 个可用工具:`);
    allTools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

  } catch (error) {
    console.error('❌ 新工具演示失败:', error);
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
