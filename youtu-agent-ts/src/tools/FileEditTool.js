"use strict";
/**
 * 文件编辑工具
 * 提供文件读写、创建、删除等功能
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
exports.fileEditTools = void 0;
var zod_1 = require("zod");
var fs = require("fs/promises");
var path = require("path");
var Logger_1 = require("../utils/Logger");
var logger = new Logger_1.Logger('FileEditTool');
// 文件操作参数模式
var FileReadSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要读取的文件路径'),
    encoding: zod_1.z.string().optional().default('utf-8').describe('文件编码')
});
var FileWriteSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要写入的文件路径'),
    content: zod_1.z.string().describe('要写入的内容'),
    encoding: zod_1.z.string().optional().default('utf-8').describe('文件编码'),
    createDir: zod_1.z.boolean().optional().default(true).describe('是否自动创建目录')
});
var FileDeleteSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要删除的文件路径')
});
var FileListSchema = zod_1.z.object({
    dirPath: zod_1.z.string().describe('要列出的目录路径'),
    recursive: zod_1.z.boolean().optional().default(false).describe('是否递归列出子目录'),
    includeHidden: zod_1.z.boolean().optional().default(false).describe('是否包含隐藏文件')
});
var FileExistsSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要检查的文件路径')
});
var FileInfoSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('要获取信息的文件路径')
});
// 文件读取处理器
var fileReadHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, encoding, content, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                filePath = args.filePath, encoding = args.encoding;
                logger.info("\u8BFB\u53D6\u6587\u4EF6: ".concat(filePath));
                return [4 /*yield*/, fs.readFile(filePath, encoding)];
            case 1:
                content = _a.sent();
                logger.info("\u6587\u4EF6\u8BFB\u53D6\u6210\u529F: ".concat(filePath, ", \u5927\u5C0F: ").concat(content.length, " \u5B57\u7B26"));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        content: content,
                        size: content.length,
                        encoding: encoding
                    })];
            case 2:
                error_1 = _a.sent();
                logger.error("\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25: ".concat(args.filePath), error_1);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 文件写入处理器
var fileWriteHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, content, encoding, createDir, dirPath, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                filePath = args.filePath, content = args.content, encoding = args.encoding, createDir = args.createDir;
                logger.info("\u5199\u5165\u6587\u4EF6: ".concat(filePath));
                if (!createDir) return [3 /*break*/, 2];
                dirPath = path.dirname(filePath);
                return [4 /*yield*/, fs.mkdir(dirPath, { recursive: true })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [4 /*yield*/, fs.writeFile(filePath, content, encoding)];
            case 3:
                _a.sent();
                logger.info("\u6587\u4EF6\u5199\u5165\u6210\u529F: ".concat(filePath, ", \u5927\u5C0F: ").concat(content.length, " \u5B57\u7B26"));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        size: content.length,
                        encoding: encoding
                    })];
            case 4:
                error_2 = _a.sent();
                logger.error("\u6587\u4EF6\u5199\u5165\u5931\u8D25: ".concat(args.filePath), error_2);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_2 instanceof Error ? error_2.message : '未知错误'
                    })];
            case 5: return [2 /*return*/];
        }
    });
}); };
// 文件删除处理器
var fileDeleteHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                filePath = args.filePath;
                logger.info("\u5220\u9664\u6587\u4EF6: ".concat(filePath));
                return [4 /*yield*/, fs.unlink(filePath)];
            case 1:
                _a.sent();
                logger.info("\u6587\u4EF6\u5220\u9664\u6210\u529F: ".concat(filePath));
                return [2 /*return*/, JSON.stringify({
                        success: true
                    })];
            case 2:
                error_3 = _a.sent();
                logger.error("\u6587\u4EF6\u5220\u9664\u5931\u8D25: ".concat(args.filePath), error_3);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_3 instanceof Error ? error_3.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 文件列表处理器
var fileListHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var dirPath, recursive, includeHidden, files, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dirPath = args.dirPath, recursive = args.recursive, includeHidden = args.includeHidden;
                logger.info("\u5217\u51FA\u76EE\u5F55: ".concat(dirPath));
                return [4 /*yield*/, listFiles(dirPath, recursive, includeHidden)];
            case 1:
                files = _a.sent();
                logger.info("\u76EE\u5F55\u5217\u51FA\u6210\u529F: ".concat(dirPath, ", \u6587\u4EF6\u6570: ").concat(files.length));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        files: files,
                        count: files.length
                    })];
            case 2:
                error_4 = _a.sent();
                logger.error("\u76EE\u5F55\u5217\u51FA\u5931\u8D25: ".concat(args.dirPath), error_4);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_4 instanceof Error ? error_4.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 文件存在检查处理器
var fileExistsHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, exists, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                filePath = args.filePath;
                logger.info("\u68C0\u67E5\u6587\u4EF6\u5B58\u5728: ".concat(filePath));
                return [4 /*yield*/, fileExists(filePath)];
            case 1:
                exists = _a.sent();
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        exists: exists,
                        path: filePath
                    })];
            case 2:
                error_5 = _a.sent();
                logger.error("\u6587\u4EF6\u5B58\u5728\u68C0\u67E5\u5931\u8D25: ".concat(args.filePath), error_5);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_5 instanceof Error ? error_5.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 文件信息处理器
var fileInfoHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, stats, info, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                filePath = args.filePath;
                logger.info("\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F: ".concat(filePath));
                return [4 /*yield*/, fs.stat(filePath)];
            case 1:
                stats = _a.sent();
                info = {
                    path: filePath,
                    size: stats.size,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    accessedAt: stats.atime,
                    permissions: stats.mode.toString(8)
                };
                logger.info("\u6587\u4EF6\u4FE1\u606F\u83B7\u53D6\u6210\u529F: ".concat(filePath));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        info: info
                    })];
            case 2:
                error_6 = _a.sent();
                logger.error("\u6587\u4EF6\u4FE1\u606F\u83B7\u53D6\u5931\u8D25: ".concat(args.filePath), error_6);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_6 instanceof Error ? error_6.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 辅助函数：递归列出文件
function listFiles(dirPath, recursive, includeHidden) {
    return __awaiter(this, void 0, void 0, function () {
        var files, entries, _i, entries_1, entry, fullPath, subFiles, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    files = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, fs.readdir(dirPath, { withFileTypes: true })];
                case 2:
                    entries = _a.sent();
                    _i = 0, entries_1 = entries;
                    _a.label = 3;
                case 3:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 8];
                    entry = entries_1[_i];
                    // 跳过隐藏文件（如果需要）
                    if (!includeHidden && entry.name.startsWith('.')) {
                        return [3 /*break*/, 7];
                    }
                    fullPath = path.join(dirPath, entry.name);
                    if (!entry.isDirectory()) return [3 /*break*/, 6];
                    files.push({
                        name: entry.name,
                        path: fullPath,
                        type: 'directory'
                    });
                    if (!recursive) return [3 /*break*/, 5];
                    return [4 /*yield*/, listFiles(fullPath, recursive, includeHidden)];
                case 4:
                    subFiles = _a.sent();
                    files.push.apply(files, subFiles);
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    files.push({
                        name: entry.name,
                        path: fullPath,
                        type: 'file'
                    });
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_7 = _a.sent();
                    logger.error("\u5217\u51FA\u76EE\u5F55\u5931\u8D25: ".concat(dirPath), error_7);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, files];
            }
        });
    });
}
// 辅助函数：检查文件是否存在
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs.access(filePath)];
                case 1:
                    _b.sent();
                    return [2 /*return*/, true];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
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
