from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.hybrid import hybrid_property

class User(UserMixin, db.Model):
    """User account model"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # admin, therapist, manager, etc.
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Role-specific permissions
    can_manage_patients = db.Column(db.Boolean, default=False)
    can_manage_finances = db.Column(db.Boolean, default=False)
    can_manage_employees = db.Column(db.Boolean, default=False)
    can_manage_therapy = db.Column(db.Boolean, default=False)
    can_manage_users = db.Column(db.Boolean, default=False)
    can_view_reports = db.Column(db.Boolean, default=False)
    
    # Employee relationship (if user is also an employee)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    employee = db.relationship('Employee', backref=db.backref('user_account', uselist=False))
    
    # Therapy reports authored by this user
    therapy_reports = db.relationship('TherapyReport', backref='author', lazy='dynamic')
    
    # Collections recorded by this user
    collections = db.relationship('Collection', backref='collector', lazy='dynamic')
    
    def set_password(self, password):
        """Create hashed password"""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Check hashed password"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Patient(db.Model):
    """Patient model for storing patient information"""
    
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    national_id = db.Column(db.String(20), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    admission_date = db.Column(db.Date, nullable=False, default=datetime.now().date)
    discharge_date = db.Column(db.Date, nullable=True)
    daily_rate = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    expenses = db.relationship('PatientExpense', backref='patient', lazy='dynamic')
    payments = db.relationship('Collection', backref='patient', lazy='dynamic')
    therapy_memberships = db.relationship('TherapyGroupMember', backref='patient', lazy='dynamic')
    
    @hybrid_property
    def total_stay_days(self):
        """Calculate total days of stay"""
        end_date = self.discharge_date if self.discharge_date else datetime.now().date()
        # ضمان أن مدة الإقامة لا تقل عن يوم واحد
        days = max(1, (end_date - self.admission_date).days + 1)  # Including admission day
        return days
    
    @hybrid_property
    def total_stay_cost(self):
        """Calculate total cost of stay"""
        return self.total_stay_days * self.daily_rate
    
    @hybrid_property
    def total_expenses(self):
        """Calculate total additional expenses"""
        return sum(expense.amount for expense in self.expenses)
    
    @hybrid_property
    def total_payments(self):
        """Calculate total payments made"""
        return sum(payment.amount for payment in self.payments)
    
    @hybrid_property
    def balance(self):
        """Calculate current balance (negative means money owed)"""
        return self.total_payments - (self.total_stay_cost + self.total_expenses)
    
    def __repr__(self):
        return f'<Patient {self.name}>'


class PatientExpense(db.Model):
    """Model for tracking patient expenses"""
    
    __tablename__ = 'patient_expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    expense_type = db.Column(db.String(50), nullable=False)  # cigarettes, medical_tests, medications, etc.
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f'<PatientExpense {self.expense_type} for Patient {self.patient_id}>'


class Collection(db.Model):
    """Model for tracking patient payments"""
    
    __tablename__ = 'collections'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    collector_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    notes = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f'<Collection {self.amount} for Patient {self.patient_id}>'


class Employee(db.Model):
    """Employee model for storing employee information"""
    
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # manager, therapist, worker, etc.
    national_id = db.Column(db.String(20), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    hire_date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    monthly_salary = db.Column(db.Float, nullable=False)
    salary_view_password = db.Column(db.String(100), nullable=True)  # كلمة مرور لعرض الراتب (للمدراء)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    salary_payments = db.relationship('SalaryPayment', backref='employee', lazy='dynamic')
    therapy_groups = db.relationship('TherapyGroup', backref='therapist', lazy='dynamic')
    
    @hybrid_property
    def is_general_manager(self):
        """التحقق مما إذا كان الموظف مدير عام"""
        return self.role == 'general_manager'
    
    def check_salary_password(self, password):
        """التحقق من صحة كلمة مرور عرض الراتب"""
        # للمدراء العامين فقط يتم التحقق من كلمة المرور
        if not self.is_general_manager:
            return True
            
        # إذا لم يتم تعيين كلمة مرور، نعتبر أي كلمة مرور صحيحة
        if not self.salary_view_password:
            return True
            
        # التحقق من تطابق كلمة المرور
        return self.salary_view_password == password
    
    def __repr__(self):
        return f'<Employee {self.name}>'


class SalaryPayment(db.Model):
    """Model for tracking employee salary payments"""
    
    __tablename__ = 'salary_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)  # salary, bonus, loan, deduction
    date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    notes = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f'<SalaryPayment {self.payment_type} for Employee {self.employee_id}>'


class TherapyGroup(db.Model):
    """Model for therapy groups"""
    
    __tablename__ = 'therapy_groups'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    therapist_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    schedule = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    members = db.relationship('TherapyGroupMember', backref='group', lazy='dynamic')
    reports = db.relationship('TherapyReport', backref='group', lazy='dynamic')
    
    def __repr__(self):
        return f'<TherapyGroup {self.name}>'


class TherapyGroupMember(db.Model):
    """Model for patient membership in therapy groups"""
    
    __tablename__ = 'therapy_group_members'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('therapy_groups.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    join_date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    exit_date = db.Column(db.Date, nullable=True)
    treatment_stage = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<TherapyGroupMember Patient {self.patient_id} in Group {self.group_id}>'


class TherapyReport(db.Model):
    """Model for therapy group reports"""
    
    __tablename__ = 'therapy_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('therapy_groups.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    report_type = db.Column(db.String(20), nullable=False)  # daily, weekly
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<TherapyReport {self.report_type} for Group {self.group_id}>'


class Expense(db.Model):
    """Model for center expenses"""
    
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # kitchen, rent, maintenance, etc.
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    date = db.Column(db.Date, nullable=False, default=datetime.now().date())
    created_at = db.Column(db.DateTime, default=datetime.now)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationship with user who created the expense
    recorder = db.relationship('User', backref='recorded_expenses')
    
    def __repr__(self):
        return f'<Expense {self.category} - {self.amount}>'
