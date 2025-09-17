/**
 * 测试修复后的glob功能
 */

const { createAgent } = require('./dist/agents/index.js');

async function testGlobFix() {
  console.log('🧪 测试修复后的glob功能...\n');
  
  try {
    // 创建简单代理
    const agent = await createAgent({
      type: 'simple',
      name: 'glob-test',
      config: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key'
      }
    });
    
    console.log('✅ 代理创建成功');
    
    // 测试1: 使用patterns参数
    console.log('\n📁 测试1: 使用patterns参数搜索TypeScript文件');
    try {
      const result1 = await agent.run('请使用file_glob工具搜索当前目录下的所有TypeScript文件，使用patterns参数：["**/*.ts", "**/*.tsx"]');
      console.log('✅ patterns参数测试成功');
      console.log('结果:', result1.output);
    } catch (error) {
      console.log('❌ patterns参数测试失败:', error.message);
    }
    
    // 测试2: 使用单个pattern参数
    console.log('\n📁 测试2: 使用单个pattern参数搜索JavaScript文件');
    try {
      const result2 = await agent.run('请使用file_glob工具搜索当前目录下的所有JavaScript文件，使用pattern参数："**/*.js"');
      console.log('✅ 单个pattern参数测试成功');
      console.log('结果:', result2.output);
    } catch (error) {
      console.log('❌ 单个pattern参数测试失败:', error.message);
    }
    
    console.log('\n🎉 glob功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testGlobFix();
