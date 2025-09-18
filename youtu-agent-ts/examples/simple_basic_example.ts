/**
 * Simple Basic Example
 * 最基础的示例，不使用任何复杂功能
 */

console.log('=== Simple Basic Example ===\n');

// 模拟搜索结果
const searchResult = {
  query: "上海明天天气",
  results: [
    {
      title: "上海明天天气预报",
      snippet: "上海明天天气预报：晴转多云，气温22°C-28°C，微风，空气质量良好。",
      link: "https://example.com/shanghai-weather",
      source: "模拟搜索"
    }
  ]
};

// 模拟LLM响应
const llmResponse = `根据搜索结果，上海明天天气晴转多云，气温22°C-28°C，微风，空气质量良好。`;

// 执行模拟搜索
console.log('执行模拟搜索: What\'s the weather like in Shanghai tomorrow?');
console.log('搜索结果:');
console.log(JSON.stringify(searchResult, null, 2));

// 模拟LLM处理
console.log('\n模拟LLM处理搜索结果...');

// 输出最终结果
console.log('\n任务结果:');
console.log(llmResponse);

console.log('\n示例执行完成!');