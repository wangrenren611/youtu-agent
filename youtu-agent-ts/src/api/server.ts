/**
 * Web API 服务器
 * 提供RESTful API和WebSocket支持
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import WebSocket from 'ws';
import { createServer } from 'http';
import * as path from 'path';
import youtuAgent, { AgentConfig } from '../index';
import { Logger } from '../utils/Logger';

const logger = new Logger('APIServer');

export class APIServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocket.Server;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS中间件
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));
    
    // 压缩中间件
    this.app.use(compression());
    
    // JSON解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 静态文件服务
    this.app.use('/ui', express.static(path.join(__dirname, '../ui')));
    
    // 请求日志中间件
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 根路径重定向到UI
    this.app.get('/', (req, res) => {
      res.redirect('/ui/');
    });

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        framework: youtuAgent.getInfo()
      });
    });

    // 获取框架信息
    this.app.get('/api/info', (req, res) => {
      res.json(youtuAgent.getInfo());
    });

    // 获取智能体列表
    this.app.get('/api/agents', (req, res) => {
      const agents = youtuAgent.getAllAgents().map(agent => ({
        type: agent.getType(),
        name: agent.getName(),
        isReady: agent.isReady()
      }));
      res.json({ agents });
    });

    // 创建智能体
    this.app.post('/api/agents', async (req, res) => {
      try {
        const config: AgentConfig = req.body;
        const agent = await youtuAgent.createAgent(config);
        
        res.status(201).json({
          success: true,
          agent: {
            type: agent.getType(),
            name: agent.getName(),
            isReady: agent.isReady()
          }
        });
      } catch (error) {
        logger.error('创建智能体失败:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });

    // 获取智能体
    this.app.get('/api/agents/:type/:name', (req, res) => {
      const { type, name } = req.params;
      const agent = youtuAgent.getAgent(type, name);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: '智能体不存在'
        });
      }
      
      res.json({
        success: true,
        agent: {
          type: agent.getType(),
          name: agent.getName(),
          isReady: agent.isReady()
        }
      });
    });

    // 运行智能体
    this.app.post('/api/agents/:type/:name/run', async (req, res) => {
      try {
        const { type, name } = req.params;
        const { input, traceId } = req.body;
        
        const agent = youtuAgent.getAgent(type, name);
        if (!agent) {
          return res.status(404).json({
            success: false,
            error: '智能体不存在'
          });
        }
        
        const result = await agent.run(input, traceId);
        
        res.json({
          success: true,
          result: {
            id: result.id,
            input: result.input,
            output: result.output,
            status: result.status,
            startTime: result.startTime,
            endTime: result.endTime,
            messageCount: result.messages.length,
            toolCallCount: result.toolCalls.length
          }
        });
      } catch (error) {
        logger.error('运行智能体失败:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });

    // 获取工具列表
    this.app.get('/api/tools', (req, res) => {
      const toolManager = youtuAgent.getToolManager();
      const tools = toolManager.getAllTools().map(tool => ({
        name: tool.name,
        description: tool.description
      }));
      
      res.json({ tools });
    });

    // 调用工具
    this.app.post('/api/tools/:name/call', async (req, res) => {
      try {
        const { name } = req.params;
        const { args } = req.body;
        
        const toolManager = youtuAgent.getToolManager();
        const result = await toolManager.callTool(name, args);
        
        res.json({
          success: true,
          result
        });
      } catch (error) {
        logger.error('调用工具失败:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });

    // 错误处理中间件
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('API错误:', error);
      res.status(500).json({
        success: false,
        error: '内部服务器错误'
      });
    });

    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: '接口不存在'
      });
    });
  }

  /**
   * 设置WebSocket
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      logger.info('WebSocket连接建立');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          logger.error('WebSocket消息处理失败:', error);
          this.sendWebSocketMessage(ws, {
            type: 'error',
            error: '消息格式错误'
          });
        }
      });
      
      ws.on('close', () => {
        logger.info('WebSocket连接关闭');
      });
      
      ws.on('error', (error) => {
        logger.error('WebSocket错误:', error);
      });
    });
  }

  /**
   * 处理WebSocket消息
   */
  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    const { type, data } = message;
    
    switch (type) {
      case 'run_agent':
        await this.handleAgentRun(ws, data);
        break;
      case 'ping':
        this.sendWebSocketMessage(ws, { type: 'pong', timestamp: Date.now() });
        break;
      default:
        this.sendWebSocketMessage(ws, {
          type: 'error',
          error: `未知消息类型: ${type}`
        });
    }
  }

  /**
   * 处理智能体运行
   */
  private async handleAgentRun(ws: WebSocket, data: any): Promise<void> {
    try {
      const { type, name, input, traceId } = data;
      
      const agent = youtuAgent.getAgent(type, name);
      if (!agent) {
        this.sendWebSocketMessage(ws, {
          type: 'error',
          error: '智能体不存在'
        });
        return;
      }
      
      // 发送开始消息
      this.sendWebSocketMessage(ws, {
        type: 'agent_start',
        data: { traceId }
      });
      
      // 流式运行智能体
      for await (const message of agent.runStream(input, traceId)) {
        this.sendWebSocketMessage(ws, {
          type: 'agent_message',
          data: message
        });
      }
      
      // 发送完成消息
      this.sendWebSocketMessage(ws, {
        type: 'agent_complete',
        data: { traceId }
      });
      
    } catch (error) {
      logger.error('WebSocket智能体运行失败:', error);
      this.sendWebSocketMessage(ws, {
        type: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 发送WebSocket消息
   */
  private sendWebSocketMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info(`API服务器启动成功，端口: ${this.port}`);
        logger.info(`健康检查: http://localhost:${this.port}/health`);
        logger.info(`API文档: http://localhost:${this.port}/api/info`);
        resolve();
      });
    });
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('API服务器已停止');
        resolve();
      });
    });
  }
}
