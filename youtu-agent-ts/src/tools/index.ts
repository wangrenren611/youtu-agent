/**
 * 工具注册器
 * 统一管理所有工具的注册和导出
 */

import { ToolDefinition } from '../types';
import { fileEditTools } from './FileEditTool';
import { searchTools } from './SearchTool';
import { codeExecutorTools } from './CodeExecutorTool';
import { imageTools } from './ImageTool';
import { dataTools } from './DataTool';

// 所有内置工具
export const builtinTools: ToolDefinition[] = [
  ...fileEditTools,
  ...searchTools,
  ...codeExecutorTools,
  ...imageTools,
  ...dataTools
];

// 工具名称映射
export const toolNameMap: Record<string, ToolDefinition> = builtinTools.reduce(
  (map, tool) => {
    map[tool.name] = tool;
    return map;
  },
  {} as Record<string, ToolDefinition>
);

// 按类别分组的工具
export const toolsByCategory = {
  file: fileEditTools,
  search: searchTools,
  code: codeExecutorTools,
  image: imageTools,
  data: dataTools
};

// 导出所有工具
export * from './FileEditTool';
export * from './SearchTool';
export * from './CodeExecutorTool';
export * from './ImageTool';
export * from './DataTool';
