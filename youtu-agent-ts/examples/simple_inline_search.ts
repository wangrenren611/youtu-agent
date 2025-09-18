/**
 * Simple Inline Search Example
 * 使用内联定义的搜索工具实现搜索功能
 */

// 模拟搜索函数
async function inlineSearch(query: string) {
  console.log(`执行搜索: ${query}`);
  return {
    success: true,
    results: [
      {
        title: "上海明天天气预报",
        snippet: "上海明天天气预报：晴转多云，气温22°C-28°C，微风，空气质量良好。",
        link: "https://example.com/shanghai-weather",
        source: "搜索引擎"
      }
    ]
  };
}

// 模拟处理搜索结果
function processSearchResults(results: any) {
  if (!results || !results.success) {
    return "搜索失败，无法获取结果。";
  }
  
  let response = "根据搜索结果：\n\n";
  
  for (const result of results.results) {
    response += `${result.snippet}\n\n`;
    response += `来源: ${result.source} - ${result.link}\n`;
  }
  
  return response;
}

async function runSimpleInlineSearchExample() {
  console.log('=== Simple Inline Search Example ===\n');

  try {
    // 1. 接收用户查询
    const userQuery = "What's the weather like in Shanghai tomorrow?";
    console.log(`用户查询: ${userQuery}`);

    // 2. 执行搜索
    console.log('\n执行搜索...');
    const searchResults = await inlineSearch(userQuery);
    console.log('\n搜索结果:');
    console.log(JSON.stringify(searchResults, null, 2));

    // 3. 处理结果
    const response = processSearchResults(searchResults);
    
    // 4. 返回结果
    console.log('\n任务结果:');
    console.log(response);
    
  } catch (error) {
    console.error('执行失败:', error);
  }
}

// 运行示例
runSimpleInlineSearchExample().catch(console.error);