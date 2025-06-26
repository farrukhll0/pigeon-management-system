// Test script to verify Vercel setup
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Vercel Setup...\n');

// Check required directories
const requiredDirs = ['public', 'api', 'lib', 'models', 'middleware'];
const requiredFiles = [
  'public/index.html',
  'public/script.js',
  'api/auth.js',
  'api/pigeons.js',
  'api/upload.js',
  'lib/db.js',
  'models/User.js',
  'models/Pigeon.js',
  'middleware/auth.js',
  'middleware/upload.js',
  'vercel.json',
  'package.json'
];

console.log('📁 Checking directory structure...');
let allDirsExist = true;
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - Missing`);
    allDirsExist = false;
  }
});

console.log('\n📄 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'multer', 'cors'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - Missing from dependencies`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
  allFilesExist = false;
}

// Check vercel.json configuration
console.log('\n⚙️  Checking Vercel configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.builds && vercelConfig.routes) {
    console.log('✅ vercel.json configuration looks good');
  } else {
    console.log('❌ vercel.json missing required configuration');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Error reading vercel.json');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));
if (allDirsExist && allFilesExist) {
  console.log('🎉 All tests passed! Your Vercel setup is ready for deployment.');
  console.log('\n📝 Next steps:');
  console.log('1. Run: vercel login');
  console.log('2. Run: vercel');
  console.log('3. Set environment variables in Vercel dashboard');
  console.log('4. Deploy to production: vercel --prod');
} else {
  console.log('❌ Some tests failed. Please fix the issues above before deploying.');
}
console.log('='.repeat(50)); 