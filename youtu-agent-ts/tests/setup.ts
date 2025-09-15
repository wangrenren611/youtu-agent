/**
 * 测试环境设置
 */

import { Logger } from '../src/utils/Logger';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // 测试时减少日志输出

// 创建测试日志器
const testLogger = new Logger('Test');

// 全局测试超时
jest.setTimeout(30000);

// 测试前清理
beforeEach(() => {
  // 清理环境变量
  delete process.env.OPENAI_API_KEY;
});

// 测试后清理
afterEach(() => {
  // 清理任何全局状态
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  testLogger.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  testLogger.error('未捕获的异常:', error);
});
