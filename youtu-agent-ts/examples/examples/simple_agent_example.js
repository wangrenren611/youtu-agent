"use strict";
/**
 * 简单智能体使用示例
 * 演示如何使用youtu-agent-ts框架创建和运行智能体
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../src/index"));
async function main() {
    try {
        console.log('🚀 启动youtu-agent-ts示例程序...');
        // 创建智能体配置
        const agentConfig = {
            type: 'simple',
            name: 'demo_agent',
            model: {
                provider: 'deepseek',
                model: 'deepseek-chat',
                apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
                baseUrl: 'https://api.deepseek.com',
                temperature: 0.7,
                maxTokens: 2000
            },
            instructions: '你是一个有用的AI助手，可以帮助用户完成各种任务。',
            tools: ['file_read', 'file_write', 'web_search'],
            maxTurns: 10
        };
        // 创建智能体
        console.log('📝 创建智能体...');
        const agent = await index_1.default.createAgent(agentConfig);
        console.log('✅ 智能体创建成功');
        // 获取智能体信息
        const agentInfo = agent.getInfo();
        console.log('📊 智能体信息:', agentInfo);
        // 运行智能体
        console.log('🤖 开始与智能体对话...');
        const result = await agent.run(`帮我创建一个名为test.txt的文件，内容是"Hello World"`);
        console.log(result, "<================>");
        // 获取框架信息
        const frameworkInfo = index_1.default.getInfo();
        console.log('\n📈 框架信息:', frameworkInfo);
        // 清理资源
        console.log('\n🧹 清理资源...');
        await index_1.default.cleanup();
        console.log('✅ 资源清理完成');
    }
    catch (error) {
        console.error('❌ 程序执行失败:', error);
        process.exit(1);
    }
}
// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    process.exit(1);
});
// 运行示例
if (require.main === module) {
    main();
}
