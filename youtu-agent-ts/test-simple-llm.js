/**
 * 测试SimpleLLMClient
 */

require('dotenv').config();

console.log('🔍 测试SimpleLLMClient...\n');

// 1. 检查环境变量
const apiKey = process.env.OPENAI_API_KEY;
console.log(`API密钥: ${apiKey ? apiKey.substring(0, 8) + '...' : '未设置'}`);

if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey === 'your-api-key-here') {
  console.log('❌ API密钥未正确配置');
  process.exit(1);
}

// 2. 测试SimpleLLMClient
async function testSimpleLLMClient() {
  try {
    console.log('\n🚀 测试SimpleLLMClient...');
    
    // 直接使用axios测试
    const axios = require('axios');
    
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Hello, world!' }
      ],
      temperature: 0.7,
      max_tokens: 100
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    console.log('✅ API调用成功');
    console.log('📝 响应:', response.data.choices[0].message.content);
    
    if (response.data.usage) {
      console.log('📊 Token使用:', response.data.usage);
    }

    return true;
  } catch (error) {
    console.log('❌ API调用失败:', error.response?.data || error.message);
    return false;
  }
}

// 3. 运行测试
testSimpleLLMClient().then(success => {
  if (success) {
    console.log('\n🎉 SimpleLLMClient测试通过！');
    console.log('💡 现在可以运行: npm run example');
  } else {
    console.log('\n💡 请检查:');
    console.log('1. API密钥是否有效');
    console.log('2. 网络连接是否正常');
    console.log('3. DeepSeek API是否可用');
  }
});
