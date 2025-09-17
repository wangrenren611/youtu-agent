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
  pattern: z.union([z.string(), z.array(z.string())]).optional().describe('单个glob模式或模式数组，如 "**/*.txt" 或 ["**/*.ts", "**/*.tsx"]'),
  patterns: z.array(z.string()).optional().describe('多个glob模式数组，如 ["**/*.ts", "**/*.tsx"]'),
  baseDir: z.string().optional().describe('基础目录，默认为当前工作目录'),
  options: z.object({
    ignore: z.array(z.string()).optional().describe('要忽略的模式'),
    dot: z.boolean().optional().default(false).describe('是否包含隐藏文件'),
    nodir: z.boolean().optional().default(false).describe('是否只返回文件，不返回目录'),
    absolute: z.boolean().optional().default(false).describe('是否返回绝对路径')
  }).optional().describe('glob选项')
}).refine(data => data.pattern || data.patterns, {
  message: "必须提供 pattern 或 patterns 参数"
});

const FileBatchSchema = z.object({
  operation: z.enum(['read', 'write', 'delete', 'info', 'create']).describe('批量操作类型：read(读取), write(写入), delete(删除), info(获取信息), create(创建)'),
  pattern: z.string().optional().describe('glob模式，如 "temp/*.txt" 或 "**/*.js"'),
  filePaths: z.union([
    z.array(z.string()),
    z.array(z.object({
      path: z.string(),
      content: z.string().optional()
    }))
  ]).optional().describe('文件路径数组，如 ["file1.txt", "file2.txt"] 或 [{path: "file1.txt", content: "内容1"}]'),
  baseDir: z.string().optional().describe('基础目录，默认为当前工作目录'),
  content: z.union([
    z.string(),
    z.array(z.string())
  ]).optional().describe('写入内容（仅write操作需要）。可以是单个字符串或字符串数组'),
  encoding: z.string().optional().default('utf-8').describe('文件编码，默认为utf-8')
}).refine(data => data.pattern || data.filePaths, {
  message: "必须提供 pattern 或 filePaths 参数。示例：{\"operation\":\"read\",\"filePaths\":[\"file1.txt\"]} 或 {\"operation\":\"write\",\"pattern\":\"temp/*.txt\",\"content\":\"内容\"}"
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
    
    // 确保文件路径是绝对路径
    const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    
    // 安全检查
    validatePath(absoluteFilePath);
    
    logger.info(`读取文件: ${absoluteFilePath}`);
    
    try {
      // 检查文件是否存在
      await fs.access(absoluteFilePath, fs.constants.R_OK);
      
      const content = await fs.readFile(absoluteFilePath, { encoding: encoding as BufferEncoding });
      
      logger.info(`文件读取成功: ${absoluteFilePath}, 大小: ${content.length} 字符`);
      
      return JSON.stringify({
        success: true,
        content,
        size: content.length,
        encoding,
        path: absoluteFilePath
      });
    } catch (readError) {
      logger.error(`文件读取操作失败: ${absoluteFilePath}`, readError);
      return JSON.stringify({
        success: false,
        error: readError instanceof Error ? readError.message : '文件读取操作失败',
        path: absoluteFilePath,
        details: readError instanceof Error ? readError.stack : undefined
      });
    }
  } catch (error) {
    logger.error(`文件读取参数解析失败: ${args['filePath']}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '参数解析失败',
      required_params: '需要提供有效的 filePath 参数'
    });
  }
};

// 文件写入处理器
const fileWriteHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    const parsed = FileWriteSchema.parse(args);
    const { filePath, content, encoding } = parsed;
    
    // 确保文件路径是绝对路径
    const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    
    // 安全检查
    validatePath(absoluteFilePath);
    
    logger.info(`写入文件: ${absoluteFilePath}, 大小: ${content.length} 字符`);
    
    try {
      // 始终确保目录存在，无论createDir参数如何设置
      const dirPath = path.dirname(absoluteFilePath);
      logger.info(`确保目录存在: ${dirPath}`);
      try {
        await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
      } catch (mkdirError) {
        logger.warn(`创建目录失败: ${dirPath}，尝试继续写入文件`, mkdirError);
      }
      
      // 写入文件，设置权限为0644
      await fs.writeFile(absoluteFilePath, content, { 
        encoding: encoding as BufferEncoding,
        mode: 0o644
      });
      
      // 验证文件是否成功写入
      const stats = await fs.stat(absoluteFilePath);
      
      logger.info(`文件写入成功: ${absoluteFilePath}, 大小: ${stats.size} 字节`);
      
      return JSON.stringify({
        success: true,
        path: absoluteFilePath,
        size: stats.size,
        encoding,
        created: true
      });
    } catch (writeError) {
      logger.error(`文件写入操作失败: ${absoluteFilePath}`, writeError);
      return JSON.stringify({
        success: false,
        error: writeError instanceof Error ? writeError.message : '文件写入操作失败',
        path: absoluteFilePath,
        details: writeError instanceof Error ? writeError.stack : undefined
      });
    }
  } catch (error) {
    logger.error(`文件写入参数解析失败`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '参数解析失败',
      required_params: '需要提供有效的 filePath 和 content 参数'
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
    if (!args || typeof args !== 'object') {
      throw new Error('参数必须是一个对象');
    }
    
    // 确保dirPath参数存在
    if (!args['dirPath']) {
      throw new Error('缺少必要参数: dirPath');
    }
    
    const parsed = FileListSchema.parse(args);
    const { dirPath, recursive, includeHidden } = parsed;
    
    // 确保目录路径是绝对路径
    const absoluteDirPath = path.isAbsolute(dirPath) ? dirPath : path.resolve(process.cwd(), dirPath);
    
    // 安全检查
    validatePath(absoluteDirPath);
    
    logger.info(`列出目录: ${absoluteDirPath}, 递归: ${recursive}, 包含隐藏文件: ${includeHidden}`);
    
    try {
      // 确保目录存在
      try {
        await fs.access(absoluteDirPath);
      } catch (accessError) {
        // 目录不存在，尝试创建
        logger.info(`目录不存在，尝试创建: ${absoluteDirPath}`);
        await fs.mkdir(absoluteDirPath, { recursive: true, mode: 0o755 });
      }
      
      // 获取目录内容
      const files = await listFiles(absoluteDirPath, recursive, includeHidden);
      
      // 计算统计信息
      const fileCount = files.filter(f => f.type === 'file').length;
      const dirCount = files.filter(f => f.type === 'directory').length;
      
      logger.info(`目录列出成功: ${absoluteDirPath}, 文件数: ${fileCount}, 目录数: ${dirCount}`);
      
      return JSON.stringify({
        success: true,
        path: absoluteDirPath,
        files,
        count: files.length,
        stats: {
          fileCount,
          dirCount,
          totalCount: files.length
        }
      });
    } catch (listError) {
      logger.error(`目录列出操作失败: ${absoluteDirPath}`, listError);
      return JSON.stringify({
        success: false,
        error: listError instanceof Error ? listError.message : '目录列出操作失败',
        path: absoluteDirPath,
        details: listError instanceof Error ? listError.stack : undefined
      });
    }
  } catch (error) {
    logger.error(`目录列出参数解析失败: ${JSON.stringify(args)}`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '参数解析失败',
      required_params: '需要提供有效的 dirPath 参数',
      provided_args: JSON.stringify(args)
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
    
    // 处理pattern和patterns参数
    let patterns: string[] = [];
    if (parsed.patterns) {
      patterns = parsed.patterns;
    } else if (parsed.pattern) {
      if (Array.isArray(parsed.pattern)) {
        patterns = parsed.pattern;
      } else {
        patterns = [parsed.pattern];
      }
    }
    
    const baseDir = parsed.baseDir || process.cwd();
    const options = parsed.options || {};
    
    // 确保基础目录是绝对路径
    const absoluteBaseDir = path.isAbsolute(baseDir) ? baseDir : path.resolve(process.cwd(), baseDir);
    
    // 安全检查基础目录
    logger.info(`检查路径安全性: ${absoluteBaseDir}`);
    validatePath(absoluteBaseDir);
    logger.info(`路径安全检查通过: ${absoluteBaseDir}`);
    
    // 确保目录存在
    try {
      await fs.access(absoluteBaseDir);
    } catch (accessError) {
      logger.info(`基础目录不存在，尝试创建: ${absoluteBaseDir}`);
      await fs.mkdir(absoluteBaseDir, { recursive: true });
    }
    
    logger.info(`Glob搜索: ${patterns.join(', ')} 在目录 ${absoluteBaseDir}`);
    
    const globOptions = {
      cwd: absoluteBaseDir,
      ignore: (options as any).ignore || ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      dot: (options as any).dot || false,
      nodir: (options as any).nodir || false,
      absolute: (options as any).absolute || false
    };
    
    try {
      // 使用glob@11的新API，支持多个模式
      const allFiles = new Set<string>();
      for (const pattern of patterns) {
        const files = await glob(pattern, globOptions);
        files.forEach(file => allFiles.add(file));
      }
      const files = Array.from(allFiles);
      
      // 对每个文件进行安全检查
      const safeFiles = files.filter(file => {
        const fullPath = ((options as any).absolute || false) ? file : path.join(absoluteBaseDir, file);
        return isPathAllowed(fullPath);
      });
      
      // 构建完整路径和文件信息
      const fullPathsWithInfo = await Promise.all(safeFiles.map(async file => {
        const fullPath = ((options as any).absolute || false) ? file : path.join(absoluteBaseDir, file);
        try {
          const stats = await fs.stat(fullPath);
          return {
            path: fullPath,
            relativePath: file,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modifiedAt: stats.mtime
          };
        } catch (statError) {
          return {
            path: fullPath,
            relativePath: file,
            type: 'unknown',
            error: statError instanceof Error ? statError.message : '获取文件信息失败'
          };
        }
      }));
      
      // 分类结果
      const files_info = fullPathsWithInfo.filter(item => item.type === 'file');
      const directories = fullPathsWithInfo.filter(item => item.type === 'directory');
      
      logger.info(`找到 ${safeFiles.length} 个匹配的文件`);
      
      return JSON.stringify({
        success: true,
        patterns: patterns,
        baseDir: absoluteBaseDir,
        files: safeFiles,
        fullPaths: safeFiles.map(file => ((options as any).absolute || false) ? file : path.join(absoluteBaseDir, file)),
        fileDetails: fullPathsWithInfo,
        fileCount: files_info.length,
        dirCount: directories.length,
        count: safeFiles.length,
        options: globOptions
      });
    } catch (globError) {
      logger.error(`Glob搜索执行失败: ${patterns.join(', ')} 在 ${absoluteBaseDir}`, globError);
      return JSON.stringify({
        success: false,
        error: globError instanceof Error ? globError.message : '未知错误',
        patterns: patterns,
        baseDir: absoluteBaseDir
      });
    }
  } catch (error) {
    // 提供更详细的错误信息，帮助LLM理解
    const errorDetails = error instanceof Error ? error.message : '未知错误';
    const providedArgs = JSON.stringify(args);
    logger.error(`Glob搜索参数解析失败: ${errorDetails}, 提供的参数: ${providedArgs}`, error);
    return JSON.stringify({
      success: false,
      error: `参数解析失败: ${errorDetails}`,
      providedArgs,
      requiredArgs: '需要提供 pattern, baseDir(可选) 参数'
    });
  }
};

// 批量文件操作处理器
const fileBatchHandler: ToolHandler = async (args) => {
  try {
    // 验证和解析参数
    if (!args || typeof args !== 'object') {
      throw new Error('参数必须是一个对象');
    }
    
    // 确保必要参数存在
    if (!args['operation']) {
      throw new Error('缺少必要参数: operation');
    }
    
    if (!args['pattern'] && (!args['filePaths'] || !Array.isArray(args['filePaths']))) {
      throw new Error('必须提供 pattern 或 filePaths 参数');
    }
    
    const parsed = FileBatchSchema.parse(args);
    const { operation, pattern, filePaths, baseDir = process.cwd(), content, encoding = 'utf-8' } = parsed;
    
    // 确保基础目录是绝对路径
    const absoluteBaseDir = path.isAbsolute(baseDir) ? baseDir : path.resolve(process.cwd(), baseDir);
    
    // 安全检查基础目录
    validatePath(absoluteBaseDir);
    
    // 确保目录存在
    try {
      await fs.access(absoluteBaseDir);
    } catch (accessError) {
      logger.info(`基础目录不存在，尝试创建: ${absoluteBaseDir}`);
      await fs.mkdir(absoluteBaseDir, { recursive: true, mode: 0o755 });
    }
    
    let files: string[] = [];
    
    if (filePaths) {
      // 使用提供的文件路径，支持字符串或对象两种格式
      files = (filePaths as Array<string | { path: string; content?: string }>).map(fp => {
        const rel = typeof fp === 'string' ? fp : fp.path;
        return path.isAbsolute(rel) ? rel : path.join(absoluteBaseDir, rel);
      });
      logger.info(`批量${operation}操作: ${Array.isArray(filePaths) ? filePaths.length : 0} 个指定文件`);
    } else if (pattern) {
      // 使用glob模式
      logger.info(`批量${operation}操作: ${pattern} 在目录 ${absoluteBaseDir}`);
      files = await glob(pattern, {
        cwd: absoluteBaseDir,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        nodir: true // 只处理文件
      });
    }
    
    // 对每个文件进行安全检查
    const safeFiles = files.filter(file => {
      const fullPath = path.isAbsolute(file) ? file : path.join(absoluteBaseDir, file);
      return isPathAllowed(fullPath);
    });
    
    // 特殊处理创建文件的情况
    if ((operation === 'create' || operation === 'write') && filePaths && Array.isArray(filePaths)) {
      const results: any[] = [];
      let successful = 0;
      let failed = 0;
      
      try {
        for (let i = 0; i < filePaths.length; i++) {
          const fileItem = (filePaths as Array<string | { path: string; content?: string }>)[i];
          try {
            // 处理两种可能的格式：字符串或对象
            let filePath: string = '';
            let fileContent: string = '';
            
            if (typeof fileItem === 'string') {
              filePath = fileItem;
              // 处理content可能是数组的情况
              const contentArr = Array.isArray(content) ? (content as string[]) : undefined;
              if (contentArr && i < contentArr.length && typeof contentArr[i] === 'string') {
                fileContent = contentArr[i] as string;
              } else if (typeof content === 'string') {
                fileContent = content;
              } else {
                fileContent = '';
              }
            } else if (typeof fileItem === 'object' && fileItem !== null) {
              // 处理对象格式 {path: string, content: string}
              filePath = (fileItem as any).path || '';
              if (typeof (fileItem as any).content === 'string') {
                fileContent = (fileItem as any).content as string;
              } else {
                const contentArr = Array.isArray(content) ? (content as string[]) : undefined;
                if (contentArr && i < contentArr.length && typeof contentArr[i] === 'string') {
                  fileContent = contentArr[i] as string;
                } else if (typeof content === 'string') {
                  fileContent = content;
                } else {
                  fileContent = '';
                }
              }
            } else {
              logger.warn(`跳过无效的文件项: ${JSON.stringify(fileItem)}`);
              failed++;
              continue;
            }
            
            if (!filePath) {
              logger.warn('跳过空路径的文件项');
              failed++;
              continue;
            }
            
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(absoluteBaseDir, filePath);
            validatePath(fullPath);
            
            // 确保目录存在
            const dirPath = path.dirname(fullPath);
            await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
            
            // 写入文件内容
            await fs.writeFile(fullPath, fileContent, { 
              encoding: encoding as BufferEncoding,
              mode: 0o644
            });
            logger.info(`创建并写入文件: ${fullPath}`);
            results.push({ 
              file: filePath, 
              success: true, 
              size: fileContent.length, 
              path: fullPath
            });
            successful++;
          } catch (itemError) {
            logger.error(`处理文件项失败: ${JSON.stringify(fileItem)}`, itemError);
            results.push({
              file: typeof fileItem === 'string' ? fileItem : (fileItem as any).path || 'unknown',
              success: false,
              error: itemError instanceof Error ? itemError.message : '处理文件项失败'
            });
            failed++;
          }
        }
        
        return JSON.stringify({
          success: successful > 0,
          operation,
          baseDir: absoluteBaseDir,
          totalFiles: results.length,
          results,
          summary: { successful, failed }
        });
      } catch (batchError) {
        logger.error(`批量${operation}操作失败`, batchError);
        return JSON.stringify({
          success: false,
          error: batchError instanceof Error ? batchError.message : `批量${operation}操作失败`,
          operation,
          details: batchError instanceof Error ? batchError.stack : undefined
        });
      }
    }
    
    if (safeFiles.length === 0) {
      const searchPattern = pattern || '指定文件';
      logger.info(`没有找到匹配的文件: ${searchPattern}`);
      
      return JSON.stringify({
        success: false,
        error: '没有找到匹配的文件',
        operation,
        pattern: pattern || 'filePaths',
        baseDir: absoluteBaseDir,
        totalFiles: 0,
        results: [],
        summary: { successful: 0, failed: 0 }
      });
    }
    
    const results: any[] = [];
    let successful = 0;
    let failed = 0;
    
    for (const file of safeFiles) {
      const fullPath = path.isAbsolute(file) ? file : path.join(absoluteBaseDir, file);
      
      try {
        let result: any = { file, path: fullPath, relativePath: file, success: true };
        
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
              
              // 确保目录存在
              const dirPath = path.dirname(fullPath);
              await fs.mkdir(dirPath, { recursive: true });
              
              await fs.writeFile(fullPath, content, { encoding: encoding as BufferEncoding });
              const stats = await fs.stat(fullPath);
              result.size = stats.size;
              break;
              
            case 'delete':
              await fs.unlink(fullPath);
              result.deleted = true;
              break;
              
            case 'info':
              const fileStats = await fs.stat(fullPath);
              result.info = {
                size: fileStats.size,
                isFile: fileStats.isFile(),
                isDirectory: fileStats.isDirectory(),
                created: fileStats.birthtime,
                modified: fileStats.mtime,
                accessed: fileStats.atime,
                permissions: fileStats.mode.toString(8)
              };
              break;
              
            default:
              throw new Error(`不支持的操作: ${operation}`);
          }
          
          successful++;
          results.push(result);
        } catch (error) {
          logger.error(`文件操作失败: ${fullPath}`, error);
          results.push({
            file,
            path: fullPath,
            relativePath: file,
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
            details: error instanceof Error ? error.stack : undefined
          });
          failed++;
        }
      }
      
      logger.info(`批量操作完成: ${results.length} 个文件处理完成`);
      
      return JSON.stringify({
        success: true,
        operation,
        pattern: pattern || 'filePaths',
        filePaths: filePaths,
        baseDir: absoluteBaseDir,
        totalFiles: safeFiles.length,
        results,
        stats: { total: results.length, success: successful, failure: failed },
        summary: { successful, failed }
      });
  } catch (error) {
    // 提供更详细的错误信息，帮助LLM理解
    const errorDetails = error instanceof Error ? error.message : '未知错误';
    const providedArgs = JSON.stringify(args);
    logger.error(`批量操作参数解析失败: ${errorDetails}, 提供的参数: ${providedArgs}`, error);
    return JSON.stringify({
      success: false,
      error: `参数解析失败: ${errorDetails}`,
      providedArgs,
      requiredArgs: '需要提供 pattern 或 filePaths, operation, baseDir(可选) 参数',
      details: error instanceof Error ? error.stack : undefined
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
    description: '批量文件操作（读取、写入、删除、获取信息）。支持两种参数格式：1) 使用filePaths数组指定文件列表，2) 使用pattern进行glob模式匹配。示例：{"operation":"read","filePaths":["file1.txt","file2.txt"]} 或 {"operation":"write","pattern":"temp/*.txt","content":"内容"}',
    parameters: FileBatchSchema,
    handler: fileBatchHandler
  }
];
