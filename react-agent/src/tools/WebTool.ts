/**
 * Web工具模块
 * 提供Web相关的工具功能
 */
import axios, { AxiosRequestConfig } from 'axios';
import { BaseTool, ToolConfig } from './BaseTool';
import { getLogger } from '../utils/logger';

const logger = getLogger('WebTool');

/**
 * Web工具配置接口
 */
export interface WebToolConfig extends ToolConfig {
  /**
   * 默认请求超时时间(毫秒)
   */
  timeout?: number;
  
  /**
   * 默认请求头
   */
  headers?: Record<string, string>;
  
  /**
   * 代理配置
   */
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    }
  };
}

/**
 * Web工具类
 * 提供HTTP请求、网页抓取等功能
 */
export class WebTool extends BaseTool {
  /**
   * 工具配置
   */
  config: WebToolConfig;

  /**
   * 构造函数
   * @param config 工具配置
   */
  constructor(config: WebToolConfig = {}) {
    super(config);
    
    // 设置默认配置
    this.config = {
      ...this.config,
      timeout: this.config.timeout || 30000,
      headers: this.config.headers || {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '提供Web相关的工具功能，包括HTTP请求、网页抓取等';
  }

  /**
   * 发送HTTP GET请求
   * @param url 请求URL
   * @param config 请求配置
   */
  async get(url: string, config: AxiosRequestConfig = {}): Promise<any> {
    try {
      logger.info(`发送GET请求: ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: this.config.headers,
        proxy: this.config.proxy,
        ...config
      });
      
      return response.data;
    } catch (error) {
      logger.error(`GET请求失败: ${error}`);
      throw error;
    }
  }

  /**
   * 发送HTTP POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   */
  async post(url: string, data: any, config: AxiosRequestConfig = {}): Promise<any> {
    try {
      logger.info(`发送POST请求: ${url}`);
      
      const response = await axios.post(url, data, {
        timeout: this.config.timeout,
        headers: this.config.headers,
        proxy: this.config.proxy,
        ...config
      });
      
      return response.data;
    } catch (error) {
      logger.error(`POST请求失败: ${error}`);
      throw error;
    }
  }

  /**
   * 抓取网页内容
   * @param url 网页URL
   * @param config 请求配置
   */
  async scrape(url: string, config: AxiosRequestConfig = {}): Promise<string> {
    try {
      logger.info(`抓取网页: ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          ...this.config.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        },
        proxy: this.config.proxy,
        responseType: 'text',
        ...config
      });
      
      return response.data;
    } catch (error) {
      logger.error(`网页抓取失败: ${error}`);
      throw error;
    }
  }

  /**
   * 下载文件
   * @param url 文件URL
   * @param config 请求配置
   */
  async download(url: string, config: AxiosRequestConfig = {}): Promise<Buffer> {
    try {
      logger.info(`下载文件: ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: this.config.headers,
        proxy: this.config.proxy,
        responseType: 'arraybuffer',
        ...config
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`文件下载失败: ${error}`);
      throw error;
    }
  }
}