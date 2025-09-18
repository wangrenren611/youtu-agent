/**
 * Simple Direct Example
 * 最简单的模拟搜索示例，完全绕过API调用
 */

// 模拟搜索函数
async function mockSearch(query: string) {
  console.log(`执行模拟搜索: ${query}`);
  return {
    success: true,
    results: [
      {
        title: "上海明天天气预报",
        snippet: "上海明天天气预报：晴转多云，气温22°C-28°C，微风，空气质量良好。",
        link: "https://example.com/shanghai-weather",
        source: "模拟搜索"
      }
    ]
  };
}

// 模拟LLM处理函数
async function mockLLMProcess(searchResults: any) {
  console.log('处理搜索结果...');
  return `我根据搜索结果为您提供上海明天的天气信息：

上海明天天气预报：晴转多云，气温22°C-28°C，微风，空气质量良好。`;
}

// 主函数
async function runSimpleDirectExample() {
  console.log('=== Simple Direct Example ===\n');

  try {
    // 1. 接收用户查询
    const userQuery = "What's the weather like in Shanghai tomorrow?";
    console.log(`用户查询: ${userQuery}`);

    // 2. 执行模拟搜索
    const searchResults = await mockSearch(userQuery);
    console.log('\n搜索结果:');
    console.log(JSON.stringify(searchResults, null, 2));

    // 3. 处理结果
    const response = await mockLLMProcess(searchResults);
    
    // 4. 返回结果
    console.log('\n任务结果:');
    console.log(response);
    
  } catch (error) {
    console.error('执行失败:', error);
  }
}

// 运行示例
runSimpleDirectExample().catch(console.error);