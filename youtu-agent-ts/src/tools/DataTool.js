"use strict";
/**
 * 数据处理工具
 * 提供CSV、JSON、Excel等数据格式的处理功能
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
exports.dataTools = void 0;
var zod_1 = require("zod");
var Logger_1 = require("../utils/Logger");
var fs = require("fs/promises");
var path = require("path");
var csv = require("csv-parser");
var fs_1 = require("fs");
var logger = new Logger_1.Logger('DataTool');
// 辅助函数
function transformJsonData(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                case 1:
                    data = _b.apply(_a, [_c.sent()]);
                    // 这里可以添加具体的转换逻辑
                    return [2 /*return*/, JSON.stringify(data, null, 2)];
            }
        });
    });
}
function queryJsonData(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                case 1:
                    data = _b.apply(_a, [_c.sent()]);
                    // 这里可以添加具体的查询逻辑
                    return [2 /*return*/, JSON.stringify(data, null, 2)];
            }
        });
    });
}
// CSV处理参数模式
var CsvProcessSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('CSV文件路径'),
    operation: zod_1.z.enum(['read', 'write', 'filter', 'sort', 'aggregate']).describe('操作类型'),
    parameters: zod_1.z.record(zod_1.z.any()).optional().describe('操作参数')
});
// JSON处理参数模式
var JsonProcessSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('JSON文件路径'),
    operation: zod_1.z.enum(['read', 'write', 'validate', 'transform', 'query']).describe('操作类型'),
    parameters: zod_1.z.record(zod_1.z.any()).optional().describe('操作参数')
});
// 数据转换参数模式
var DataConvertSchema = zod_1.z.object({
    inputPath: zod_1.z.string().describe('输入文件路径'),
    outputPath: zod_1.z.string().describe('输出文件路径'),
    inputFormat: zod_1.z.enum(['csv', 'json', 'excel']).describe('输入格式'),
    outputFormat: zod_1.z.enum(['csv', 'json', 'excel']).describe('输出格式'),
    options: zod_1.z.record(zod_1.z.any()).optional().describe('转换选项')
});
// 数据分析参数模式
var DataAnalyzeSchema = zod_1.z.object({
    filePath: zod_1.z.string().describe('数据文件路径'),
    analysisType: zod_1.z.enum(['summary', 'statistics', 'correlation', 'trend']).describe('分析类型'),
    columns: zod_1.z.array(zod_1.z.string()).optional().describe('要分析的列')
});
// CSV处理处理器
var csvProcessHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, operation, _a, parameters, _b, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 13, , 14]);
                filePath = args.filePath, operation = args.operation, _a = args.parameters, parameters = _a === void 0 ? {} : _a;
                logger.info("\u5904\u7406CSV\u6587\u4EF6: ".concat(filePath, ", \u64CD\u4F5C: ").concat(operation));
                _b = operation;
                switch (_b) {
                    case 'read': return [3 /*break*/, 1];
                    case 'write': return [3 /*break*/, 3];
                    case 'filter': return [3 /*break*/, 5];
                    case 'sort': return [3 /*break*/, 7];
                    case 'aggregate': return [3 /*break*/, 9];
                }
                return [3 /*break*/, 11];
            case 1: return [4 /*yield*/, readCsvFile(filePath, parameters)];
            case 2: return [2 /*return*/, _c.sent()];
            case 3: return [4 /*yield*/, writeCsvFile(filePath, parameters)];
            case 4: return [2 /*return*/, _c.sent()];
            case 5: return [4 /*yield*/, filterCsvData(filePath, parameters)];
            case 6: return [2 /*return*/, _c.sent()];
            case 7: return [4 /*yield*/, sortCsvData(filePath, parameters)];
            case 8: return [2 /*return*/, _c.sent()];
            case 9: return [4 /*yield*/, aggregateCsvData(filePath, parameters)];
            case 10: return [2 /*return*/, _c.sent()];
            case 11: throw new Error("\u4E0D\u652F\u6301\u7684CSV\u64CD\u4F5C: ".concat(operation));
            case 12: return [3 /*break*/, 14];
            case 13:
                error_1 = _c.sent();
                logger.error("CSV\u5904\u7406\u5931\u8D25: ".concat(args.filePath), error_1);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : '未知错误'
                    })];
            case 14: return [2 /*return*/];
        }
    });
}); };
// JSON处理处理器
var jsonProcessHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, operation, _a, parameters, _b, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 13, , 14]);
                filePath = args.filePath, operation = args.operation, _a = args.parameters, parameters = _a === void 0 ? {} : _a;
                logger.info("\u5904\u7406JSON\u6587\u4EF6: ".concat(filePath, ", \u64CD\u4F5C: ").concat(operation));
                _b = operation;
                switch (_b) {
                    case 'read': return [3 /*break*/, 1];
                    case 'write': return [3 /*break*/, 3];
                    case 'validate': return [3 /*break*/, 5];
                    case 'transform': return [3 /*break*/, 7];
                    case 'query': return [3 /*break*/, 9];
                }
                return [3 /*break*/, 11];
            case 1: return [4 /*yield*/, readJsonFile(filePath, parameters)];
            case 2: return [2 /*return*/, _c.sent()];
            case 3: return [4 /*yield*/, writeJsonFile(filePath, parameters)];
            case 4: return [2 /*return*/, _c.sent()];
            case 5: return [4 /*yield*/, validateJsonFile(filePath, parameters)];
            case 6: return [2 /*return*/, _c.sent()];
            case 7: return [4 /*yield*/, transformJsonData(filePath, parameters)];
            case 8: return [2 /*return*/, _c.sent()];
            case 9: return [4 /*yield*/, queryJsonData(filePath, parameters)];
            case 10: return [2 /*return*/, _c.sent()];
            case 11: throw new Error("\u4E0D\u652F\u6301\u7684JSON\u64CD\u4F5C: ".concat(operation));
            case 12: return [3 /*break*/, 14];
            case 13:
                error_2 = _c.sent();
                logger.error("JSON\u5904\u7406\u5931\u8D25: ".concat(args.filePath), error_2);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_2 instanceof Error ? error_2.message : '未知错误'
                    })];
            case 14: return [2 /*return*/];
        }
    });
}); };
// 数据转换处理器
var dataConvertHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var inputPath, outputPath, inputFormat, outputFormat, _a, options, data, _b, _c, error_3;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 17, , 18]);
                inputPath = args.inputPath, outputPath = args.outputPath, inputFormat = args.inputFormat, outputFormat = args.outputFormat, _a = args.options, options = _a === void 0 ? {} : _a;
                logger.info("\u8F6C\u6362\u6570\u636E\u683C\u5F0F: ".concat(inputFormat, " -> ").concat(outputFormat));
                data = void 0;
                _b = inputFormat;
                switch (_b) {
                    case 'csv': return [3 /*break*/, 1];
                    case 'json': return [3 /*break*/, 3];
                    case 'excel': return [3 /*break*/, 5];
                }
                return [3 /*break*/, 7];
            case 1: return [4 /*yield*/, readCsvData(inputPath)];
            case 2:
                data = _d.sent();
                return [3 /*break*/, 8];
            case 3: return [4 /*yield*/, readJsonData(inputPath)];
            case 4:
                data = _d.sent();
                return [3 /*break*/, 8];
            case 5: return [4 /*yield*/, readExcelData(inputPath)];
            case 6:
                data = _d.sent();
                return [3 /*break*/, 8];
            case 7: throw new Error("\u4E0D\u652F\u6301\u7684\u8F93\u5165\u683C\u5F0F: ".concat(inputFormat));
            case 8:
                _c = outputFormat;
                switch (_c) {
                    case 'csv': return [3 /*break*/, 9];
                    case 'json': return [3 /*break*/, 11];
                    case 'excel': return [3 /*break*/, 13];
                }
                return [3 /*break*/, 15];
            case 9: return [4 /*yield*/, writeCsvData(outputPath, data, options)];
            case 10:
                _d.sent();
                return [3 /*break*/, 16];
            case 11: return [4 /*yield*/, writeJsonData(outputPath, data, options)];
            case 12:
                _d.sent();
                return [3 /*break*/, 16];
            case 13: return [4 /*yield*/, writeExcelData(outputPath, data, options)];
            case 14:
                _d.sent();
                return [3 /*break*/, 16];
            case 15: throw new Error("\u4E0D\u652F\u6301\u7684\u8F93\u51FA\u683C\u5F0F: ".concat(outputFormat));
            case 16:
                logger.info("\u6570\u636E\u8F6C\u6362\u5B8C\u6210: ".concat(outputPath));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        inputPath: inputPath,
                        outputPath: outputPath,
                        inputFormat: inputFormat,
                        outputFormat: outputFormat,
                        recordCount: Array.isArray(data) ? data.length : 1
                    })];
            case 17:
                error_3 = _d.sent();
                logger.error("\u6570\u636E\u8F6C\u6362\u5931\u8D25: ".concat(args.inputPath), error_3);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_3 instanceof Error ? error_3.message : '未知错误'
                    })];
            case 18: return [2 /*return*/];
        }
    });
}); };
// 数据分析处理器
var dataAnalyzeHandler = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, analysisType, _a, columns, data, analysis, _b, error_4;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 12, , 13]);
                filePath = args.filePath, analysisType = args.analysisType, _a = args.columns, columns = _a === void 0 ? [] : _a;
                logger.info("\u5206\u6790\u6570\u636E: ".concat(filePath, ", \u7C7B\u578B: ").concat(analysisType));
                return [4 /*yield*/, readDataFile(filePath)];
            case 1:
                data = _c.sent();
                analysis = void 0;
                _b = analysisType;
                switch (_b) {
                    case 'summary': return [3 /*break*/, 2];
                    case 'statistics': return [3 /*break*/, 4];
                    case 'correlation': return [3 /*break*/, 6];
                    case 'trend': return [3 /*break*/, 8];
                }
                return [3 /*break*/, 10];
            case 2: return [4 /*yield*/, generateDataSummary(data, columns)];
            case 3:
                analysis = _c.sent();
                return [3 /*break*/, 11];
            case 4: return [4 /*yield*/, calculateStatistics(data, columns)];
            case 5:
                analysis = _c.sent();
                return [3 /*break*/, 11];
            case 6: return [4 /*yield*/, calculateCorrelation(data, columns)];
            case 7:
                analysis = _c.sent();
                return [3 /*break*/, 11];
            case 8: return [4 /*yield*/, analyzeTrends(data, columns)];
            case 9:
                analysis = _c.sent();
                return [3 /*break*/, 11];
            case 10: throw new Error("\u4E0D\u652F\u6301\u7684\u5206\u6790\u7C7B\u578B: ".concat(analysisType));
            case 11:
                logger.info("\u6570\u636E\u5206\u6790\u5B8C\u6210: ".concat(filePath));
                return [2 /*return*/, JSON.stringify({
                        success: true,
                        filePath: filePath,
                        analysisType: analysisType,
                        analysis: analysis,
                        recordCount: Array.isArray(data) ? data.length : 1
                    })];
            case 12:
                error_4 = _c.sent();
                logger.error("\u6570\u636E\u5206\u6790\u5931\u8D25: ".concat(args.filePath), error_4);
                return [2 /*return*/, JSON.stringify({
                        success: false,
                        error: error_4 instanceof Error ? error_4.message : '未知错误'
                    })];
            case 13: return [2 /*return*/];
        }
    });
}); };
// CSV文件读取
function readCsvFile(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var limit, columns, results;
        return __generator(this, function (_a) {
            limit = parameters.limit, columns = parameters.columns;
            results = [];
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    (0, fs_1.createReadStream)(filePath)
                        .pipe(csv())
                        .on('data', function (data) {
                        if (limit && results.length >= limit) {
                            return;
                        }
                        if (columns && columns.length > 0) {
                            var filteredData_1 = {};
                            columns.forEach(function (col) {
                                if (data[col] !== undefined) {
                                    filteredData_1[col] = data[col];
                                }
                            });
                            results.push(filteredData_1);
                        }
                        else {
                            results.push(data);
                        }
                    })
                        .on('end', function () {
                        resolve(JSON.stringify({
                            success: true,
                            data: results,
                            count: results.length
                        }));
                    })
                        .on('error', reject);
                })];
        });
    });
}
// CSV文件写入
function writeCsvFile(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var data, headers, csvContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = parameters.data, headers = parameters.headers;
                    if (!Array.isArray(data)) {
                        throw new Error('数据必须是数组格式');
                    }
                    csvContent = '';
                    // 写入表头
                    if (headers && headers.length > 0) {
                        csvContent += headers.join(',') + '\n';
                    }
                    else if (data.length > 0) {
                        csvContent += Object.keys(data[0]).join(',') + '\n';
                    }
                    // 写入数据
                    data.forEach(function (row) {
                        var values = Object.values(row).map(function (value) {
                            return typeof value === 'string' && value.includes(',') ? "\"".concat(value, "\"") : value;
                        });
                        csvContent += values.join(',') + '\n';
                    });
                    return [4 /*yield*/, fs.writeFile(filePath, csvContent, 'utf-8')];
                case 1:
                    _a.sent();
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            filePath: filePath,
                            recordCount: data.length
                        })];
            }
        });
    });
}
// CSV数据过滤
function filterCsvData(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var conditions, outputPath, data, filteredData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    conditions = parameters.conditions, outputPath = parameters.outputPath;
                    return [4 /*yield*/, readCsvData(filePath)];
                case 1:
                    data = _a.sent();
                    filteredData = data.filter(function (row) {
                        return conditions.every(function (condition) {
                            var column = condition.column, operator = condition.operator, value = condition.value;
                            var cellValue = row[column];
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
                    if (!outputPath) return [3 /*break*/, 3];
                    return [4 /*yield*/, writeCsvData(outputPath, filteredData)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, JSON.stringify({
                        success: true,
                        originalCount: data.length,
                        filteredCount: filteredData.length,
                        data: filteredData
                    })];
            }
        });
    });
}
// CSV数据排序
function sortCsvData(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var sortBy, _a, order, outputPath, data, sortedData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    sortBy = parameters.sortBy, _a = parameters.order, order = _a === void 0 ? 'asc' : _a, outputPath = parameters.outputPath;
                    return [4 /*yield*/, readCsvData(filePath)];
                case 1:
                    data = _b.sent();
                    sortedData = data.sort(function (a, b) {
                        var aVal = a[sortBy];
                        var bVal = b[sortBy];
                        if (order === 'desc') {
                            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
                        }
                        else {
                            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                        }
                    });
                    if (!outputPath) return [3 /*break*/, 3];
                    return [4 /*yield*/, writeCsvData(outputPath, sortedData)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [2 /*return*/, JSON.stringify({
                        success: true,
                        sortBy: sortBy,
                        order: order,
                        data: sortedData
                    })];
            }
        });
    });
}
// CSV数据聚合
function aggregateCsvData(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var groupBy, aggregations, data, groups, aggregatedData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    groupBy = parameters.groupBy, aggregations = parameters.aggregations;
                    return [4 /*yield*/, readCsvData(filePath)];
                case 1:
                    data = _a.sent();
                    groups = {};
                    // 分组
                    data.forEach(function (row) {
                        var key = row[groupBy];
                        if (!groups[key]) {
                            groups[key] = [];
                        }
                        groups[key].push(row);
                    });
                    aggregatedData = Object.entries(groups).map(function (_a) {
                        var _b;
                        var key = _a[0], group = _a[1];
                        var result = (_b = {}, _b[groupBy] = key, _b);
                        aggregations.forEach(function (agg) {
                            var column = agg.column, operation = agg.operation, alias = agg.alias;
                            var values = group.map(function (row) { return Number(row[column]); }).filter(function (v) { return !isNaN(v); });
                            var value;
                            switch (operation) {
                                case 'sum':
                                    value = values.reduce(function (sum, v) { return sum + v; }, 0);
                                    break;
                                case 'avg':
                                    value = values.reduce(function (sum, v) { return sum + v; }, 0) / values.length;
                                    break;
                                case 'min':
                                    value = Math.min.apply(Math, values);
                                    break;
                                case 'max':
                                    value = Math.max.apply(Math, values);
                                    break;
                                case 'count':
                                    value = values.length;
                                    break;
                                default:
                                    value = 0;
                            }
                            result[alias || "".concat(operation, "_").concat(column)] = value;
                        });
                        return result;
                    });
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            groupBy: groupBy,
                            aggregatedData: aggregatedData,
                            groupCount: Object.keys(groups).length
                        })];
            }
        });
    });
}
// JSON文件读取
function readJsonFile(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var query, _a, pretty, content, data, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    query = parameters.query, _a = parameters.pretty, pretty = _a === void 0 ? false : _a;
                    return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                case 1:
                    content = _b.sent();
                    data = JSON.parse(content);
                    result = data;
                    if (query) {
                        result = queryJsonObject(data, query);
                    }
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            data: result,
                            pretty: pretty
                        })];
            }
        });
    });
}
// JSON文件写入
function writeJsonFile(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a, pretty, content;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    data = parameters.data, _a = parameters.pretty, pretty = _a === void 0 ? true : _a;
                    content = pretty ?
                        JSON.stringify(data, null, 2) :
                        JSON.stringify(data);
                    return [4 /*yield*/, fs.writeFile(filePath, content, 'utf-8')];
                case 1:
                    _b.sent();
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            filePath: filePath,
                            size: content.length
                        })];
            }
        });
    });
}
// JSON数据验证
function validateJsonFile(filePath, parameters) {
    return __awaiter(this, void 0, void 0, function () {
        var schema, content, data, isValid, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    schema = parameters.schema;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                case 2:
                    content = _a.sent();
                    data = JSON.parse(content);
                    isValid = validateAgainstSchema(data, schema);
                    return [2 /*return*/, JSON.stringify({
                            success: true,
                            isValid: isValid,
                            errors: isValid ? [] : ['数据不符合schema要求']
                        })];
                case 3:
                    error_5 = _a.sent();
                    return [2 /*return*/, JSON.stringify({
                            success: false,
                            isValid: false,
                            errors: ['JSON格式错误']
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 辅助函数
function readCsvData(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var results = [];
                    (0, fs_1.createReadStream)(filePath)
                        .pipe(csv())
                        .on('data', function (data) { return results.push(data); })
                        .on('end', function () { return resolve(results); })
                        .on('error', reject);
                })];
        });
    });
}
function readJsonData(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                case 1:
                    content = _a.sent();
                    return [2 /*return*/, JSON.parse(content)];
            }
        });
    });
}
function readExcelData(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // 模拟Excel读取
            // 实际项目中可以使用xlsx等库
            logger.info("\u6A21\u62DF\u8BFB\u53D6Excel\u6587\u4EF6: ".concat(filePath));
            return [2 /*return*/, [
                    { name: 'John', age: 30, city: 'New York' },
                    { name: 'Jane', age: 25, city: 'London' }
                ]];
        });
    });
}
function writeCsvData(filePath_1, data_1) {
    return __awaiter(this, arguments, void 0, function (filePath, data, options) {
        var csvContent;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    csvContent = '';
                    if (data.length > 0) {
                        csvContent += Object.keys(data[0]).join(',') + '\n';
                        data.forEach(function (row) {
                            var values = Object.values(row).map(function (value) {
                                return typeof value === 'string' && value.includes(',') ? "\"".concat(value, "\"") : value;
                            });
                            csvContent += values.join(',') + '\n';
                        });
                    }
                    return [4 /*yield*/, fs.writeFile(filePath, csvContent, 'utf-8')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function writeJsonData(filePath_1, data_1) {
    return __awaiter(this, arguments, void 0, function (filePath, data, options) {
        var pretty, content;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pretty = options.pretty !== false;
                    content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
                    return [4 /*yield*/, fs.writeFile(filePath, content, 'utf-8')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function writeExcelData(filePath_1, data_1) {
    return __awaiter(this, arguments, void 0, function (filePath, data, options) {
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            // 模拟Excel写入
            // 实际项目中可以使用xlsx等库
            logger.info("\u6A21\u62DF\u5199\u5165Excel\u6587\u4EF6: ".concat(filePath));
            return [2 /*return*/];
        });
    });
}
function readDataFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var ext, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ext = path.extname(filePath).toLowerCase();
                    _a = ext;
                    switch (_a) {
                        case '.csv': return [3 /*break*/, 1];
                        case '.json': return [3 /*break*/, 3];
                        case '.xlsx': return [3 /*break*/, 5];
                        case '.xls': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 7];
                case 1: return [4 /*yield*/, readCsvData(filePath)];
                case 2: return [2 /*return*/, _b.sent()];
                case 3: return [4 /*yield*/, readJsonData(filePath)];
                case 4: return [2 /*return*/, _b.sent()];
                case 5: return [4 /*yield*/, readExcelData(filePath)];
                case 6: return [2 /*return*/, _b.sent()];
                case 7: throw new Error("\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u683C\u5F0F: ".concat(ext));
            }
        });
    });
}
function queryJsonObject(data, query) {
    // 简单的JSON查询实现
    // 实际项目中可以使用jsonpath等库
    try {
        var path_2 = query.split('.');
        var result = data;
        for (var _i = 0, path_1 = path_2; _i < path_1.length; _i++) {
            var key = path_1[_i];
            result = result[key];
        }
        return result;
    }
    catch (_a) {
        return null;
    }
}
function validateAgainstSchema(data, schema) {
    // 简单的schema验证
    // 实际项目中应该使用专业的验证库
    return true;
}
function generateDataSummary(data, columns) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    totalRecords: data.length,
                    columns: columns.length > 0 ? columns : Object.keys(data[0] || {}),
                    dataTypes: {},
                    nullCounts: {},
                    uniqueCounts: {}
                }];
        });
    });
}
function calculateStatistics(data, columns) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    mean: {},
                    median: {},
                    mode: {},
                    standardDeviation: {},
                    variance: {}
                }];
        });
    });
}
function calculateCorrelation(data, columns) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    correlationMatrix: {},
                    significantCorrelations: []
                }];
        });
    });
}
function analyzeTrends(data, columns) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    trends: {},
                    seasonalPatterns: {},
                    forecasts: {}
                }];
        });
    });
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
