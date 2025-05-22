"""
خدمات إدارة صفحة الفيسبوك
"""
import os
import requests
import facebook
from datetime import datetime
from models import db, FacebookMessage, FacebookPost, FacebookComment

class FacebookService:
    def __init__(self, page_id=None):
        """
        تهيئة خدمة الفيسبوك
        
        Args:
            page_id: معرف الصفحة في قاعدة البيانات، إذا كان None سيتم استخدام الصفحة الافتراضية
        """
        self.app_id = os.environ.get('FACEBOOK_APP_ID')
        self.app_secret = os.environ.get('FACEBOOK_APP_SECRET')
        
        if not all([self.app_id, self.app_secret]):
            raise ValueError("معرفات تطبيق الفيسبوك غير مكتملة")
            
        # الحصول على معلومات الصفحة
        from models import FacebookPage
        
        if page_id:
            # استخدام الصفحة المحددة
            self.page = FacebookPage.query.get(page_id)
        else:
            # استخدام الصفحة الافتراضية
            self.page = FacebookPage.query.filter_by(is_default=True).first()
            
            # إذا لم يتم العثور على صفحة افتراضية، استخدم أول صفحة متاحة
            if not self.page:
                self.page = FacebookPage.query.first()
                
        # إذا لم يكن هناك صفحات مسجلة، استخدم رمز الوصول من متغيرات البيئة (للتوافق مع الإصدارات السابقة)
        if not self.page:
            self.page_id = None
            self.page_name = "الصفحة الافتراضية"
            self.page_access_token = os.environ.get('FACEBOOK_PAGE_ACCESS_TOKEN')
            
            if not self.page_access_token:
                raise ValueError("لا يوجد صفحات مسجلة ولم يتم تعيين رمز الوصول في متغيرات البيئة")
        else:
            self.page_id = self.page.id
            self.page_name = self.page.page_name
            self.page_access_token = self.page.page_access_token
        
        self.graph = facebook.GraphAPI(access_token=self.page_access_token, version="3.1")
    
    def get_page_messages(self):
        """جلب الرسائل الواردة من صفحة الفيسبوك"""
        try:
            # جلب المحادثات
            conversations = self.graph.get_connections('me', 'conversations')
            
            messages = []
            for conversation in conversations['data']:
                # جلب الرسائل في كل محادثة
                conv_messages = self.graph.get_connections(conversation['id'], 'messages')
                
                for message in conv_messages['data']:
                    # التحقق من وجود الرسالة في قاعدة البيانات
                    existing_message = FacebookMessage.query.filter_by(
                        fb_message_id=message['id']
                    ).first()
                    
                    if not existing_message:
                        # إضافة الرسالة الجديدة
                        new_message = FacebookMessage(
                            fb_message_id=message['id'],
                            sender_name=message.get('from', {}).get('name', 'مجهول'),
                            sender_id=message.get('from', {}).get('id', ''),
                            message_text=message.get('message', ''),
                            received_at=datetime.strptime(message['created_time'], '%Y-%m-%dT%H:%M:%S%z')
                        )
                        db.session.add(new_message)
                        messages.append(new_message)
            
            db.session.commit()
            return messages
            
        except Exception as e:
            print(f"خطأ في جلب رسائل الفيسبوك: {str(e)}")
            return []
    
    def send_message_reply(self, recipient_id, message_text):
        """إرسال رد على رسالة فيسبوك"""
        try:
            response = self.graph.put_object(
                parent_object='me',
                connection_name='messages',
                recipient={'id': recipient_id},
                message={'text': message_text}
            )
            return response
        except Exception as e:
            print(f"خطأ في إرسال الرد: {str(e)}")
            return None
    
    def publish_post(self, message, image_url=None):
        """نشر منشور على صفحة الفيسبوك"""
        try:
            post_data = {'message': message}
            
            if image_url:
                post_data['link'] = image_url
            
            response = self.graph.put_object(
                parent_object='me',
                connection_name='feed',
                **post_data
            )
            
            return response
            
        except Exception as e:
            print(f"خطأ في نشر المنشور: {str(e)}")
            return None
    
    def get_post_comments(self, post_id):
        """جلب التعليقات على منشور معين"""
        try:
            comments = self.graph.get_connections(post_id, 'comments')
            
            new_comments = []
            for comment in comments['data']:
                # التحقق من وجود التعليق في قاعدة البيانات
                existing_comment = FacebookComment.query.filter_by(
                    fb_comment_id=comment['id']
                ).first()
                
                if not existing_comment:
                    # البحث عن المنشور في قاعدة البيانات
                    fb_post = FacebookPost.query.filter_by(fb_post_id=post_id).first()
                    
                    if fb_post:
                        new_comment = FacebookComment(
                            fb_comment_id=comment['id'],
                            post_id=fb_post.id,
                            commenter_name=comment.get('from', {}).get('name', 'مجهول'),
                            commenter_id=comment.get('from', {}).get('id', ''),
                            comment_text=comment.get('message', ''),
                            created_at=datetime.strptime(comment['created_time'], '%Y-%m-%dT%H:%M:%S%z')
                        )
                        db.session.add(new_comment)
                        new_comments.append(new_comment)
            
            db.session.commit()
            return new_comments
            
        except Exception as e:
            print(f"خطأ في جلب التعليقات: {str(e)}")
            return []
    
    def reply_to_comment(self, comment_id, reply_text):
        """الرد على تعليق"""
        try:
            response = self.graph.put_object(
                parent_object=comment_id,
                connection_name='comments',
                message=reply_text
            )
            return response
        except Exception as e:
            print(f"خطأ في الرد على التعليق: {str(e)}")
            return None
    
    def get_page_insights(self):
        """جلب إحصائيات الصفحة"""
        try:
            insights = self.graph.get_connections(
                'me',
                'insights',
                metric='page_fans,page_impressions,page_engaged_users'
            )
            return insights['data']
        except Exception as e:
            print(f"خطأ في جلب الإحصائيات: {str(e)}")
            return []