/**
 * 模型配置类
 * 定义与模型相关的配置项
 */

/**
 * 模型配置接口
 */
export interface ModelConfig {
  /**
   * API密钥
   */
  apiKey: string;
  
  /**
   * 组织ID
   */
  organization?: string;
  
  /**
   * 基础URL
   */
  baseURL?: string;
  
  /**
   * 模型名称
   */
  model: string;
  
  /**
   * 温度参数
   */
  temperature?: number;
  
  /**
   * 最大生成token数
   */
  maxTokens?: number;
  
  /**
   * 其他模型设置
   */
  modelSettings?: Record<string, any>;
}