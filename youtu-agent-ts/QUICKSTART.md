# youtu-agent-ts 快速开始指南

## 🚀 5分钟快速上手

### 1. 环境准备

确保你的系统已安装：
- Node.js 18+ 
- npm 或 yarn

### 2. 安装项目

```bash
# 克隆项目（如果从仓库获取）
git clone <repository-url>
cd youtu-agent-ts

# 安装依赖
npm install
```

### 3. 配置环境

```bash
# 复制环境变量模板
cp env.example .env

# 编辑 .env 文件，填入你的API密钥
# 至少需要设置 OPENAI_API_KEY
```

### 4. 运行示例

```bash
# 运行简单示例
npm run example
```

### 5. 启动服务器

```bash
# 启动API服务器
npm run serve

# 在另一个终端测试API
curl http://localhost:3000/health
```

## 📝 基本使用

### 创建智能体

```typescript
import youtuAgent, { AgentConfig } from 'youtu-agent-ts';

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

const agent = await youtuAgent.createAgent(config);
```

### 运行智能体

```typescript
// 简单对话
const result = await agent.run('你好，请介绍一下你自己');
console.log(result.output);

// 流式对话
for await (const message of agent.runStream('请帮我分析这个数据')) {
  console.log(message.content);
}
```

### 使用工具

```typescript
// 文件操作
const result = await agent.run('帮我创建一个名为test.txt的文件，内容是"Hello World"');

// 网络搜索
const searchResult = await agent.run('搜索一下最新的AI技术发展');

// 代码执行
const codeResult = await agent.run('帮我写一个Python函数计算斐波那契数列');
```

## 🔧 常用命令

```bash
# 开发
npm run dev          # 开发模式
npm run build        # 构建项目
npm run clean        # 清理构建文件

# 测试
npm test             # 运行测试
npm run test:watch   # 监视模式测试
npm run test:coverage # 覆盖率报告

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run format       # 代码格式化

# 服务
npm run serve        # 启动API服务器
npm run example      # 运行示例
npm run cli info     # 查看框架信息
```

## 📚 更多资源

- [完整文档](README.md)
- [架构设计](docs/architecture.md)
- [项目总结](PROJECT_SUMMARY.md)
- [示例代码](examples/)

## ❓ 常见问题

### Q: 如何添加自定义工具？
A: 参考 [自定义工具文档](README.md#自定义工具)

### Q: 如何配置不同的语言模型？
A: 修改配置文件中的model部分，支持OpenAI、Anthropic等

### Q: 如何部署到生产环境？
A: 参考 [部署文档](docs/deployment.md)

### Q: 遇到错误怎么办？
A: 查看日志文件，或提交Issue获取帮助

---

**开始你的AI智能体开发之旅吧！** 🎉
