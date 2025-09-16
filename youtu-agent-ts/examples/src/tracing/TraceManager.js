"use strict";
/**
 * 追踪管理器
 * 负责智能体执行过程的追踪、监控和记录
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceManager = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class TraceManager extends events_1.EventEmitter {
    constructor(tracesDir = './traces') {
        super();
        this.sessions = new Map();
        this.events = new Map();
        this.logger = new Logger_1.Logger('TraceManager');
        this.tracesDir = tracesDir;
    }
    /**
     * 开始新的追踪会话
     * @param name 会话名称
     * @param metadata 元数据
     * @returns 追踪ID
     */
    startTrace(name, metadata = {}) {
        const traceId = (0, uuid_1.v4)();
        const session = {
            id: traceId,
            name,
            startTime: new Date(),
            status: 'active',
            events: [],
            metadata
        };
        this.sessions.set(traceId, session);
        this.events.set(traceId, []);
        this.logger.info(`开始追踪会话: ${name} (${traceId})`);
        this.emit('trace_start', session);
        return traceId;
    }
    /**
     * 结束追踪会话
     * @param traceId 追踪ID
     * @param status 结束状态
     */
    endTrace(traceId, status = 'completed') {
        const session = this.sessions.get(traceId);
        if (!session) {
            this.logger.warn(`追踪会话不存在: ${traceId}`);
            return;
        }
        session.endTime = new Date();
        session.status = status;
        this.logger.info(`结束追踪会话: ${session.name} (${traceId}), 状态: ${status}`);
        this.emit('trace_end', session);
        // 异步保存追踪数据
        this.saveTrace(traceId).catch(error => {
            this.logger.error(`保存追踪数据失败: ${traceId}`, error);
        });
    }
    /**
     * 记录追踪事件
     * @param traceId 追踪ID
     * @param eventType 事件类型
     * @param data 事件数据
     * @param duration 持续时间（毫秒）
     */
    recordEvent(traceId, eventType, data = {}, duration) {
        const session = this.sessions.get(traceId);
        if (!session) {
            this.logger.warn(`追踪会话不存在: ${traceId}`);
            return;
        }
        const event = {
            id: (0, uuid_1.v4)(),
            traceId,
            eventType,
            timestamp: new Date(),
            data,
            duration
        };
        session.events.push(event);
        this.events.get(traceId)?.push(event);
        this.logger.debug(`记录事件: ${eventType} (${traceId})`);
        this.emit('event_recorded', event);
    }
    /**
     * 记录智能体开始事件
     * @param traceId 追踪ID
     * @param agentName 智能体名称
     * @param input 输入内容
     */
    recordAgentStart(traceId, agentName, input) {
        this.recordEvent(traceId, 'agent_start', {
            agentName,
            input: input.substring(0, 200) // 限制输入长度
        });
    }
    /**
     * 记录智能体结束事件
     * @param traceId 追踪ID
     * @param agentName 智能体名称
     * @param output 输出内容
     * @param duration 执行时间
     */
    recordAgentEnd(traceId, agentName, output, duration) {
        this.recordEvent(traceId, 'agent_end', {
            agentName,
            output: output.substring(0, 200), // 限制输出长度
            duration
        }, duration);
    }
    /**
     * 记录工具调用事件
     * @param traceId 追踪ID
     * @param toolName 工具名称
     * @param args 工具参数
     * @param result 工具结果
     * @param duration 执行时间
     */
    recordToolCall(traceId, toolName, args, result, duration) {
        this.recordEvent(traceId, 'tool_call', {
            toolName,
            args: this.sanitizeData(args),
            result: result.substring(0, 200), // 限制结果长度
            duration
        }, duration);
    }
    /**
     * 记录错误事件
     * @param traceId 追踪ID
     * @param error 错误信息
     * @param context 错误上下文
     */
    recordError(traceId, error, context = {}) {
        this.recordEvent(traceId, 'error', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context
        });
    }
    /**
     * 记录任务记录器
     * @param traceId 追踪ID
     * @param recorder 任务记录器
     */
    recordTaskRecorder(traceId, recorder) {
        this.recordEvent(traceId, 'task_recorder', {
            taskId: recorder.id,
            input: recorder.input,
            output: recorder.output,
            status: recorder.status,
            messageCount: recorder.messages.length,
            toolCallCount: recorder.toolCalls.length,
            startTime: recorder.startTime,
            endTime: recorder.endTime,
            duration: recorder.endTime ?
                recorder.endTime.getTime() - recorder.startTime.getTime() : undefined
        });
    }
    /**
     * 获取追踪会话
     * @param traceId 追踪ID
     * @returns 追踪会话
     */
    getTrace(traceId) {
        return this.sessions.get(traceId);
    }
    /**
     * 获取追踪事件
     * @param traceId 追踪ID
     * @returns 事件列表
     */
    getTraceEvents(traceId) {
        return this.events.get(traceId) || [];
    }
    /**
     * 查询追踪数据
     * @param filter 查询过滤器
     * @returns 追踪会话列表
     */
    queryTraces(filter = {}) {
        let results = Array.from(this.sessions.values());
        if (filter.traceId) {
            results = results.filter(session => session.id === filter.traceId);
        }
        if (filter.agentName) {
            results = results.filter(session => session.events.some(event => event.data.agentName === filter.agentName));
        }
        if (filter.status) {
            results = results.filter(session => session.status === filter.status);
        }
        if (filter.startTime) {
            results = results.filter(session => session.startTime >= filter.startTime);
        }
        if (filter.endTime) {
            results = results.filter(session => !session.endTime || session.endTime <= filter.endTime);
        }
        if (filter.eventType) {
            results = results.filter(session => session.events.some(event => event.eventType === filter.eventType));
        }
        return results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }
    /**
     * 获取追踪统计信息
     * @returns 统计信息
     */
    getStats() {
        const sessions = Array.from(this.sessions.values());
        const totalTraces = sessions.length;
        const activeTraces = sessions.filter(s => s.status === 'active').length;
        const completedTraces = sessions.filter(s => s.status === 'completed').length;
        const failedTraces = sessions.filter(s => s.status === 'failed').length;
        const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);
        const eventTypeStats = {};
        sessions.forEach(session => {
            session.events.forEach(event => {
                eventTypeStats[event.eventType] = (eventTypeStats[event.eventType] || 0) + 1;
            });
        });
        const completedSessions = sessions.filter(s => s.endTime);
        const averageDuration = completedSessions.length > 0 ?
            completedSessions.reduce((sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()), 0) / completedSessions.length : 0;
        return {
            totalTraces,
            activeTraces,
            completedTraces,
            failedTraces,
            averageDuration,
            totalEvents,
            eventTypeStats
        };
    }
    /**
     * 保存追踪数据
     * @param traceId 追踪ID
     */
    async saveTrace(traceId) {
        try {
            const session = this.sessions.get(traceId);
            if (!session) {
                return;
            }
            await fs.mkdir(this.tracesDir, { recursive: true });
            const filename = `trace_${traceId}_${Date.now()}.json`;
            const filepath = path.join(this.tracesDir, filename);
            const data = {
                session,
                events: this.events.get(traceId) || [],
                savedAt: new Date().toISOString()
            };
            await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
            this.logger.debug(`追踪数据已保存: ${filepath}`);
        }
        catch (error) {
            this.logger.error(`保存追踪数据失败: ${traceId}`, error);
        }
    }
    /**
     * 清理敏感数据
     * @param data 原始数据
     * @returns 清理后的数据
     */
    sanitizeData(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            // 过滤敏感字段
            if (['password', 'token', 'key', 'secret'].some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = this.sanitizeData(value);
            }
        }
        return sanitized;
    }
    /**
     * 清理旧的追踪数据
     * @param maxAge 最大保存时间（毫秒）
     */
    async cleanupOldTraces(maxAge = 7 * 24 * 60 * 60 * 1000) {
        try {
            const cutoffTime = new Date(Date.now() - maxAge);
            const oldSessions = Array.from(this.sessions.values())
                .filter(session => session.startTime < cutoffTime);
            for (const session of oldSessions) {
                this.sessions.delete(session.id);
                this.events.delete(session.id);
            }
            this.logger.info(`清理了 ${oldSessions.length} 个旧追踪会话`);
        }
        catch (error) {
            this.logger.error('清理旧追踪数据失败:', error);
        }
    }
    /**
     * 导出追踪数据
     * @param traceId 追踪ID
     * @param format 导出格式
     * @returns 导出的数据
     */
    async exportTrace(traceId, format = 'json') {
        const session = this.sessions.get(traceId);
        if (!session) {
            throw new Error(`追踪会话不存在: ${traceId}`);
        }
        const events = this.events.get(traceId) || [];
        if (format === 'json') {
            return JSON.stringify({
                session,
                events,
                exportedAt: new Date().toISOString()
            }, null, 2);
        }
        else if (format === 'csv') {
            let csv = 'timestamp,eventType,data\n';
            events.forEach(event => {
                const dataStr = JSON.stringify(event.data).replace(/"/g, '""');
                csv += `${event.timestamp.toISOString()},"${event.eventType}","${dataStr}"\n`;
            });
            return csv;
        }
        throw new Error(`不支持的导出格式: ${format}`);
    }
}
exports.TraceManager = TraceManager;
