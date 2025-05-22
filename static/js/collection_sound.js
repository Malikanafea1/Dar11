// إنشاء سياق الصوت العام
let audioContext;
try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (error) {
    console.error('فشل إنشاء سياق الصوت:', error);
}

// وظيفة لتشغيل صوت نجاح التحصيل (مشابه لصوت فودافون كاش)
function playCollectionSuccessSound() {
    if (!audioContext) return;
    
    try {
        // إنشاء مذبذب للنغمة الأولى
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime); // تردد أعلى
        
        // إنشاء مذبذب للنغمة الثانية
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(1600, audioContext.currentTime); // تردد أعلى
        
        // إنشاء متحكم في الصوت لتلاشي الصوت
        const gainNode1 = audioContext.createGain();
        const gainNode2 = audioContext.createGain();
        
        // توصيل المذبذبات بمتحكمات الصوت
        oscillator1.connect(gainNode1);
        oscillator2.connect(gainNode2);
        
        // توصيل متحكمات الصوت بمخرج الصوت
        gainNode1.connect(audioContext.destination);
        gainNode2.connect(audioContext.destination);
        
        // ضبط مستوى الصوت الأولي
        gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.setValueAtTime(0.0, audioContext.currentTime);
        
        // جدولة تلاشي الصوت
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        // جدولة النغمة الثانية بعد الأولى
        gainNode2.gain.setValueAtTime(0.0, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        // بدء تشغيل المذبذبات
        oscillator1.start();
        oscillator2.start(audioContext.currentTime + 0.15);
        
        // إيقاف المذبذبات بعد وقت قصير
        oscillator1.stop(audioContext.currentTime + 0.3);
        oscillator2.stop(audioContext.currentTime + 0.4);
        
        console.log('تم تشغيل صوت نجاح التحصيل');
    } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
    }
}

// وظيفة لتشغيل صوت خروج المريض
function playPatientDischargeSound() {
    if (!audioContext) return;
    
    try {
        // إنشاء مذبذب للنغمة الأولى
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(600, audioContext.currentTime); // تردد منخفض
        
        // إنشاء مذبذب للنغمة الثانية
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(400, audioContext.currentTime); // تردد أقل
        
        // إنشاء متحكم في الصوت لتلاشي الصوت
        const gainNode1 = audioContext.createGain();
        const gainNode2 = audioContext.createGain();
        
        // توصيل المذبذبات بمتحكمات الصوت
        oscillator1.connect(gainNode1);
        oscillator2.connect(gainNode2);
        
        // توصيل متحكمات الصوت بمخرج الصوت
        gainNode1.connect(audioContext.destination);
        gainNode2.connect(audioContext.destination);
        
        // ضبط مستوى الصوت الأولي
        gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        // جدولة تلاشي الصوت
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // بدء تشغيل المذبذبات
        oscillator1.start();
        oscillator2.start();
        
        // إيقاف المذبذبات بعد وقت قصير
        oscillator1.stop(audioContext.currentTime + 0.5);
        oscillator2.stop(audioContext.currentTime + 0.5);
        
        console.log('تم تشغيل صوت خروج المريض');
    } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
    }
}

// وظيفة لتشغيل صوت دفع راتب
function playSalaryPaymentSound() {
    if (!audioContext) return;
    
    try {
        // إنشاء مذبذب للنغمة
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'triangle';
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator1.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.2);
        
        // إنشاء متحكم في الصوت
        const gainNode = audioContext.createGain();
        
        // توصيل المذبذب بمتحكم الصوت
        oscillator1.connect(gainNode);
        
        // توصيل متحكم الصوت بمخرج الصوت
        gainNode.connect(audioContext.destination);
        
        // ضبط مستوى الصوت وتلاشيه
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        // بدء تشغيل المذبذب
        oscillator1.start();
        
        // إيقاف المذبذب بعد وقت قصير
        oscillator1.stop(audioContext.currentTime + 0.4);
        
        console.log('تم تشغيل صوت دفع الراتب');
    } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
    }
}

// وظيفة لتشغيل صوت الخصم أو السلفة
function playDeductionOrLoanSound() {
    if (!audioContext) return;
    
    try {
        // إنشاء مذبذب للنغمة
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(700, audioContext.currentTime);
        oscillator1.frequency.linearRampToValueAtTime(500, audioContext.currentTime + 0.3);
        
        // إنشاء متحكم في الصوت
        const gainNode = audioContext.createGain();
        
        // توصيل المذبذب بمتحكم الصوت
        oscillator1.connect(gainNode);
        
        // توصيل متحكم الصوت بمخرج الصوت
        gainNode.connect(audioContext.destination);
        
        // ضبط مستوى الصوت وتلاشيه
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        // بدء تشغيل المذبذب
        oscillator1.start();
        
        // إيقاف المذبذب بعد وقت قصير
        oscillator1.stop(audioContext.currentTime + 0.3);
        
        console.log('تم تشغيل صوت الخصم أو السلفة');
    } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
    }
}

// وظيفة لتشغيل صوت إضافة مصروف
function playExpenseSound() {
    if (!audioContext) return;
    
    try {
        // إنشاء مذبذب للنغمة
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(900, audioContext.currentTime);
        oscillator1.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.3);
        
        // إنشاء متحكم في الصوت
        const gainNode = audioContext.createGain();
        
        // توصيل المذبذب بمتحكم الصوت
        oscillator1.connect(gainNode);
        
        // توصيل متحكم الصوت بمخرج الصوت
        gainNode.connect(audioContext.destination);
        
        // ضبط مستوى الصوت وتلاشيه
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        // بدء تشغيل المذبذب
        oscillator1.start();
        
        // إيقاف المذبذب بعد وقت قصير
        oscillator1.stop(audioContext.currentTime + 0.3);
        
        console.log('تم تشغيل صوت إضافة مصروف');
    } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
    }
}

// كود للتحقق من نوع الإشعارات وتشغيل الصوت المناسب عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود إشعار نجاح
    const successAlert = document.querySelector('.alert-success');
    if (successAlert) {
        // تشغيل الصوت المناسب حسب نوع العملية
        const alertText = successAlert.textContent;
        
        // تحصيل جديد
        if (alertText.includes('تم إضافة المبلغ بنجاح') || alertText.includes('نجاح التحصيل')) {
            playCollectionSuccessSound();
            
            // تمييز أحدث تحصيل (الصف الأول في الجدول)
            const firstRow = document.querySelector('table.table tbody tr:first-child');
            if (firstRow) {
                firstRow.classList.add('highlight-success');
            }
        }
        // تسجيل خروج مريض
        else if (alertText.includes('تم تسجيل خروج المريض') || alertText.includes('خروج المريض')) {
            playPatientDischargeSound();
        }
        // دفع راتب
        else if (alertText.includes('تم دفع الراتب') || alertText.includes('تسجيل الدفعة')) {
            playSalaryPaymentSound();
        }
        // خصم أو سلفة
        else if (alertText.includes('خصم') || alertText.includes('سلفة')) {
            playDeductionOrLoanSound();
        }
        // مصروف عام
        else if (alertText.includes('تم إضافة المصروف') || alertText.includes('تسجيل المصروف')) {
            playExpenseSound();
        }
        // أي إشعار نجاح آخر
        else {
            playCollectionSuccessSound(); // استخدام صوت التحصيل كصوت افتراضي للنجاح
        }
    }
});