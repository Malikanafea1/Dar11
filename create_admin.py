"""
هذا السكريبت يقوم بإنشاء حساب مدير النظام الافتراضي
"""
from app import app, db
from models import User
from werkzeug.security import generate_password_hash
from load_env import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

def create_admin_user():
    # التحقق من وجود المستخدم
    admin = User.query.filter_by(username='atef').first()
    
    if admin:
        print("المستخدم 'atef' موجود بالفعل!")
        # إذا كان موجوداً، فقم بتحديث كلمة المرور
        admin.set_password('atef123atef')
        admin.role = 'admin'
        admin.can_manage_patients = True
        admin.can_manage_finances = True
        admin.can_manage_employees = True
        admin.can_manage_therapy = True
        admin.can_manage_users = True
        admin.can_view_reports = True
        db.session.commit()
        print("تم تحديث حساب المستخدم 'atef' بنجاح!")
    else:
        # إنشاء مستخدم جديد إذا لم يكن موجوداً
        new_admin = User()
        new_admin.username = 'atef'
        new_admin.email = 'atef@dar-el-hayah.com'
        new_admin.role = 'admin'
        new_admin.can_manage_patients = True
        new_admin.can_manage_finances = True
        new_admin.can_manage_employees = True 
        new_admin.can_manage_therapy = True
        new_admin.can_manage_users = True
        new_admin.can_view_reports = True
        new_admin.set_password('atef123atef')
        
        db.session.add(new_admin)
        db.session.commit()
        print("تم إنشاء حساب المستخدم 'atef' بنجاح!")

if __name__ == '__main__':
    with app.app_context():
        create_admin_user()