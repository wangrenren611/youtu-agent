// 直接测试glob功能，不依赖编译
const { glob } = require('glob');
const path = require('path');
const { z } = require('zod');

// 复制FileGlobSchema
const FileGlobSchema = z.object({
  pattern: z.string().describe('glob模式，如 "**/*.txt" 或 "src/**/*.js"'),
  baseDir: z.string().optional().describe('基础目录，默认为当前工作目录'),
  options: z.object({
    ignore: z.array(z.string()).optional().describe('要忽略的模式'),
    dot: z.boolean().optional().default(false).describe('是否包含隐藏文件'),
    nodir: z.boolean().optional().default(false).describe('是否只返回文件，不返回目录'),
    absolute: z.boolean().optional().default(false).describe('是否返回绝对路径')
  }).optional().describe('glob选项')
});

async function testGlobHandler() {
  try {
    console.log('Testing glob handler...');
    
    // 模拟智能体传递的参数
    const args = {
      pattern: '**/*.ts',
      baseDir: process.cwd(),
      options: {
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        dot: false,
        nodir: false,
        absolute: false
      }
    };
    
    console.log('Input args:', JSON.stringify(args, null, 2));
    
    // 解析参数
    const parsed = FileGlobSchema.parse(args);
    const { pattern, baseDir = process.cwd(), options = {} } = parsed;
    
    console.log('Parsed:', { pattern, baseDir, options });
    
    // 安全检查基础目录
    const resolvedPath = path.resolve(baseDir);
    console.log('Resolved path:', resolvedPath);
    
    const globOptions = {
      cwd: baseDir,
      ignore: (options).ignore || ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      dot: (options).dot || false,
      nodir: (options).nodir || false,
      absolute: (options).absolute || false
    };
    
    console.log('Glob options:', globOptions);
    
    const files = await glob(pattern, globOptions);
    
    console.log('Found files:', files.length);
    console.log('First 5 files:', files.slice(0, 5));
    
    const result = {
      success: true,
      pattern,
      baseDir,
      files,
      count: files.length,
      options: globOptions
    };
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

testGlobHandler();
