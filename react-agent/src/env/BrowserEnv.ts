/**
 * 浏览器环境类
 * 提供浏览器自动化功能
 */
import puppeteer, { Browser, Page } from 'puppeteer';
import { BaseEnv, EnvConfig } from './BaseEnv';
import { getLogger } from '../utils/logger';

const logger = getLogger('BrowserEnv');

/**
 * 浏览器环境配置接口
 */
export interface BrowserEnvConfig extends EnvConfig {
  config: {
    /**
     * 是否使用无头模式
     */
    headless?: boolean;
    
    /**
     * 浏览器窗口宽度
     */
    width?: number;
    
    /**
     * 浏览器窗口高度
     */
    height?: number;
    
    /**
     * 默认超时时间(毫秒)
     */
    timeout?: number;
    
    /**
     * 其他Puppeteer启动参数
     */
    launchOptions?: Record<string, any>;
  }
}

/**
 * 浏览器环境类
 */
export class BrowserEnv extends BaseEnv {
  /**
   * 浏览器实例
   */
  private browser: Browser | null = null;
  
  /**
   * 当前页面
   */
  private page: Page | null = null;

  /**
   * 构造函数
   * @param config 浏览器环境配置
   */
  constructor(config: BrowserEnvConfig | Record<string, any> | null = null) {
    super(config);
    
    // 设置默认配置
    if (!this.config.config.headless) {
      this.config.config.headless = true;
    }
    
    if (!this.config.config.width) {
      this.config.config.width = 1280;
    }
    
    if (!this.config.config.height) {
      this.config.config.height = 800;
    }
    
    if (!this.config.config.timeout) {
      this.config.config.timeout = 30000;
    }
  }

  /**
   * 构建环境
   */
  async build(): Promise<void> {
    await super.build();
    
    try {
      // 启动浏览器
      this.browser = await puppeteer.launch({
        headless: this.config.config.headless ? 'new' : false,
        defaultViewport: {
          width: this.config.config.width,
          height: this.config.config.height
        },
        timeout: this.config.config.timeout,
        ...this.config.config.launchOptions
      });
      
      // 创建新页面
      this.page = await this.browser.newPage();
      
      logger.info('浏览器环境已启动');
    } catch (error) {
      logger.error(`浏览器环境启动失败: ${error}`);
      throw error;
    }
  }

  /**
   * 清理环境
   */
  async cleanup(): Promise<void> {
    try {
      // 关闭浏览器
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
      
      logger.info('浏览器环境已关闭');
    } catch (error) {
      logger.error(`浏览器环境关闭失败: ${error}`);
    }
    
    await super.cleanup();
  }

  /**
   * 重置环境
   */
  async reset(): Promise<void> {
    try {
      // 关闭当前页面
      if (this.page) {
        await this.page.close();
      }
      
      // 创建新页面
      if (this.browser) {
        this.page = await this.browser.newPage();
      }
      
      logger.info('浏览器环境已重置');
    } catch (error) {
      logger.error(`浏览器环境重置失败: ${error}`);
      throw error;
    }
  }

  /**
   * 执行动作
   * @param action 动作对象
   */
  async step(action: BrowserAction): Promise<any> {
    if (!this.page) {
      throw new Error('浏览器页面未初始化');
    }
    
    try {
      switch (action.type) {
        case 'goto':
          await this.page.goto(action.url, { waitUntil: 'networkidle2' });
          break;
          
        case 'click':
          await this.page.click(action.selector);
          break;
          
        case 'type':
          await this.page.type(action.selector, action.text);
          break;
          
        case 'select':
          await this.page.select(action.selector, action.value);
          break;
          
        case 'wait':
          if (action.selector) {
            await this.page.waitForSelector(action.selector, { timeout: action.timeout });
          } else if (action.timeout) {
            await this.page.waitForTimeout(action.timeout);
          }
          break;
          
        case 'evaluate':
          return await this.page.evaluate(action.script, ...(action.args || []));
          
        default:
          throw new Error(`未知的浏览器动作类型: ${(action as any).type}`);
      }
      
      return await this.observe();
    } catch (error) {
      logger.error(`执行浏览器动作失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取观察
   */
  async observe(): Promise<BrowserObservation> {
    if (!this.page) {
      throw new Error('浏览器页面未初始化');
    }
    
    try {
      // 获取当前URL
      const url = this.page.url();
      
      // 获取页面标题
      const title = await this.page.title();
      
      // 获取页面内容
      const content = await this.page.content();
      
      // 获取页面截图
      const screenshot = await this.page.screenshot({ encoding: 'base64' });
      
      return {
        url,
        title,
        content,
        screenshot: screenshot.toString()
      };
    } catch (error) {
      logger.error(`获取浏览器观察失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取当前页面
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * 获取浏览器实例
   */
  getBrowser(): Browser | null {
    return this.browser;
  }
}

/**
 * 浏览器动作类型
 */
export type BrowserAction = 
  | { type: 'goto', url: string }
  | { type: 'click', selector: string }
  | { type: 'type', selector: string, text: string }
  | { type: 'select', selector: string, value: string }
  | { type: 'wait', selector?: string, timeout?: number }
  | { type: 'evaluate', script: string | Function, args?: any[] };

/**
 * 浏览器观察接口
 */
export interface BrowserObservation {
  /**
   * 当前URL
   */
  url: string;
  
  /**
   * 页面标题
   */
  title: string;
  
  /**
   * 页面内容
   */
  content: string;
  
  /**
   * 页面截图(Base64)
   */
  screenshot: string;
}