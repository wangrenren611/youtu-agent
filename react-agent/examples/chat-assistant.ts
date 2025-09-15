/**
 * 聊天助手示例
 * 演示如何使用LLMAgent创建简单的聊天助手
 */
import { LLMAgent } from '../src/agents/LLMAgent';
import { TerminalUI } from '../src/ui/TerminalUI';
import { getLogger, setGlobalLogConfig, LogLevel } from '../src/utils/logger';

// 声明Node.js全局变量类型
declare const process: {
  env: Record<string, string | undefined>;
  stdout: {
    write(buffer: Uint8Array | string): boolean;
  };
  exit(code?: number): never;
  [key: string]: any;
};

// 设置日志级别
setGlobalLogConfig({ level: LogLevel.INFO });

const logger = getLogger('ChatAssistantExample');

/**
 * 主函数
 */
async function main() {
  logger.info('启动聊天助手示例');
  
  // 创建终端UI
  const ui = new TerminalUI({
    promptText: '你: ',
    showWelcome: true
  });
  
  // 创建LLM代理
  const chatAgent = new LLMAgent({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo'
  });
  
  try {
    // 构建代理
    await chatAgent.build();
    
    // 设置指令
    await chatAgent.setInstructions(`
      你是一个友好的聊天助手，可以回答用户的各种问题。
      请保持回答简洁、有帮助且友好。
      如果不知道答案，请诚实地说不知道，不要编造信息。
    `);
    
    // 启动UI
    ui.start();
    
    // 显示欢迎消息
    ui.print('聊天助手已启动，输入"退出"结束对话。', 'info');
    
    // 聊天循环
    let chatHistory = [];
    let running = true;
    
    while (running) {
      // 获取用户输入
      const userInput = await ui.readLine();
      
      // 检查是否退出
      if (userInput.toLowerCase() === '退出') {
        running = false;
        continue;
      }
      
      try {
        // 添加用户消息到历史
        const messages = chatHistory.map(msg => ({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: userInput });
        
        // 创建响应回调
        let response = '';
        
        // 发送请求
        process.stdout.write('助手: ');
        response = await chatAgent.run(messages);
        process.stdout.write(response);
        process.stdout.write('\n\n');
        
        // 添加助手响应到历史
        chatHistory.push({ role: 'user', content: userInput });
        chatHistory.push({ role: 'assistant', content: response });
        
        // 限制历史长度，避免token过多
        if (chatHistory.length > 10) {
          chatHistory = chatHistory.slice(chatHistory.length - 10);
        }
      } catch (error) {
        ui.print(`错误: ${error.message}`, 'error');
      }
    }
    
    ui.print('聊天已结束，感谢使用！', 'success');
  } catch (error) {
    logger.error(`程序执行失败: ${error}`);
  } finally {
    // 停止UI
    ui.stop();
    
    // 清理代理
    await chatAgent.cleanup();
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