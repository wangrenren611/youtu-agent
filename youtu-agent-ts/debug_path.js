const path = require('path');

// 复制ALLOWED_DIRECTORIES定义
const ALLOWED_DIRECTORIES = [
  process.cwd(), // 当前工作目录
  path.join(process.cwd(), 'data'), // 数据目录
  path.join(process.cwd(), 'temp'), // 临时目录
  path.join(process.cwd(), 'logs'), // 日志目录
  '/tmp', // 系统临时目录
  path.join(process.env['HOME'] || '', 'Downloads'), // 用户下载目录
];

console.log('Current working directory:', process.cwd());
console.log('ALLOWED_DIRECTORIES:', ALLOWED_DIRECTORIES);

const testPath = '/Users/wrr/work/youtu-agent/youtu-agent-ts';
const resolvedPath = path.resolve(testPath);
const cwd = process.cwd();

console.log('Test path:', testPath);
console.log('Resolved path:', resolvedPath);
console.log('CWD:', cwd);
console.log('Resolved path starts with CWD:', resolvedPath.startsWith(cwd));

// 检查每个允许的目录
for (const allowedDir of ALLOWED_DIRECTORIES) {
  console.log(`Resolved path starts with ${allowedDir}:`, resolvedPath.startsWith(allowedDir));
}
