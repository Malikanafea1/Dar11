from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash

from app import db
from models import User
from forms import LoginForm, RegisterForm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        print(f"محاولة تسجيل دخول: {form.username.data}")
        user = User.query.filter_by(username=form.username.data).first()
        
        # تسجيل معلومات التشخيص
        if user:
            print(f"تم العثور على المستخدم: {user.username}, حالة النشاط: {user.is_active}")
        else:
            print(f"لم يتم العثور على المستخدم: {form.username.data}")
            # محاولة البحث عن أي مستخدم في النظام للتأكد من أن قاعدة البيانات تعمل
            all_users = User.query.all()
            print(f"عدد المستخدمين في النظام: {len(all_users)}")
            if all_users:
                print(f"أسماء المستخدمين المتاحة: {[u.username for u in all_users]}")
        
        # تحديد نوع الخطأ بشكل أكثر دقة
        if not user:
            flash('اسم المستخدم غير موجود في النظام', 'danger')
        elif not user.is_active:
            flash('هذا الحساب معطل، يرجى التواصل مع مسؤول النظام', 'danger')
        elif not user.check_password(form.password.data):
            print(f"كلمة المرور غير صحيحة للمستخدم: {user.username}")
            flash('كلمة المرور غير صحيحة', 'danger')
        else:
            print(f"تسجيل دخول ناجح للمستخدم: {user.username}")
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.dashboard'))
    
    return render_template('login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('تم تسجيل الخروج بنجاح', 'success')
    return redirect(url_for('main.index'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    # إذا لم يكن هناك مستخدمين في النظام، اسمح بإنشاء المستخدم الأول (سيكون مسؤول النظام)
    if User.query.count() == 0:
        is_first_user = True
    else:
        # إذا كان هناك مستخدمين بالفعل، تحقق إذا كان المستخدم الحالي مسجل دخول ومسؤول نظام
        if not current_user.is_authenticated or current_user.role != 'admin':
            flash('يجب أن تكون مسؤول نظام مسجل دخول لإنشاء حسابات جديدة', 'danger')
            return redirect(url_for('main.index'))
        is_first_user = False
    
    form = RegisterForm()
    if form.validate_on_submit():
        # إنشاء مستخدم جديد
        user = User()
        user.username = form.username.data
        user.email = form.email.data
        user.role = form.role.data
        user.can_manage_patients = form.can_manage_patients.data
        user.can_manage_finances = form.can_manage_finances.data
        user.can_manage_employees = form.can_manage_employees.data
        user.can_manage_therapy = form.can_manage_therapy.data
        user.can_manage_users = form.can_manage_users.data
        user.can_view_reports = form.can_view_reports.data
        user.set_password(form.password.data)
        
        # المستخدم الأول يكون دائماً مسؤول نظام مع كل الصلاحيات
        if is_first_user:
            user.role = 'admin'
            user.can_manage_patients = True
            user.can_manage_finances = True
            user.can_manage_employees = True
            user.can_manage_therapy = True
            user.can_manage_users = True
            user.can_view_reports = True
        
        # إذا كان المستخدم معالج، امنحه تلقائيًا صلاحية إدارة المجموعات العلاجية
        if user.role == 'therapist':
            user.can_manage_therapy = True
            user.can_view_reports = True
        
        db.session.add(user)
        db.session.commit()
        
        flash('تم إنشاء الحساب بنجاح', 'success')
        
        # إذا كان المستخدم الأول، توجيه إلى صفحة تسجيل الدخول
        if is_first_user:
            return redirect(url_for('auth.login'))
        # غير ذلك، العودة إلى صفحة إدارة المستخدمين
        return redirect(url_for('main.users'))
    
    return render_template('register.html', form=form)
