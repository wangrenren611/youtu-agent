# API密钥设置指南

## 问题描述

运行workforce agent示例时遇到以下错误：
```
API密钥未配置或无效。请检查配置中的apiKey设置。
```

## 解决方案

### 1. 获取API密钥

#### OpenAI API密钥
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录你的账户
3. 点击 "Create new secret key"
4. 复制生成的API密钥

#### DeepSeek API密钥
1. 访问 [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. 登录你的账户
3. 创建新的API密钥
4. 复制生成的API密钥

### 2. 设置环境变量

#### 方法一：临时设置（当前终端会话）
```bash
# 对于OpenAI
export OPENAI_API_KEY="your-actual-openai-api-key"

# 对于DeepSeek
export DEEPSEEK_API_KEY="your-actual-deepseek-api-key"
```

#### 方法二：永久设置（推荐）

**在 ~/.bashrc 或 ~/.zshrc 中添加：**
```bash
# 对于OpenAI
export OPENAI_API_KEY="your-actual-openai-api-key"

# 对于DeepSeek
export DEEPSEEK_API_KEY="your-actual-deepseek-api-key"
```

然后重新加载配置：
```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

#### 方法三：使用 .env 文件
1. 在项目根目录创建 `.env` 文件
2. 添加以下内容：
```
OPENAI_API_KEY=your-actual-openai-api-key
DEEPSEEK_API_KEY=your-actual-deepseek-api-key
```

### 3. 验证设置

运行测试脚本验证API密钥是否正确设置：
```bash
node test_api_key.js
```

### 4. 运行示例

设置好API密钥后，运行workforce示例：
```bash
npm run example:workforce
```

## 常见问题

### Q: 为什么需要API密钥？
A: workforce agent使用多个LLM模型来执行不同的任务（规划、分配、执行、答案提取），每个子智能体都需要调用LLM API。

### Q: 可以使用不同的API提供商吗？
A: 可以，目前支持OpenAI和DeepSeek。你可以在配置中指定不同的provider。

### Q: API密钥安全吗？
A: 请确保：
- 不要将API密钥提交到版本控制系统
- 使用环境变量而不是硬编码
- 定期轮换API密钥
- 设置API使用限制

## 示例配置

```typescript
const workforceConfig: AgentConfig = {
  type: 'workforce',
  name: 'workforce_example',
  model: {
    provider: 'deepseek',  // 或 'openai'
    model: 'deepseek-chat', // 或 'gpt-4'
    apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
    baseUrl: 'https://api.deepseek.com', // 或 'https://api.openai.com'
    temperature: 0.7,
    maxTokens: 2000
  },
  // ... 其他配置
};
```
