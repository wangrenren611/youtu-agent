/**
 * 文件编辑工具
 * 提供文件读写、创建、删除等功能
 */

import { ToolDefinition, ToolHandler } from '../types';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { Logger } from '../utils/Logger';

const logger = new Logger('FileEditTool');

// 允许访问的目录配置
const ALLOWED_DIRECTORIES = [
  process.cwd(), // 当前工作目录
  path.join(process.cwd(), 'data'), // 数据目录
  path.join(process.cwd(), 'temp'), // 临时目录
  path.join(process.cwd(), 'logs'), // 日志目录
  '/tmp', // 系统临时目录
  path.join(process.env['HOME'] || '', 'Downloads'), // 用户下载目录
];

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

const FileGlobSchema = z.object({
  pattern: z.string().describe('glob模式，如 "**/*.txt" 或 "src/**/*.js"'),
  baseDir: z.string().optional().describe('基础目录，默认为当前工作目录'),
  options: z.object({
    ignore: z.array(z.string()).optional().describe('要忽略的模式'),
    dot: z.boolean().optional().default(false).describe('是否包含隐藏文件'),
    nodir: z.boolean().optional().default(false).describe('是否只返回文件，不返回目录'),
    absolute: z.boolean().optional().default(false).describe('是否返回绝对路径')
  }).optional().describe('glob选项')
});

const FileBatchSchema = z.object({
  operation: z.enum(['read', 'write', 'delete', 'info']).describe('批量操作类型'),
  pattern: z.string().describe('glob模式'),
  baseDir: z.string().optional().describe('基础目录'),
  content: z.string().optional().describe('写入内容（仅write操作需要）'),
  encoding: z.string().optional().default('utf-8').describe('文件编码')
});

// 安全检查函数 - 只允许在允许的目录中操作
function isPathAllowed(filePath: string): boolean {
  // 处理波浪号路径
  const normalizedPath = filePath.startsWith('~') 
    ? path.join(process.env['HOME'] || '', filePath.slice(1))
    : filePath;
  
  const resolvedPath = path.resolve(normalizedPath);
  
  // 检查是否在允许的目录中
  for (const allowedDir of ALLOWED_DIRECTORIES) {
    if (resolvedPath.startsWith(allowedDir)) {
      return true;
    }
  }
  
  return false;
}

// 验证路径安全性
function validatePath(filePath: string): void {
  if (!isPathAllowed(filePath)) {
    throw new Error(`访问被拒绝: 路径 "${filePath}" 不在允许的目录中。允许的目录: ${ALLOWED_DIRECTORIES.join(', ')}`);
  }
}

// 文件读取处理器
const fileReadHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileReadSchema.parse(args);
    const { filePath, encoding } = parsed;
    
    // 安全检查
    validatePath(filePath);
    
    logger.info(`读取文件: ${filePath}`);
    
    const content = await fs.readFile(filePath, { encoding: encoding as BufferEncoding });
    
    logger.info(`文件读取成功: ${filePath}, 大小: ${content.length} 字符`);
    
    return JSON.stringify({
      success: true,
      content,
      size: content.length,
      encoding
    });
  } catch (error) {
    logger.error(`文件读取失败: ${args['filePath']}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件写入处理器
const fileWriteHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileWriteSchema.parse(args);
    const { filePath, content, encoding, createDir } = parsed;
    
    // 安全检查
    validatePath(filePath);
    
    logger.info(`写入文件: ${filePath}`);
    
    // 如果需要，创建目录
    if (createDir) {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    await fs.writeFile(filePath, content, { encoding: encoding as BufferEncoding });
    
    logger.info(`文件写入成功: ${filePath}, 大小: ${content.length} 字符`);
    
    return JSON.stringify({
      success: true,
      size: content.length,
      encoding
    });
  } catch (error) {
    logger.error(`文件写入失败: ${args['filePath']}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件删除处理器
const fileDeleteHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileDeleteSchema.parse(args);
    const { filePath } = parsed;
    
    // 安全检查
    validatePath(filePath);
    
    logger.info(`删除文件: ${filePath}`);
    
    await fs.unlink(filePath);
    
    logger.info(`文件删除成功: ${filePath}`);
    
    return JSON.stringify({
      success: true
    });
  } catch (error) {
    logger.error(`文件删除失败: ${args['filePath']}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件列表处理器
const fileListHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileListSchema.parse(args);
    const { dirPath, recursive, includeHidden } = parsed;
    
    // 安全检查
    validatePath(dirPath);
    
    logger.info(`列出目录: ${dirPath}`);
    
    const files = await listFiles(dirPath, recursive, includeHidden);
    
    logger.info(`目录列出成功: ${dirPath}, 文件数: ${files.length}`);
    
    return JSON.stringify({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    logger.error(`目录列出失败: ${args['dirPath']}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件存在检查处理器
const fileExistsHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileExistsSchema.parse(args);
    const { filePath } = parsed;
    
    // 安全检查
    validatePath(filePath);
    
    logger.info(`检查文件存在: ${filePath}`);
    
    const exists = await fileExists(filePath);
    
    return JSON.stringify({
      success: true,
      exists,
      path: filePath
    });
  } catch (error) {
    logger.error(`文件存在检查失败: ${args['filePath']}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 文件信息处理器
const fileInfoHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileInfoSchema.parse(args);
    const { filePath } = parsed;
    
    // 安全检查
    validatePath(filePath);
    
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
    logger.error(`文件信息获取失败: ${args['filePath']}`, error);
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

// Glob搜索处理器
const fileGlobHandler: ToolHandler = async (args) => {
  try {
    const parsed = FileGlobSchema.parse(args);
    const pattern = parsed.pattern;
    const baseDir = parsed.baseDir || process.cwd();
    const options = parsed.options || {};
    
    // 安全检查基础目录
    logger.info(`检查路径安全性: ${baseDir}`);
    validatePath(baseDir);
    logger.info(`路径安全检查通过: ${baseDir}`);
    
    logger.info(`Glob搜索: ${pattern} 在目录 ${baseDir}`);
    
    const globOptions = {
      cwd: baseDir,
      ignore: (options as any).ignore || ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      dot: (options as any).dot || false,
      nodir: (options as any).nodir || false,
      absolute: (options as any).absolute || false
    };
    
    // 使用glob@11的新API
    const files = await glob(pattern, globOptions);
    
    // 对每个文件进行安全检查
    const safeFiles = files.filter(file => {
      const fullPath = ((options as any).absolute || false) ? file : path.join(baseDir, file);
      return isPathAllowed(fullPath);
    });
    
    logger.info(`找到 ${safeFiles.length} 个匹配的文件`);
    
    return JSON.stringify({
      success: true,
      pattern,
      baseDir,
      files: safeFiles,
      count: safeFiles.length,
      options: globOptions
    });
  } catch (error) {
    logger.error('Glob搜索失败:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 批量文件操作处理器
const fileBatchHandler: ToolHandler = async (args) => {
  try {
    const parsed = FileBatchSchema.parse(args);
    const { operation, pattern, baseDir = process.cwd(), content, encoding = 'utf-8' } = parsed;
    
    // 安全检查基础目录
    validatePath(baseDir);
    
    logger.info(`批量${operation}操作: ${pattern} 在目录 ${baseDir}`);
    
    // 使用glob找到匹配的文件
    const files = await glob(pattern, {
      cwd: baseDir,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      nodir: true // 只处理文件
    });
    
    // 对每个文件进行安全检查
    const safeFiles = files.filter(file => {
      const fullPath = path.join(baseDir, file);
      return isPathAllowed(fullPath);
    });
    
    const results: any[] = [];
    
    for (const file of safeFiles) {
      const fullPath = path.join(baseDir, file);
      
      try {
        let result: any = { file, success: true };
        
        switch (operation) {
          case 'read':
            const fileContent = await fs.readFile(fullPath, { encoding: encoding as BufferEncoding });
            result.content = fileContent;
            result.size = fileContent.length;
            break;
            
          case 'write':
            if (!content) {
              throw new Error('写入操作需要提供content参数');
            }
            await fs.writeFile(fullPath, content, { encoding: encoding as BufferEncoding });
            result.size = content.length;
            break;
            
          case 'delete':
            await fs.unlink(fullPath);
            result.deleted = true;
            break;
            
          case 'info':
            const stats = await fs.stat(fullPath);
            result.info = {
              size: stats.size,
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              mtime: stats.mtime,
              ctime: stats.ctime
            };
            break;
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          file,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
    
    logger.info(`批量操作完成: ${results.length} 个文件处理完成`);
    
    return JSON.stringify({
      success: true,
      operation,
      pattern,
      baseDir,
      totalFiles: safeFiles.length,
      results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    logger.error('批量操作失败:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

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
  },
  {
    name: 'file_glob',
    description: '使用glob模式搜索文件',
    parameters: FileGlobSchema,
    handler: fileGlobHandler
  },
  {
    name: 'file_batch',
    description: '批量文件操作（读取、写入、删除、获取信息）',
    parameters: FileBatchSchema,
    handler: fileBatchHandler
  }
];
