// وظيفة تشغيل صوت النجاح عند إضافة تحصيل (مشابه لصوت فودافون كاش)
function playSuccessSound() {
    try {
        // إنشاء سياق الصوت
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
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
    } catch (error) {
        console.error('فشل تشغيل الصوت:', error);
    }
}

// صوت إشعار عند استلام رسالة جديدة
function playMessageReceiveSound() {
    try {
        // إنشاء سياق الصوت
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // إنشاء مذبذب للنغمة
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
        
        // إنشاء متحكم في الصوت
        const gainNode = audioContext.createGain();
        
        // توصيل المذبذب بمتحكم الصوت
        oscillator.connect(gainNode);
        
        // توصيل متحكم الصوت بمخرج الصوت
        gainNode.connect(audioContext.destination);
        
        // ضبط مستوى الصوت وتلاشيه
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        // بدء وإيقاف المذبذب
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.error('فشل تشغيل صوت استلام الرسالة:', error);
    }
}

// صوت إشعار عند إرسال رسالة
function playMessageSendSound() {
    try {
        // إنشاء سياق الصوت
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // إنشاء مذبذب للنغمة
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        
        // إنشاء متحكم في الصوت
        const gainNode = audioContext.createGain();
        
        // توصيل المذبذب بمتحكم الصوت
        oscillator.connect(gainNode);
        
        // توصيل متحكم الصوت بمخرج الصوت
        gainNode.connect(audioContext.destination);
        
        // ضبط مستوى الصوت وتلاشيه
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        // بدء وإيقاف المذبذب
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.error('فشل تشغيل صوت إرسال الرسالة:', error);
    }
}

// نشر حدث نجاح التحصيل ليمكن التقاطه في صفحات أخرى
function triggerCollectionSuccess() {
    // إنشاء حدث مخصص
    const event = new CustomEvent('collectionSuccess');
    document.dispatchEvent(event);
    
    // تشغيل الصوت مباشرة
    playSuccessSound();
}

// إطلاق حدث استلام رسالة
function triggerMessageReceived() {
    // إنشاء حدث مخصص
    const event = new CustomEvent('messageReceived');
    document.dispatchEvent(event);
    
    // تشغيل الصوت مباشرة
    playMessageReceiveSound();
}

// إطلاق حدث إرسال رسالة
function triggerMessageSent() {
    // إنشاء حدث مخصص
    const event = new CustomEvent('messageSent');
    document.dispatchEvent(event);
    
    // تشغيل الصوت مباشرة
    playMessageSendSound();
}

// الاستماع للأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود إشعار نجاح التحصيل
    const successAlert = document.querySelector('.alert-success');
    if (successAlert && successAlert.textContent.includes('تم إضافة المبلغ بنجاح')) {
        playSuccessSound();
    }
    
    // الاستماع للأحداث المخصصة
    document.addEventListener('collectionSuccess', function() {
        playSuccessSound();
    });
    
    document.addEventListener('messageReceived', function() {
        playMessageReceiveSound();
    });
    
    document.addEventListener('messageSent', function() {
        playMessageSendSound();
    });
});