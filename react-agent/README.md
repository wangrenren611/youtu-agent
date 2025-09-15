# React Agent TypeScript

React Agent TypeScript是youtu-agent的TypeScript实现版本，提供了一套灵活、可扩展的代理系统框架，用于构建基于LLM的智能代理应用。

## 特性

- **模块化架构**：核心组件高度模块化，便于扩展和定制
- **LLM集成**：内置OpenAI API集成，支持流式响应
- **工具系统**：灵活的工具注册和管理机制
- **环境系统**：支持浏览器自动化等多种环境
- **追踪系统**：详细记录代理执行过程
- **插件机制**：支持动态加载外部工具插件

## 快速开始

### 安装

```bash
# 安装依赖
npm install
```

### 设置环境变量

创建`.env`文件并设置必要的环境变量：

```
OPENAI_API_KEY=your_openai_api_key
```

### 运行示例

```bash
# 运行聊天助手示例
npm run example chat

# 运行网页搜索示例
npm run example web-search
```

## 项目结构

```
react-agent/
├── src/                  # 源代码目录
│   ├── agents/           # 代理系统
│   ├── config/           # 配置系统
│   ├── env/              # 环境系统
│   ├── tools/            # 工具系统
│   ├── tracing/          # 追踪系统
│   ├── ui/               # 用户界面
│   └── utils/            # 工具函数
├── examples/             # 示例应用
├── docs/                 # 文档
└── tests/                # 测试
```

## 核心组件

### 代理系统

- `BaseAgent`: 所有代理的基类
- `LLMAgent`: 基于LLM的代理实现
- `WebAgent`: 用于Web浏览和交互的代理

### 环境系统

- `BaseEnv`: 环境基类
- `BrowserEnv`: 浏览器环境，基于Puppeteer

### 工具系统

- `BaseTool`: 工具基类
- `WebTool`: Web工具，提供HTTP请求等功能
- `FileSystemTool`: 文件系统工具
- `ToolRegistry`: 工具注册表
- `PluginLoader`: 插件加载器

## 示例应用

- **聊天助手**：基于LLMAgent的简单聊天机器人
- **网页搜索**：使用WebAgent进行网页搜索和信息提取

## 开发

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

## 许可证

MIT