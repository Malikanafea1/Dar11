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

### 1. ربط المستودع

1. ادفع الكود إلى GitHub
2. اربط المستودع مع Render

### 2. إعداد متغيرات البيئة في Render

في لوحة تحكم Render، أضف:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID` 
- `VITE_FIREBASE_APP_ID`

### 3. النشر

Render سيقوم بالنشر تلقائياً باستخدام الإعدادات في `render.yaml`

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