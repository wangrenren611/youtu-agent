/**
 * 简单网页搜索示例
 * 演示如何使用WebAgent进行网页搜索和信息提取
 */
import { WebAgent } from '../src/agents/WebAgent';
import { getLogger, setGlobalLogConfig, LogLevel } from '../src/utils/logger';

// 声明Node.js全局变量类型
declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
  [key: string]: any;
};

// 设置日志级别
setGlobalLogConfig({ level: LogLevel.INFO });

const logger = getLogger('WebSearchExample');

/**
 * 主函数
 */
async function main() {
  logger.info('启动简单网页搜索示例');
  
  // 创建Web代理
  const webAgent = new WebAgent({
    name: 'SearchAgent',
    llmConfig: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo',
    },
    browserConfig: {
      headless: false, // 设置为false以显示浏览器窗口
      width: 1280,
      height: 800
    },
    maxSteps: 5
  });
  
  try {
    // 构建代理
    await webAgent.build();
    
    // 执行搜索任务
    const task = '搜索"TypeScript代理模式"并提取前三个搜索结果的标题和链接';
    logger.info(`执行任务: ${task}`);
    
    const result = await webAgent.run(task);
    
    // 输出结果
    logger.info('任务执行结果:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    logger.error(`任务执行失败: ${error}`);
  } finally {
    // 清理代理
    await webAgent.cleanup();
  }
}

// 检查API密钥
if (!process.env.OPENAI_API_KEY) {
  logger.error('请设置OPENAI_API_KEY环境变量');
  process.exit(1);
}

// 运行主函数
main().catch(error => {
  logger.error(`程序执行失败: ${error}`);
  process.exit(1);
});