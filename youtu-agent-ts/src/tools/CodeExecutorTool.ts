/**
 * 代码执行工具
 * 提供Python、JavaScript等代码的安全执行功能
 */

import { ToolDefinition, ToolHandler } from '../types';
import { z } from 'zod';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/Logger';

const logger = new Logger('CodeExecutorTool');

// Python代码执行参数模式
const PythonExecuteSchema = z.object({
  code: z.string().describe('要执行的Python代码'),
  timeout: z.number().optional().default(30).describe('执行超时时间（秒）'),
  workingDir: z.string().optional().describe('工作目录')
});

// JavaScript代码执行参数模式
const JavaScriptExecuteSchema = z.object({
  code: z.string().describe('要执行的JavaScript代码'),
  timeout: z.number().optional().default(30).describe('执行超时时间（秒）'),
  workingDir: z.string().optional().describe('工作目录')
});

// Shell命令执行参数模式
const ShellExecuteSchema = z.object({
  command: z.string().describe('要执行的Shell命令'),
  timeout: z.number().optional().default(30).describe('执行超时时间（秒）'),
  workingDir: z.string().optional().describe('工作目录')
});

// Python代码执行处理器
const pythonExecuteHandler: ToolHandler = async (args) => {
  try {
    const { code, timeout, workingDir } = args;
    
    logger.info('执行Python代码', { codeLength: code.length, timeout });
    
    const result = await executePythonCode(code, timeout, workingDir);
    
    logger.info('Python代码执行完成', { success: result.success });
    
    return JSON.stringify(result);
  } catch (error) {
    logger.error('Python代码执行失败:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stdout: '',
      stderr: '',
      exitCode: -1
    });
  }
};

// JavaScript代码执行处理器
const javascriptExecuteHandler: ToolHandler = async (args) => {
  try {
    const { code, timeout, workingDir } = args;
    
    logger.info('执行JavaScript代码', { codeLength: code.length, timeout });
    
    const result = await executeJavaScriptCode(code, timeout, workingDir);
    
    logger.info('JavaScript代码执行完成', { success: result.success });
    
    return JSON.stringify(result);
  } catch (error) {
    logger.error('JavaScript代码执行失败:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stdout: '',
      stderr: '',
      exitCode: -1
    });
  }
};

// Shell命令执行处理器
const shellExecuteHandler: ToolHandler = async (args) => {
  try {
    const { command, timeout, workingDir } = args;
    
    logger.info('执行Shell命令', { command, timeout });
    
    const result = await executeShellCommand(command, timeout, workingDir);
    
    logger.info('Shell命令执行完成', { success: result.success });
    
    return JSON.stringify(result);
  } catch (error) {
    logger.error('Shell命令执行失败:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stdout: '',
      stderr: '',
      exitCode: -1
    });
  }
};

// 执行Python代码
async function executePythonCode(code: string, timeout: number, workingDir?: string): Promise<any> {
  const tempDir = workingDir || path.join(process.cwd(), 'temp');
  const fileName = `python_${uuidv4()}.py`;
  const filePath = path.join(tempDir, fileName);
  
  try {
    // 确保临时目录存在
    await fs.mkdir(tempDir, { recursive: true });
    
    // 写入代码到临时文件
    await fs.writeFile(filePath, code, 'utf-8');
    
    // 执行Python代码
    const result = await executeCommand('python3', [filePath], timeout, tempDir);
    
    // 清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      logger.warn('清理临时文件失败:', cleanupError);
    }
    
    return result;
  } catch (error) {
    // 确保清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      logger.warn('清理临时文件失败:', cleanupError);
    }
    throw error;
  }
}

// 执行JavaScript代码
async function executeJavaScriptCode(code: string, timeout: number, workingDir?: string): Promise<any> {
  const tempDir = workingDir || path.join(process.cwd(), 'temp');
  const fileName = `javascript_${uuidv4()}.js`;
  const filePath = path.join(tempDir, fileName);
  
  try {
    // 确保临时目录存在
    await fs.mkdir(tempDir, { recursive: true });
    
    // 写入代码到临时文件
    await fs.writeFile(filePath, code, 'utf-8');
    
    // 执行JavaScript代码
    const result = await executeCommand('node', [filePath], timeout, tempDir);
    
    // 清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      logger.warn('清理临时文件失败:', cleanupError);
    }
    
    return result;
  } catch (error) {
    // 确保清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      logger.warn('清理临时文件失败:', cleanupError);
    }
    throw error;
  }
}

// 执行Shell命令
async function executeShellCommand(command: string, timeout: number, workingDir?: string): Promise<any> {
  const tempDir = workingDir || process.cwd();
  
  // 解析命令和参数
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);
  
  return executeCommand(cmd, args, timeout, tempDir);
}

// 通用命令执行函数
async function executeCommand(
  command: string, 
  args: string[], 
  timeout: number, 
  workingDir: string
): Promise<any> {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    // 设置超时
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        process.kill('SIGTERM');
        resolve({
          success: false,
          error: `命令执行超时 (${timeout}秒)`,
          stdout,
          stderr,
          exitCode: -1
        });
      }
    }, timeout * 1000);

    // 收集输出
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // 处理进程结束
    process.on('close', (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        
        const success = code === 0;
        resolve({
          success,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          error: success ? null : `命令执行失败，退出码: ${code}`
        });
      }
    });

    // 处理进程错误
    process.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: `进程启动失败: ${error.message}`,
          stdout,
          stderr,
          exitCode: -1
        });
      }
    });
  });
}

// 导出工具定义
export const codeExecutorTools: ToolDefinition[] = [
  {
    name: 'python_execute',
    description: '执行Python代码',
    parameters: PythonExecuteSchema,
    handler: pythonExecuteHandler
  },
  {
    name: 'javascript_execute',
    description: '执行JavaScript代码',
    parameters: JavaScriptExecuteSchema,
    handler: javascriptExecuteHandler
  },
  {
    name: 'shell_execute',
    description: '执行Shell命令',
    parameters: ShellExecuteSchema,
    handler: shellExecuteHandler
  }
];
