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

class CollectionForm(FlaskForm):
    patient_id = SelectField('المريض', coerce=int, validators=[DataRequired('هذا الحقل مطلوب')])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired('هذا الحقل مطلوب')])
    date = DateField('تاريخ التحصيل', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    notes = StringField('ملاحظات', validators=[Optional()])
    submit = SubmitField('تسجيل المبلغ')

    def __init__(self, *args, **kwargs):
        super(CollectionForm, self).__init__(*args, **kwargs)
        self.patient_id.choices = [(p.id, p.name) for p in Patient.query.filter_by(is_active=True).all()]

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
    notes = TextAreaField('ملاحظات', validators=[Optional()])
    submit = SubmitField('حفظ')

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

class SearchDateRangeForm(FlaskForm):
    start_date = DateField('من تاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    end_date = DateField('إلى تاريخ', format='%Y-%m-%d', validators=[DataRequired('هذا الحقل مطلوب')])
    submit = SubmitField('عرض التقرير')

    def validate_end_date(self, end_date):
        if self.start_date.data and end_date.data:
            if end_date.data < self.start_date.data:
                raise ValidationError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
