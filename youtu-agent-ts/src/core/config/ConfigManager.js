"use strict";
/**
 * 配置管理器
 * 负责配置文件的加载、解析和管理
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
exports.ConfigManager = void 0;
var fs = require("fs/promises");
var path = require("path");
var yaml = require("yaml");
var types_1 = require("../../types");
var Logger_1 = require("../../utils/Logger");
var ConfigManager = /** @class */ (function () {
    function ConfigManager(configPath) {
        if (configPath === void 0) { configPath = './configs'; }
        this.cache = new Map();
        this.logger = new Logger_1.Logger('ConfigManager');
        this.configPath = path.resolve(configPath);
    }
    /**
     * 加载智能体配置
     * @param name 配置名称
     * @returns 智能体配置
     */
    ConfigManager.prototype.loadAgentConfig = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, configPath, config, agentConfig, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "agent:".concat(name);
                        if (this.cache.has(cacheKey)) {
                            return [2 /*return*/, this.cache.get(cacheKey)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        configPath = path.join(this.configPath, 'agents', "".concat(name, ".yaml"));
                        return [4 /*yield*/, this.loadYamlConfig(configPath)];
                    case 2:
                        config = _a.sent();
                        agentConfig = this.validateAgentConfig(config);
                        this.cache.set(cacheKey, agentConfig);
                        this.logger.info("\u667A\u80FD\u4F53\u914D\u7F6E ".concat(name, " \u52A0\u8F7D\u6210\u529F"));
                        return [2 /*return*/, agentConfig];
                    case 3:
                        error_1 = _a.sent();
                        throw new types_1.ConfigError("\u52A0\u8F7D\u667A\u80FD\u4F53\u914D\u7F6E\u5931\u8D25: ".concat(name), "agents/".concat(name, ".yaml"), error_1);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 加载模型配置
     * @param name 配置名称
     * @returns 模型配置
     */
    ConfigManager.prototype.loadModelConfig = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, configPath, config, modelConfig, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "model:".concat(name);
                        if (this.cache.has(cacheKey)) {
                            return [2 /*return*/, this.cache.get(cacheKey)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        configPath = path.join(this.configPath, 'model', "".concat(name, ".yaml"));
                        return [4 /*yield*/, this.loadYamlConfig(configPath)];
                    case 2:
                        config = _a.sent();
                        modelConfig = this.validateModelConfig(config);
                        this.cache.set(cacheKey, modelConfig);
                        this.logger.info("\u6A21\u578B\u914D\u7F6E ".concat(name, " \u52A0\u8F7D\u6210\u529F"));
                        return [2 /*return*/, modelConfig];
                    case 3:
                        error_2 = _a.sent();
                        throw new types_1.ConfigError("\u52A0\u8F7D\u6A21\u578B\u914D\u7F6E\u5931\u8D25: ".concat(name), "model/".concat(name, ".yaml"), error_2);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 加载工具配置
     * @param name 配置名称
     * @returns 工具配置
     */
    ConfigManager.prototype.loadToolConfig = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, configPath, config, toolConfig, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "tool:".concat(name);
                        if (this.cache.has(cacheKey)) {
                            return [2 /*return*/, this.cache.get(cacheKey)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        configPath = path.join(this.configPath, 'tools', "".concat(name, ".yaml"));
                        return [4 /*yield*/, this.loadYamlConfig(configPath)];
                    case 2:
                        config = _a.sent();
                        toolConfig = this.validateToolConfig(config);
                        this.cache.set(cacheKey, toolConfig);
                        this.logger.info("\u5DE5\u5177\u914D\u7F6E ".concat(name, " \u52A0\u8F7D\u6210\u529F"));
                        return [2 /*return*/, toolConfig];
                    case 3:
                        error_3 = _a.sent();
                        throw new types_1.ConfigError("\u52A0\u8F7D\u5DE5\u5177\u914D\u7F6E\u5931\u8D25: ".concat(name), "tools/".concat(name, ".yaml"), error_3);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 加载YAML配置文件
     * @param filePath 文件路径
     * @returns 配置对象
     */
    ConfigManager.prototype.loadYamlConfig = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, config, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        config = yaml.parse(content);
                        // 处理环境变量替换
                        return [2 /*return*/, this.processEnvironmentVariables(config)];
                    case 2:
                        error_4 = _a.sent();
                        throw new types_1.ConfigError("\u8BFB\u53D6\u914D\u7F6E\u6587\u4EF6\u5931\u8D25: ".concat(filePath), filePath, error_4);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 处理环境变量替换
     * @param config 配置对象
     * @returns 处理后的配置对象
     */
    ConfigManager.prototype.processEnvironmentVariables = function (config) {
        var _this = this;
        if (typeof config === 'string') {
            // 替换 ${VAR} 格式的环境变量
            return config.replace(/\$\{([^}]+)\}/g, function (match, varName) {
                var value = process.env[varName];
                if (value === undefined) {
                    _this.logger.warn("\u73AF\u5883\u53D8\u91CF ".concat(varName, " \u672A\u5B9A\u4E49"));
                    return match;
                }
                return value;
            });
        }
        if (Array.isArray(config)) {
            return config.map(function (item) { return _this.processEnvironmentVariables(item); });
        }
        if (config && typeof config === 'object') {
            var result = {};
            for (var _i = 0, _a = Object.entries(config); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                result[key] = this.processEnvironmentVariables(value);
            }
            return result;
        }
        return config;
    };
    /**
     * 验证智能体配置
     * @param config 原始配置
     * @returns 验证后的配置
     */
    ConfigManager.prototype.validateAgentConfig = function (config) {
        var required = ['type', 'name', 'model'];
        for (var _i = 0, required_1 = required; _i < required_1.length; _i++) {
            var field = required_1[_i];
            if (!config[field]) {
                throw new types_1.ConfigError("\u667A\u80FD\u4F53\u914D\u7F6E\u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5: ".concat(field), 'agent config', { field: field, config: config });
            }
        }
        return {
            type: config.type,
            name: config.name,
            model: this.validateModelConfig(config.model),
            instructions: config.instructions,
            tools: config.tools || [],
            maxTurns: config.maxTurns || 20,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 4000
        };
    };
    /**
     * 验证模型配置
     * @param config 原始配置
     * @returns 验证后的配置
     */
    ConfigManager.prototype.validateModelConfig = function (config) {
        var required = ['provider', 'model'];
        for (var _i = 0, required_2 = required; _i < required_2.length; _i++) {
            var field = required_2[_i];
            if (!config[field]) {
                throw new types_1.ConfigError("\u6A21\u578B\u914D\u7F6E\u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5: ".concat(field), 'model config', { field: field, config: config });
            }
        }
        return {
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey || process.env["".concat(config.provider.toUpperCase(), "_API_KEY")],
            baseUrl: config.baseUrl,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 4000,
            timeout: config.timeout || 30000
        };
    };
    /**
     * 验证工具配置
     * @param config 原始配置
     * @returns 验证后的配置
     */
    ConfigManager.prototype.validateToolConfig = function (config) {
        var required = ['name', 'type'];
        for (var _i = 0, required_3 = required; _i < required_3.length; _i++) {
            var field = required_3[_i];
            if (!config[field]) {
                throw new types_1.ConfigError("\u5DE5\u5177\u914D\u7F6E\u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5: ".concat(field), 'tool config', { field: field, config: config });
            }
        }
        return {
            name: config.name,
            type: config.type,
            enabled: config.enabled !== false,
            parameters: config.parameters || {}
        };
    };
    /**
     * 获取配置列表
     * @param type 配置类型
     * @returns 配置名称列表
     */
    ConfigManager.prototype.getConfigList = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var dirPath, files, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        dirPath = path.join(this.configPath, type);
                        return [4 /*yield*/, fs.readdir(dirPath)];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files
                                .filter(function (file) { return file.endsWith('.yaml') || file.endsWith('.yml'); })
                                .map(function (file) { return path.basename(file, path.extname(file)); })];
                    case 2:
                        error_5 = _a.sent();
                        this.logger.error("\u83B7\u53D6\u914D\u7F6E\u5217\u8868\u5931\u8D25: ".concat(type), error_5);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 清除缓存
     * @param key 可选的缓存键
     */
    ConfigManager.prototype.clearCache = function (key) {
        if (key) {
            this.cache.delete(key);
        }
        else {
            this.cache.clear();
        }
        this.logger.info("\u914D\u7F6E\u7F13\u5B58\u5DF2\u6E05\u9664".concat(key ? ": ".concat(key) : ''));
    };
    /**
     * 重新加载配置
     * @param name 配置名称
     * @param type 配置类型
     */
    ConfigManager.prototype.reloadConfig = function (name, type) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = "".concat(type, ":").concat(name);
                        this.cache.delete(cacheKey);
                        _a = type;
                        switch (_a) {
                            case 'agent': return [3 /*break*/, 1];
                            case 'model': return [3 /*break*/, 3];
                            case 'tool': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, this.loadAgentConfig(name)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 3: return [4 /*yield*/, this.loadModelConfig(name)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.loadToolConfig(name)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        this.logger.info("\u914D\u7F6E ".concat(type, ":").concat(name, " \u5DF2\u91CD\u65B0\u52A0\u8F7D"));
                        return [2 /*return*/];
                }
            });
        });
    };
    return ConfigManager;
}());
exports.ConfigManager = ConfigManager;
