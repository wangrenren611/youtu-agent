"use strict";
/**
 * 工具注册器
 * 统一管理所有工具的注册和导出
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsByCategory = exports.toolNameMap = exports.builtinTools = void 0;
const FileEditTool_1 = require("./FileEditTool");
const SearchTool_1 = require("./SearchTool");
const CodeExecutorTool_1 = require("./CodeExecutorTool");
const ImageTool_1 = require("./ImageTool");
const DataTool_1 = require("./DataTool");
// 所有内置工具
exports.builtinTools = [
    ...FileEditTool_1.fileEditTools,
    ...SearchTool_1.searchTools,
    ...CodeExecutorTool_1.codeExecutorTools,
    ...ImageTool_1.imageTools,
    ...DataTool_1.dataTools
];
// 工具名称映射
exports.toolNameMap = exports.builtinTools.reduce((map, tool) => {
    map[tool.name] = tool;
    return map;
}, {});
// 按类别分组的工具
exports.toolsByCategory = {
    file: FileEditTool_1.fileEditTools,
    search: SearchTool_1.searchTools,
    code: CodeExecutorTool_1.codeExecutorTools,
    image: ImageTool_1.imageTools,
    data: DataTool_1.dataTools
};
// 导出所有工具
__exportStar(require("./FileEditTool"), exports);
__exportStar(require("./SearchTool"), exports);
__exportStar(require("./CodeExecutorTool"), exports);
__exportStar(require("./ImageTool"), exports);
__exportStar(require("./DataTool"), exports);
