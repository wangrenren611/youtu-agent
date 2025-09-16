/**
 * 数据库管理器
 * 负责数据库连接、操作和事务管理
 */

import { DatabaseConnection, DatabaseConfig, DatasetSample, EvaluationSample, ToolTracingModel, GenerationTracingModel, ToolCacheModel } from './types';
import { Logger } from '../utils/Logger';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: DatabaseConnection | null = null;
  private readonly logger: Logger;
  private readonly config: DatabaseConfig;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.logger = new Logger('DatabaseManager');
  }

  /**
   * 获取数据库管理器实例
   */
  static getInstance(config?: DatabaseConfig): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!config) {
        throw new Error('DatabaseManager需要配置信息');
      }
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('正在初始化数据库连接...');
      
      // 根据URL判断数据库类型
      if (this.config.url.startsWith('sqlite:')) {
        await this.initializeSQLite();
      } else if (this.config.url.startsWith('postgresql:')) {
        await this.initializePostgreSQL();
      } else if (this.config.url.startsWith('mysql:')) {
        await this.initializeMySQL();
      } else {
        throw new Error(`不支持的数据库类型: ${this.config.url}`);
      }

      // 初始化数据库表结构
      await this.initializeSchema();
      
      this.logger.info('数据库连接初始化成功');
    } catch (error) {
      this.logger.error('数据库连接初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查sqlite3模块是否可用
   */
  private checkSQLite3Available(): boolean {
    try {
      require('sqlite3');
      return true;
    } catch (error) {
      this.logger.warn('sqlite3模块不可用:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * 初始化SQLite连接
   */
  private async initializeSQLite(): Promise<void> {
    if (!this.checkSQLite3Available()) {
      throw new Error('sqlite3模块不可用。请运行 "npm run install:sqlite3" 来安装sqlite3模块，或使用其他数据库类型。');
    }

    const sqlite3 = require('sqlite3').verbose();
    const path = this.config.url.replace('sqlite:', '');
    
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(path, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          this.connection = {
            query: (sql: string, params: unknown[] = []) => {
              return new Promise((resolve, reject) => {
                db.all(sql, params, (err: Error | null, rows: unknown[]) => {
                  if (err) reject(err);
                  else resolve(rows);
                });
              });
            },
            execute: (sql: string, params: unknown[] = []) => {
              return new Promise((resolve, reject) => {
                db.run(sql, params, function(this: any, err: Error | null) {
                  if (err) reject(err);
                  else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
                });
              });
            },
            close: () => {
              return new Promise((resolve, reject) => {
                db.close((err: Error | null) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            },
            beginTransaction: () => {
              return new Promise((resolve, reject) => {
                db.run('BEGIN TRANSACTION', (err: Error | null) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            },
            commit: () => {
              return new Promise((resolve, reject) => {
                db.run('COMMIT', (err: Error | null) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            },
            rollback: () => {
              return new Promise((resolve, reject) => {
                db.run('ROLLBACK', (err: Error | null) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            }
          };
          resolve();
        }
      });
    });
  }

  /**
   * 初始化PostgreSQL连接
   */
  private async initializePostgreSQL(): Promise<void> {
    // TODO: 实现PostgreSQL连接
    throw new Error('PostgreSQL支持尚未实现');
  }

  /**
   * 初始化MySQL连接
   */
  private async initializeMySQL(): Promise<void> {
    // TODO: 实现MySQL连接
    throw new Error('MySQL支持尚未实现');
  }

  /**
   * 初始化数据库表结构
   */
  private async initializeSchema(): Promise<void> {
    if (!this.connection) {
      throw new Error('数据库连接未初始化');
    }

    const tables = [
      // 数据集样本表
      `CREATE TABLE IF NOT EXISTS data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset TEXT NOT NULL DEFAULT '',
        "index" INTEGER,
        source TEXT NOT NULL DEFAULT '',
        source_index INTEGER,
        question TEXT NOT NULL DEFAULT '',
        answer TEXT,
        topic TEXT,
        level INTEGER DEFAULT 0,
        file_name TEXT,
        meta TEXT
      )`,
      
      // 评估样本表
      `CREATE TABLE IF NOT EXISTS evaluation_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        dataset TEXT NOT NULL DEFAULT '',
        dataset_index INTEGER,
        source TEXT NOT NULL DEFAULT '',
        raw_question TEXT NOT NULL DEFAULT '',
        level INTEGER DEFAULT 0,
        augmented_question TEXT,
        correct_answer TEXT,
        file_name TEXT,
        meta TEXT,
        trace_id TEXT,
        trace_url TEXT,
        response TEXT,
        time_cost REAL,
        trajectory TEXT,
        trajectories TEXT,
        extracted_final_answer TEXT,
        judged_response TEXT,
        reasoning TEXT,
        correct BOOLEAN,
        confidence INTEGER,
        exp_id TEXT NOT NULL DEFAULT 'default',
        stage TEXT NOT NULL DEFAULT 'init'
      )`,
      
      // 工具追踪表
      `CREATE TABLE IF NOT EXISTS tracing_tool (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT NOT NULL DEFAULT '',
        span_id TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        input TEXT,
        output TEXT,
        mcp_data TEXT
      )`,
      
      // 生成追踪表
      `CREATE TABLE IF NOT EXISTS tracing_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT NOT NULL DEFAULT '',
        span_id TEXT NOT NULL DEFAULT '',
        model TEXT NOT NULL DEFAULT '',
        input TEXT,
        output TEXT,
        usage TEXT
      )`,
      
      // 工具缓存表
      `CREATE TABLE IF NOT EXISTS cache_tool (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        function TEXT NOT NULL,
        args TEXT,
        kwargs TEXT,
        result TEXT,
        cache_key TEXT NOT NULL,
        timestamp REAL NOT NULL,
        datetime TEXT NOT NULL,
        execution_time REAL NOT NULL
      )`
    ];

    for (const table of tables) {
      await this.connection.execute(table);
    }

    this.logger.info('数据库表结构初始化完成');
  }

  /**
   * 检查数据库连接是否可用
   */
  async checkConnection(): Promise<boolean> {
    if (!this.connection) {
      return false;
    }

    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('数据库连接检查失败:', error);
      return false;
    }
  }

  /**
   * 获取数据库连接
   */
  getConnection(): DatabaseConnection {
    if (!this.connection) {
      throw new Error('数据库连接未初始化');
    }
    return this.connection;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.logger.info('数据库连接已关闭');
    }
  }

  /**
   * 执行事务
   */
  async executeTransaction<T>(callback: (connection: DatabaseConnection) => Promise<T>): Promise<T> {
    if (!this.connection) {
      throw new Error('数据库连接未初始化');
    }

    try {
      await this.connection.beginTransaction();
      const result = await callback(this.connection);
      await this.connection.commit();
      return result;
    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }

  /**
   * 插入数据集样本
   */
  async insertDatasetSample(sample: Omit<DatasetSample, 'id'>): Promise<number> {
    const connection = this.getConnection();
    const result = await connection.execute(
      `INSERT INTO data (dataset, "index", source, source_index, question, answer, topic, level, file_name, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sample.dataset,
        sample.index,
        sample.source,
        sample.sourceIndex,
        sample.question,
        sample.answer,
        sample.topic,
        sample.level,
        sample.fileName,
        sample.meta ? JSON.stringify(sample.meta) : null
      ]
    );
    return result.lastInsertRowid || 0;
  }

  /**
   * 插入评估样本
   */
  async insertEvaluationSample(sample: Omit<EvaluationSample, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const connection = this.getConnection();
    const result = await connection.execute(
      `INSERT INTO evaluation_data (dataset, dataset_index, source, raw_question, level, augmented_question, 
       correct_answer, file_name, meta, trace_id, trace_url, response, time_cost, trajectory, trajectories,
       extracted_final_answer, judged_response, reasoning, correct, confidence, exp_id, stage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sample.dataset,
        sample.datasetIndex,
        sample.source,
        sample.rawQuestion,
        sample.level,
        sample.augmentedQuestion,
        sample.correctAnswer,
        sample.fileName,
        sample.meta ? JSON.stringify(sample.meta) : null,
        sample.traceId,
        sample.traceUrl,
        sample.response,
        sample.timeCost,
        sample.trajectory,
        sample.trajectories,
        sample.extractedFinalAnswer,
        sample.judgedResponse,
        sample.reasoning,
        sample.correct,
        sample.confidence,
        sample.expId,
        sample.stage
      ]
    );
    return result.lastInsertRowid || 0;
  }

  /**
   * 插入工具追踪数据
   */
  async insertToolTracing(tracing: Omit<ToolTracingModel, 'id'>): Promise<number> {
    const connection = this.getConnection();
    const result = await connection.execute(
      `INSERT INTO tracing_tool (trace_id, span_id, name, input, output, mcp_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tracing.traceId,
        tracing.spanId,
        tracing.name,
        tracing.input ? JSON.stringify(tracing.input) : null,
        tracing.output ? JSON.stringify(tracing.output) : null,
        tracing.mcpData ? JSON.stringify(tracing.mcpData) : null
      ]
    );
    return result.lastInsertRowid || 0;
  }

  /**
   * 插入生成追踪数据
   */
  async insertGenerationTracing(tracing: Omit<GenerationTracingModel, 'id'>): Promise<number> {
    const connection = this.getConnection();
    const result = await connection.execute(
      `INSERT INTO tracing_generation (trace_id, span_id, model, input, output, usage)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tracing.traceId,
        tracing.spanId,
        tracing.model,
        tracing.input ? JSON.stringify(tracing.input) : null,
        tracing.output ? JSON.stringify(tracing.output) : null,
        tracing.usage ? JSON.stringify(tracing.usage) : null
      ]
    );
    return result.lastInsertRowid || 0;
  }

  /**
   * 插入工具缓存数据
   */
  async insertToolCache(cache: Omit<ToolCacheModel, 'id'>): Promise<number> {
    const connection = this.getConnection();
    const result = await connection.execute(
      `INSERT INTO cache_tool (function, args, kwargs, result, cache_key, timestamp, datetime, execution_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cache.function,
        cache.args,
        cache.kwargs,
        cache.result ? JSON.stringify(cache.result) : null,
        cache.cacheKey,
        cache.timestamp,
        cache.datetime,
        cache.executionTime
      ]
    );
    return result.lastInsertRowid || 0;
  }

  /**
   * 查询评估样本
   */
  async queryEvaluationSamples(expId: string, stage?: string): Promise<EvaluationSample[]> {
    const connection = this.getConnection();
    let sql = 'SELECT * FROM evaluation_data WHERE exp_id = ?';
    const params: unknown[] = [expId];
    
    if (stage) {
      sql += ' AND stage = ?';
      params.push(stage);
    }
    
    const rows = await connection.query(sql, params) as any[];
    return rows.map(row => ({
      ...row,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      datasetIndex: row.dataset_index,
      sourceIndex: row.source_index,
      rawQuestion: row.raw_question,
      augmentedQuestion: row.augmented_question,
      correctAnswer: row.correct_answer,
      fileName: row.file_name,
      traceId: row.trace_id,
      traceUrl: row.trace_url,
      timeCost: row.time_cost,
      extractedFinalAnswer: row.extracted_final_answer,
      judgedResponse: row.judged_response,
      expId: row.exp_id
    }));
  }
}
