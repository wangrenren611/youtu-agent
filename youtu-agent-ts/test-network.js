/**
 * 网络连接测试
 */

require('dotenv').config();
const axios = require('axios');

console.log('🔍 网络连接测试...\n');

const apiKey = process.env.OPENAI_API_KEY;
console.log(`API密钥: ${apiKey ? apiKey.substring(0, 8) + '...' : '未设置'}`);

// 1. 测试基本网络连接
async function testBasicConnection() {
  try {
    console.log('\n🌐 测试基本网络连接...');
    const response = await axios.get('https://httpbin.org/get', { timeout: 10000 });
    console.log('✅ 基本网络连接正常');
    console.log(`   状态: ${response.status}`);
  } catch (error) {
    console.log('❌ 基本网络连接失败:', error.message);
  }
}

// 2. 测试DeepSeek API连接
async function testDeepSeekConnection() {
  try {
    console.log('\n🔗 测试DeepSeek API连接...');
    const response = await axios.get('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 15000
    });
    console.log('✅ DeepSeek API连接正常');
    console.log(`   状态: ${response.status}`);
    console.log(`   模型数量: ${response.data.data?.length || 0}`);
  } catch (error) {
    console.log('❌ DeepSeek API连接失败:');
    console.log(`   状态: ${error.response?.status}`);
    console.log(`   消息: ${error.response?.data?.error?.message || error.message}`);
  }
}

// 3. 测试简单的聊天请求
async function testSimpleChat() {
  try {
    console.log('\n💬 测试简单聊天请求...');
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      temperature: 0.7,
      max_tokens: 10
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 20000
    });
    
    console.log('✅ 简单聊天请求成功');
    console.log(`   响应: ${response.data.choices[0].message.content}`);
    
  } catch (error) {
    console.log('❌ 简单聊天请求失败:');
    console.log(`   状态: ${error.response?.status}`);
    console.log(`   消息: ${error.response?.data?.error?.message || error.message}`);
    console.log(`   错误类型: ${error.code || 'unknown'}`);
  }
}

// 4. 测试不同的超时设置
async function testWithDifferentTimeouts() {
  const timeouts = [5000, 10000, 15000, 30000];
  
  for (const timeout of timeouts) {
    try {
      console.log(`\n⏱️  测试超时设置: ${timeout}ms`);
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        temperature: 0.7,
        max_tokens: 5
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: timeout
      });
      
      console.log(`✅ 超时 ${timeout}ms 成功`);
      break;
      
    } catch (error) {
      console.log(`❌ 超时 ${timeout}ms 失败: ${error.message}`);
      if (error.code === 'ECONNABORTED') {
        console.log('   请求超时');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   域名解析失败');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   连接被拒绝');
      }
    }
  }
}

// 5. 运行所有测试
async function runAllTests() {
  await testBasicConnection();
  await testDeepSeekConnection();
  await testSimpleChat();
  await testWithDifferentTimeouts();
  
  console.log('\n🎉 网络测试完成！');
}

runAllTests().catch(error => {
  console.log('\n💥 测试失败:', error.message);
});
