#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🏥 بدء تشغيل نظام إدارة المستشفى...');

// بدء الخادم أولاً
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// انتظار بدء الخادم ثم تشغيل Electron
setTimeout(() => {
  console.log('🖥️ تشغيل واجهة التطبيق...');
  
  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', (code) => {
    console.log('إغلاق التطبيق...');
    serverProcess.kill();
    process.exit(code);
  });

}, 3000);

// التعامل مع إنهاء العملية
process.on('SIGINT', () => {
  console.log('إيقاف الخادم...');
  serverProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  serverProcess.kill();
  process.exit();
});