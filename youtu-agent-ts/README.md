# youtu-agent-ts

一个基于Node.js和TypeScript的智能体框架，提供多智能体协作、工具调用、配置管理等核心功能。

## 🚀 特性

- **多智能体支持**: 支持简单智能体、编排智能体、工作流智能体等多种类型
- **丰富的工具生态**: 内置文件操作、搜索、代码执行等常用工具
- **配置驱动**: 基于YAML的灵活配置系统
- **类型安全**: 完整的TypeScript类型定义
- **可扩展性**: 支持自定义工具和智能体
- **实时追踪**: 完整的执行追踪和日志记录
- **Web API**: RESTful API和WebSocket支持

## 📦 安装

```bash
# 克隆项目
git clone <repository-url>
cd youtu-agent-ts

# 安装依赖
npm install

# 构建项目
npm run build
```

## 🛠️ 开发

```bash
# 开发模式
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint

# 格式化代码
npm run format
```

## 📖 快速开始

### 1. 基本使用

```typescript
import youtuAgent, { AgentConfig } from 'youtu-agent-ts';

// 创建智能体配置
const config: AgentConfig = {
  type: 'simple',
  name: 'my_agent',
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY
  },
  tools: ['file_read', 'web_search']
};

// 创建并运行智能体
const agent = await youtuAgent.createAgent(config);
const result = await agent.run('你好，请介绍一下你自己');
console.log(result.output);
```

### 2. 使用配置文件

```yaml
# configs/agents/my_agent.yaml
type: simple
name: "my_agent"
model:
  provider: openai
  model: "gpt-3.5-turbo"
  apiKey: "${OPENAI_API_KEY}"
tools:
  - "file_read"
  - "file_write"
  - "web_search"
```

```typescript
import { ConfigManager } from 'youtu-agent-ts';

const configManager = new ConfigManager();
const config = await configManager.loadAgentConfig('my_agent');
const agent = await youtuAgent.createAgent(config);
```

### 3. 流式对话

```typescript
const agent = await youtuAgent.createAgent(config);

for await (const message of agent.runStream('请帮我分析这个数据')) {
  console.log(message.content);
}
```

## 🏗️ 架构设计

### 核心组件

```
src/
├── core/                 # 核心框架
│   ├── agent/           # 智能体基类
│   ├── tool/            # 工具系统
│   ├── config/          # 配置管理
│   └── workflow/        # 工作流引擎
├── agents/              # 智能体实现
├── tools/               # 工具实现
├── api/                 # Web API
├── ui/                  # 前端界面
└── utils/               # 工具函数
```

### 智能体类型

1. **SimpleAgent**: 单轮对话智能体
2. **OrchestraAgent**: 多智能体编排
3. **WorkforceAgent**: 工作流智能体

### 工具系统

- **文件操作**: 读写、创建、删除文件
- **搜索工具**: 网络搜索、本地搜索
- **代码执行**: Python、JavaScript、Shell
- **图像处理**: 图像生成、编辑
- **数据处理**: CSV、JSON处理

## 🔧 配置

### 环境变量

```bash
# OpenAI API密钥
OPENAI_API_KEY=your-api-key

# 日志级别
LOG_LEVEL=info

# 日志目录
LOG_DIR=./logs
```

### 配置文件

配置文件使用YAML格式，支持环境变量替换：

```yaml
model:
  provider: openai
  model: "gpt-3.5-turbo"
  apiKey: "${OPENAI_API_KEY}"
  temperature: 0.7
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --testNamePattern="SimpleAgent"

# 生成覆盖率报告
npm run test:coverage
```

## 📚 API文档

### 核心API

#### YoutuAgentTS

```typescript
class YoutuAgentTS {
  // 初始化框架
  async initialize(): Promise<void>
  
  // 创建智能体
  async createAgent(config: AgentConfig): Promise<BaseAgent>
  
  // 获取智能体
  getAgent(type: string, name: string): BaseAgent | undefined
  
  // 获取所有智能体
  getAllAgents(): BaseAgent[]
  
  // 清理资源
  async cleanup(): Promise<void>
}
```

#### BaseAgent

```typescript
abstract class BaseAgent {
  // 运行智能体
  async run(input: string, traceId?: string): Promise<TaskRecorder>
  
  // 流式运行
  async* runStream(input: string, traceId?: string): AsyncGenerator<Message>
  
  // 初始化
  async initialize(): Promise<void>
  
  // 清理
  async cleanup(): Promise<void>
}
```

#### ToolManager

```typescript
class ToolManager {
  // 注册工具
  registerTool(tool: ToolDefinition): void
  
  // 调用工具
  async callTool(name: string, args: any): Promise<string>
  
  // 获取工具列表
  getAllTools(): ToolDefinition[]
}
```

## 🔌 扩展开发

### 自定义工具

```typescript
import { ToolDefinition, ToolHandler } from 'youtu-agent-ts';
import { z } from 'zod';

const myToolSchema = z.object({
  input: z.string().describe('输入参数')
});

const myToolHandler: ToolHandler = async (args) => {
  // 实现工具逻辑
  return '工具执行结果';
};

const myTool: ToolDefinition = {
  name: 'my_tool',
  description: '我的自定义工具',
  parameters: myToolSchema,
  handler: myToolHandler
};

// 注册工具
toolManager.registerTool(myTool);
```

### 自定义智能体

```typescript
import { BaseAgent } from 'youtu-agent-ts';

class MyAgent extends BaseAgent {
  protected async onInitialize(): Promise<void> {
    // 自定义初始化逻辑
  }
  
  protected async execute(input: string, recorder: TaskRecorder): Promise<string> {
    // 自定义执行逻辑
    return '执行结果';
  }
  
  protected async* executeStream(input: string, recorder: TaskRecorder): AsyncGenerator<Message> {
    // 自定义流式执行逻辑
    yield { role: 'assistant', content: '流式结果' };
  }
  
  protected async onCleanup(): Promise<void> {
    // 自定义清理逻辑
  }
}
```

## 📊 性能监控

框架提供完整的性能监控和追踪功能：

- 执行时间统计
- 内存使用监控
- 工具调用追踪
- 错误日志记录

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [LangChain.js](https://github.com/langchain-ai/langchainjs) - 智能体框架基础
- [OpenAI](https://openai.com/) - 语言模型支持
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Express.js](https://expressjs.com/) - Web框架

## 📞 支持

如有问题或建议，请：

- 提交 [Issue](https://github.com/your-repo/issues)
- 发送邮件至 support@example.com
- 查看 [文档](https://docs.example.com)

---

**youtu-agent-ts** - 让AI智能体开发更简单、更强大！
