# دليل تشغيل التطبيق كبرنامج سطح مكتب

## متطلبات التشغيل
- Node.js (الإصدار 18 أو أحدث)
- اتصال بالإنترنت (للوصول إلى قاعدة البيانات Firebase)
- نظام تشغيل Windows 10/11، macOS 10.14+، أو Linux Ubuntu 18.04+

## تحضير المشروع للتشغيل المحلي

### 1. تحميل المشروع
```bash
# استنساخ المشروع أو تحميل الملفات
git clone <repository-url>
cd hospital-management-system

# أو تحميل الملفات وفك الضغط
```

### 2. تثبيت المتطلبات
```bash
# تثبيت جميع الحزم المطلوبة
npm install

# تأكد من تثبيت Electron وأدوات البناء
npm install electron electron-builder concurrently wait-on --save-dev
```

### 3. إعداد متغيرات البيئة
أنشئ ملف `.env` في جذر المشروع وأضف إعدادات Firebase:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
DATABASE_URL=your-database-url
```

## طرق تشغيل التطبيق

### الطريقة الأولى: التشغيل السريع
```bash
node start-desktop.js
```

### الطريقة الثانية: التشغيل اليدوي
1. في نافذة طرفية أولى، شغل الخادم:
```bash
npm run dev
```

2. في نافذة طرفية ثانية، شغل واجهة التطبيق:
```bash
npx electron .
```

## ميزات التطبيق على سطح المكتب

### الواجهة
- نافذة تطبيق مخصصة بحجم 1400x900 بكسل
- حد أدنى للحجم 1200x700 بكسل
- إمكانية تكبير وتصغير النافذة
- وضع ملء الشاشة (F11)

### القوائم والاختصارات
- **إعادة تحميل**: Ctrl+R (أو Cmd+R على Mac)
- **فرض إعادة التحميل**: Ctrl+Shift+R
- **تكبير**: Ctrl+Plus
- **تصغير**: Ctrl+Minus  
- **الحجم الطبيعي**: Ctrl+0
- **ملء الشاشة**: F11
- **إغلاق**: Ctrl+Q (أو Cmd+Q على Mac)

### الأمان
- منع فتح مواقع خارجية داخل التطبيق
- فتح الروابط الخارجية في المتصفح الافتراضي
- حماية من تشغيل عدة نسخ من التطبيق

## إنشاء ملفات التوزيع

### لنظام Windows
```bash
npm run build
npx electron-builder --win
```

### لنظام macOS
```bash
npm run build  
npx electron-builder --mac
```

### لنظام Linux
```bash
npm run build
npx electron-builder --linux
```

## المتطلبات التقنية

### ملفات التطبيق
- `electron/main.js` - الملف الرئيسي لـ Electron
- `electron-builder.json` - إعدادات بناء التطبيق
- `start-desktop.js` - سكريبت التشغيل السريع

### الاعتمادات المطلوبة
- electron
- electron-builder  
- concurrently
- wait-on

## استكشاف الأخطاء

### إذا لم يبدأ الخادم
1. تأكد من تثبيت جميع الحزم: `npm install`
2. تحقق من توفر منفذ 5000
3. تأكد من إعدادات Firebase

### إذا لم تفتح نافذة التطبيق
1. تحقق من تثبيت Electron: `npm install electron`
2. جرب التشغيل اليدوي بدلاً من السكريبت
3. تحقق من سجلات الأخطاء في وحدة التحكم

### مشاكل الشبكة
- تأكد من الاتصال بالإنترنت
- تحقق من إعدادات Firebase
- تأكد من صحة متغيرات البيئة

## الاختلافات عن النسخة على الويب
- يعمل كتطبيق مستقل دون الحاجة لمتصفح
- قوائم وأشرطة أدوات مخصصة
- اختصارات لوحة مفاتيح إضافية
- حماية أمنية محسنة
- إمكانية التوزيع كملف تثبيت

## ملاحظات مهمة
- يحتاج التطبيق لاتصال بالإنترنت للعمل مع قاعدة البيانات
- جميع البيانات محفوظة في Firebase ويمكن الوصول إليها من أي جهاز
- التطبيق يحافظ على نفس الوظائف والميزات الموجودة في النسخة على الويب