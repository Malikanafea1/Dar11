# تحويل التطبيق إلى ملف .exe - الدليل المبسط

## الخطوة 1: تحضير جهازك (5 دقائق)

### تثبيت Node.js
1. اذهب إلى https://nodejs.org
2. حمل النسخة LTS (الأحدث المستقرة)
3. ثبت البرنامج واتبع التعليمات
4. أعد تشغيل الكمبيوتر

### تحميل ملفات المشروع
1. حمل جميع ملفات المشروع من Replit
2. استخرجها في مجلد مثل `C:\hospital-app`

## الخطوة 2: إعداد المشروع (10 دقائق)

### فتح موجه الأوامر
1. اضغط `Windows + R`
2. اكتب `cmd` واضغط Enter
3. انتقل لمجلد المشروع:
```cmd
cd C:\hospital-app
```

### تثبيت المكتبات
```cmd
npm install
npm install electron electron-builder --save-dev
```

### إنشاء ملف الإعدادات
أنشئ ملف `.env` في مجلد المشروع وأضف:
```
VITE_FIREBASE_API_KEY=مفتاح-API-من-Firebase
VITE_FIREBASE_AUTH_DOMAIN=مشروعك.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=معرف-المشروع
VITE_FIREBASE_STORAGE_BUCKET=مشروعك.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=رقم-المرسل
VITE_FIREBASE_APP_ID=معرف-التطبيق
```

## الخطوة 3: تحديث package.json (5 دقائق)

أضف هذه الأسطر لملف `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "build-exe": "npm run build && electron-builder --win",
    "test-app": "npm run dev & timeout 10 & electron ."
  },
  "build": {
    "appId": "com.hospital.app",
    "productName": "نظام إدارة المستشفى",
    "directories": {
      "output": "dist-exe"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "electron/assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "نظام إدارة المستشفى"
    }
  }
}
```

## الخطوة 4: إنشاء ملف .exe (15 دقائق)

### اختبار التطبيق أولاً
```cmd
npm run test-app
```
تأكد من ظهور نافذة التطبيق وعمله بشكل صحيح.

### بناء ملف .exe
```cmd
npm run build-exe
```

انتظر انتهاء العملية (قد تستغرق 10-15 دقيقة).

## الخطوة 5: العثور على الملف النهائي

ستجد الملفات في مجلد `dist-exe`:
- **ملف التثبيت**: `نظام إدارة المستشفى Setup 1.0.0.exe`
- **مجلد التطبيق**: `win-unpacked/` (للتشغيل المباشر)

## الخطوة 6: توزيع التطبيق

### لتثبيت التطبيق:
- أعط المستخدمين ملف `نظام إدارة المستشفى Setup 1.0.0.exe`
- يقومون بتشغيله واتباع معالج التثبيت
- سيظهر اختصار على سطح المكتب

### للتشغيل المباشر:
- انسخ مجلد `win-unpacked` كاملاً
- شغل ملف `نظام إدارة المستشفى.exe` بداخله

## حل المشاكل السريع

### إذا فشل البناء:
```cmd
rmdir /s dist dist-exe
npm install
npm run build-exe
```

### إذا لم تظهر الأيقونة:
- ضع أي ملف .ico في `electron/assets/icon.ico`
- أو احذف السطر المتعلق بالأيقونة من package.json

### إذا ظهر خطأ عند التشغيل:
- تأكد من وجود ملف `.env` مع إعدادات Firebase الصحيحة
- تأكد من الاتصال بالإنترنت

## النتيجة النهائية

ستحصل على:
✅ ملف تثبيت `.exe` بحجم ~200 ميجابايت
✅ يعمل على أي جهاز Windows 10/11
✅ لا يحتاج تثبيت Node.js أو برامج إضافية
✅ ينشئ اختصارات تلقائياً
✅ يحتفظ بجميع ميزات التطبيق الأصلي

**ملاحظة مهمة**: التطبيق يحتاج اتصال إنترنت للعمل مع قاعدة البيانات Firebase.

## الأوامر السريعة للنسخ

```cmd
cd C:\hospital-app
npm install
npm install electron electron-builder --save-dev
npm run build-exe
```

بهذه الطريقة ستحصل على تطبيق Windows كامل جاهز للتوزيع!