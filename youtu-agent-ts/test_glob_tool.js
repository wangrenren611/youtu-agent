const { fileGlobHandler } = require('./dist/tools/FileEditTool.js');

async function testGlobTool() {
  try {
    console.log('Testing glob tool...');
    
    const args = {
      pattern: '**/*.ts',
      baseDir: process.cwd(),
      options: {
        ignore: ['node_modules/**', '.git/**'],
        dot: false,
        nodir: false,
        absolute: false
      }
    };
    
    console.log('Args:', JSON.stringify(args, null, 2));
    
    const result = await fileGlobHandler(args);
    
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGlobTool();
