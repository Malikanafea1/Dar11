# نظام إدارة المستشفى

نظام شامل لإدارة المستشفيات باللغة العربية يتضمن إدارة المرضى والموظفين والعمليات المالية.

## المميزات

- ✅ إدارة المرضى (إضافة، تعديل، خروج)
- ✅ إدارة الموظفين
- ✅ نظام مالي شامل (المدفوعات والمصروفات)
- ✅ لوحة تحكم تفاعلية
- ✅ تقارير مفصلة
- ✅ استيراد البيانات من Excel
- ✅ واجهة مستخدم عربية

## التقنيات المستخدمة

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **قاعدة البيانات**: Firebase Firestore
- **المصادقة**: Firebase Auth
- **UI Components**: Shadcn/ui + Radix UI

## متطلبات التشغيل

- Node.js 18+
- حساب Firebase

## إعداد المشروع

### 1. تهيئة Firebase

1. أنشئ مشروع جديد في [Firebase Console](https://console.firebase.google.com)
2. فعّل Firestore Database
3. فعّل Authentication (Email/Password)
4. احصل على إعدادات المشروع

### 2. متغيرات البيئة

أنشئ ملف `.env` في جذر المشروع:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 3. تشغيل المشروع محلياً

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم
npm run dev
```

## النشر على Render

### 1. رفع الكود إلى GitHub
```bash
git init
git add .
git commit -m "Hospital Management System - Ready for deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. إنشاء خدمة على Render

1. اذهب إلى [render.com](https://render.com) وأنشئ حساب
2. اضغط "New +" واختر "Web Service"
3. اربط حساب GitHub واختر مستودع المشروع
4. Render سيكتشف `render.yaml` تلقائياً

### 3. إضافة مفتاح Firebase API

في Render Dashboard، أضف متغير البيئة:
- `VITE_FIREBASE_API_KEY` = مفتاح API الخاص بمشروع Firebase

### 4. النشر

اضغط "Deploy" وانتظر اكتمال العملية!

## معلومات Firebase المُعدة:
- **Project ID**: dar1-23
- **Auth Domain**: dar1-23.firebaseapp.com
- **App ID**: 1:1015752030247:web:1fa3e73cfdaa129195f602
- **Messaging Sender ID**: 1015752030247

## البنية

```
├── client/          # تطبيق React
├── server/          # خادم Express
├── shared/          # الأنواع المشتركة
├── render.yaml      # إعدادات Render
└── package.json     # المكتبات والسكريبتات
```

## المساهمة

مرحب بالمساهمات! يرجى إنشاء Pull Request مع وصف التغييرات.

## الترخيص

MIT License