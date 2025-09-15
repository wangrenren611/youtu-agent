# Node.js 版本 youtu-agent 实现详解

## 核心组件实现

### 1. 代理系统实现

#### BaseAgent 实现
```typescript
/**
 * 基础代理类
 * 提供所有代理共享的核心功能
 */
export abstract class BaseAgent {
  description: string;
  config: AgentConfig;
  env: BaseEnv | null = null;
  tools: Map<string, Tool> = new Map();
  context: AgentContext = {};
  recorder: TaskRecorder;

  constructor(config: AgentConfig) {
    this.config = config;
    this.description = config.description || this.constructor.name;
    this.recorder = new TaskRecorder(config.input || '');
  }

  // 构建代理
  async build(): Promise<void> {
    await this.initTools();
    // 子类可以扩展此方法
  }

  // 初始化工具
  async initTools(): Promise<void> {
    if (this.config.tools) {
      for (const tool of this.config.tools) {
        this.addTool(tool);
      }
    }
  }

  // 添加工具
  addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  // 获取工具
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  // 设置上下文
  setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  // 获取上下文
  getContext(key: string): any {
    return this.context[key];
  }

  // 清理资源
  async cleanup(): Promise<void> {
    // 清理工具
    for (const tool of this.tools.values()) {
      if (typeof tool.cleanup === 'function') {
        await tool.cleanup();
      }
    }
    
    // 清理环境
    if (this.env) {
      await this.env.cleanup();
    }
  }

  // 运行代理（抽象方法，子类必须实现）
  abstract run(options?: RunOptions): Promise<any>;
}
```

#### SimpleAgent 实现
```typescript
/**
 * 简单代理类
 * 实现与LLM的交互
 */
export class SimpleAgent extends BaseAgent {
  modelClient: any; // LLM客户端

  constructor(config: AgentConfig) {
    super(config);
  }

  // 构建代理
  async build(): Promise<void> {
    await super.build();
    await this.initModelClient();
  }

  // 初始化模型客户端
  async initModelClient(): Promise<void> {
    // 根据配置初始化模型客户端
    // 实际实现需要根据具体的LLM API进行适配
  }

  // 运行代理
  async run(options?: RunOptions): Promise<any> {
    this.recorder.start();
    
    try {
      const input = this.config.input;
      let context = this.context;
      
      // 调用LLM
      const response = await this.callLLM(input, context);
      
      // 解析LLM响应
      const result = this.parseLLMResponse(response);
      
      // 处理工具调用
      if (result.toolCalls && result.toolCalls.length > 0) {
        const toolResults = await this.executeToolCalls(result.toolCalls);
        
        // 更新上下文
        context = {
          ...context,
          toolResults
        };
        
        // 再次调用LLM
        const finalResponse = await this.callLLM(input, context);
        this.recorder.addRunResult({
          type: 'llm_call',
          data: finalResponse
        });
        
        this.recorder.setFinalOutput(finalResponse.content);
      } else {
        this.recorder.setFinalOutput(result.content);
      }
      
      this.recorder.complete();
      return this.recorder;
    } catch (error) {
      this.recorder.fail(error);
      throw error;
    }
  }

  // 调用LLM
  async callLLM(input: string, context: any): Promise<any> {
    // 实际实现需要根据具体的LLM API进行适配
    const response = await this.modelClient.generate(input, context);
    
    this.recorder.addRunResult({
      type: 'llm_call',
      data: response
    });
    
    return response;
  }

  // 解析LLM响应
  parseLLMResponse(response: any): { content: string; toolCalls?: any[] } {
    // 解析LLM响应，提取内容和工具调用
    // 实际实现需要根据具体的LLM响应格式进行适配
    return {
      content: response.content,
      toolCalls: response.toolCalls
    };
  }

  // 执行工具调用
  async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    const results = [];
    
    for (const call of toolCalls) {
      const tool = this.getTool(call.name);
      
      if (!tool) {
        throw new Error(`工具 ${call.name} 不存在`);
      }
      
      try {
        const result = await tool.execute(call.arguments);
        
        this.recorder.addRunResult({
          type: 'tool_call',
          data: {
            tool: call.name,
            arguments: call.arguments,
            result
          }
        });
        
        results.push({
          tool: call.name,
          result
        });
      } catch (error) {
        results.push({
          tool: call.name,
          error: error.message
        });
      }
    }
    
    return results;
  }
}
```

#### OrchestraAgent 实现
```typescript
/**
 * 编排代理类
 * 实现多代理协作
 */
export class OrchestraAgent extends BaseAgent {
  subAgents: Map<string, BaseAgent> = new Map();

  constructor(config: AgentConfig) {
    super(config);
  }

  // 构建代理
  async build(): Promise<void> {
    await super.build();
    await this.initSubAgents();
  }

  // 初始化子代理
  async initSubAgents(): Promise<void> {
    if (this.config.subAgents) {
      for (const agentConfig of this.config.subAgents) {
        const agent = await AgentFactory.createAgent(agentConfig);
        await agent.build();
        this.addSubAgent(agentConfig.name, agent);
      }
    }
  }

  // 添加子代理
  addSubAgent(name: string, agent: BaseAgent): void {
    this.subAgents.set(name, agent);
  }

  // 获取子代理
  getSubAgent(name: string): BaseAgent | undefined {
    return this.subAgents.get(name);
  }

  // 运行代理
  async run(options?: RunOptions): Promise<any> {
    this.recorder.start();
    
    try {
      // 规划执行
      const plan = await this.planExecution(this.config.input);
      
      // 执行计划
      const result = await this.executePlan(plan);
      
      this.recorder.setFinalOutput(result);
      this.recorder.complete();
      return this.recorder;
    } catch (error) {
      this.recorder.fail(error);
      throw error;
    }
  }

  // 规划执行
  async planExecution(input: string): Promise<any[]> {
    // 创建执行计划
    // 实际实现可能需要调用规划代理或使用预定义的计划
    return [
      { agent: 'agent1', input },
      { agent: 'agent2', input: '{{agent1.output}}' }
    ];
  }

  // 执行计划
  async executePlan(plan: any[]): Promise<string> {
    const results: Record<string, any> = {};
    
    for (const step of plan) {
      const agent = this.getSubAgent(step.agent);
      
      if (!agent) {
        throw new Error(`子代理 ${step.agent} 不存在`);
      }
      
      // 准备输入
      const input = this.prepareStepInput(step.input, results);
      
      // 设置代理输入
      agent.config.input = input;
      
      // 运行子代理
      const result = await agent.run();
      
      // 记录结果
      results[step.agent] = {
        output: result.finalOutput
      };
      
      this.recorder.addRunResult({
        type: 'sub_agent_call',
        data: {
          agent: step.agent,
          input,
          output: result.finalOutput
        }
      });
    }
    
    // 合并结果
    return this.mergeResults(results);
  }

  // 准备步骤输入
  prepareStepInput(input: string, results: Record<string, any>): string {
    // 替换输入中的变量引用
    return input.replace(/{{([\w.]+)}}/g, (match, path) => {
      const parts = path.split('.');
      let value = results;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return match;
        }
      }
      
      return String(value);
    });
  }

  // 合并结果
  mergeResults(results: Record<string, any>): string {
    // 合并所有子代理的结果
    // 实际实现可能需要更复杂的逻辑
    const lastAgent = Object.keys(results).pop();
    return results[lastAgent]?.output || '';
  }

  // 清理资源
  async cleanup(): Promise<void> {
    // 清理子代理
    for (const agent of this.subAgents.values()) {
      await agent.cleanup();
    }
    
    await super.cleanup();
  }
}
```

### 2. 工具系统实现

#### ToolRegistry 实现
```typescript
/**
 * 工具注册表
 * 管理所有可用工具
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Tool> = new Map();

  private constructor() {}

  // 获取单例实例
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  // 注册工具
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  // 获取工具
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  // 获取所有工具
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  // 移除工具
  remove(name: string): boolean {
    return this.tools.delete(name);
  }
}
```

### 3. 环境系统实现

#### NodeEnv 实现
```typescript
/**
 * Node.js 环境类
 * 提供 Node.js 环境的配置和管理
 */
export class NodeEnv extends BaseEnv {
  workingDir: string;
  envVars: Record<string, string>;
  timeout: number;

  constructor(config: NodeEnvConfig) {
    super(config);
    
    // 设置工作目录
    this.workingDir = config.config.workingDir || process.cwd();
    
    // 设置环境变量
    this.envVars = {
      ...process.env,
      ...config.config.env
    };
    
    // 设置超时时间
    this.timeout = config.config.timeout || 30000; // 默认 30 秒
  }
  
  // 构建环境
  async build(): Promise<void> {
    await super.build();
    
    // 确保工作目录存在
    if (!fs.existsSync(this.workingDir)) {
      fs.mkdirSync(this.workingDir, { recursive: true });
    }
  }
  
  // 执行命令
  async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execAsync(command, {
        cwd: this.workingDir,
        env: this.envVars,
        timeout: this.timeout
      });
    } catch (error) {
      throw new Error(`执行命令失败: ${error}`);
    }
  }
  
  // 执行动作
  async step(action: { type: string; payload: any }): Promise<any> {
    switch (action.type) {
      case 'execute_command':
        return await this.executeCommand(action.payload);
        
      case 'read_file':
        return await this.readFile(action.payload);
        
      case 'write_file':
        return await this.writeFile(action.payload.path, action.payload.content);
        
      case 'list_directory':
        return await this.listDirectory(action.payload);
        
      default:
        throw new Error(`未知的动作类型: ${action.type}`);
    }
  }
  
  // 获取观察
  async observe(): Promise<any> {
    return {
      workingDir: this.workingDir,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
  }
}
```

### 4. 任务追踪实现

#### TaskRecorder 实现
```typescript
/**
 * 任务记录器
 * 记录代理执行过程和结果
 */
export class TaskRecorder {
  input: string;
  traceId: string;
  runResults: any[] = [];
  finalOutput: string = '';
  startTime: number = 0;
  endTime: number = 0;
  status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
  error: Error | null = null;

  constructor(input: string) {
    this.input = input;
    this.traceId = this.generateTraceId();
  }

  // 生成追踪ID
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // 开始记录
  start(): void {
    this.startTime = Date.now();
    this.status = 'running';
  }

  // 添加运行结果
  addRunResult(result: any): void {
    this.runResults.push({
      ...result,
      timestamp: Date.now()
    });
  }

  // 设置最终输出
  setFinalOutput(output: string): void {
    this.finalOutput = output;
  }

  // 完成记录
  complete(): void {
    this.endTime = Date.now();
    this.status = 'completed';
  }

  // 记录失败
  fail(error: Error): void {
    this.endTime = Date.now();
    this.status = 'failed';
    this.error = error;
  }

  // 获取执行时间（毫秒）
  getExecutionTime(): number {
    return this.endTime - this.startTime;
  }

  // 获取完整记录
  getRecord(): any {
    return {
      traceId: this.traceId,
      input: this.input,
      runResults: this.runResults,
      finalOutput: this.finalOutput,
      startTime: this.startTime,
      endTime: this.endTime,
      executionTime: this.getExecutionTime(),
      status: this.status,
      error: this.error ? this.error.message : null
    };
  }
}
```

## 使用示例

### 创建和运行简单代理

```typescript
// 创建简单代理
const simpleAgent = await AgentFactory.createAgent({
  type: AgentType.SIMPLE,
  name: 'simple-agent',
  description: '简单代理示例',
  input: '查询当前天气',
  tools: [
    // 工具列表
  ]
});

// 构建代理
await simpleAgent.build();

// 运行代理
const result = await simpleAgent.run();

// 输出结果
console.log(result.finalOutput);

// 清理资源
await simpleAgent.cleanup();
```

### 创建和运行编排代理

```typescript
// 创建编排代理
const orchestraAgent = await AgentFactory.createAgent({
  type: AgentType.ORCHESTRA,
  name: 'orchestra-agent',
  description: '编排代理示例',
  input: '分析并总结这篇文章',
  subAgents: [
    {
      type: AgentType.SIMPLE,
      name: 'analyzer',
      description: '分析代理',
      tools: [
        // 分析工具
      ]
    },
    {
      type: AgentType.SIMPLE,
      name: 'summarizer',
      description: '总结代理',
      tools: [
        // 总结工具
      ]
    }
  ]
});

// 构建代理
await orchestraAgent.build();

// 运行代理
const result = await orchestraAgent.run();

// 输出结果
console.log(result.finalOutput);

// 清理资源
await orchestraAgent.cleanup();
```

## 扩展示例

### 创建自定义工具

```typescript
// 定义工具
const weatherTool: Tool = {
  name: 'weather',
  description: '获取当前天气信息',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: '位置'
      }
    },
    required: ['location']
  },
  execute: async (args: any) => {
    const { location } = args;
    // 实际实现可能需要调用天气API
    return {
      location,
      temperature: '25°C',
      condition: '晴天',
      humidity: '60%'
    };
  }
};

// 注册工具
ToolRegistry.getInstance().register(weatherTool);
```

### 创建自定义代理

```typescript
// 定义自定义代理
class CustomAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async build(): Promise<void> {
    await super.build();
    // 自定义初始化逻辑
  }

  async run(options?: RunOptions): Promise<any> {
    this.recorder.start();
    
    try {
      // 自定义运行逻辑
      const result = '自定义代理结果';
      
      this.recorder.setFinalOutput(result);
      this.recorder.complete();
      return this.recorder;
    } catch (error) {
      this.recorder.fail(error);
      throw error;
    }
  }
}

// 注册自定义代理
AgentFactory.registerAgentType('CUSTOM', (config) => new CustomAgent(config));

// 创建自定义代理
const customAgent = await AgentFactory.createAgent({
  type: 'CUSTOM',
  name: 'custom-agent',
  description: '自定义代理示例',
  input: '自定义输入'
});
```