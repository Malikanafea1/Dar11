#!/bin/bash

echo "==========================================="
echo "     نظام إدارة المستشفى - تطبيق سطح المكتب"
echo "==========================================="
echo

echo "جاري بدء الخادم..."
npm run dev &
SERVER_PID=$!

echo "انتظار تشغيل الخادم..."
sleep 5

echo "تشغيل واجهة التطبيق..."
NODE_ENV=development npx electron .

echo
echo "إيقاف الخادم..."
kill $SERVER_PID 2>/dev/null

echo "تم إغلاق التطبيق"