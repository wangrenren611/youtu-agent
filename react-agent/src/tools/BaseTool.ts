/**
 * 基础工具类
 * 定义工具系统的基础接口和类
 */

/**
 * 工具配置接口
 */
export interface ToolConfig {
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具配置
   */
  config: Record<string, any>;
  
  /**
   * 激活的工具列表
   */
  activatedTools?: string[];
}

/**
 * 工具函数装饰器
 * 用于注册工具方法
 * @param name 工具名称（可选）
 */
export function registerTool(name?: string): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const methodName = typeof name === 'string' ? name : propertyKey.toString();
    
    // 标记该方法为工具
    (descriptor.value as any)._isTool = true;
    (descriptor.value as any)._toolName = methodName;
    
    return descriptor;
  };
}

/**
 * 基础工具集抽象类
 */
export abstract class BaseToolkit {
  /**
   * 工具配置
   */
  config: ToolConfig;
  
  /**
   * 工具映射表
   */
  private _toolsMap: Map<string, Function> | null = null;
  
  /**
   * 是否已构建
   */
  private _built: boolean = false;

  /**
   * 构造函数
   * @param config 工具配置
   */
  constructor(config: ToolConfig | Record<string, any> | null = null) {
    if (!this.isToolConfig(config)) {
      const configObj = config || {};
      config = {
        name: this.constructor.name,
        config: configObj
      };
    }
    
    this.config = config;
  }

  /**
   * 判断是否为工具配置
   * @param config 配置对象
   */
  private isToolConfig(config: any): config is ToolConfig {
    return config !== null && 
           typeof config === 'object' && 
           'name' in config && 
           'config' in config;
  }

  /**
   * 获取工具映射表
   */
  get toolsMap(): Map<string, Function> {
    if (this._toolsMap === null) {
      this._toolsMap = new Map();
      
      // 遍历类的所有方法，注册标记为工具的方法
      const prototype = Object.getPrototypeOf(this);
      const propertyNames = Object.getOwnPropertyNames(prototype);
      
      for (const name of propertyNames) {
        const method = (this as any)[name];
        
        if (typeof method === 'function' && method._isTool) {
          this._toolsMap.set(method._toolName, method.bind(this));
        }
      }
    }
    
    return this._toolsMap;
  }

  /**
   * 构建工具集
   */
  async build(): Promise<void> {
    if (this._built) {
      return;
    }
    
    this._built = true;
  }

  /**
   * 清理工具集
   */
  async cleanup(): Promise<void> {
    this._built = false;
  }

  /**
   * 获取工具映射函数
   */
  async getToolsMapFunc(): Promise<Map<string, Function>> {
    if (this.config.activatedTools && this.config.activatedTools.length > 0) {
      // 验证所有激活的工具都存在
      for (const toolName of this.config.activatedTools) {
        if (!this.toolsMap.has(toolName)) {
          throw new Error(`工具 ${toolName} 不存在！可用工具: ${Array.from(this.toolsMap.keys()).join(', ')}`);
        }
      }
      
      // 创建只包含激活工具的映射
      const activatedToolsMap = new Map<string, Function>();
      
      for (const toolName of this.config.activatedTools) {
        activatedToolsMap.set(toolName, this.toolsMap.get(toolName)!);
      }
      
      return activatedToolsMap;
    }
    
    return this.toolsMap;
  }

  /**
   * 获取工具描述
   */
  async getToolsDescription(): Promise<any[]> {
    const toolsMap = await this.getToolsMapFunc();
    const toolsDescription: any[] = [];
    
    for (const [name, func] of toolsMap.entries()) {
      toolsDescription.push({
        name,
        description: func._description || `执行 ${name} 工具`,
        parameters: func._parameters || {}
      });
    }
    
    return toolsDescription;
  }
}