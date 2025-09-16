"use strict";
/**
 * 文件编辑工具
 * 提供文件读写、创建、删除等功能
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileEditTools = void 0;
const zod_1 = require("zod");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const Logger_1 = require("../utils/Logger");
const logger = new Logger_1.Logger('FileEditTool');
// 文件操作参数模式
const FileReadSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要读取的文件路径'),
    encoding: zod_1.z.string().optional().default('utf-8').describe('文件编码')
});
const FileWriteSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要写入的文件路径'),
    content: zod_1.z.string().describe('要写入的内容'),
    encoding: zod_1.z.string().optional().default('utf-8').describe('文件编码'),
    createDir: zod_1.z.boolean().optional().default(true).describe('是否自动创建目录')
});
const FileDeleteSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要删除的文件路径')
});
const FileListSchema = zod_1.z.object({
    dirPath: zod_1.z.string().describe('要列出的目录路径'),
    recursive: zod_1.z.boolean().optional().default(false).describe('是否递归列出子目录'),
    includeHidden: zod_1.z.boolean().optional().default(false).describe('是否包含隐藏文件')
});
const FileExistsSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要检查的文件路径')
});
const FileInfoSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要获取信息的文件路径')
});
// 文件读取处理器
const fileReadHandler = async (args) => {
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
    }
    catch (error) {
        logger.error(`文件读取失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 文件写入处理器
const fileWriteHandler = async (args) => {
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
    }
    catch (error) {
        console.log("====>",error);
        logger.error(`文件写入失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 文件删除处理器
const fileDeleteHandler = async (args) => {
    try {
        const { filePath } = args;
        logger.info(`删除文件: ${filePath}`);
        await fs.unlink(filePath);
        logger.info(`文件删除成功: ${filePath}`);
        return JSON.stringify({
            success: true
        });
    }
    catch (error) {
        logger.error(`文件删除失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 文件列表处理器
const fileListHandler = async (args) => {
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
    }
    catch (error) {
        logger.error(`目录列出失败: ${args.dirPath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 文件存在检查处理器
const fileExistsHandler = async (args) => {
    try {
        const { filePath } = args;
        logger.info(`检查文件存在: ${filePath}`);
        const exists = await fileExists(filePath);
        return JSON.stringify({
            success: true,
            exists,
            path: filePath
        });
    }
    catch (error) {
        logger.error(`文件存在检查失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 文件信息处理器
const fileInfoHandler = async (args) => {
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
    }
    catch (error) {
        logger.error(`文件信息获取失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 辅助函数：递归列出文件
async function listFiles(dirPath, recursive, includeHidden) {
    const files = [];
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
            }
            else {
                files.push({
                    name: entry.name,
                    path: fullPath,
                    type: 'file'
                });
            }
        }
    }
    catch (error) {
        logger.error(`列出目录失败: ${dirPath}`, error);
    }
    return files;
}
// 辅助函数：检查文件是否存在
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
// 导出工具定义
exports.fileEditTools = [
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
