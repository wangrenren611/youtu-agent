const { glob } = require('glob');
const path = require('path');

async function testGlob() {
  try {
    console.log('Testing glob...');
    
    const pattern = '**/*.ts';
    const baseDir = process.cwd();
    
    console.log('Pattern:', pattern);
    console.log('BaseDir:', baseDir);
    
    const globOptions = {
      cwd: baseDir,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      dot: false,
      nodir: false,
      absolute: false
    };
    
    console.log('Glob options:', globOptions);
    
    const files = await glob(pattern, globOptions);
    
    console.log('Found files:', files.length);
    console.log('First 5 files:', files.slice(0, 5));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGlob();
