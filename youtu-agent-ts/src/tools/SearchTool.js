"use strict";
/**
 * 搜索工具
 * 提供网络搜索、本地搜索等功能
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
exports.searchTools = void 0;
var zod_1 = require("zod");
var axios_1 = require("axios");
var Logger_1 = require("../utils/Logger");
var logger = new Logger_1.Logger('SearchTool');
// 网络搜索参数模式
var WebSearchSchema = zod_1.z.object({
    query: zod_1.z.string().describe('搜索查询'),
    maxResults: zod_1.z.number().optional().default(5).describe('最大结果数量'),
    language: zod_1.z.string().optional().default('zh-CN').describe('搜索语言')
});
// 本地搜索参数模式
var LocalSearchSchema = zod_1.z.object({
    query: zod_1.z.string().describe('搜索查询'),
    directory: zod_1.z.string().describe('搜索目录'),
    fileTypes: zod_1.z.array(zod_1.z.string()).optional().describe('文件类型过滤'),
    caseSensitive: zod_1.z.boolean().optional().default(false).describe('是否区分大小写'),
    recursive: zod_1.z.boolean().optional().default(true).describe('是否递归搜索')
});
// 网络搜索处理器
var webSearchHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var query, maxResults, language, searchResults, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                query = args.query, maxResults = args.maxResults, language = args.language;
                logger.info("\u6267\u884C\u7F51\u7EDC\u641C\u7D22: ".concat(query));
                return [4 /*yield*/, performWebSearch(query, maxResults, language)];
            case 1:
                searchResults = _a.sent();
                logger.info("\u7F51\u7EDC\u641C\u7D22\u5B8C\u6210: ".concat(query, ", \u7ED3\u679C\u6570: ").concat(searchResults.length));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        query: query,
                        results: searchResults,
                        count: searchResults.length
                    })];
            case 2:
                error_1 = _a.sent();
                logger.error("\u7F51\u7EDC\u641C\u7D22\u5931\u8D25: ".concat(args.query), error_1);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 本地搜索处理器
var localSearchHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var query, directory, fileTypes, caseSensitive, recursive, searchResults, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                query = args.query, directory = args.directory, fileTypes = args.fileTypes, caseSensitive = args.caseSensitive, recursive = args.recursive;
                logger.info("\u6267\u884C\u672C\u5730\u641C\u7D22: ".concat(query, " \u5728 ").concat(directory));
                return [4 /*yield*/, performLocalSearch(query, directory, fileTypes, caseSensitive, recursive)];
            case 1:
                searchResults = _a.sent();
                logger.info("\u672C\u5730\u641C\u7D22\u5B8C\u6210: ".concat(query, ", \u7ED3\u679C\u6570: ").concat(searchResults.length));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        query: query,
                        directory: directory,
                        results: searchResults,
                        count: searchResults.length
                    })];
            case 2:
                error_2 = _a.sent();
                logger.error("\u672C\u5730\u641C\u7D22\u5931\u8D25: ".concat(args.query), error_2);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_2 instanceof Error ? error_2.message : '未知错误'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
// 执行网络搜索
function performWebSearch(query, maxResults, language) {
    return __awaiter(this, void 0, void 0, function () {
        var response, results, _i, _a, topic, additionalResults, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, axios_1.default.get('https://api.duckduckgo.com/', {
                            params: {
                                q: query,
                                format: 'json',
                                no_html: '1',
                                skip_disambig: '1'
                            },
                            timeout: 10000
                        })];
                case 1:
                    response = _b.sent();
                    results = [];
                    // 处理抽象结果
                    if (response.data.Abstract) {
                        results.push({
                            title: response.data.Heading || query,
                            content: response.data.Abstract,
                            url: response.data.AbstractURL,
                            source: 'DuckDuckGo Abstract'
                        });
                    }
                    // 处理相关主题
                    if (response.data.RelatedTopics) {
                        for (_i = 0, _a = response.data.RelatedTopics.slice(0, maxResults - results.length); _i < _a.length; _i++) {
                            topic = _a[_i];
                            if (topic.Text && topic.FirstURL) {
                                results.push({
                                    title: topic.Text.split(' - ')[0] || topic.Text,
                                    content: topic.Text,
                                    url: topic.FirstURL,
                                    source: 'DuckDuckGo Related'
                                });
                            }
                        }
                    }
                    if (!(results.length < maxResults)) return [3 /*break*/, 3];
                    return [4 /*yield*/, performFallbackSearch(query, maxResults - results.length)];
                case 2:
                    additionalResults = _b.sent();
                    results.push.apply(results, additionalResults);
                    _b.label = 3;
                case 3: return [2 /*return*/, results.slice(0, maxResults)];
                case 4:
                    error_3 = _b.sent();
                    logger.error('网络搜索API调用失败:', error_3);
                    // 返回模拟结果
                    return [2 /*return*/, [{
                                title: "\u641C\u7D22\u7ED3\u679C: ".concat(query),
                                content: "\u62B1\u6B49\uFF0C\u65E0\u6CD5\u83B7\u53D6 \"".concat(query, "\" \u7684\u5B9E\u65F6\u641C\u7D22\u7ED3\u679C\u3002\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u6216\u7A0D\u540E\u91CD\u8BD5\u3002"),
                                url: '',
                                source: 'Fallback'
                            }]];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// 备用搜索方法
function performFallbackSearch(query, maxResults) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // 这里可以实现其他搜索API的调用
            // 例如：Google Custom Search API、Bing Search API等
            return [2 /*return*/, [{
                        title: "\u5907\u7528\u641C\u7D22\u7ED3\u679C: ".concat(query),
                        content: "\u8FD9\u662F \"".concat(query, "\" \u7684\u5907\u7528\u641C\u7D22\u7ED3\u679C\u3002\u5EFA\u8BAE\u4F7F\u7528\u5176\u4ED6\u641C\u7D22\u5DE5\u5177\u83B7\u53D6\u66F4\u51C6\u786E\u7684\u4FE1\u606F\u3002"),
                        url: '',
                        source: 'Fallback Search'
                    }]];
        });
    });
}
// 执行本地搜索
function performLocalSearch(query_1, directory_1, fileTypes_1) {
    return __awaiter(this, arguments, void 0, function (query, directory, fileTypes, caseSensitive, recursive) {
        function searchDirectory(dirPath) {
            return __awaiter(this, void 0, void 0, function () {
                var entries, _loop_1, _i, entries_1, entry, dirError_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, fs.readdir(dirPath, { withFileTypes: true })];
                        case 1:
                            entries = _a.sent();
                            _loop_1 = function (entry) {
                                var fullPath, ext, content, searchContent, lines_1, matches_1, fileError_1;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            fullPath = path.join(dirPath, entry.name);
                                            if (!(entry.isDirectory() && recursive)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, searchDirectory(fullPath)];
                                        case 1:
                                            _b.sent();
                                            return [3 /*break*/, 6];
                                        case 2:
                                            if (!entry.isFile()) return [3 /*break*/, 6];
                                            // 检查文件类型
                                            if (fileTypes && fileTypes.length > 0) {
                                                ext = path.extname(entry.name).toLowerCase();
                                                if (!fileTypes.includes(ext)) {
                                                    return [2 /*return*/, "continue"];
                                                }
                                            }
                                            _b.label = 3;
                                        case 3:
                                            _b.trys.push([3, 5, , 6]);
                                            return [4 /*yield*/, fs.readFile(fullPath, 'utf-8')];
                                        case 4:
                                            content = _b.sent();
                                            searchContent = caseSensitive ? content : content.toLowerCase();
                                            if (searchRegex.test(searchContent)) {
                                                lines_1 = content.split('\n');
                                                matches_1 = [];
                                                lines_1.forEach(function (line, index) {
                                                    if (searchRegex.test(caseSensitive ? line : line.toLowerCase())) {
                                                        matches_1.push({
                                                            lineNumber: index + 1,
                                                            content: line.trim(),
                                                            context: lines_1.slice(Math.max(0, index - 2), index + 3).join('\n')
                                                        });
                                                    }
                                                });
                                                if (matches_1.length > 0) {
                                                    results.push({
                                                        file: fullPath,
                                                        matches: matches_1,
                                                        matchCount: matches_1.length
                                                    });
                                                }
                                            }
                                            return [3 /*break*/, 6];
                                        case 5:
                                            fileError_1 = _b.sent();
                                            // 跳过无法读取的文件
                                            logger.debug("\u8DF3\u8FC7\u6587\u4EF6: ".concat(fullPath), fileError_1);
                                            return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            };
                            _i = 0, entries_1 = entries;
                            _a.label = 2;
                        case 2:
                            if (!(_i < entries_1.length)) return [3 /*break*/, 5];
                            entry = entries_1[_i];
                            return [5 /*yield**/, _loop_1(entry)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            dirError_1 = _a.sent();
                            logger.error("\u641C\u7D22\u76EE\u5F55\u5931\u8D25: ".concat(dirPath), dirError_1);
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        }
        var fs, path, results, searchRegex;
        if (caseSensitive === void 0) { caseSensitive = false; }
        if (recursive === void 0) { recursive = true; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                case 1:
                    fs = _a.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('path'); })];
                case 2:
                    path = _a.sent();
                    results = [];
                    searchRegex = new RegExp(caseSensitive ? query : query.toLowerCase(), caseSensitive ? 'g' : 'gi');
                    return [4 /*yield*/, searchDirectory(directory)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, results];
            }
        });
    });
}
// 导出工具定义
exports.searchTools = [
    {
        name: 'web_search',
        description: '在互联网上搜索信息',
        parameters: WebSearchSchema,
        handler: webSearchHandler
    },
    {
        name: 'local_search',
        description: '在本地文件系统中搜索内容',
        parameters: LocalSearchSchema,
        handler: localSearchHandler
    }
];
