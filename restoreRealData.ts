import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./server/firebase";

async function restoreRealFirebaseData() {
  console.log("🔄 بدء استعادة البيانات الحقيقية من Firebase...");
  
  try {
    // فحص المجموعات المتاحة في Firebase
    const collections = ['patients', 'staff', 'expenses', 'payments', 'settings', 'users'];
    
    for (const collectionName of collections) {
      console.log(`\n📊 فحص مجموعة: ${collectionName}`);
      
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = [];
        
        querySnapshot.forEach((doc) => {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`✅ تم العثور على ${docs.length} سجل في ${collectionName}`);
        
        // عرض أول 3 سجلات كمثال
        if (docs.length > 0) {
          console.log("🔍 عينة من البيانات:");
          docs.slice(0, 3).forEach((item, index) => {
            console.log(`   ${index + 1}. ID: ${item.id}`);
            if (item.name) console.log(`      الاسم: ${item.name}`);
            if (item.admissionDate) console.log(`      تاريخ الدخول: ${item.admissionDate}`);
            if (item.amount) console.log(`      المبلغ: ${item.amount}`);
            if (item.role) console.log(`      الوظيفة: ${item.role}`);
            if (item.description) console.log(`      الوصف: ${item.description}`);
            console.log("      ---");
          });
        }
        
        // حفظ البيانات في ملف JSON للمراجعة
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync('firebase_backup')) {
          fs.mkdirSync('firebase_backup');
        }
        
        fs.writeFileSync(
          path.join('firebase_backup', `${collectionName}.json`), 
          JSON.stringify(docs, null, 2), 
          'utf8'
        );
        
        console.log(`💾 تم حفظ بيانات ${collectionName} في firebase_backup/${collectionName}.json`);
        
      } catch (error) {
        console.error(`❌ خطأ في قراءة ${collectionName}:`, error.message);
      }
    }
    
    // فحص البيانات الإحصائية
    console.log("\n📈 ملخص البيانات المستعادة:");
    
    const patientsSnapshot = await getDocs(collection(db, "patients"));
    const staffSnapshot = await getDocs(collection(db, "staff"));
    const paymentsSnapshot = await getDocs(collection(db, "payments"));
    const expensesSnapshot = await getDocs(collection(db, "expenses"));
    
    console.log(`👥 المرضى: ${patientsSnapshot.size} سجل`);
    console.log(`👨‍⚕️ الموظفون: ${staffSnapshot.size} سجل`);
    console.log(`💰 المدفوعات: ${paymentsSnapshot.size} سجل`);
    console.log(`💸 المصروفات: ${expensesSnapshot.size} سجل`);
    
    // تحليل بيانات المرضى
    console.log("\n🔍 تحليل بيانات المرضى:");
    const patients = [];
    patientsSnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    
    const activePatients = patients.filter(p => p.status === 'active');
    const dischargedPatients = patients.filter(p => p.status === 'discharged');
    
    console.log(`   النشطون: ${activePatients.length}`);
    console.log(`   المخرجون: ${dischargedPatients.length}`);
    
    // فحص صحة البيانات
    console.log("\n🔍 فحص صحة البيانات:");
    let dataIssues = 0;
    
    patients.forEach((patient, index) => {
      if (!patient.admissionDate || patient.admissionDate === '') {
        console.log(`⚠️  المريض ${patient.name || patient.id}: تاريخ دخول مفقود`);
        dataIssues++;
      }
      if (!patient.dailyCost || patient.dailyCost === 0) {
        console.log(`⚠️  المريض ${patient.name || patient.id}: تكلفة يومية مفقودة`);
        dataIssues++;
      }
    });
    
    if (dataIssues === 0) {
      console.log("✅ جميع البيانات سليمة!");
    } else {
      console.log(`⚠️  تم العثور على ${dataIssues} مشكلة في البيانات`);
    }
    
    console.log("\n🎉 تمت استعادة البيانات الحقيقية بنجاح!");
    console.log("📁 تم حفظ نسخة احتياطية في مجلد firebase_backup/");
    
  } catch (error) {
    console.error("❌ خطأ في استعادة البيانات:", error);
    throw error;
  }
}

// تشغيل النص البرمجي
restoreRealFirebaseData()
  .then(() => {
    console.log("\n✅ اكتملت عملية استعادة البيانات بنجاح");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ فشلت عملية استعادة البيانات:", error);
    process.exit(1);
  });