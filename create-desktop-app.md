# تحويل التطبيق إلى برنامج سطح مكتب - دليل شامل

## نظرة عامة
تم إعداد التطبيق ليعمل كبرنامج سطح مكتب باستخدام Electron. يتيح هذا تشغيل النظام كتطبيق مستقل على الكمبيوتر مع الاحتفاظ بجميع الميزات والاتصال بقاعدة البيانات عبر الإنترنت.

## الخطوات المطلوبة لتشغيل التطبيق محلياً

### المرحلة الأولى: تحضير البيئة المحلية

#### 1. تحميل الملفات
- نسخ جميع ملفات المشروع إلى جهازك المحلي
- فك الضغط إن أمكن
- فتح مجلد المشروع في محرر النصوص

#### 2. تثبيت Node.js
- تحميل Node.js من الموقع الرسمي: https://nodejs.org
- تثبيت الإصدار LTS (الموصى به)
- التأكد من التثبيت: `node --version && npm --version`

#### 3. تثبيت المتطلبات
```bash
cd path/to/project
npm install
```

### المرحلة الثانية: إعداد التطبيق

#### 1. إعداد متغيرات البيئة
إنشاء ملف `.env` في جذر المشروع:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Database (if using PostgreSQL)
DATABASE_URL=your-database-url
```

#### 2. تعديل package.json
إضافة السكريبتات التالية إلى ملف package.json:
```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5000 && electron .\"",
    "build-desktop": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --publish=never"
  }
}
```

### المرحلة الثالثة: تشغيل التطبيق

#### الطريقة الأولى: التشغيل المطور
```bash
# في نافذة طرفية أولى
npm run dev

# في نافذة طرفية ثانية (بعد تشغيل الخادم)
npm run electron
```

#### الطريقة الثانية: التشغيل الآلي
```bash
npm run electron-dev
```

#### الطريقة الثالثة: استخدام السكريبتات المحضرة
**لنظام Windows:**
```cmd
run-desktop.bat
```

**لأنظمة Linux/Mac:**
```bash
./run-desktop.sh
```

## إنشاء ملفات التوزيع

### إعداد الأيقونات
1. وضع ملفات الأيقونات في `electron/assets/`:
   - `icon.ico` (Windows)
   - `icon.icns` (macOS)
   - `icon.png` (Linux)

### بناء التطبيق للتوزيع
```bash
# بناء لجميع المنصات
npm run build-desktop

# بناء لمنصة محددة
npx electron-builder --win    # Windows
npx electron-builder --mac    # macOS
npx electron-builder --linux  # Linux
```

## الميزات المضافة للنسخة المكتبية

### واجهة المستخدم
- نافذة مخصصة بحجم 1400x900 بكسل
- إمكانية تغيير حجم النافذة (حد أدنى 1200x700)
- وضع ملء الشاشة
- قوائم مخصصة باللغة العربية

### اختصارات لوحة المفاتيح
- **Ctrl+R**: إعادة تحميل
- **Ctrl+Shift+R**: فرض إعادة التحميل
- **Ctrl++**: تكبير
- **Ctrl+-**: تصغير
- **Ctrl+0**: الحجم الطبيعي
- **F11**: ملء الشاشة
- **Ctrl+Q**: إغلاق التطبيق

### الأمان والحماية
- منع تشغيل عدة نسخ من التطبيق
- حماية من فتح مواقع خارجية
- فتح الروابط الخارجية في المتصفح الافتراضي

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### خطأ "electron command not found"
```bash
npm install electron --save-dev
npx electron --version
```

#### خطأ "Port 5000 is already in use"
- إيقاف أي عمليات تستخدم المنفذ 5000
- أو تغيير المنفذ في إعدادات الخادم

#### مشكلة في تحميل Firebase
- التأكد من صحة متغيرات البيئة
- التحقق من الاتصال بالإنترنت
- التأكد من صلاحيات Firebase

#### نافذة التطبيق لا تظهر
```bash
# تشغيل في وضع التطوير لرؤية الأخطاء
NODE_ENV=development npx electron .
```

## ملفات النظام المطلوبة

### الملفات الأساسية
- `electron/main.js` - الملف الرئيسي
- `electron-builder.json` - إعدادات البناء
- `run-desktop.bat` - سكريبت Windows
- `run-desktop.sh` - سكريبت Linux/Mac

### الملفات الاختيارية
- `electron/assets/` - أيقونات التطبيق
- `.env` - متغيرات البيئة المحلية

## مقارنة مع النسخة على الويب

| الميزة | النسخة على الويب | تطبيق سطح المكتب |
|--------|------------------|------------------|
| طريقة التشغيل | متصفح | تطبيق مستقل |
| الأداء | يعتمد على المتصفح | أداء محسن |
| الاختصارات | محدودة | اختصارات كاملة |
| القوائم | لا توجد | قوائم مخصصة |
| التوزيع | رابط ويب | ملف تثبيت |
| الأمان | أمان المتصفح | أمان محسن |

## نصائح للاستخدام الأمثل

1. **حفظ البيانات**: جميع البيانات محفوظة في Firebase ويمكن الوصول إليها من أي مكان
2. **النسخ الاحتياطي**: استخدم ميزة النسخ الاحتياطي المدمجة في التطبيق
3. **التحديثات**: يمكن تحديث التطبيق بإعادة بناء الملفات وتوزيعها
4. **الأداء**: لأفضل أداء، استخدم اتصال إنترنت مستقر
5. **الأمان**: حافظ على تحديث متغيرات البيئة وكلمات المرور

هذا النظام يوفر تجربة سطح مكتب كاملة مع الاحتفاظ بجميع مزايا التطبيق الأصلي والاتصال المباشر بقاعدة البيانات.