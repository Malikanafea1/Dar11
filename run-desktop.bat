@echo off
echo ===========================================
echo     نظام إدارة المستشفى - تطبيق سطح المكتب
echo ===========================================
echo.

echo جاري بدء الخادم...
start /B npm run dev

echo انتظار تشغيل الخادم...
timeout /t 5 /nobreak > nul

echo تشغيل واجهة التطبيق...
npx electron .

echo.
echo تم إغلاق التطبيق
pause