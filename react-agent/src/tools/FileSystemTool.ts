/**
 * 文件系统工具模块
 * 提供文件和目录操作功能
 */
import * as fs from 'fs';
import * as path from 'path';
import { BaseTool } from './BaseTool.js';

// 声明Node.js全局变量类型
declare const process: {
  cwd(): string;
  [key: string]: any;
};

// 声明Buffer编码类型
type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';
import { getLogger } from '../utils/logger';

const logger = getLogger('FileSystemTool');

/**
 * 文件系统工具配置接口
 */
export interface FileSystemToolConfig extends ToolConfig {
  /**
   * 根目录路径
   * 所有操作将被限制在此目录内
   */
  rootDir?: string;
  
  /**
   * 是否允许写入操作
   */
  allowWrite?: boolean;
  
  /**
   * 是否允许删除操作
   */
  allowDelete?: boolean;
}

/**
 * 文件系统工具类
 * 提供文件和目录操作功能
 */
export class FileSystemTool extends BaseTool {
  /**
   * 工具配置
   */
  config: FileSystemToolConfig;

  /**
   * 构造函数
   * @param config 工具配置
   */
  constructor(config: Partial<FileSystemToolConfig> = {}) {
    const defaultConfig: FileSystemToolConfig = {
      name: 'filesystem',
      rootDir: config.rootDir || process.cwd(),
      allowWrite: config.allowWrite !== undefined ? config.allowWrite : true,
      allowDelete: config.allowDelete !== undefined ? config.allowDelete : false
    };
    
    super(defaultConfig);
    
    // 初始化配置
    this.config = defaultConfig;
    
    // 确保根目录存在
    if (!fs.existsSync(this.config.rootDir)) {
      throw new Error(`根目录不存在: ${this.config.rootDir}`);
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '提供文件和目录操作功能，包括读取、写入、列表等';
  }

  /**
   * 验证路径是否在根目录内
   * @param filePath 文件路径
   */
  private validatePath(filePath: string): string {
    // 获取绝对路径
    const absolutePath = path.resolve(this.config.rootDir, filePath);
    
    // 检查路径是否在根目录内
    if (!absolutePath.startsWith(this.config.rootDir)) {
      throw new Error(`路径超出根目录范围: ${filePath}`);
    }
    
    return absolutePath;
  }

  /**
   * 读取文件内容
   * @param filePath 文件路径
   * @param encoding 编码方式
   */
  async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
      const absolutePath = this.validatePath(filePath);
      
      logger.info(`读取文件: ${absolutePath}`);
      
      return await fs.promises.readFile(absolutePath, { encoding });
    } catch (error) {
      logger.error(`读取文件失败: ${error}`);
      throw error;
    }
  }

  /**
   * 写入文件内容
   * @param filePath 文件路径
   * @param content 文件内容
   * @param encoding 编码方式
   */
  async writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    // 检查是否允许写入
    if (!this.config.allowWrite) {
      throw new Error('不允许写入操作');
    }
    
    try {
      const absolutePath = this.validatePath(filePath);
      
      // 确保目录存在
      await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
      
      logger.info(`写入文件: ${absolutePath}`);
      
      await fs.promises.writeFile(absolutePath, content, { encoding });
    } catch (error) {
      logger.error(`写入文件失败: ${error}`);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   */
  async deleteFile(filePath: string): Promise<void> {
    // 检查是否允许删除
    if (!this.config.allowDelete) {
      throw new Error('不允许删除操作');
    }
    
    try {
      const absolutePath = this.validatePath(filePath);
      
      logger.info(`删除文件: ${absolutePath}`);
      
      await fs.promises.unlink(absolutePath);
    } catch (error) {
      logger.error(`删除文件失败: ${error}`);
      throw error;
    }
  }

  /**
   * 列出目录内容
   * @param dirPath 目录路径
   */
  async listDir(dirPath: string): Promise<string[]> {
    try {
      const absolutePath = this.validatePath(dirPath);
      
      logger.info(`列出目录: ${absolutePath}`);
      
      return await fs.promises.readdir(absolutePath);
    } catch (error) {
      logger.error(`列出目录失败: ${error}`);
      throw error;
    }
  }

  /**
   * 检查文件或目录是否存在
   * @param filePath 文件或目录路径
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = this.validatePath(filePath);
      
      return fs.existsSync(absolutePath);
    } catch (error) {
      logger.error(`检查文件存在失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取文件状态
   * @param filePath 文件路径
   */
  async stat(filePath: string): Promise<fs.Stats> {
    try {
      const absolutePath = this.validatePath(filePath);
      
      return await fs.promises.stat(absolutePath);
    } catch (error) {
      logger.error(`获取文件状态失败: ${error}`);
      throw error;
    }
  }
}