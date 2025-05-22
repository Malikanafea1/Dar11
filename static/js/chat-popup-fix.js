document.addEventListener('DOMContentLoaded', function() {
    console.log('تحميل نافذة الدردشة المنبثقة');
    
    // عناصر نافذة الدردشة المنبثقة
    const chatPopupToggle = document.getElementById('chatPopupToggle');
    const chatPopupWindow = document.getElementById('chatPopupWindow');
    const chatPopupClose = document.getElementById('chatPopupClose');
    const chatPopupContent = document.getElementById('chatPopupContent');
    
    // التحقق من وجود العناصر
    console.log('زر الدردشة:', chatPopupToggle);
    console.log('نافذة الدردشة:', chatPopupWindow);
    console.log('زر الإغلاق:', chatPopupClose);
    
    // إذا كانت العناصر موجودة
    if (chatPopupToggle && chatPopupWindow && chatPopupClose) {
        console.log('تم العثور على جميع العناصر اللازمة للدردشة المنبثقة');
        
        // إظهار وإخفاء نافذة الدردشة
        chatPopupToggle.addEventListener('click', function() {
            console.log('تم النقر على زر الدردشة');
            
            if (chatPopupWindow.style.display === 'none' || chatPopupWindow.style.display === '') {
                console.log('فتح نافذة الدردشة');
                chatPopupWindow.style.display = 'block';
                
                // تحميل محتوى الدردشة
                chatPopupContent.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">جاري تحميل الدردشة...</p></div>';
                
                // جلب محتوى الدردشة من الخادم
                fetchChatMessages();
            } else {
                console.log('إغلاق نافذة الدردشة');
                chatPopupWindow.style.display = 'none';
            }
        });
        
        // إغلاق نافذة الدردشة
        chatPopupClose.addEventListener('click', function() {
            console.log('تم النقر على زر الإغلاق');
            chatPopupWindow.style.display = 'none';
        });
        
        // وظيفة جلب رسائل الدردشة
        function fetchChatMessages() {
            console.log('جلب رسائل الدردشة');
            
            fetch('/chat-messages')
                .then(response => {
                    console.log('استجابة الخادم:', response);
                    return response.json();
                })
                .then(data => {
                    console.log('بيانات الدردشة:', data);
                    
                    // إنشاء محتوى الدردشة
                    if (data.messages && data.messages.length > 0) {
                        let html = '<div class="chat-messages p-3">';
                        
                        // إضافة الرسائل
                        data.messages.forEach(message => {
                            const isCurrentUser = message.sender_id === data.current_user_id;
                            html += `
                                <div class="message-container mb-2 ${isCurrentUser ? 'text-end' : ''}">
                                    <div class="message-bubble p-2 rounded ${isCurrentUser ? 'bg-primary text-white ms-auto' : 'bg-light'}" style="display: inline-block; max-width: 75%;">
                                        <div class="message-header mb-1">
                                            <small class="fw-bold">${message.sender_username}</small>
                                            <small class="text-muted ms-2">${message.timestamp}</small>
                                        </div>
                                        <div class="message-content">
                                            ${message.message}
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += '</div>';
                        
                        // إضافة نموذج إرسال الرسائل
                        html += `
                            <div class="chat-form p-2 border-top">
                                <form id="popupChatForm" method="POST" action="/send-chat-message">
                                    <input type="hidden" name="csrf_token" value="${data.csrf_token}">
                                    <div class="input-group">
                                        <input type="text" name="message" class="form-control" placeholder="اكتب رسالتك هنا..." required>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        `;
                        
                        // عرض المحتوى
                        chatPopupContent.innerHTML = html;
                        
                        // التمرير إلى أسفل نافذة الدردشة
                        const chatMessages = chatPopupContent.querySelector('.chat-messages');
                        if (chatMessages) {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                        
                        // إعداد نموذج إرسال الرسائل
                        setupChatForm();
                    } else {
                        chatPopupContent.innerHTML = '<div class="text-center py-5"><p>لا توجد رسائل</p></div>';
                    }
                })
                .catch(error => {
                    console.error('خطأ في جلب رسائل الدردشة:', error);
                    chatPopupContent.innerHTML = '<div class="text-center py-5"><p class="text-danger">حدث خطأ أثناء تحميل الدردشة</p></div>';
                });
        }
        
        // إعداد نموذج إرسال الرسائل
        function setupChatForm() {
            const popupChatForm = document.getElementById('popupChatForm');
            
            if (popupChatForm) {
                popupChatForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    console.log('إرسال رسالة جديدة');
                    
                    const formData = new FormData(popupChatForm);
                    
                    fetch('/send-chat-message', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('استجابة إرسال الرسالة:', data);
                        
                        if (data.success) {
                            // تشغيل صوت إرسال الرسالة
                            if (typeof triggerMessageSent === 'function') {
                                triggerMessageSent();
                            }
                            
                            // إعادة تحميل محتوى الدردشة
                            fetchChatMessages();
                            
                            // مسح حقل الرسالة
                            popupChatForm.reset();
                        } else {
                            alert('حدث خطأ أثناء إرسال الرسالة');
                        }
                    })
                    .catch(error => {
                        console.error('خطأ في إرسال الرسالة:', error);
                        alert('حدث خطأ أثناء إرسال الرسالة');
                    });
                });
            }
        }
    } else {
        console.error('لم يتم العثور على عناصر الدردشة المنبثقة');
    }
});