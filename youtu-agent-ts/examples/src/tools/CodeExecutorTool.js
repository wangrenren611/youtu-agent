"use strict";
/**
 * 代码执行工具
 * 提供Python、JavaScript等代码的安全执行功能
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
exports.codeExecutorTools = void 0;
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const Logger_1 = require("../utils/Logger");
const logger = new Logger_1.Logger('CodeExecutorTool');
// Python代码执行参数模式
const PythonExecuteSchema = zod_1.z.object({
    code: zod_1.z.string().describe('要执行的Python代码'),
    timeout: zod_1.z.number().optional().default(30).describe('执行超时时间（秒）'),
    workingDir: zod_1.z.string().optional().describe('工作目录')
});
// JavaScript代码执行参数模式
const JavaScriptExecuteSchema = zod_1.z.object({
    code: zod_1.z.string().describe('要执行的JavaScript代码'),
    timeout: zod_1.z.number().optional().default(30).describe('执行超时时间（秒）'),
    workingDir: zod_1.z.string().optional().describe('工作目录')
});
// Shell命令执行参数模式
const ShellExecuteSchema = zod_1.z.object({
    command: zod_1.z.string().describe('要执行的Shell命令'),
    timeout: zod_1.z.number().optional().default(30).describe('执行超时时间（秒）'),
    workingDir: zod_1.z.string().optional().describe('工作目录')
});
// Python代码执行处理器
const pythonExecuteHandler = async (args) => {
    try {
        const { code, timeout, workingDir } = args;
        logger.info('执行Python代码', { codeLength: code.length, timeout });
        const result = await executePythonCode(code, timeout, workingDir);
        logger.info('Python代码执行完成', { success: result.success });
        return JSON.stringify(result);
    }
    catch (error) {
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
const javascriptExecuteHandler = async (args) => {
    try {
        const { code, timeout, workingDir } = args;
        logger.info('执行JavaScript代码', { codeLength: code.length, timeout });
        const result = await executeJavaScriptCode(code, timeout, workingDir);
        logger.info('JavaScript代码执行完成', { success: result.success });
        return JSON.stringify(result);
    }
    catch (error) {
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
const shellExecuteHandler = async (args) => {
    try {
        const { command, timeout, workingDir } = args;
        logger.info('执行Shell命令', { command, timeout });
        const result = await executeShellCommand(command, timeout, workingDir);
        logger.info('Shell命令执行完成', { success: result.success });
        return JSON.stringify(result);
    }
    catch (error) {
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
async function executePythonCode(code, timeout, workingDir) {
    const tempDir = workingDir || path.join(process.cwd(), 'temp');
    const fileName = `python_${(0, uuid_1.v4)()}.py`;
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
        }
        catch (cleanupError) {
            logger.warn('清理临时文件失败:', cleanupError);
        }
        return result;
    }
    catch (error) {
        // 确保清理临时文件
        try {
            await fs.unlink(filePath);
        }
        catch (cleanupError) {
            logger.warn('清理临时文件失败:', cleanupError);
        }
        throw error;
    }
}
// 执行JavaScript代码
async function executeJavaScriptCode(code, timeout, workingDir) {
    const tempDir = workingDir || path.join(process.cwd(), 'temp');
    const fileName = `javascript_${(0, uuid_1.v4)()}.js`;
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
        }
        catch (cleanupError) {
            logger.warn('清理临时文件失败:', cleanupError);
        }
        return result;
    }
    catch (error) {
        // 确保清理临时文件
        try {
            await fs.unlink(filePath);
        }
        catch (cleanupError) {
            logger.warn('清理临时文件失败:', cleanupError);
        }
        throw error;
    }
}
// 执行Shell命令
async function executeShellCommand(command, timeout, workingDir) {
    const tempDir = workingDir || process.cwd();
    // 解析命令和参数
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    return executeCommand(cmd, args, timeout, tempDir);
}
// 通用命令执行函数
async function executeCommand(command, args, timeout, workingDir) {
    return new Promise((resolve) => {
        const process = (0, child_process_1.spawn)(command, args, {
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
exports.codeExecutorTools = [
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
