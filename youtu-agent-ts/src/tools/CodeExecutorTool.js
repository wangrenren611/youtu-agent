"use strict";
/**
 * 代码执行工具
 * 提供Python、JavaScript等代码的安全执行功能
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeExecutorTools = void 0;
var zod_1 = require("zod");
var child_process_1 = require("child_process");
var fs = require("fs/promises");
var path = require("path");
var uuid_1 = require("uuid");
var Logger_1 = require("../utils/Logger");
var logger = new Logger_1.Logger('CodeExecutorTool');
// Python代码执行参数模式
var PythonExecuteSchema = zod_1.z.object({
    code: zod_1.z.string().describe('要执行的Python代码'),
    timeout: zod_1.z.number().optional().default(30).describe('执行超时时间（秒）'),
    workingDir: zod_1.z.string().optional().describe('工作目录')
});
// JavaScript代码执行参数模式
var JavaScriptExecuteSchema = zod_1.z.object({
    code: zod_1.z.string().describe('要执行的JavaScript代码'),
    timeout: zod_1.z.number().optional().default(30).describe('执行超时时间（秒）'),
    workingDir: zod_1.z.string().optional().describe('工作目录')
});
// Shell命令执行参数模式
var ShellExecuteSchema = zod_1.z.object({
    command: zod_1.z.string().describe('要执行的Shell命令'),
    timeout: zod_1.z.number().optional().default(30).describe('执行超时时间（秒）'),
    workingDir: zod_1.z.string().optional().describe('工作目录')
});
// Python代码执行处理器
var pythonExecuteHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var code, timeout, workingDir, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                code = args.code, timeout = args.timeout, workingDir = args.workingDir;
                logger.info('执行Python代码', { codeLength: code.length, timeout: timeout });
                return [4 /*yield*/, executePythonCode(code, timeout, workingDir)];
            case 1:
                result = _a.sent();
                logger.info('Python代码执行完成', { success: result.success });
                return [2 /*return*/, JSON.stringify(result)];
            case 2:
                error_1 = _a.sent();
                logger.error('Python代码执行失败:', error_1);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : '未知错误',
                        stdout: '',
                        stderr: '',
                        exitCode: -1
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// JavaScript代码执行处理器
var javascriptExecuteHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var code, timeout, workingDir, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                code = args.code, timeout = args.timeout, workingDir = args.workingDir;
                logger.info('执行JavaScript代码', { codeLength: code.length, timeout: timeout });
                return [4 /*yield*/, executeJavaScriptCode(code, timeout, workingDir)];
            case 1:
                result = _a.sent();
                logger.info('JavaScript代码执行完成', { success: result.success });
                return [2 /*return*/, JSON.stringify(result)];
            case 2:
                error_2 = _a.sent();
                logger.error('JavaScript代码执行失败:', error_2);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_2 instanceof Error ? error_2.message : '未知错误',
                        stdout: '',
                        stderr: '',
                        exitCode: -1
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Shell命令执行处理器
var shellExecuteHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var command, timeout, workingDir, result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                command = args.command, timeout = args.timeout, workingDir = args.workingDir;
                logger.info('执行Shell命令', { command: command, timeout: timeout });
                return [4 /*yield*/, executeShellCommand(command, timeout, workingDir)];
            case 1:
                result = _a.sent();
                logger.info('Shell命令执行完成', { success: result.success });
                return [2 /*return*/, JSON.stringify(result)];
            case 2:
                error_3 = _a.sent();
                logger.error('Shell命令执行失败:', error_3);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_3 instanceof Error ? error_3.message : '未知错误',
                        stdout: '',
                        stderr: '',
                        exitCode: -1
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 执行Python代码
function executePythonCode(code, timeout, workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        var tempDir, fileName, filePath, result, cleanupError_1, error_4, cleanupError_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tempDir = workingDir || path.join(process.cwd(), 'temp');
                    fileName = "python_".concat((0, uuid_1.v4)(), ".py");
                    filePath = path.join(tempDir, fileName);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 14]);
                    // 确保临时目录存在
                    return [4 /*yield*/, fs.mkdir(tempDir, { recursive: true })];
                case 2:
                    // 确保临时目录存在
                    _a.sent();
                    // 写入代码到临时文件
                    return [4 /*yield*/, fs.writeFile(filePath, code, 'utf-8')];
                case 3:
                    // 写入代码到临时文件
                    _a.sent();
                    return [4 /*yield*/, executeCommand('python3', [filePath], timeout, tempDir)];
                case 4:
                    result = _a.sent();
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, fs.unlink(filePath)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    cleanupError_1 = _a.sent();
                    logger.warn('清理临时文件失败:', cleanupError_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/, result];
                case 9:
                    error_4 = _a.sent();
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, fs.unlink(filePath)];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 12:
                    cleanupError_2 = _a.sent();
                    logger.warn('清理临时文件失败:', cleanupError_2);
                    return [3 /*break*/, 13];
                case 13: throw error_4;
                case 14: return [2 /*return*/];
            }
        });
    });
}
// 执行JavaScript代码
function executeJavaScriptCode(code, timeout, workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        var tempDir, fileName, filePath, result, cleanupError_3, error_5, cleanupError_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tempDir = workingDir || path.join(process.cwd(), 'temp');
                    fileName = "javascript_".concat((0, uuid_1.v4)(), ".js");
                    filePath = path.join(tempDir, fileName);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 14]);
                    // 确保临时目录存在
                    return [4 /*yield*/, fs.mkdir(tempDir, { recursive: true })];
                case 2:
                    // 确保临时目录存在
                    _a.sent();
                    // 写入代码到临时文件
                    return [4 /*yield*/, fs.writeFile(filePath, code, 'utf-8')];
                case 3:
                    // 写入代码到临时文件
                    _a.sent();
                    return [4 /*yield*/, executeCommand('node', [filePath], timeout, tempDir)];
                case 4:
                    result = _a.sent();
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, fs.unlink(filePath)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    cleanupError_3 = _a.sent();
                    logger.warn('清理临时文件失败:', cleanupError_3);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/, result];
                case 9:
                    error_5 = _a.sent();
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, fs.unlink(filePath)];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 12:
                    cleanupError_4 = _a.sent();
                    logger.warn('清理临时文件失败:', cleanupError_4);
                    return [3 /*break*/, 13];
                case 13: throw error_5;
                case 14: return [2 /*return*/];
            }
        });
    });
}
// 执行Shell命令
function executeShellCommand(command, timeout, workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        var tempDir, parts, cmd, args;
        return __generator(this, function (_a) {
            tempDir = workingDir || process.cwd();
            parts = command.trim().split(/\s+/);
            cmd = parts[0];
            args = parts.slice(1);
            return [2 /*return*/, executeCommand(cmd, args, timeout, tempDir)];
        });
    });
}
// 通用命令执行函数
function executeCommand(command, args, timeout, workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var _a, _b;
                    var process = (0, child_process_1.spawn)(command, args, {
                        cwd: workingDir,
                        stdio: ['pipe', 'pipe', 'pipe'],
                        shell: false
                    });
                    var stdout = '';
                    var stderr = '';
                    var isResolved = false;
                    // 设置超时
                    var timeoutId = setTimeout(function () {
                        if (!isResolved) {
                            isResolved = true;
                            process.kill('SIGTERM');
                            resolve({
                                success: false,
                                error: "\u547D\u4EE4\u6267\u884C\u8D85\u65F6 (".concat(timeout, "\u79D2)"),
                                stdout: stdout,
                                stderr: stderr,
                                exitCode: -1
                            });
                        }
                    }, timeout * 1000);
                    // 收集输出
                    (_a = process.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                        stdout += data.toString();
                    });
                    (_b = process.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                        stderr += data.toString();
                    });
                    // 处理进程结束
                    process.on('close', function (code) {
                        if (!isResolved) {
                            isResolved = true;
                            clearTimeout(timeoutId);
                            var success = code === 0;
                            resolve({
                                success: success,
                                stdout: stdout.trim(),
                                stderr: stderr.trim(),
                                exitCode: code,
                                error: success ? null : "\u547D\u4EE4\u6267\u884C\u5931\u8D25\uFF0C\u9000\u51FA\u7801: ".concat(code)
                            });
                        }
                    });
                    // 处理进程错误
                    process.on('error', function (error) {
                        if (!isResolved) {
                            isResolved = true;
                            clearTimeout(timeoutId);
                            resolve({
                                success: false,
                                error: "\u8FDB\u7A0B\u542F\u52A8\u5931\u8D25: ".concat(error.message),
                                stdout: stdout,
                                stderr: stderr,
                                exitCode: -1
                            });
                        }
                    });
                })];
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
