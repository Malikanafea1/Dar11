document.addEventListener('DOMContentLoaded', function() {
    // عناصر نافذة الدردشة المنبثقة
    const chatPopupToggle = document.getElementById('chatPopupToggle');
    const chatPopupWindow = document.getElementById('chatPopupWindow');
    const chatPopupClose = document.getElementById('chatPopupClose');
    const chatPopupContent = document.getElementById('chatPopupContent');
    
    // متغيرات لتتبع الرسائل
    let lastMessageId = 0;
    let checkMessagesInterval = null;
    
    // إذا كانت العناصر موجودة
    if (chatPopupToggle && chatPopupWindow && chatPopupClose) {
        // إظهار وإخفاء نافذة الدردشة
        chatPopupToggle.addEventListener('click', function() {
            if (chatPopupWindow.style.display === 'none' || chatPopupWindow.style.display === '') {
                chatPopupWindow.style.display = 'block';
                
                // تحميل محتوى الدردشة إذا لم يتم تحميله بالفعل
                loadChatContent();
                
                // بدء مراقبة الرسائل الجديدة
                startCheckingNewMessages();
            } else {
                chatPopupWindow.style.display = 'none';
                
                // إيقاف مراقبة الرسائل الجديدة عند إغلاق النافذة
                stopCheckingNewMessages();
            }
        });
        
        // إغلاق نافذة الدردشة
        chatPopupClose.addEventListener('click', function() {
            chatPopupWindow.style.display = 'none';
            
            // إيقاف مراقبة الرسائل الجديدة عند إغلاق النافذة
            stopCheckingNewMessages();
        });
        
        // بدء التحقق من الرسائل الجديدة بشكل دوري
        function startCheckingNewMessages() {
            // إيقاف أي فترة زمنية سابقة
            stopCheckingNewMessages();
            
            // بدء فترة زمنية جديدة للتحقق من الرسائل كل 10 ثوانٍ
            checkMessagesInterval = setInterval(checkForNewMessages, 10000);
        }
        
        // إيقاف التحقق من الرسائل الجديدة
        function stopCheckingNewMessages() {
            if (checkMessagesInterval) {
                clearInterval(checkMessagesInterval);
                checkMessagesInterval = null;
            }
        }
        
        // التحقق من وجود رسائل جديدة
        function checkForNewMessages() {
            fetch('/chat-messages')
                .then(response => response.json())
                .then(data => {
                    if (data.messages && data.messages.length > 0) {
                        const latestMessage = data.messages[data.messages.length - 1];
                        
                        // إذا كانت هناك رسالة جديدة وليست من المستخدم الحالي
                        if (latestMessage.id > lastMessageId && latestMessage.sender_id !== data.current_user_id) {
                            // تحديث آخر معرف للرسالة
                            lastMessageId = latestMessage.id;
                            
                            // تشغيل صوت استلام الرسالة
                            if (typeof triggerMessageReceived === 'function') {
                                triggerMessageReceived();
                            }
                            
                            // تحديث محتوى الدردشة
                            loadChatContent();
                        } else if (latestMessage.id > lastMessageId) {
                            // تحديث آخر معرف للرسالة حتى لو كانت من المستخدم الحالي
                            lastMessageId = latestMessage.id;
                        }
                    }
                })
                .catch(error => {
                    console.error('خطأ عند التحقق من الرسائل الجديدة:', error);
                });
        }
        
        // دالة تحميل محتوى الدردشة
        function loadChatContent() {
            // إظهار مؤشر التحميل
            chatPopupContent.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">جاري تحميل الدردشة...</p></div>';
            
            // جلب محتوى الدردشة من الخادم باستخدام AJAX
            fetch('/chat-messages')
                .then(response => response.json())
                .then(data => {
                    // إنشاء محتوى الدردشة
                    if (data.messages && data.messages.length > 0) {
                        let html = '<div class="chat-messages p-3">';
                        
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
                        const popupChatForm = document.getElementById('popupChatForm');
                        if (popupChatForm) {
                            popupChatForm.addEventListener('submit', function(e) {
                                e.preventDefault();
                                
                                const formData = new FormData(popupChatForm);
                                
                                fetch('/send-chat-message', {
                                    method: 'POST',
                                    body: formData
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        // تشغيل صوت إرسال الرسالة
                                        if (typeof triggerMessageSent === 'function') {
                                            triggerMessageSent();
                                        }
                                        
                                        // إعادة تحميل محتوى الدردشة
                                        loadChatContent();
                                        // مسح حقل الرسالة
                                        popupChatForm.reset();
                                    } else {
                                        alert('حدث خطأ أثناء إرسال الرسالة');
                                    }
                                })
                                .catch(error => {
                                    console.error('خطأ:', error);
                                    alert('حدث خطأ أثناء إرسال الرسالة');
                                });
                            });
                        }
                    } else {
                        chatPopupContent.innerHTML = '<div class="text-center py-5"><p>لا توجد رسائل</p></div>';
                    }
                })
                .catch(error => {
                    console.error('خطأ:', error);
                    chatPopupContent.innerHTML = '<div class="text-center py-5"><p class="text-danger">حدث خطأ أثناء تحميل الدردشة</p></div>';
                });
        }
    }
});