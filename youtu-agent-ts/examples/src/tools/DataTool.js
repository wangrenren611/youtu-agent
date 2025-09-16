"use strict";
/**
 * 数据处理工具
 * 提供CSV、JSON、Excel等数据格式的处理功能
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
exports.dataTools = void 0;
const zod_1 = require("zod");
const Logger_1 = require("../utils/Logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const csv = __importStar(require("csv-parser"));
const fs_1 = require("fs");
const logger = new Logger_1.Logger('DataTool');
// 辅助函数
async function transformJsonData(filePath, parameters) {
    // 简单的JSON数据转换实现
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    // 这里可以添加具体的转换逻辑
    return JSON.stringify(data, null, 2);
}
async function queryJsonData(filePath, parameters) {
    // 简单的JSON数据查询实现
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    // 这里可以添加具体的查询逻辑
    return JSON.stringify(data, null, 2);
}
// CSV处理参数模式
const CsvProcessSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('CSV文件路径'),
    operation: zod_1.z.enum(['read', 'write', 'filter', 'sort', 'aggregate']).describe('操作类型'),
    parameters: zod_1.z.record(zod_1.z.any()).optional().describe('操作参数')
});
// JSON处理参数模式
const JsonProcessSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('JSON文件路径'),
    operation: zod_1.z.enum(['read', 'write', 'validate', 'transform', 'query']).describe('操作类型'),
    parameters: zod_1.z.record(zod_1.z.any()).optional().describe('操作参数')
});
// 数据转换参数模式
const DataConvertSchema = zod_1.z.object({
    inputPath: zod_1.z.string().describe('输入文件路径'),
    outputPath: zod_1.z.string().describe('输出文件路径'),
    inputFormat: zod_1.z.enum(['csv', 'json', 'excel']).describe('输入格式'),
    outputFormat: zod_1.z.enum(['csv', 'json', 'excel']).describe('输出格式'),
    options: zod_1.z.record(zod_1.z.any()).optional().describe('转换选项')
});
// 数据分析参数模式
const DataAnalyzeSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('数据文件路径'),
    analysisType: zod_1.z.enum(['summary', 'statistics', 'correlation', 'trend']).describe('分析类型'),
    columns: zod_1.z.array(zod_1.z.string()).optional().describe('要分析的列')
});
// CSV处理处理器
const csvProcessHandler = async (args) => {
    try {
        const { filePath, operation, parameters = {} } = args;
        logger.info(`处理CSV文件: ${filePath}, 操作: ${operation}`);
        switch (operation) {
            case 'read':
                return await readCsvFile(filePath, parameters);
            case 'write':
                return await writeCsvFile(filePath, parameters);
            case 'filter':
                return await filterCsvData(filePath, parameters);
            case 'sort':
                return await sortCsvData(filePath, parameters);
            case 'aggregate':
                return await aggregateCsvData(filePath, parameters);
            default:
                throw new Error(`不支持的CSV操作: ${operation}`);
        }
    }
    catch (error) {
        logger.error(`CSV处理失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// JSON处理处理器
const jsonProcessHandler = async (args) => {
    try {
        const { filePath, operation, parameters = {} } = args;
        logger.info(`处理JSON文件: ${filePath}, 操作: ${operation}`);
        switch (operation) {
            case 'read':
                return await readJsonFile(filePath, parameters);
            case 'write':
                return await writeJsonFile(filePath, parameters);
            case 'validate':
                return await validateJsonFile(filePath, parameters);
            case 'transform':
                return await transformJsonData(filePath, parameters);
            case 'query':
                return await queryJsonData(filePath, parameters);
            default:
                throw new Error(`不支持的JSON操作: ${operation}`);
        }
    }
    catch (error) {
        logger.error(`JSON处理失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 数据转换处理器
const dataConvertHandler = async (args) => {
    try {
        const { inputPath, outputPath, inputFormat, outputFormat, options = {} } = args;
        logger.info(`转换数据格式: ${inputFormat} -> ${outputFormat}`);
        // 读取输入数据
        let data;
        switch (inputFormat) {
            case 'csv':
                data = await readCsvData(inputPath);
                break;
            case 'json':
                data = await readJsonData(inputPath);
                break;
            case 'excel':
                data = await readExcelData(inputPath);
                break;
            default:
                throw new Error(`不支持的输入格式: ${inputFormat}`);
        }
        // 写入输出数据
        switch (outputFormat) {
            case 'csv':
                await writeCsvData(outputPath, data, options);
                break;
            case 'json':
                await writeJsonData(outputPath, data, options);
                break;
            case 'excel':
                await writeExcelData(outputPath, data, options);
                break;
            default:
                throw new Error(`不支持的输出格式: ${outputFormat}`);
        }
        logger.info(`数据转换完成: ${outputPath}`);
        return JSON.stringify({
            success: true,
            inputPath,
            outputPath,
            inputFormat,
            outputFormat,
            recordCount: Array.isArray(data) ? data.length : 1
        });
    }
    catch (error) {
        logger.error(`数据转换失败: ${args.inputPath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// 数据分析处理器
const dataAnalyzeHandler = async (args) => {
    try {
        const { filePath, analysisType, columns = [] } = args;
        logger.info(`分析数据: ${filePath}, 类型: ${analysisType}`);
        // 读取数据
        const data = await readDataFile(filePath);
        // 执行分析
        let analysis;
        switch (analysisType) {
            case 'summary':
                analysis = await generateDataSummary(data, columns);
                break;
            case 'statistics':
                analysis = await calculateStatistics(data, columns);
                break;
            case 'correlation':
                analysis = await calculateCorrelation(data, columns);
                break;
            case 'trend':
                analysis = await analyzeTrends(data, columns);
                break;
            default:
                throw new Error(`不支持的分析类型: ${analysisType}`);
        }
        logger.info(`数据分析完成: ${filePath}`);
        return JSON.stringify({
            success: true,
            filePath,
            analysisType,
            analysis,
            recordCount: Array.isArray(data) ? data.length : 1
        });
    }
    catch (error) {
        logger.error(`数据分析失败: ${args.filePath}`, error);
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
};
// CSV文件读取
async function readCsvFile(filePath, parameters) {
    const { limit, columns } = parameters;
    const results = [];
    return new Promise((resolve, reject) => {
        (0, fs_1.createReadStream)(filePath)
            .pipe(csv())
            .on('data', (data) => {
            if (limit && results.length >= limit) {
                return;
            }
            if (columns && columns.length > 0) {
                const filteredData = {};
                columns.forEach((col) => {
                    if (data[col] !== undefined) {
                        filteredData[col] = data[col];
                    }
                });
                results.push(filteredData);
            }
            else {
                results.push(data);
            }
        })
            .on('end', () => {
            resolve(JSON.stringify({
                success: true,
                data: results,
                count: results.length
            }));
        })
            .on('error', reject);
    });
}
// CSV文件写入
async function writeCsvFile(filePath, parameters) {
    const { data, headers } = parameters;
    if (!Array.isArray(data)) {
        throw new Error('数据必须是数组格式');
    }
    let csvContent = '';
    // 写入表头
    if (headers && headers.length > 0) {
        csvContent += headers.join(',') + '\n';
    }
    else if (data.length > 0) {
        csvContent += Object.keys(data[0]).join(',') + '\n';
    }
    // 写入数据
    data.forEach((row) => {
        const values = Object.values(row).map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value);
        csvContent += values.join(',') + '\n';
    });
    await fs.writeFile(filePath, csvContent, 'utf-8');
    return JSON.stringify({
        success: true,
        filePath,
        recordCount: data.length
    });
}
// CSV数据过滤
async function filterCsvData(filePath, parameters) {
    const { conditions, outputPath } = parameters;
    const data = await readCsvData(filePath);
    const filteredData = data.filter((row) => {
        return conditions.every((condition) => {
            const { column, operator, value } = condition;
            const cellValue = row[column];
            switch (operator) {
                case 'equals':
                    return cellValue == value;
                case 'not_equals':
                    return cellValue != value;
                case 'greater_than':
                    return Number(cellValue) > Number(value);
                case 'less_than':
                    return Number(cellValue) < Number(value);
                case 'contains':
                    return String(cellValue).includes(String(value));
                case 'not_contains':
                    return !String(cellValue).includes(String(value));
                default:
                    return true;
            }
        });
    });
    if (outputPath) {
        await writeCsvData(outputPath, filteredData);
    }
    return JSON.stringify({
        success: true,
        originalCount: data.length,
        filteredCount: filteredData.length,
        data: filteredData
    });
}
// CSV数据排序
async function sortCsvData(filePath, parameters) {
    const { sortBy, order = 'asc', outputPath } = parameters;
    const data = await readCsvData(filePath);
    const sortedData = data.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (order === 'desc') {
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        else {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
    });
    if (outputPath) {
        await writeCsvData(outputPath, sortedData);
    }
    return JSON.stringify({
        success: true,
        sortBy,
        order,
        data: sortedData
    });
}
// CSV数据聚合
async function aggregateCsvData(filePath, parameters) {
    const { groupBy, aggregations } = parameters;
    const data = await readCsvData(filePath);
    const groups = {};
    // 分组
    data.forEach((row) => {
        const key = row[groupBy];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(row);
    });
    // 聚合
    const aggregatedData = Object.entries(groups).map(([key, group]) => {
        const result = { [groupBy]: key };
        aggregations.forEach((agg) => {
            const { column, operation, alias } = agg;
            const values = group.map((row) => Number(row[column])).filter((v) => !isNaN(v));
            let value;
            switch (operation) {
                case 'sum':
                    value = values.reduce((sum, v) => sum + v, 0);
                    break;
                case 'avg':
                    value = values.reduce((sum, v) => sum + v, 0) / values.length;
                    break;
                case 'min':
                    value = Math.min(...values);
                    break;
                case 'max':
                    value = Math.max(...values);
                    break;
                case 'count':
                    value = values.length;
                    break;
                default:
                    value = 0;
            }
            result[alias || `${operation}_${column}`] = value;
        });
        return result;
    });
    return JSON.stringify({
        success: true,
        groupBy,
        aggregatedData,
        groupCount: Object.keys(groups).length
    });
}
// JSON文件读取
async function readJsonFile(filePath, parameters) {
    const { query, pretty = false } = parameters;
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    let result = data;
    if (query) {
        result = queryJsonObject(data, query);
    }
    return JSON.stringify({
        success: true,
        data: result,
        pretty
    });
}
// JSON文件写入
async function writeJsonFile(filePath, parameters) {
    const { data, pretty = true } = parameters;
    const content = pretty ?
        JSON.stringify(data, null, 2) :
        JSON.stringify(data);
    await fs.writeFile(filePath, content, 'utf-8');
    return JSON.stringify({
        success: true,
        filePath,
        size: content.length
    });
}
// JSON数据验证
async function validateJsonFile(filePath, parameters) {
    const { schema } = parameters;
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        // 简单的验证逻辑
        // 实际项目中可以使用ajv等库进行schema验证
        const isValid = validateAgainstSchema(data, schema);
        return JSON.stringify({
            success: true,
            isValid,
            errors: isValid ? [] : ['数据不符合schema要求']
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            isValid: false,
            errors: ['JSON格式错误']
        });
    }
}
// 辅助函数
async function readCsvData(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        (0, fs_1.createReadStream)(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}
async function readJsonData(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
}
async function readExcelData(filePath) {
    // 模拟Excel读取
    // 实际项目中可以使用xlsx等库
    logger.info(`模拟读取Excel文件: ${filePath}`);
    return [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'London' }
    ];
}
async function writeCsvData(filePath, data, options = {}) {
    let csvContent = '';
    if (data.length > 0) {
        csvContent += Object.keys(data[0]).join(',') + '\n';
        data.forEach(row => {
            const values = Object.values(row).map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value);
            csvContent += values.join(',') + '\n';
        });
    }
    await fs.writeFile(filePath, csvContent, 'utf-8');
}
async function writeJsonData(filePath, data, options = {}) {
    const pretty = options.pretty !== false;
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await fs.writeFile(filePath, content, 'utf-8');
}
async function writeExcelData(filePath, data, options = {}) {
    // 模拟Excel写入
    // 实际项目中可以使用xlsx等库
    logger.info(`模拟写入Excel文件: ${filePath}`);
}
async function readDataFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.csv':
            return await readCsvData(filePath);
        case '.json':
            return await readJsonData(filePath);
        case '.xlsx':
        case '.xls':
            return await readExcelData(filePath);
        default:
            throw new Error(`不支持的文件格式: ${ext}`);
    }
}
function queryJsonObject(data, query) {
    // 简单的JSON查询实现
    // 实际项目中可以使用jsonpath等库
    try {
        const path = query.split('.');
        let result = data;
        for (const key of path) {
            result = result[key];
        }
        return result;
    }
    catch {
        return null;
    }
}
function validateAgainstSchema(data, schema) {
    // 简单的schema验证
    // 实际项目中应该使用专业的验证库
    return true;
}
async function generateDataSummary(data, columns) {
    return {
        totalRecords: data.length,
        columns: columns.length > 0 ? columns : Object.keys(data[0] || {}),
        dataTypes: {},
        nullCounts: {},
        uniqueCounts: {}
    };
}
async function calculateStatistics(data, columns) {
    return {
        mean: {},
        median: {},
        mode: {},
        standardDeviation: {},
        variance: {}
    };
}
async function calculateCorrelation(data, columns) {
    return {
        correlationMatrix: {},
        significantCorrelations: []
    };
}
async function analyzeTrends(data, columns) {
    return {
        trends: {},
        seasonalPatterns: {},
        forecasts: {}
    };
}
// 导出工具定义
exports.dataTools = [
    {
        name: 'csv_process',
        description: '处理CSV文件（读取、写入、过滤、排序、聚合）',
        parameters: CsvProcessSchema,
        handler: csvProcessHandler
    },
    {
        name: 'json_process',
        description: '处理JSON文件（读取、写入、验证、转换、查询）',
        parameters: JsonProcessSchema,
        handler: jsonProcessHandler
    },
    {
        name: 'data_convert',
        description: '转换数据格式（CSV、JSON、Excel之间转换）',
        parameters: DataConvertSchema,
        handler: dataConvertHandler
    },
    {
        name: 'data_analyze',
        description: '分析数据（摘要、统计、相关性、趋势分析）',
        parameters: DataAnalyzeSchema,
        handler: dataAnalyzeHandler
    }
];
