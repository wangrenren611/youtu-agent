/**
 * 测试文件操作功能
 */

require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');

console.log('🔍 测试文件操作功能...\n');

async function testFileOperations() {
  try {
    // 1. 测试文件创建
    console.log('📝 测试文件创建...');
    const testContent = 'Hello World from file operation test!';
    const testFileName = 'test-file.txt';
    const testFilePath = path.join(process.cwd(), testFileName);
    
    await fs.writeFile(testFilePath, testContent, 'utf-8');
    console.log(`✅ 文件创建成功: ${testFilePath}`);
    
    // 2. 测试文件读取
    console.log('\n📖 测试文件读取...');
    const readContent = await fs.readFile(testFilePath, 'utf-8');
    console.log(`✅ 文件读取成功: ${readContent}`);
    
    // 3. 验证内容
    if (readContent === testContent) {
      console.log('✅ 文件内容验证成功');
    } else {
      console.log('❌ 文件内容验证失败');
    }
    
    // 4. 清理测试文件
    console.log('\n🧹 清理测试文件...');
    await fs.unlink(testFilePath);
    console.log('✅ 测试文件已删除');
    
    console.log('\n🎉 文件操作测试完成！');
    
  } catch (error) {
    console.log('❌ 文件操作测试失败:', error.message);
  }
}

testFileOperations();
