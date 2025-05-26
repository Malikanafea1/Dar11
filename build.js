#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🏗️  بناء المشروع للإنتاج...');

try {
  // بناء الواجهة الأمامية
  console.log('📦 بناء React App...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  
  console.log('✅ تم بناء المشروع بنجاح!');
  console.log('🚀 جاهز للنشر على Render');
  
} catch (error) {
  console.error('❌ خطأ في البناء:', error.message);
  process.exit(1);
}