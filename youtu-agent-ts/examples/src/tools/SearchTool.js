"use strict";
/**
 * 搜索工具
 * 提供网络搜索、本地搜索等功能
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTools = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const Logger_1 = require("../utils/Logger");
const logger = new Logger_1.Logger('SearchTool');
// 网络搜索参数模式
const WebSearchSchema = zod_1.z.object({
    query: zod_1.z.string().describe('搜索查询'),
    maxResults: zod_1.z.number().optional().default(5).describe('最大结果数量'),
    language: zod_1.z.string().optional().default('zh-CN').describe('搜索语言')
});
// 本地搜索参数模式
const LocalSearchSchema = zod_1.z.object({
    query: zod_1.z.string().describe('搜索查询'),
    directory: zod_1.z.string().describe('搜索目录'),
    fileTypes: zod_1.z.array(zod_1.z.string()).optional().describe('文件类型过滤'),
    caseSensitive: zod_1.z.boolean().optional().default(false).describe('是否区分大小写'),
    recursive: zod_1.z.boolean().optional().default(true).describe('是否递归搜索')
});
// 网络搜索处理器
const webSearchHandler = async (args) => {
    try {
        const { query, maxResults, language } = args;
        logger.info(`执行网络搜索: ${query}`);
        // 这里使用DuckDuckGo API作为示例
        // 实际项目中可以使用Google Search API、Bing API等
        const searchResults = await performWebSearch(query, maxResults, language);
        logger.info(`网络搜索完成: ${query}, 结果数: ${searchResults.length}`);
        return JSON.stringify({
            success: true,
            query,
            results: searchResults,
            count: searchResults.length
        });
    }
    catch (error) {
        logger.error(`网络搜索失败: ${args.query}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 本地搜索处理器
const localSearchHandler = async (args) => {
    try {
        const { query, directory, fileTypes, caseSensitive, recursive } = args;
        logger.info(`执行本地搜索: ${query} 在 ${directory}`);
        const searchResults = await performLocalSearch(query, directory, fileTypes, caseSensitive, recursive);
        logger.info(`本地搜索完成: ${query}, 结果数: ${searchResults.length}`);
        return JSON.stringify({
            success: true,
            query,
            directory,
            results: searchResults,
            count: searchResults.length
        });
    }
    catch (error) {
        logger.error(`本地搜索失败: ${args.query}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 执行网络搜索
async function performWebSearch(query, maxResults, language) {
    try {
        // 使用DuckDuckGo Instant Answer API
        const response = await axios_1.default.get('https://api.duckduckgo.com/', {
            params: {
                q: query,
                format: 'json',
                no_html: '1',
                skip_disambig: '1'
            },
            timeout: 10000
        });
        const results = [];
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
            for (const topic of response.data.RelatedTopics.slice(0, maxResults - results.length)) {
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
        // 如果结果不足，尝试使用其他搜索API
        if (results.length < maxResults) {
            const additionalResults = await performFallbackSearch(query, maxResults - results.length);
            results.push(...additionalResults);
        }
        return results.slice(0, maxResults);
    }
    catch (error) {
        logger.error('网络搜索API调用失败:', error);
        // 返回模拟结果
        return [{
                title: `搜索结果: ${query}`,
                content: `抱歉，无法获取 "${query}" 的实时搜索结果。请检查网络连接或稍后重试。`,
                url: '',
                source: 'Fallback'
            }];
    }
}
// 备用搜索方法
async function performFallbackSearch(query, maxResults) {
    // 这里可以实现其他搜索API的调用
    // 例如：Google Custom Search API、Bing Search API等
    return [{
            title: `备用搜索结果: ${query}`,
            content: `这是 "${query}" 的备用搜索结果。建议使用其他搜索工具获取更准确的信息。`,
            url: '',
            source: 'Fallback Search'
        }];
}
// 执行本地搜索
async function performLocalSearch(query, directory, fileTypes, caseSensitive = false, recursive = true) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const results = [];
    const searchRegex = new RegExp(caseSensitive ? query : query.toLowerCase(), caseSensitive ? 'g' : 'gi');
    async function searchDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory() && recursive) {
                    await searchDirectory(fullPath);
                }
                else if (entry.isFile()) {
                    // 检查文件类型
                    if (fileTypes && fileTypes.length > 0) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (!fileTypes.includes(ext)) {
                            continue;
                        }
                    }
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const searchContent = caseSensitive ? content : content.toLowerCase();
                        if (searchRegex.test(searchContent)) {
                            // 找到匹配，提取上下文
                            const lines = content.split('\n');
                            const matches = [];
                            lines.forEach((line, index) => {
                                if (searchRegex.test(caseSensitive ? line : line.toLowerCase())) {
                                    matches.push({
                                        lineNumber: index + 1,
                                        content: line.trim(),
                                        context: lines.slice(Math.max(0, index - 2), index + 3).join('\n')
                                    });
                                }
                            });
                            if (matches.length > 0) {
                                results.push({
                                    file: fullPath,
                                    matches,
                                    matchCount: matches.length
                                });
                            }
                        }
                    }
                    catch (fileError) {
                        // 跳过无法读取的文件
                        logger.debug(`跳过文件: ${fullPath}`, fileError);
                    }
                }
            }
        }
        catch (dirError) {
            logger.error(`搜索目录失败: ${dirPath}`, dirError);
        }
    }
    await searchDirectory(directory);
    return results;
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
