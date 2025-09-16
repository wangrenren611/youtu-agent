/**
 * 数据库工具
 * 提供数据库查询和操作功能
 */

import { z } from 'zod';
import { BaseToolHandler } from './BaseToolHandler';
import { ToolDefinition } from '../types';

const DatabaseToolSchema = z.object({
  operation: z.enum(['query', 'execute', 'insert', 'update', 'delete']).describe('数据库操作类型'),
  sql: z.string().describe('SQL语句'),
  params: z.array(z.unknown()).optional().describe('SQL参数'),
  table: z.string().optional().describe('表名（用于insert/update/delete操作）'),
  data: z.record(z.unknown()).optional().describe('数据对象（用于insert/update操作）'),
  where: z.record(z.unknown()).optional().describe('WHERE条件（用于update/delete操作）')
});

class DatabaseToolHandler extends BaseToolHandler {
  constructor() {
    super('DatabaseTool');
  }

  async handle(args: Record<string, unknown>): Promise<string> {
    return this.wrapHandler(async (args) => {
      const { operation, sql, params, table, data, where } = DatabaseToolSchema.parse(args);
      
      // 获取数据库管理器
      const { YoutuAgentTS } = await import('../index');
      const framework = new YoutuAgentTS();
      const dbManager = framework.getDatabaseManager();
      
      if (!dbManager) {
        return this.createErrorResponse('数据库未配置或不可用。请检查DATABASE_URL环境变量是否正确设置，并确保sqlite3模块已正确安装。');
      }

      const connection = dbManager.getConnection();

      try {
        switch (operation) {
          case 'query':
            const queryResult = await connection.query(sql, params || []);
            return this.createSuccessResponse({
              operation: 'query',
              result: queryResult,
              count: Array.isArray(queryResult) ? queryResult.length : 0
            });

          case 'execute':
            const executeResult = await connection.execute(sql, params || []);
            return this.createSuccessResponse({
              operation: 'execute',
              result: executeResult
            });

          case 'insert':
            if (!table || !data) {
              throw new Error('插入操作需要提供table和data参数');
            }
            const insertSql = this.buildInsertSQL(table, data);
            const insertResult = await connection.execute(insertSql, Object.values(data));
            return this.createSuccessResponse({
              operation: 'insert',
              result: insertResult,
              insertedId: insertResult.lastInsertRowid
            });

          case 'update':
            if (!table || !data || !where) {
              throw new Error('更新操作需要提供table、data和where参数');
            }
            const updateSql = this.buildUpdateSQL(table, data, where);
            const updateParams = [...Object.values(data), ...Object.values(where)];
            const updateResult = await connection.execute(updateSql, updateParams);
            return this.createSuccessResponse({
              operation: 'update',
              result: updateResult,
              affectedRows: updateResult.changes
            });

          case 'delete':
            if (!table || !where) {
              throw new Error('删除操作需要提供table和where参数');
            }
            const deleteSql = this.buildDeleteSQL(table, where);
            const deleteResult = await connection.execute(deleteSql, Object.values(where));
            return this.createSuccessResponse({
              operation: 'delete',
              result: deleteResult,
              affectedRows: deleteResult.changes
            });

          default:
            throw new Error(`不支持的操作类型: ${operation}`);
        }
      } catch (error) {
        this.logOperationError('数据库操作', error, { operation, sql });
        return this.createErrorResponse(error);
      }
    })(args);
  }

  /**
   * 构建INSERT SQL语句
   */
  private buildInsertSQL(table: string, data: Record<string, unknown>): string {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  }

  /**
   * 构建UPDATE SQL语句
   */
  private buildUpdateSQL(table: string, data: Record<string, unknown>, where: Record<string, unknown>): string {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    return `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  }

  /**
   * 构建DELETE SQL语句
   */
  private buildDeleteSQL(table: string, where: Record<string, unknown>): string {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    return `DELETE FROM ${table} WHERE ${whereClause}`;
  }
}

export const databaseTool: ToolDefinition = {
  name: 'database',
  description: '执行数据库操作，包括查询、插入、更新和删除',
  parameters: DatabaseToolSchema,
  handler: new DatabaseToolHandler().handle.bind(new DatabaseToolHandler())
};
