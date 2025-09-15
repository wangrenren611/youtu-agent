/**
 * 示例运行器
 * 用于运行各种示例应用
 */
import * as path from 'path';
import { getLogger, setGlobalLogConfig, LogLevel } from '../src/utils/logger';

// 声明Node.js全局变量类型
declare const process: {
  argv: string[];
  exit(code?: number): never;
  [key: string]: any;
};

// 声明__dirname变量
declare const __dirname: string;

// 设置日志级别
setGlobalLogConfig({ level: LogLevel.INFO });

const logger = getLogger('ExampleRunner');

/**
 * 示例类型
 */
enum ExampleType {
  CHAT = 'chat',
  WEB_SEARCH = 'web-search'
}

/**
 * 获取示例路径
 * @param type 示例类型
 */
function getExamplePath(type: ExampleType): string {
  switch (type) {
    case ExampleType.CHAT:
      return path.join(__dirname, 'chat-assistant.ts');
    case ExampleType.WEB_SEARCH:
      return path.join(__dirname, 'simple-web-search.ts');
    default:
      throw new Error(`未知的示例类型: ${type}`);
  }
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
使用方法: npm run example <示例类型>

可用的示例类型:
  chat        - 聊天助手示例
  web-search  - 网页搜索示例
    `);
    process.exit(0);
  }
  
  // 解析示例类型
  const exampleType = args[0].toLowerCase();
  
  // 检查示例类型
  if (!Object.values(ExampleType).includes(exampleType as ExampleType)) {
    logger.error(`未知的示例类型: ${exampleType}`);
    process.exit(1);
  }
  
  // 获取示例路径
  const examplePath = getExamplePath(exampleType as ExampleType);
  
  // 运行示例
  logger.info(`运行示例: ${exampleType}`);
  
  try {
    // 动态导入示例模块
    await import(examplePath);
  } catch (error) {
    logger.error(`运行示例失败: ${error}`);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  logger.error(`程序执行失败: ${error}`);
  process.exit(1);
});