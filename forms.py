from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, FloatField, DateField
from wtforms import TextAreaField, SelectField, BooleanField, HiddenField, IntegerField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional, ValidationError
from datetime import date
from models import User, Patient, Employee

class LoginForm(FlaskForm):
    username = StringField('اسم المستخدم', validators=[DataRequired('هذا الحقل مطلوب')])
    password = PasswordField('كلمة المرور', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('تسجيل الدخول')

class RegisterForm(FlaskForm):
    username = StringField('اسم المستخدم', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=3, max=64)])
    email = StringField('البريد الإلكتروني', validators=[DataRequired('هذا الحقل مطلوب'), Email('بريد إلكتروني غير صالح')])
    password = PasswordField('كلمة المرور', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=8)])
    confirm_password = PasswordField('تأكيد كلمة المرور', validators=[DataRequired('هذا الحقل مطلوب'), EqualTo('password', 'كلمات المرور غير متطابقة')])
    role = SelectField('الدور', choices=[
        ('admin', 'مدير النظام'), 
        ('manager', 'مدير عام'),
        ('therapist', 'معالج'),
        ('accountant', 'محاسب'),
        ('employee', 'موظف')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    
    # Permissions checkboxes
    can_manage_patients = BooleanField('إدارة المرضى')
    can_manage_finances = BooleanField('إدارة المالية')
    can_manage_employees = BooleanField('إدارة الموظفين')
    can_manage_therapy = BooleanField('إدارة المجموعات العلاجية')
    can_manage_users = BooleanField('إدارة المستخدمين')
    can_view_reports = BooleanField('عرض التقارير')
    
    submit = SubmitField('تسجيل')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('اسم المستخدم موجود بالفعل')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('البريد الإلكتروني مستخدم بالفعل')
            
class EditUserForm(FlaskForm):
    username = StringField('اسم المستخدم', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=3, max=64)])
    email = StringField('البريد الإلكتروني', validators=[DataRequired('هذا الحقل مطلوب'), Email('بريد إلكتروني غير صالح')])
    role = SelectField('الدور', choices=[
        ('admin', 'مدير النظام'), 
        ('manager', 'مدير عام'),
        ('therapist', 'معالج'),
        ('accountant', 'محاسب'),
        ('employee', 'موظف')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    
    # Permissions checkboxes
    can_manage_patients = BooleanField('إدارة المرضى')
    can_manage_finances = BooleanField('إدارة المالية')
    can_manage_employees = BooleanField('إدارة الموظفين')
    can_manage_therapy = BooleanField('إدارة المجموعات العلاجية')
    can_manage_users = BooleanField('إدارة المستخدمين')
    can_view_reports = BooleanField('عرض التقارير')
    
    # Option to allow changing password
    change_password = BooleanField('تغيير كلمة المرور')
    password = PasswordField('كلمة المرور الجديدة', validators=[Optional(), Length(min=8)])
    confirm_password = PasswordField('تأكيد كلمة المرور الجديدة', validators=[Optional(), EqualTo('password', 'كلمات المرور غير متطابقة')])
    
    submit = SubmitField('حفظ التغييرات')
    
    def __init__(self, original_username, original_email, *args, **kwargs):
        super(EditUserForm, self).__init__(*args, **kwargs)
        self.original_username = original_username
        self.original_email = original_email
        
    def validate_username(self, username):
        if username.data != self.original_username:
            user = User.query.filter_by(username=username.data).first()
            if user:
                raise ValidationError('اسم المستخدم موجود بالفعل')
                
    def validate_email(self, email):
        if email.data != self.original_email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('البريد الإلكتروني مستخدم بالفعل')
                
    def validate_password(self, password):
        if self.change_password.data and not password.data:
            raise ValidationError('يجب إدخال كلمة مرور جديدة')

class PatientForm(FlaskForm):
    name = StringField('الاسم', validators=[DataRequired('هذا الحقل مطلوب')])
    national_id = StringField('الرقم القومي', validators=[Optional()])
    phone = StringField('رقم الهاتف', validators=[Optional()])
    address = StringField('العنوان', validators=[Optional()])
    admission_date = DateField('تاريخ الدخول', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    daily_rate = FloatField('التكلفة اليومية (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    notes = TextAreaField('ملاحظات', validators=[Optional()])
    submit = SubmitField('حفظ')

class PatientExpenseForm(FlaskForm):
    patient_id = HiddenField('رقم المريض', validators=[DataRequired('هذا الحقل مطلوب')])
    expense_type = SelectField('نوع المصروف', choices=[
        ('cigarettes', 'سجائر'),
        ('medical_tests', 'فحوصات طبية'),
        ('medications', 'أدوية'),
        ('personal_expenses', 'مصاريف شخصية'),
        ('haircut', 'حلاقة'),
        ('buffet', 'بوفيه'),
        ('laundry', 'غسيل ملابس'),
        ('other', 'أخرى')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    description = StringField('وصف', validators=[Optional()])
    date = DateField('التاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('إضافة مصروف')

class EditPatientExpenseForm(FlaskForm):
    expense_type = SelectField('نوع المصروف', choices=[
        ('cigarettes', 'سجائر'),
        ('medical_tests', 'فحوصات طبية'),
        ('medications', 'أدوية'),
        ('personal_expenses', 'مصاريف شخصية'),
        ('haircut', 'حلاقة'),
        ('buffet', 'بوفيه'),
        ('laundry', 'غسيل ملابس'),
        ('other', 'أخرى')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    description = StringField('وصف', validators=[Optional()])
    date = DateField('التاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('حفظ التغييرات')

class CollectionForm(FlaskForm):
    patient_id = SelectField('المريض', coerce=int, validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    date = DateField('تاريخ التحصيل', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    notes = StringField('ملاحظات', validators=[Optional()])
    submit = SubmitField('تسجيل المبلغ')

    def __init__(self, *args, **kwargs):
        super(CollectionForm, self).__init__(*args, **kwargs)
        self.patient_id.choices = [(p.id, p.name) for p in Patient.query.filter_by(is_active=True).all()]
        
class EditCollectionForm(FlaskForm):
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    date = DateField('تاريخ التحصيل', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    notes = StringField('ملاحظات', validators=[Optional()])
    submit = SubmitField('حفظ التغييرات')

class EmployeeForm(FlaskForm):
    name = StringField('الاسم', validators=[DataRequired('هذا الحقل مطلوب')])
    role = SelectField('الوظيفة', choices=[
        ('general_manager', 'مدير عام'),
        ('shift_manager_halfway', 'مدير نوبة - هاف واي'),
        ('shift_manager_detox', 'مدير نوبة - ديتوكس'),
        ('supervisor_halfway', 'مشرف - هاف واي'),
        ('supervisor_detox', 'مشرف - ديتوكس'),
        ('worker', 'عامل'),
        ('chef', 'طباخ'),
        ('doctor', 'طبيب'),
        ('therapist', 'معالج'),
        ('case_referral', 'مسؤول تحويل الحالات')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    national_id = StringField('الرقم القومي', validators=[Optional()])
    phone = StringField('رقم الهاتف', validators=[Optional()])
    address = StringField('العنوان', validators=[Optional()])
    hire_date = DateField('تاريخ التعيين', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    monthly_salary = FloatField('الراتب الشهري (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    salary_view_password = StringField('كلمة مرور لعرض الراتب (للمدراء العامين فقط)', validators=[Optional()])
    notes = TextAreaField('ملاحظات', validators=[Optional()])
    submit = SubmitField('حفظ')
    
    def __init__(self, *args, **kwargs):
        super(EmployeeForm, self).__init__(*args, **kwargs)
        # سيتم عرض حقل كلمة المرور لعرض الراتب إذا كان الموظف مدير عام
        # سيتم التحقق من ذلك عن طريق JavaScript في الواجهة

class SalaryPaymentForm(FlaskForm):
    employee_id = SelectField('الموظف', coerce=int, validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    payment_type = SelectField('نوع الدفعة', choices=[
        ('salary', 'راتب'),
        ('bonus', 'مكافأة'),
        ('loan', 'سلفة'),
        ('deduction', 'خصم'),
        ('bwanas', 'بوانص')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    date = DateField('التاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    notes = StringField('ملاحظات', validators=[Optional()])
    submit = SubmitField('تسجيل الدفعة')

    def __init__(self, *args, **kwargs):
        super(SalaryPaymentForm, self).__init__(*args, **kwargs)
        self.employee_id.choices = [(e.id, e.name) for e in Employee.query.filter_by(is_active=True).all()]

class TherapyGroupForm(FlaskForm):
    name = StringField('اسم المجموعة', validators=[DataRequired('هذا الحقل مطلوب')])
    therapist_id = SelectField('المعالج المسؤول', coerce=int, validators=[DataRequired('هذا الحقل مطلوب')])
    description = TextAreaField('وصف المجموعة', validators=[Optional()])
    schedule = StringField('مواعيد الجلسات', validators=[Optional()])
    submit = SubmitField('حفظ')

    def __init__(self, *args, **kwargs):
        super(TherapyGroupForm, self).__init__(*args, **kwargs)
        # Only show therapists as choices
        self.therapist_id.choices = [(e.id, e.name) for e in 
                                    Employee.query.filter_by(role='therapist', is_active=True).all()]

class TherapyGroupMemberForm(FlaskForm):
    group_id = HiddenField('رقم المجموعة', validators=[DataRequired('هذا الحقل مطلوب')])
    patient_id = SelectField('المريض', coerce=int, validators=[DataRequired('هذا الحقل مطلوب')])
    treatment_stage = StringField('مرحلة العلاج', validators=[Optional()])
    notes = TextAreaField('ملاحظات', validators=[Optional()])
    submit = SubmitField('إضافة المريض للمجموعة')

    def __init__(self, *args, **kwargs):
        super(TherapyGroupMemberForm, self).__init__(*args, **kwargs)
        self.patient_id.choices = [(p.id, p.name) for p in Patient.query.filter_by(is_active=True).all()]

class TherapyReportForm(FlaskForm):
    group_id = HiddenField('رقم المجموعة', validators=[DataRequired('هذا الحقل مطلوب')])
    report_type = SelectField('نوع التقرير', choices=[
        ('daily', 'تقرير يومي'),
        ('weekly', 'تقرير أسبوعي')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    content = TextAreaField('محتوى التقرير', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('حفظ التقرير')

    def validate_content(self, content):
        if len(content.data) < 10:
            raise ValidationError('محتوى التقرير قصير جدًا، برجاء كتابة تقرير أكثر تفصيلًا')

class ExpenseForm(FlaskForm):
    category = SelectField('القسم', choices=[
        ('kitchen', 'مطبخ'),
        ('buffet', 'بوفيه'),
        ('rent', 'إيجار'),
        ('maintenance', 'صيانة'),
        ('medications', 'أدوية'),
        ('electricity', 'كهرباء'),
        ('gas', 'غاز'),
        ('water', 'مياه'),
        ('transport', 'مواصلات'),
        ('bonuses', 'مكافآت'),
        ('salaries', 'رواتب'),
        ('miscellaneous', 'متنوعات'),
        ('hospitality', 'ضيافة'),
        ('entertainment', 'يوم ترفيهي')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    description = StringField('الوصف', validators=[Optional()])
    date = DateField('التاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('تسجيل المصروف')
    
class EditExpenseForm(FlaskForm):
    category = SelectField('القسم', choices=[
        ('kitchen', 'مطبخ'),
        ('buffet', 'بوفيه'),
        ('rent', 'إيجار'),
        ('maintenance', 'صيانة'),
        ('medications', 'أدوية'),
        ('electricity', 'كهرباء'),
        ('gas', 'غاز'),
        ('water', 'مياه'),
        ('transport', 'مواصلات'),
        ('bonuses', 'مكافآت'),
        ('salaries', 'رواتب'),
        ('miscellaneous', 'متنوعات'),
        ('hospitality', 'ضيافة'),
        ('entertainment', 'يوم ترفيهي')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    description = StringField('الوصف', validators=[Optional()])
    date = DateField('التاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('حفظ التغييرات')

class SearchDateRangeForm(FlaskForm):
    start_date = DateField('من تاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    end_date = DateField('إلى تاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('عرض التقرير')

    def validate_end_date(self, end_date):
        if self.start_date.data and end_date.data:
            if end_date.data < self.start_date.data:
                raise ValidationError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
                
class DashboardNoteForm(FlaskForm):
    title = StringField('العنوان', validators=[DataRequired('هذا الحقل مطلوب'), Length(max=100)])
    content = TextAreaField('المحتوى', validators=[Optional()])
    is_task = BooleanField('هل هي مهمة؟')
    due_date = DateField('تاريخ الاستحقاق', format='%Y-%m-%d', validators=[Optional()])
    submit = SubmitField('إضافة')
    
    def validate_due_date(self, due_date):
        if self.is_task.data and not due_date.data:
            raise ValidationError('يجب تحديد تاريخ استحقاق للمهمة')

# نموذج نشر منشور على فيسبوك
class FacebookPostForm(FlaskForm):
    content = TextAreaField('محتوى المنشور', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=1, max=5000)])
    image_url = StringField('رابط الصورة (اختياري)', validators=[Optional()])
    submit = SubmitField('نشر على فيسبوك')

# نموذج الرد على رسائل فيسبوك
class FacebookMessageReplyForm(FlaskForm):
    message_id = HiddenField('معرف الرسالة', validators=[DataRequired()])
    reply_text = TextAreaField('نص الرد', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=1, max=1000)])
    submit = SubmitField('إرسال الرد')

# نموذج الرد على تعليقات فيسبوك
class FacebookCommentReplyForm(FlaskForm):
    comment_id = HiddenField('معرف التعليق', validators=[DataRequired()])
    reply_text = TextAreaField('نص الرد', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=1, max=1000)])
    submit = SubmitField('الرد على التعليق')

# نموذج طلب تحويل النص إلى فيديو
class TextToVideoForm(FlaskForm):
    title = StringField('عنوان الفيديو', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=3, max=200)])
    text_content = TextAreaField('النص المراد تحويله', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=10, max=10000)])
    voice_type = SelectField('نوع الصوت', choices=[
        ('egyptian_male_1', 'صوت مصري ذكر 1'),
        ('egyptian_female_1', 'صوت مصري أنثى 1'),
        ('egyptian_male_2', 'صوت مصري ذكر 2'),
        ('egyptian_female_2', 'صوت مصري أنثى 2')
    ], validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('إنشاء الفيديو')

    def validate_text_content(self, text_content):
        # التحقق من أن النص يحتوي على أحرف عربية
        arabic_chars = sum(1 for char in text_content.data if '\u0600' <= char <= '\u06FF')
        if arabic_chars < len(text_content.data.replace(' ', '')) * 0.3:
            raise ValidationError('يجب أن يحتوي النص على نسبة أكبر من الأحرف العربية')

# نموذج إضافة صفحة فيسبوك
class FacebookPageForm(FlaskForm):
    page_name = StringField('اسم الصفحة', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=3, max=200)])
    page_id = StringField('معرف الصفحة', validators=[DataRequired('هذا الحقل مطلوب'), Length(min=5, max=100)])
    page_access_token = TextAreaField('رمز الوصول للصفحة', validators=[DataRequired('هذا الحقل مطلوب')])
    is_default = BooleanField('الصفحة الافتراضية')
    submit = SubmitField('حفظ الصفحة')
    
    def validate_page_id(self, page_id):
        from models import FacebookPage
        from flask import request
        
        page = FacebookPage.query.filter_by(page_id=page_id.data).first()
        if page and (request.endpoint != 'main.edit_facebook_page' or str(page.id) != request.view_args.get('page_id')):
            raise ValidationError('يوجد صفحة مسجلة بهذا المعرف بالفعل')

# نموذج اختيار صفحة فيسبوك
class FacebookPageSelectForm(FlaskForm):
    page_id = SelectField('اختر الصفحة', coerce=int, validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('تحديد الصفحة')
    
    def __init__(self, *args, **kwargs):
        super(FacebookPageSelectForm, self).__init__(*args, **kwargs)
        from models import FacebookPage
        # تحميل الصفحات من قاعدة البيانات
        self.page_id.choices = [(page.id, page.page_name) for page in FacebookPage.query.all()]
