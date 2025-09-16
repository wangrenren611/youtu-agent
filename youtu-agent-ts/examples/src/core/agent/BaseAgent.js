"use strict";
/**
 * 基础智能体类
 * 定义了所有智能体的通用接口和行为，支持ReAct模式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const events_1 = require("events");
const types_1 = require("../../types");
const Logger_1 = require("../../utils/Logger");
const ConfigManager_1 = require("../config/ConfigManager");
const ToolManager_1 = require("../tool/ToolManager");
class BaseAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isInitialized = false;
        // ReAct模式相关属性
        this.maxTurns = 10;
        this.currentTurn = 0;
        this.availableTools = new Map();
        this.config = config;
        this.logger = new Logger_1.Logger(`Agent:${config.name}`);
        this.toolManager = new ToolManager_1.ToolManager();
        this.configManager = new ConfigManager_1.ConfigManager();
        this.maxTurns = config.maxTurns || 10;
    }
    /**
     * 初始化智能体
     * 子类可以重写此方法来实现特定的初始化逻辑
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            this.logger.info('正在初始化智能体...');
            // 加载工具
            if (this.config.tools && this.config.tools.length > 0) {
                await this.loadTools(this.config.tools);
                this.logger.info(`已加载 ${this.availableTools.size} 个工具`);
            }
            // 执行子类特定的初始化
            await this.onInitialize();
            this.isInitialized = true;
            this.logger.info('智能体初始化完成');
            this.emit('initialized');
        }
        catch (error) {
            this.logger.error('智能体初始化失败:', error);
            throw new types_1.AgentError(`智能体初始化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'INITIALIZATION_FAILED', error);
        }
    }
    /**
     * 运行智能体
     * @param input 输入内容
     * @param traceId 追踪ID
     * @returns 任务记录器
     */
    async run(input, traceId) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const recorder = this.createTaskRecorder(input, traceId);
        try {
            this.logger.info(`开始执行任务: ${input}`);
            this.emit('task_start', recorder);
            // 执行ReAct循环
            const result = await this.reactLoop(input, recorder);
            recorder.output = result;
            recorder.status = 'completed';
            recorder.endTime = new Date();
            this.logger.info('任务执行完成');
            this.emit('task_completed', recorder);
            return recorder;
        }
        catch (error) {
            recorder.status = 'failed';
            recorder.error = error instanceof Error ? error.message : '未知错误';
            recorder.endTime = new Date();
            this.logger.error('任务执行失败:', error);
            this.emit('task_failed', recorder);
            throw error;
        }
    }
    /**
     * 流式运行智能体
     * @param input 输入内容
     * @param traceId 追踪ID
     * @returns 异步生成器，产生流式结果
     */
    async *runStream(input, traceId) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const recorder = this.createTaskRecorder(input, traceId);
        try {
            this.logger.info(`开始流式执行任务: ${input}`);
            this.emit('stream_start', recorder);
            // 执行ReAct循环的流式版本
            for await (const message of this.reactLoopStream(input, recorder)) {
                recorder.messages.push(message);
                this.emit('stream_message', message);
                yield message;
            }
            recorder.status = 'completed';
            recorder.endTime = new Date();
            this.logger.info('流式任务执行完成');
            this.emit('stream_completed', recorder);
        }
        catch (error) {
            recorder.status = 'failed';
            recorder.error = error instanceof Error ? error.message : '未知错误';
            recorder.endTime = new Date();
            this.logger.error('流式任务执行失败:', error);
            this.emit('stream_failed', recorder);
            throw error;
        }
    }
    /**
     * 清理资源
     */
    async cleanup() {
        try {
            this.logger.info('正在清理智能体资源...');
            await this.onCleanup();
            this.toolManager.cleanup();
            this.isInitialized = false;
            this.logger.info('智能体资源清理完成');
        }
        catch (error) {
            this.logger.error('智能体资源清理失败:', error);
        }
    }
    /**
     * 获取智能体配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 获取智能体名称
     */
    getName() {
        return this.config.name;
    }
    /**
     * 获取智能体类型
     */
    getType() {
        return this.config.type;
    }
    /**
     * 检查智能体是否已初始化
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * 创建任务记录器
     */
    createTaskRecorder(input, traceId) {
        return {
            id: traceId || this.generateTraceId(),
            input,
            messages: [],
            toolCalls: [],
            startTime: new Date(),
            status: 'pending',
            // ReAct模式相关字段
            reasoning: [],
            actions: [],
            observations: [],
            turns: 0,
            maxTurns: this.maxTurns
        };
    }
    /**
     * 生成追踪ID
     */
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * ReAct循环核心方法
     */
    async reactLoop(input, recorder) {
        let currentInput = input;
        for (recorder.turns = 0; recorder.turns < recorder.maxTurns; recorder.turns++) {
            this.logger.info(`ReAct循环 - 第 ${recorder.turns + 1} 轮`);
            // 1. Reasoning: 分析当前情况
            const reasoning = await this.reason(currentInput, recorder);
            recorder.reasoning.push(reasoning);
            // 2. Acting: 决定行动（工具调用或生成响应）
            const action = await this.act(reasoning, recorder);
            recorder.actions.push(action);
            if (action.type === 'tool_call' && action.toolCall) {
                // 3. Observation: 执行工具并观察结果
                const observation = await this.observe(action.toolCall, recorder);
                recorder.observations.push(observation);
                // 构建下一轮的输入
                currentInput = this.buildNextInput(currentInput, observation, recorder);
            }
            else if (action.type === 'response' && action.response) {
                // 直接返回响应
                return action.response;
            }
        }
        throw new types_1.AgentError('达到最大轮次限制', 'MAX_TURNS_EXCEEDED');
    }
    /**
     * ReAct循环的流式版本
     */
    async *reactLoopStream(input, recorder) {
        let currentInput = input;
        for (recorder.turns = 0; recorder.turns < recorder.maxTurns; recorder.turns++) {
            this.logger.info(`ReAct循环 - 第 ${recorder.turns + 1} 轮`);
            // 1. Reasoning: 分析当前情况
            const reasoning = await this.reason(currentInput, recorder);
            recorder.reasoning.push(reasoning);
            // 发送推理消息
            yield {
                role: 'assistant',
                content: `思考: ${reasoning}`,
                timestamp: new Date()
            };
            // 2. Acting: 决定行动
            const action = await this.act(reasoning, recorder);
            recorder.actions.push(action);
            if (action.type === 'tool_call' && action.toolCall) {
                // 发送工具调用消息
                yield {
                    role: 'assistant',
                    content: `调用工具: ${action.toolCall.function.name}`,
                    tool_calls: [action.toolCall],
                    timestamp: new Date()
                };
                // 3. Observation: 执行工具并观察结果
                const observation = await this.observe(action.toolCall, recorder);
                recorder.observations.push(observation);
                // 发送工具结果消息
                yield {
                    role: 'tool',
                    content: observation,
                    tool_call_id: action.toolCall.id,
                    timestamp: new Date()
                };
                // 构建下一轮的输入
                currentInput = this.buildNextInput(currentInput, observation, recorder);
            }
            else if (action.type === 'response' && action.response) {
                // 发送最终响应
                yield {
                    role: 'assistant',
                    content: action.response,
                    timestamp: new Date()
                };
                return;
            }
        }
        throw new types_1.AgentError('达到最大轮次限制', 'MAX_TURNS_EXCEEDED');
    }
    /**
     * 推理阶段 - 分析当前情况
     */
    async reason(input, recorder) {
        const prompt = this.buildReasoningPrompt(input, recorder);
        const response = await this.callLLM(prompt);
        return response;
    }
    /**
     * 行动阶段 - 决定下一步行动
     */
    async act(reasoning, recorder) {
        const prompt = this.buildActionPrompt(reasoning, recorder);
        const response = await this.callLLM(prompt);
        // 解析是否包含工具调用
        const toolCall = this.parseToolCall(response);
        if (toolCall) {
            return { type: 'tool_call', toolCall, reasoning };
        }
        else {
            return { type: 'response', response, reasoning };
        }
    }
    /**
     * 观察阶段 - 执行工具并观察结果
     */
    async observe(toolCall, recorder) {
        const tool = this.availableTools.get(toolCall.function.name);
        if (!tool) {
            throw new types_1.AgentError(`工具 ${toolCall.function.name} 不存在`, 'TOOL_NOT_FOUND');
        }
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.handler(args);
            recorder.toolCalls.push(toolCall);
            return result;
        }
        catch (error) {
            const errorMsg = `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
            this.logger.error(errorMsg, error);
            return errorMsg;
        }
    }
    /**
     * 构建下一轮的输入
     */
    buildNextInput(currentInput, observation, _recorder) {
        return `${currentInput}\n\n工具结果: ${observation}`;
    }
    /**
     * 构建推理提示词
     */
    buildReasoningPrompt(input, recorder) {
        const availableTools = Array.from(this.availableTools.values())
            .map(tool => `- ${tool.name}: ${tool.description}`)
            .join('\n');
        return `请分析当前情况并决定下一步行动。

当前输入: ${input}

可用工具:
${availableTools}

历史记录:
${recorder.observations.map((obs, i) => `第${i + 1}轮结果: ${obs}`).join('\n')}

请分析当前情况，考虑是否需要使用工具来完成任务。`;
    }
    /**
     * 构建行动提示词
     */
    buildActionPrompt(reasoning, _recorder) {
        const availableTools = Array.from(this.availableTools.values())
            .map(tool => `- ${tool.name}: ${tool.description}`)
            .join('\n');
        return `基于以下分析，请决定下一步行动:

分析: ${reasoning}

可用工具:
${availableTools}

如果需要使用工具，请以以下格式调用:
{
  "name": "工具名称",
  "arguments": "{\"参数\": \"值\"}"
}

如果不需要工具，请直接提供最终答案。`;
    }
    /**
     * 解析工具调用
     */
    parseToolCall(response) {
        try {
            // 尝试解析JSON格式的工具调用
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.name && parsed.arguments) {
                    return {
                        id: this.generateTraceId(),
                        type: 'function',
                        function: {
                            name: parsed.name,
                            arguments: typeof parsed.arguments === 'string' ? parsed.arguments : JSON.stringify(parsed.arguments)
                        }
                    };
                }
            }
        }
        catch (error) {
            // 解析失败，返回null
        }
        return null;
    }
    /**
     * 加载工具
     */
    async loadTools(toolNames) {
        for (const toolName of toolNames) {
            try {
                const tool = await this.toolManager.loadTool(toolName);
                if (tool) {
                    this.availableTools.set(toolName, tool);
                    this.logger.info(`已加载工具: ${toolName}`);
                }
            }
            catch (error) {
                this.logger.warn(`加载工具失败: ${toolName}`, error);
            }
        }
    }
}
exports.BaseAgent = BaseAgent;
