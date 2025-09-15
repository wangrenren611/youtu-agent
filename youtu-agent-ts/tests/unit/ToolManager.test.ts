/**
 * ToolManager 单元测试
 */

import { ToolManager } from '../../src/core/tool/ToolManager';
import { ToolDefinition } from '../../src/types';
import { z } from 'zod';

describe('ToolManager', () => {
  let toolManager: ToolManager;

  beforeEach(() => {
    toolManager = new ToolManager();
  });

  afterEach(() => {
    toolManager.cleanup();
  });

  describe('工具注册', () => {
    test('应该正确注册工具', () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: '测试工具',
        parameters: z.object({ input: z.string() }),
        handler: async () => 'test result'
      };

      toolManager.registerTool(tool);

      expect(toolManager.hasTool('test_tool')).toBe(true);
      expect(toolManager.getTool('test_tool')).toBe(tool);
    });

    test('应该批量注册工具', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: '工具1',
          parameters: z.object({ input: z.string() }),
          handler: async () => 'result1'
        },
        {
          name: 'tool2',
          description: '工具2',
          parameters: z.object({ input: z.string() }),
          handler: async () => 'result2'
        }
      ];

      toolManager.registerTools(tools);

      expect(toolManager.hasTool('tool1')).toBe(true);
      expect(toolManager.hasTool('tool2')).toBe(true);
      expect(toolManager.getAllTools()).toHaveLength(2);
    });

    test('应该覆盖已存在的工具', () => {
      const tool1: ToolDefinition = {
        name: 'test_tool',
        description: '原始工具',
        parameters: z.object({ input: z.string() }),
        handler: async () => 'original'
      };

      const tool2: ToolDefinition = {
        name: 'test_tool',
        description: '新工具',
        parameters: z.object({ input: z.string() }),
        handler: async () => 'new'
      };

      toolManager.registerTool(tool1);
      toolManager.registerTool(tool2);

      expect(toolManager.getTool('test_tool')?.description).toBe('新工具');
    });
  });

  describe('工具调用', () => {
    beforeEach(() => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: '测试工具',
        parameters: z.object({ 
          input: z.string(),
          optional: z.number().optional()
        }),
        handler: async (args) => `处理: ${args.input}`
      };

      toolManager.registerTool(tool);
    });

    test('应该正确调用工具', async () => {
      const result = await toolManager.callTool('test_tool', { input: 'test' });
      expect(result).toBe('处理: test');
    });

    test('应该验证工具参数', async () => {
      await expect(
        toolManager.callTool('test_tool', { invalid: 'param' })
      ).rejects.toThrow();
    });

    test('应该处理不存在的工具', async () => {
      await expect(
        toolManager.callTool('nonexistent_tool', { input: 'test' })
      ).rejects.toThrow('工具 nonexistent_tool 不存在');
    });

    test('应该处理工具执行错误', async () => {
      const errorTool: ToolDefinition = {
        name: 'error_tool',
        description: '错误工具',
        parameters: z.object({ input: z.string() }),
        handler: async () => {
          throw new Error('工具执行错误');
        }
      };

      toolManager.registerTool(errorTool);

      await expect(
        toolManager.callTool('error_tool', { input: 'test' })
      ).rejects.toThrow('工具执行错误');
    });
  });

  describe('工具管理', () => {
    beforeEach(() => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: '工具1',
          parameters: z.object({ input: z.string() }),
          handler: async () => 'result1'
        },
        {
          name: 'tool2',
          description: '工具2',
          parameters: z.object({ input: z.string() }),
          handler: async () => 'result2'
        }
      ];

      toolManager.registerTools(tools);
    });

    test('应该获取所有工具名称', () => {
      const names = toolManager.getToolNames();
      expect(names).toContain('tool1');
      expect(names).toContain('tool2');
      expect(names).toHaveLength(2);
    });

    test('应该移除工具', () => {
      expect(toolManager.hasTool('tool1')).toBe(true);
      
      const removed = toolManager.removeTool('tool1');
      expect(removed).toBe(true);
      expect(toolManager.hasTool('tool1')).toBe(false);
    });

    test('应该清空所有工具', () => {
      expect(toolManager.getAllTools()).toHaveLength(2);
      
      toolManager.clearTools();
      expect(toolManager.getAllTools()).toHaveLength(0);
    });
  });

  describe('批量调用', () => {
    beforeEach(() => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: '工具1',
          parameters: z.object({ input: z.string() }),
          handler: async (args) => `结果1: ${args.input}`
        },
        {
          name: 'tool2',
          description: '工具2',
          parameters: z.object({ input: z.string() }),
          handler: async (args) => `结果2: ${args.input}`
        }
      ];

      toolManager.registerTools(tools);
    });

    test('应该顺序调用工具', async () => {
      const calls = [
        { name: 'tool1', args: { input: 'test1' } },
        { name: 'tool2', args: { input: 'test2' } }
      ];

      const results = await toolManager.callTools(calls);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBe('结果1: test1');
      expect(results[1]).toBe('结果2: test2');
    });

    test('应该并行调用工具', async () => {
      const calls = [
        { name: 'tool1', args: { input: 'test1' } },
        { name: 'tool2', args: { input: 'test2' } }
      ];

      const results = await toolManager.callToolsParallel(calls);
      
      expect(results).toHaveLength(2);
      expect(results).toContain('结果1: test1');
      expect(results).toContain('结果2: test2');
    });
  });
});
