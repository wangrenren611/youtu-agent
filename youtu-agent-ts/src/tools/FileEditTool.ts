/**
 * 文件编辑工具
 * 提供文件读写、创建、删除等功能
 */

import { ToolDefinition, ToolHandler } from '../types';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/Logger';

const logger = new Logger('FileEditTool');

// 文件操作参数模式
const FileReadSchema = z.object({
  filePath: z.string().describe('要读取的文件路径'),
  encoding: z.string().optional().default('utf-8').describe('文件编码')
});

const FileWriteSchema = z.object({
  filePath: z.string().describe('要写入的文件路径'),
  content: z.string().describe('要写入的内容'),
  encoding: z.string().optional().default('utf-8').describe('文件编码'),
  createDir: z.boolean().optional().default(true).describe('是否自动创建目录')
});

const FileDeleteSchema = z.object({
  filePath: z.string().describe('要删除的文件路径')
});

const FileListSchema = z.object({
  dirPath: z.string().describe('要列出的目录路径'),
  recursive: z.boolean().optional().default(false).describe('是否递归列出子目录'),
  includeHidden: z.boolean().optional().default(false).describe('是否包含隐藏文件')
});

const FileExistsSchema = z.object({
  filePath: z.string().describe('要检查的文件路径')
});

const FileInfoSchema = z.object({
  filePath: z.string().describe('要获取信息的文件路径')
});

// 文件读取处理器
const fileReadHandler: ToolHandler = async (args) => {
  try {
    const { filePath, encoding } = args;
    
    logger.info(`读取文件: ${filePath}`);
    
    const content = await fs.readFile(filePath, encoding);
    
    logger.info(`文件读取成功: ${filePath}, 大小: ${content.length} 字符`);
    
    return JSON.stringify({
      success: true,
      content,
      size: content.length,
      encoding
    });
  } catch (error) {
    logger.error(`文件读取失败: ${args.filePath}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件写入处理器
const fileWriteHandler: ToolHandler = async (args) => {
  try {
    const { filePath, content, encoding, createDir } = args;
    
    logger.info(`写入文件: ${filePath}`);
    
    // 如果需要，创建目录
    if (createDir) {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    await fs.writeFile(filePath, content, encoding);
    
    logger.info(`文件写入成功: ${filePath}, 大小: ${content.length} 字符`);
    
    return JSON.stringify({
      success: true,
      size: content.length,
      encoding
    });
  } catch (error) {
    logger.error(`文件写入失败: ${args.filePath}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件删除处理器
const fileDeleteHandler: ToolHandler = async (args) => {
  try {
    const { filePath } = args;
    
    logger.info(`删除文件: ${filePath}`);
    
    await fs.unlink(filePath);
    
    logger.info(`文件删除成功: ${filePath}`);
    
    return JSON.stringify({
      success: true
    });
  } catch (error) {
    logger.error(`文件删除失败: ${args.filePath}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件列表处理器
const fileListHandler: ToolHandler = async (args) => {
  try {
    const { dirPath, recursive, includeHidden } = args;
    
    logger.info(`列出目录: ${dirPath}`);
    
    const files = await listFiles(dirPath, recursive, includeHidden);
    
    logger.info(`目录列出成功: ${dirPath}, 文件数: ${files.length}`);
    
    return JSON.stringify({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    logger.error(`目录列出失败: ${args.dirPath}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件存在检查处理器
const fileExistsHandler: ToolHandler = async (args) => {
  try {
    const { filePath } = args;
    
    logger.info(`检查文件存在: ${filePath}`);
    
    const exists = await fileExists(filePath);
    
    return JSON.stringify({
      success: true,
      exists,
      path: filePath
    });
  } catch (error) {
    logger.error(`文件存在检查失败: ${args.filePath}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件信息处理器
const fileInfoHandler: ToolHandler = async (args) => {
  try {
    const { filePath } = args;
    
    logger.info(`获取文件信息: ${filePath}`);
    
    const stats = await fs.stat(filePath);
    
    const info = {
      path: filePath,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
      permissions: stats.mode.toString(8)
    };
    
    logger.info(`文件信息获取成功: ${filePath}`);
    
    return JSON.stringify({
      success: true,
      info
    });
  } catch (error) {
    logger.error(`文件信息获取失败: ${args.filePath}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 辅助函数：递归列出文件
async function listFiles(dirPath: string, recursive: boolean, includeHidden: boolean): Promise<any[]> {
  const files: any[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // 跳过隐藏文件（如果需要）
      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }
      
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'directory'
        });
        
        // 递归列出子目录
        if (recursive) {
          const subFiles = await listFiles(fullPath, recursive, includeHidden);
          files.push(...subFiles);
        }
      } else {
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'file'
        });
      }
    }
  } catch (error) {
    logger.error(`列出目录失败: ${dirPath}`, error);
  }
  
  return files;
}

// 辅助函数：检查文件是否存在
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 导出工具定义
export const fileEditTools: ToolDefinition[] = [
  {
    name: 'file_read',
    description: '读取文件内容',
    parameters: FileReadSchema,
    handler: fileReadHandler
  },
  {
    name: 'file_write',
    description: '写入文件内容',
    parameters: FileWriteSchema,
    handler: fileWriteHandler
  },
  {
    name: 'file_delete',
    description: '删除文件',
    parameters: FileDeleteSchema,
    handler: fileDeleteHandler
  },
  {
    name: 'file_list',
    description: '列出目录中的文件',
    parameters: FileListSchema,
    handler: fileListHandler
  },
  {
    name: 'file_exists',
    description: '检查文件是否存在',
    parameters: FileExistsSchema,
    handler: fileExistsHandler
  },
  {
    name: 'file_info',
    description: '获取文件信息',
    parameters: FileInfoSchema,
    handler: fileInfoHandler
  }
];
