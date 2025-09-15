/**
 * 基础环境类
 * 定义环境系统的基础接口和类
 */

/**
 * 环境配置接口
 */
export interface EnvConfig {
  /**
   * 环境名称
   */
  name: string;
  
  /**
   * 环境配置
   */
  config: Record<string, any>;
}

/**
 * 基础环境抽象类
 */
export abstract class BaseEnv {
  /**
   * 环境配置
   */
  config: EnvConfig;
  
  /**
   * 是否已构建
   */
  private _built: boolean = false;

  /**
   * 构造函数
   * @param config 环境配置
   */
  constructor(config: EnvConfig | Record<string, any> | null = null) {
    if (!this.isEnvConfig(config)) {
      const configObj = config || {};
      config = {
        name: this.constructor.name,
        config: configObj
      };
    }
    
    this.config = config;
  }

  /**
   * 判断是否为环境配置
   * @param config 配置对象
   */
  private isEnvConfig(config: any): config is EnvConfig {
    return config !== null && 
           typeof config === 'object' && 
           'name' in config && 
           'config' in config;
  }

  /**
   * 构建环境
   */
  async build(): Promise<void> {
    if (this._built) {
      return;
    }
    
    this._built = true;
  }

  /**
   * 清理环境
   */
  async cleanup(): Promise<void> {
    this._built = false;
  }

  /**
   * 重置环境
   */
  abstract async reset(): Promise<void>;

  /**
   * 执行动作
   * @param action 动作
   */
  abstract async step(action: any): Promise<any>;

  /**
   * 获取观察
   */
  abstract async observe(): Promise<any>;
}