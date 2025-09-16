#!/usr/bin/env node

/**
 * youtu-agent-ts 命令行接口
 * 提供启动服务器、运行示例等功能
 */

import { Command } from 'commander';
import { APIServer } from './api/server';
import youtuAgent from './index';
import { Logger } from './utils/Logger';

const logger = new Logger('CLI');
const program = new Command();

program
  .name('youtu-agent-ts')
  .description('youtu-agent-ts 智能体框架')
  .version('1.0.0');

// 启动服务器命令
program
  .command('serve')
  .description('启动API服务器')
  .option('-p, --port <port>', '服务器端口', '3000')
  .option('--host <host>', '服务器主机', 'localhost')
  .action(async (options) => {
    try {
      logger.info('正在启动youtu-agent-ts服务器...');
      
      // 初始化框架
      await youtuAgent.initialize();
      
      // 启动API服务器
      const server = new APIServer(parseInt(options.port));
      await server.start();
      
      logger.info('服务器启动完成');
      
      // 优雅关闭
      process.on('SIGINT', async () => {
        logger.info('正在关闭服务器...');
        await server.stop();
        await youtuAgent.cleanup();
        process.exit(0);
      });
      
    } catch (error) {
      logger.error('服务器启动失败:', error);
      process.exit(1);
    }
  });

// 运行示例命令
program
  .command('example')
  .description('运行示例程序')
  .option('-c, --config <config>', '配置文件路径', 'configs/agents/simple.yaml')
  .action(async () => {
    try {
      logger.info('正在运行示例程序...');
      
      // 初始化框架
      await youtuAgent.initialize();
      
      // 加载配置
      const configManager = youtuAgent.getConfigManager();
      const config = await configManager.loadAgentConfig('simple');
      
      // 创建智能体
      const agent = await youtuAgent.createAgent(config);
      
      // 运行示例对话
      const examples = [
        '帮我创建一个名为hello.txt的文件，内容是"Hello World"',
      ];
      
      for (const input of examples) {
        logger.info(`\n👤 用户: ${input}`);
        
        try {
          const result = await agent.run(input);
          logger.info(`🤖 智能体: ${result.output}`);
          
          if (result.toolCalls.length > 0) {
            logger.info(`🔧 工具调用: ${result.toolCalls.length}次`);
          }
          
        } catch (error) {
          logger.error('❌ 执行失败:', error);
        }
      }
      
      // 清理资源
      await youtuAgent.cleanup();
      logger.info('示例程序运行完成');
      
    } catch (error) {
      logger.error('示例程序运行失败:', error);
      process.exit(1);
    }
  });

// 测试命令
program
  .command('test')
  .description('运行测试')
  .option('--watch', '监视模式')
  .option('--coverage', '生成覆盖率报告')
  .action(async (options) => {
    try {
      const { spawn } = await import('child_process');
      
      const args = ['test'];
      if (options.watch) args.push('--watch');
      if (options.coverage) args.push('--coverage');
      
      const testProcess = spawn('npm', args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      testProcess.on('close', (code) => {
        process.exit(code || 0);
      });
      
    } catch (error) {
      logger.error('测试运行失败:', error);
      process.exit(1);
    }
  });

// 构建命令
program
  .command('build')
  .description('构建项目')
  .action(async () => {
    try {
      const { spawn } = await import('child_process');
      
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('构建完成');
        } else {
          logger.error('构建失败');
          process.exit(1);
        }
      });
      
    } catch (error) {
      logger.error('构建失败:', error);
      process.exit(1);
    }
  });

// 信息命令
program
  .command('info')
  .description('显示框架信息')
  .action(async () => {
    try {
      await youtuAgent.initialize();
      
      const info = youtuAgent.getInfo();
      
      console.log('\n📊 youtu-agent-ts 框架信息:');
      console.log(`   名称: ${info.name}`);
      console.log(`   版本: ${info.version}`);
      console.log(`   状态: ${info.isInitialized ? '已初始化' : '未初始化'}`);
      console.log(`   智能体数量: ${info.agents.total}`);
      console.log(`   工具数量: ${info.tools.total}`);
      
      if (info.agents.total > 0) {
        console.log('\n🤖 智能体列表:');
        Object.entries(info.agents.byType).forEach(([type, count]) => {
          console.log(`   ${type}: ${count}个`);
        });
      }
      
      if (info.tools.total > 0) {
        console.log('\n🔧 工具列表:');
        info.tools.names.forEach(name => {
          console.log(`   ${name}`);
        });
      }
      
      await youtuAgent.cleanup();
      
    } catch (error) {
      logger.error('获取信息失败:', error);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse();

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
