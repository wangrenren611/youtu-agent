/**
 * Node.js 环境类
 * 提供 Node.js 环境的配置和管理
 */
import { BaseEnv, EnvConfig } from './BaseEnv';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Node.js 环境配置接口
 */
export interface NodeEnvConfig extends EnvConfig {
  /**
   * 工作目录
   */
  workingDir?: string;
  
  /**
   * 环境变量
   */
  env?: Record<string, string>;
  
  /**
   * 超时时间（毫秒）
   */
  timeout?: number;
}

/**
 * Node.js 环境类
 */
export class NodeEnv extends BaseEnv {
  /**
   * 工作目录
   */
  workingDir: string;
  
  /**
   * 环境变量
   */
  envVars: Record<string, string>;
  
  /**
   * 超时时间（毫秒）
   */
  timeout: number;
  
  /**
   * 构造函数
   * @param config 环境配置
   */
  constructor(config: NodeEnvConfig) {
    super(config);
    
    // 设置工作目录
    this.workingDir = config.config.workingDir || process.cwd();
    
    // 设置环境变量
    this.envVars = {
      ...process.env,
      ...config.config.env
    };
    
    // 设置超时时间
    this.timeout = config.config.timeout || 30000; // 默认 30 秒
  }
  
  /**
   * 构建环境
   */
  async build(): Promise<void> {
    await super.build();
    
    // 确保工作目录存在
    if (!fs.existsSync(this.workingDir)) {
      fs.mkdirSync(this.workingDir, { recursive: true });
    }
  }
  
  /**
   * 重置环境
   */
  async reset(): Promise<void> {
    // 重置环境变量
    this.envVars = {
      ...process.env,
      ...this.config.config.env
    };
  }
  
  /**
   * 执行命令
   * @param command 命令
   */
  async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execAsync(command, {
        cwd: this.workingDir,
        env: this.envVars,
        timeout: this.timeout
      });
    } catch (error) {
      throw new Error(`执行命令失败: ${error}`);
    }
  }
  
  /**
   * 执行动作
   * @param action 动作
   */
  async step(action: { type: string; payload: any }): Promise<any> {
    switch (action.type) {
      case 'execute_command':
        return await this.executeCommand(action.payload);
        
      case 'read_file':
        return await this.readFile(action.payload);
        
      case 'write_file':
        return await this.writeFile(action.payload.path, action.payload.content);
        
      case 'list_directory':
        return await this.listDirectory(action.payload);
        
      default:
        throw new Error(`未知的动作类型: ${action.type}`);
    }
  }
  
  /**
   * 获取观察
   */
  async observe(): Promise<any> {
    return {
      workingDir: this.workingDir,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
  }
  
  /**
   * 读取文件
   * @param filePath 文件路径
   */
  async readFile(filePath: string): Promise<string> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workingDir, filePath);
    
    try {
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`读取文件失败: ${error}`);
    }
  }
  
  /**
   * 写入文件
   * @param filePath 文件路径
   * @param content 文件内容
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workingDir, filePath);
    
    try {
      // 确保目录存在
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
    } catch (error) {
      throw new Error(`写入文件失败: ${error}`);
    }
  }
  
  /**
   * 列出目录内容
   * @param dirPath 目录路径
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(this.workingDir, dirPath);
    
    try {
      return fs.readdirSync(fullPath);
    } catch (error) {
      throw new Error(`列出目录内容失败: ${error}`);
    }
  }
  
  /**
   * 清理环境
   */
  async cleanup(): Promise<void> {
    await super.cleanup();
  }
}