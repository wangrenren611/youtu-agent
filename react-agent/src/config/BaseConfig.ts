/**
 * 基础配置类
 * 所有配置类的基类
 */

/**
 * 基础配置接口
 */
export interface BaseConfig {
  /**
   * 配置名称
   */
  name: string;
  
  /**
   * 配置内容
   */
  config: Record<string, any>;
}

/**
 * 基础配置类
 */
export class BaseConfigImpl implements BaseConfig {
  /**
   * 配置名称
   */
  name: string;
  
  /**
   * 配置内容
   */
  config: Record<string, any>;

  /**
   * 构造函数
   * @param name 配置名称
   * @param config 配置内容
   */
  constructor(name: string, config: Record<string, any> = {}) {
    this.name = name;
    this.config = config;
  }

  /**
   * 获取配置项
   * @param key 配置键
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T): T {
    return key in this.config ? this.config[key] : defaultValue;
  }

  /**
   * 设置配置项
   * @param key 配置键
   * @param value 配置值
   */
  set<T>(key: string, value: T): void {
    this.config[key] = value;
  }
}