// إدارة الإشعارات الصوتية
class SoundNotifications {
    constructor() {
        this.notificationSound = new Audio('/static/sounds/notification.mp3');
        this.warningSound = new Audio('/static/sounds/warning.mp3');
        this.successSound = new Audio('/static/sounds/success.mp3');
    }

    // تشغيل صوت إشعار عادي
    playNotification() {
        this.notificationSound.play();
    }

    // تشغيل صوت تحذير
    playWarning() {
        this.warningSound.play();
    }

    // تشغيل صوت نجاح
    playSuccess() {
        this.successSound.play();
    }
}

// إضافة الإشعارات للتحصيلات والرواتب
document.addEventListener('DOMContentLoaded', function() {
    const notifications = new SoundNotifications();
    
    // التحقق من وجود تنبيهات
    const alertElement = document.querySelector('.alert-warning, .alert-danger');
    if (alertElement) {
        // تأخير قصير قبل تشغيل الصوت
        setTimeout(() => {
            notifications.playWarning();
        }, 500);
    }
    
    // التحقق من وجود رسائل نجاح
    const successElement = document.querySelector('.alert-success');
    if (successElement) {
        // تأخير قصير قبل تشغيل الصوت
        setTimeout(() => {
            notifications.playSuccess();
        }, 500);
    }

    // التحقق من المصروفات العالية (يتم تنفيذه في صفحة المصروفات)
    checkHighExpenses();
    
    // التحقق من الرواتب المستحقة (يتم تنفيذه في لوحة التحكم)
    checkDueSalaries();
    
    // التحقق من التحصيلات المطلوبة (يتم تنفيذه في لوحة التحكم)
    checkRequiredCollections();
});

// التحقق من المصروفات العالية
function checkHighExpenses() {
    const highExpensesElement = document.getElementById('high-expenses-alert');
    if (highExpensesElement) {
        setTimeout(() => {
            const notifications = new SoundNotifications();
            notifications.playWarning();
        }, 1000);
    }
}

// التحقق من الرواتب المستحقة
function checkDueSalaries() {
    const dueSalariesElement = document.getElementById('due-salaries-alert');
    if (dueSalariesElement) {
        setTimeout(() => {
            const notifications = new SoundNotifications();
            notifications.playNotification();
        }, 1000);
    }
}

// التحقق من التحصيلات المطلوبة
function checkRequiredCollections() {
    const requiredCollectionsElement = document.getElementById('required-collections-alert');
    if (requiredCollectionsElement) {
        setTimeout(() => {
            const notifications = new SoundNotifications();
            notifications.playNotification();
        }, 1000);
    }
}