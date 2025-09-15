/**
 * 终端UI模块
 * 提供命令行界面交互功能
 */
import readline from 'readline';
import chalk from 'chalk';
import { getLogger } from '../utils/logger';

const logger = getLogger('TerminalUI');

/**
 * 终端UI配置接口
 */
export interface TerminalUIConfig {
  /**
   * 是否显示欢迎信息
   */
  showWelcome: boolean;
  
  /**
   * 是否显示提示符
   */
  showPrompt: boolean;
  
  /**
   * 提示符文本
   */
  promptText: string;
  
  /**
   * 是否显示颜色
   */
  useColors: boolean;
}

/**
 * 默认终端UI配置
 */
const DEFAULT_CONFIG: TerminalUIConfig = {
  showWelcome: true,
  showPrompt: true,
  promptText: '> ',
  useColors: true
};

/**
 * 终端UI类
 */
export class TerminalUI {
  /**
   * 终端UI配置
   */
  private config: TerminalUIConfig;
  
  /**
   * readline接口
   */
  private rl: readline.Interface;
  
  /**
   * 是否正在运行
   */
  private running: boolean = false;

  /**
   * 构造函数
   * @param config 终端UI配置
   */
  constructor(config: Partial<TerminalUIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 创建readline接口
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 启动终端UI
   */
  start(): void {
    if (this.running) {
      return;
    }
    
    this.running = true;
    
    // 显示欢迎信息
    if (this.config.showWelcome) {
      this.showWelcome();
    }
    
    // 显示提示符
    if (this.config.showPrompt) {
      this.showPrompt();
    }
  }

  /**
   * 停止终端UI
   */
  stop(): void {
    if (!this.running) {
      return;
    }
    
    this.running = false;
    this.rl.close();
  }

  /**
   * 显示欢迎信息
   */
  private showWelcome(): void {
    const welcomeText = `
    ┌─────────────────────────────────────────┐
    │                                         │
    │   欢迎使用 React Agent 终端界面         │
    │   输入 'help' 获取帮助                  │
    │   输入 'exit' 退出程序                  │
    │                                         │
    └─────────────────────────────────────────┘
    `;
    
    console.log(this.config.useColors ? chalk.cyan(welcomeText) : welcomeText);
  }

  /**
   * 显示提示符
   */
  private showPrompt(): void {
    this.rl.prompt();
  }

  /**
   * 读取用户输入
   * @param promptText 提示文本
   */
  async readLine(promptText?: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(promptText || this.config.promptText, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * 输出信息
   * @param message 消息文本
   * @param type 消息类型
   */
  print(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (!this.config.useColors) {
      console.log(message);
      return;
    }
    
    switch (type) {
      case 'info':
        console.log(chalk.white(message));
        break;
      case 'success':
        console.log(chalk.green(message));
        break;
      case 'warning':
        console.log(chalk.yellow(message));
        break;
      case 'error':
        console.log(chalk.red(message));
        break;
    }
  }

  /**
   * 清屏
   */
  clear(): void {
    console.clear();
  }

  /**
   * 设置事件监听器
   * @param event 事件名称
   * @param listener 监听器函数
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.rl.on(event, listener);
  }
}