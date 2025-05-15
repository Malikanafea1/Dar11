from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user
from datetime import datetime, timedelta, date
from sqlalchemy import func, or_
from dateutil.relativedelta import relativedelta
from werkzeug.security import generate_password_hash

from app import db
from models import (Patient, PatientExpense, Collection, Employee, SalaryPayment, 
                   TherapyGroup, TherapyGroupMember, TherapyReport, Expense, User)
from forms import (PatientForm, PatientExpenseForm, CollectionForm, EmployeeForm, SalaryPaymentForm,
                  TherapyGroupForm, TherapyGroupMemberForm, TherapyReportForm, ExpenseForm,
                  SearchDateRangeForm, RegisterForm, EditUserForm)

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    # Get today's date and the start of the current month
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    
    # Initialize values
    active_patients = 0
    today_collections = 0
    month_collections = 0
    today_expenses = 0
    month_expenses = 0
    negative_balance_patients = []
    
    # If user is not therapist or has appropriate permissions, show financial info
    if current_user.role != 'therapist':
        # Count active patients
        if current_user.can_manage_patients:
            active_patients = Patient.query.filter_by(is_active=True).count()
        
        # Get financial information if user has permission
        if current_user.can_manage_finances:
            # Count today's collections
            today_collections = db.session.query(func.sum(Collection.amount)).filter(
                Collection.date == today
            ).scalar() or 0
            
            # Count month's collections
            month_collections = db.session.query(func.sum(Collection.amount)).filter(
                Collection.date >= start_of_month,
                Collection.date <= today
            ).scalar() or 0
            
            # Count today's expenses
            today_expenses = db.session.query(func.sum(Expense.amount)).filter(
                Expense.date == today
            ).scalar() or 0
            
            # Count month's expenses
            month_expenses = db.session.query(func.sum(Expense.amount)).filter(
                Expense.date >= start_of_month,
                Expense.date <= today
            ).scalar() or 0
            
            # Get 5 patients with negative balances
            if current_user.can_view_reports:
                negative_balance_patients = Patient.query.filter_by(is_active=True).all()
                negative_balance_patients = [p for p in negative_balance_patients if p.balance < 0]
                negative_balance_patients = sorted(negative_balance_patients, key=lambda p: p.balance)[:5]
    
    # Get recent therapy reports - this is available to therapists
    recent_reports = []
    if current_user.role == 'therapist':
        # If user is therapist, only show their group reports
        # استخدام علاقة employee من المستخدم الحالي مباشرة
        if current_user.employee_id:
            employee = current_user.employee
            therapist_groups = TherapyGroup.query.filter_by(therapist_id=current_user.employee_id).all()
            group_ids = [g.id for g in therapist_groups]
            recent_reports = TherapyReport.query.filter(TherapyReport.group_id.in_(group_ids)).order_by(
                TherapyReport.created_at.desc()).limit(5).all()
    else:
        # For other users with appropriate permissions, show all reports
        recent_reports = TherapyReport.query.order_by(TherapyReport.created_at.desc()).limit(5).all()
    
    return render_template('dashboard.html', 
                          active_patients=active_patients,
                          today_collections=today_collections,
                          month_collections=month_collections,
                          today_expenses=today_expenses,
                          month_expenses=month_expenses,
                          negative_balance_patients=negative_balance_patients,
                          recent_reports=recent_reports,
                          is_therapist=(current_user.role == 'therapist'))

# Patient routes
@main_bp.route('/patients')
@login_required
def patients():
    if not current_user.can_manage_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    patients_list = Patient.query.order_by(Patient.is_active.desc(), Patient.name).all()
    return render_template('patients/index.html', patients=patients_list)

@main_bp.route('/patients/add', methods=['GET', 'POST'])
@login_required
def add_patient():
    if not current_user.can_manage_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = PatientForm()
    if form.validate_on_submit():
        patient = Patient(
            name=form.name.data,
            national_id=form.national_id.data,
            phone=form.phone.data,
            address=form.address.data,
            admission_date=form.admission_date.data,
            daily_rate=form.daily_rate.data,
            notes=form.notes.data,
            is_active=True
        )
        db.session.add(patient)
        db.session.commit()
        flash('تم إضافة المريض بنجاح', 'success')
        return redirect(url_for('main.patients'))
    return render_template('patients/add.html', form=form)

@main_bp.route('/patients/<int:id>')
@login_required
def view_patient(id):
    if not current_user.can_manage_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    patient = Patient.query.get_or_404(id)
    expense_form = PatientExpenseForm()
    expense_form.patient_id.data = patient.id
    expense_form.date.data = date.today()
    
    return render_template('patients/view.html', patient=patient, expense_form=expense_form)

@main_bp.route('/patients/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_patient(id):
    if not current_user.can_manage_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    patient = Patient.query.get_or_404(id)
    form = PatientForm(obj=patient)
    
    if form.validate_on_submit():
        patient.name = form.name.data
        patient.national_id = form.national_id.data
        patient.phone = form.phone.data
        patient.address = form.address.data
        patient.admission_date = form.admission_date.data
        patient.daily_rate = form.daily_rate.data
        patient.notes = form.notes.data
        
        db.session.commit()
        flash('تم تحديث بيانات المريض بنجاح', 'success')
        return redirect(url_for('main.view_patient', id=patient.id))
        
    return render_template('patients/edit.html', form=form, patient=patient)

@main_bp.route('/patients/<int:id>/toggle_status', methods=['POST'])
@login_required
def toggle_patient_status(id):
    if not current_user.can_manage_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    patient = Patient.query.get_or_404(id)
    patient.is_active = not patient.is_active
    
    # If deactivating a patient, set discharge date
    if not patient.is_active:
        patient.discharge_date = date.today()
    else:
        patient.discharge_date = None
        
    db.session.commit()
    
    status = "تنشيط" if patient.is_active else "تعطيل"
    flash(f'تم {status} المريض بنجاح', 'success')
    return redirect(url_for('main.view_patient', id=patient.id))

@main_bp.route('/patients/<int:id>/add_expense', methods=['POST'])
@login_required
def add_patient_expense(id):
    if not current_user.can_manage_patients and not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    patient = Patient.query.get_or_404(id)
    form = PatientExpenseForm()
    
    if form.validate_on_submit():
        expense = PatientExpense(
            patient_id=patient.id,
            expense_type=form.expense_type.data,
            amount=form.amount.data,
            description=form.description.data,
            date=form.date.data
        )
        db.session.add(expense)
        db.session.commit()
        flash('تم إضافة المصروف بنجاح', 'success')
        
    return redirect(url_for('main.view_patient', id=patient.id))

@main_bp.route('/patients/<int:id>/statement')
@login_required
def patient_statement(id):
    if not current_user.can_manage_patients and not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    patient = Patient.query.get_or_404(id)
    
    # Get all expenses
    expenses = patient.expenses.order_by(PatientExpense.date).all()
    
    # Get all payments
    payments = patient.payments.order_by(Collection.date).all()
    
    # Calculate running balance
    transactions = []
    running_balance = 0
    
    # Calculate daily room charges
    end_date = patient.discharge_date if patient.discharge_date else date.today()
    current_date = patient.admission_date
    
    while current_date <= end_date:
        transactions.append({
            'date': current_date,
            'description': 'إقامة',
            'amount': -patient.daily_rate,
            'running_balance': running_balance - patient.daily_rate
        })
        running_balance -= patient.daily_rate
        current_date += timedelta(days=1)
    
    # Add expenses
    for expense in expenses:
        transactions.append({
            'date': expense.date,
            'description': f"{dict(PatientExpenseForm.expense_type.kwargs['choices']).get(expense.expense_type, '')} - {expense.description}",
            'amount': -expense.amount,
            'running_balance': running_balance - expense.amount
        })
        running_balance -= expense.amount
    
    # Add payments
    for payment in payments:
        transactions.append({
            'date': payment.date,  # تاريخ الدفعة الذي تم اختياره عند التسجيل
            'description': f"دفعة - {payment.notes or ''} (تاريخ التسجيل: {payment.created_at.strftime('%Y-%m-%d')})",
            'amount': payment.amount,
            'running_balance': running_balance + payment.amount
        })
        running_balance += payment.amount
    
    # Sort by date
    transactions.sort(key=lambda x: x['date'])
    
    # Recalculate running balance after sorting
    running_balance = 0
    for transaction in transactions:
        running_balance += transaction['amount']
        transaction['running_balance'] = running_balance
    
    # Group by month for summary
    monthly_summary = {}
    for t in transactions:
        month_key = f"{t['date'].year}-{t['date'].month}"
        if month_key not in monthly_summary:
            monthly_summary[month_key] = {
                'month': t['date'].strftime('%B %Y'),
                'charges': 0,
                'payments': 0
            }
        
        if t['amount'] < 0:
            monthly_summary[month_key]['charges'] += abs(t['amount'])
        else:
            monthly_summary[month_key]['payments'] += t['amount']
    
    return render_template('patients/statement.html', 
                          patient=patient, 
                          transactions=transactions, 
                          monthly_summary=monthly_summary)

# Collections routes
@main_bp.route('/collections')
@login_required
def collections():
    if not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    collections_list = Collection.query.order_by(Collection.date.desc()).all()
    return render_template('collections/index.html', collections=collections_list)

@main_bp.route('/collections/add', methods=['GET', 'POST'])
@login_required
def add_collection():
    if not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = CollectionForm()
    form.date.data = date.today()
    
    if form.validate_on_submit():
        collection = Collection(
            patient_id=form.patient_id.data,
            collector_id=current_user.id,
            amount=form.amount.data,
            date=form.date.data,
            notes=form.notes.data
        )
        db.session.add(collection)
        db.session.commit()
        flash('تم إضافة المبلغ بنجاح', 'success')
        return redirect(url_for('main.collections'))
        
    return render_template('collections/add.html', form=form)

# Employee routes
@main_bp.route('/employees')
@login_required
def employees():
    if not current_user.can_manage_employees:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    employees_list = Employee.query.order_by(Employee.is_active.desc(), Employee.name).all()
    return render_template('employees/index.html', employees=employees_list)

@main_bp.route('/employees/add', methods=['GET', 'POST'])
@login_required
def add_employee():
    if not current_user.can_manage_employees:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = EmployeeForm()
    form.hire_date.data = date.today()
    
    if form.validate_on_submit():
        # إنشاء موظف جديد
        employee = Employee(
            name=form.name.data,
            role=form.role.data,
            national_id=form.national_id.data,
            phone=form.phone.data,
            address=form.address.data,
            hire_date=form.hire_date.data,
            monthly_salary=form.monthly_salary.data,
            notes=form.notes.data,
            is_active=True
        )
        
        # إذا كان المدير العام وتم إدخال كلمة مرور لعرض الراتب
        if form.role.data == 'general_manager' and form.salary_view_password.data:
            employee.salary_view_password = form.salary_view_password.data
        
        db.session.add(employee)
        db.session.commit()
        flash('تم إضافة الموظف بنجاح', 'success')
        return redirect(url_for('main.employees'))
        
    return render_template('employees/add.html', form=form)

@main_bp.route('/employees/<int:id>')
@login_required
def view_employee(id):
    if not current_user.can_manage_employees:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    employee = Employee.query.get_or_404(id)
    payment_form = SalaryPaymentForm()
    payment_form.employee_id.data = employee.id
    payment_form.date.data = date.today()
    
    payments = SalaryPayment.query.filter_by(employee_id=employee.id).order_by(SalaryPayment.date.desc()).all()
    
    return render_template('employees/view.html', 
                          employee=employee, 
                          payment_form=payment_form,
                          payments=payments)

@main_bp.route('/employees/<int:id>/add_payment', methods=['POST'])
@login_required
def add_employee_payment(id):
    if not current_user.can_manage_employees and not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    employee = Employee.query.get_or_404(id)
    form = SalaryPaymentForm()
    
    if form.validate_on_submit():
        payment = SalaryPayment(
            employee_id=employee.id,
            amount=form.amount.data,
            payment_type=form.payment_type.data,
            date=form.date.data,
            notes=form.notes.data
        )
        db.session.add(payment)
        
        # If this is a salary payment, also add a center expense
        if form.payment_type.data == 'salary':
            expense = Expense(
                category='salaries',
                amount=form.amount.data,
                description=f"راتب {employee.name}",
                date=form.date.data,
                created_by=current_user.id
            )
            db.session.add(expense)
        
        db.session.commit()
        flash('تم تسجيل الدفعة بنجاح', 'success')
        
    return redirect(url_for('main.view_employee', id=employee.id))

@main_bp.route('/employees/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_employee(id):
    if not current_user.can_manage_employees:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    employee = Employee.query.get_or_404(id)
    form = EmployeeForm(obj=employee)
    
    if form.validate_on_submit():
        employee.name = form.name.data
        employee.role = form.role.data
        employee.national_id = form.national_id.data
        employee.phone = form.phone.data
        employee.address = form.address.data
        employee.hire_date = form.hire_date.data
        employee.monthly_salary = form.monthly_salary.data
        employee.notes = form.notes.data
        
        # إذا كان مدير عام وتم إدخال كلمة مرور جديدة لعرض الراتب
        if form.role.data == 'general_manager' and form.salary_view_password.data:
            employee.salary_view_password = form.salary_view_password.data
        
        db.session.commit()
        flash('تم تحديث بيانات الموظف بنجاح', 'success')
        return redirect(url_for('main.view_employee', id=employee.id))
        
    return render_template('employees/edit.html', form=form, employee=employee)

@main_bp.route('/employees/<int:id>/delete', methods=['POST'])
@login_required
def delete_employee(id):
    if not current_user.can_manage_employees:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    employee = Employee.query.get_or_404(id)
    
    # تخزين الاسم قبل الحذف للرسالة
    name = employee.name
    
    # حذف الموظف
    db.session.delete(employee)
    db.session.commit()
    
    flash(f'تم حذف الموظف {name} بنجاح', 'success')
    return redirect(url_for('main.employees'))

@main_bp.route('/employees/<int:id>/toggle_status', methods=['POST'])
@login_required
def toggle_employee_status(id):
    if not current_user.can_manage_employees:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    employee = Employee.query.get_or_404(id)
    employee.is_active = not employee.is_active
    db.session.commit()
    
    status = "تنشيط" if employee.is_active else "تعطيل"
    flash(f'تم {status} الموظف بنجاح', 'success')
    return redirect(url_for('main.view_employee', id=employee.id))

# Therapy groups routes
@main_bp.route('/therapy_groups')
@login_required
def therapy_groups():
    # التحقق أولاً مما إذا كان المستخدم يملك صلاحية أو معالج
    if current_user.can_manage_therapy or current_user.role == 'therapist':
        # يمكن للجميع رؤية كل المجموعات العلاجية
        groups = TherapyGroup.query.all()
        
        # إذا كان المستخدم معالج، نحدد المجموعات الخاصة به لتمييزها في العرض
        is_therapist = False
        therapist_groups_ids = []
        if current_user.role == 'therapist' and current_user.employee_id:
            is_therapist = True
            therapist_groups = TherapyGroup.query.filter_by(therapist_id=current_user.employee_id).all()
            therapist_groups_ids = [group.id for group in therapist_groups]
    else:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    return render_template(
        'therapy/index.html', 
        groups=groups, 
        is_therapist=is_therapist if 'is_therapist' in locals() else False,
        therapist_groups_ids=therapist_groups_ids if 'therapist_groups_ids' in locals() else []
    )

@main_bp.route('/therapy_groups/add', methods=['GET', 'POST'])
@login_required
def add_therapy_group():
    # التحقق من صلاحية إضافة المجموعات العلاجية
    if not (current_user.can_manage_therapy or current_user.role == 'therapist'):
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = TherapyGroupForm()
    
    # إذا كان المستخدم معالج، نعين المجموعة له تلقائيًا
    if current_user.role == 'therapist':
        if current_user.employee_id:
            # تعطيل حقل اختيار المعالج وتعيينه للمعالج الحالي
            form.therapist_id.data = current_user.employee_id
            form.therapist_id.render_kw = {'disabled': 'disabled'}
        else:
            flash('لم يتم العثور على بيانات المعالج الخاصة بك', 'danger')
            return redirect(url_for('main.dashboard'))
    
    if form.validate_on_submit():
        # تحديد معرف المعالج
        therapist_id = form.therapist_id.data
        if current_user.role == 'therapist' and current_user.employee_id:
            # إذا كان المستخدم معالج، استخدم معرفه دائمًا
            therapist_id = current_user.employee_id
            
        group = TherapyGroup(
            name=form.name.data,
            therapist_id=therapist_id,
            description=form.description.data,
            schedule=form.schedule.data,
            is_active=True
        )
        db.session.add(group)
        db.session.commit()
        flash('تم إنشاء المجموعة العلاجية بنجاح', 'success')
        return redirect(url_for('main.therapy_groups'))
        
    return render_template('therapy/add.html', form=form)

@main_bp.route('/therapy_groups/<int:id>')
@login_required
def view_therapy_group(id):
    group = TherapyGroup.query.get_or_404(id)
    
    # Check permissions
    # Allow therapists to view all therapy groups
    if current_user.role != 'therapist' and not current_user.can_manage_therapy:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    # Get members with their patients
    members = TherapyGroupMember.query.filter_by(group_id=id, exit_date=None).all()
    
    # Forms
    member_form = TherapyGroupMemberForm()
    member_form.group_id.data = id
    
    report_form = TherapyReportForm()
    report_form.group_id.data = id
    
    # Get recent reports
    reports = TherapyReport.query.filter_by(group_id=id).order_by(TherapyReport.report_date.desc()).limit(10).all()
    
    # Check if current user can add patients
    # المعالج يمكنه إضافة مرضى للمجموعات الخاصة به فقط
    can_add_patients = current_user.can_manage_therapy
    if current_user.role == 'therapist':
        if current_user.employee_id and group.therapist_id == current_user.employee_id:
            can_add_patients = True
    
    # Check if current user can add reports
    # المعالج يمكنه إضافة تقارير للمجموعات الخاصة به فقط
    can_add_reports = current_user.can_manage_therapy
    if current_user.role == 'therapist':
        if current_user.employee_id and group.therapist_id == current_user.employee_id:
            can_add_reports = True
    
    # Add today's date for the form
    from datetime import datetime
    today_date = datetime.now().strftime('%Y-%m-%d')
    
    return render_template('therapy/view.html', 
                          group=group, 
                          members=members,
                          reports=reports,
                          member_form=member_form,
                          report_form=report_form,
                          can_add_patients=can_add_patients,
                          can_add_reports=can_add_reports,
                          today_date=today_date)

@main_bp.route('/therapy_groups/<int:id>/add_member', methods=['POST'])
@login_required
def add_therapy_group_member(id):
    group = TherapyGroup.query.get_or_404(id)
    
    # التحقق من صلاحيات إضافة المرضى للمجموعة
    can_add_patients = current_user.can_manage_therapy
    if current_user.role == 'therapist':
        if current_user.employee_id and group.therapist_id == current_user.employee_id:
            can_add_patients = True
    
    if not can_add_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = TherapyGroupMemberForm()
    
    if form.validate_on_submit():
        # Check if patient is already in the group
        existing = TherapyGroupMember.query.filter_by(
            group_id=id, 
            patient_id=form.patient_id.data, 
            exit_date=None
        ).first()
        
        if existing:
            flash('المريض موجود بالفعل في المجموعة', 'danger')
        else:
            member = TherapyGroupMember(
                group_id=id,
                patient_id=form.patient_id.data,
                treatment_stage=form.treatment_stage.data,
                notes=form.notes.data,
                join_date=date.today()
            )
            db.session.add(member)
            db.session.commit()
            flash('تم إضافة المريض للمجموعة بنجاح', 'success')
        
    return redirect(url_for('main.view_therapy_group', id=id))

@main_bp.route('/therapy_groups/<int:group_id>/members/<int:member_id>/remove', methods=['POST'])
@login_required
def remove_therapy_group_member(group_id, member_id):
    group = TherapyGroup.query.get_or_404(group_id)
    
    # التحقق من صلاحيات إزالة المرضى من المجموعة
    can_remove_patients = current_user.can_manage_therapy
    if current_user.role == 'therapist':
        if current_user.employee_id and group.therapist_id == current_user.employee_id:
            can_remove_patients = True
    
    if not can_remove_patients:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    member = TherapyGroupMember.query.get_or_404(member_id)
    
    # Set exit date to today
    member.exit_date = date.today()
    db.session.commit()
    flash('تم إزالة المريض من المجموعة بنجاح', 'success')
    
    return redirect(url_for('main.view_therapy_group', id=group_id))

@main_bp.route('/therapy_groups/<int:id>/add_report', methods=['POST'])
@login_required
def add_therapy_report(id):
    group = TherapyGroup.query.get_or_404(id)
    form = TherapyReportForm()
    
    # تعبئة المعرف المطلوب في النموذج
    form.group_id.data = id
    
    # Check permissions
    can_add_report = current_user.can_manage_therapy
    if current_user.role == 'therapist':
        if current_user.employee_id and group.therapist_id == current_user.employee_id:
            can_add_report = True
    
    if not can_add_report:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
    
    if form.validate_on_submit():
        # Check if a report already exists for today
        existing_report = TherapyReport.query.filter_by(
            group_id=id,
            report_date=date.today(),
            report_type=form.report_type.data
        ).first()
        
        if existing_report:
            # Update existing report if it's by the same author
            if existing_report.author_id == current_user.id:
                existing_report.content = form.content.data
                existing_report.updated_at = datetime.now()
                db.session.commit()
                flash('تم تحديث التقرير بنجاح', 'success')
            else:
                flash('يوجد بالفعل تقرير لهذا اليوم بواسطة معالج آخر', 'danger')
        else:
            # Create new report
            report = TherapyReport(
                group_id=id,
                author_id=current_user.id,
                report_date=date.today(),
                report_type=form.report_type.data,
                content=form.content.data
            )
            db.session.add(report)
            db.session.commit()
            flash('تم إضافة التقرير بنجاح', 'success')
        
    return redirect(url_for('main.view_therapy_group', id=id))

@main_bp.route('/therapy_groups/add_report', methods=['GET'])
@login_required
def redirect_add_therapy_report():
    """
    معالجة المسار الخاطئ - توجيه المستخدم إلى الصفحة الرئيسية للمجموعات العلاجية
    """
    flash('يرجى اختيار مجموعة علاجية أولاً لإضافة تقرير', 'warning')
    return redirect(url_for('main.therapy_groups'))

@main_bp.route('/therapy_groups/add_member', methods=['GET'])
@login_required
def redirect_add_therapy_member():
    """
    معالجة المسار الخاطئ - توجيه المستخدم إلى الصفحة الرئيسية للمجموعات العلاجية
    """
    flash('يرجى اختيار مجموعة علاجية أولاً لإضافة مريض', 'warning')
    return redirect(url_for('main.therapy_groups'))

@main_bp.route('/therapy_groups/members/remove', methods=['GET'])
@login_required
def redirect_remove_therapy_member():
    """
    معالجة المسار الخاطئ - توجيه المستخدم إلى الصفحة الرئيسية للمجموعات العلاجية
    """
    flash('يرجى اختيار مجموعة علاجية أولاً لإزالة مريض', 'warning')
    return redirect(url_for('main.therapy_groups'))

# معالجة عامة لأي مسار غير صحيح متعلق بالمجموعات العلاجية
@main_bp.route('/therapy_groups/<path:subpath>', methods=['GET', 'POST'])
@login_required
def handle_therapy_groups_404(subpath):
    """
    معالجة عامة لأي مسار غير موجود تحت therapy_groups
    """
    flash('المسار غير صحيح. يرجى اختيار مجموعة علاجية من القائمة', 'warning')
    return redirect(url_for('main.therapy_groups'))

# تم حذف مسار الـ users المكرر هنا للحفاظ على المسار الموجود مسبقاً

# تم حذف مسار add_user المكرر هنا

@main_bp.route('/users/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_user(id):
    if not current_user.can_manage_users:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    user = User.query.get_or_404(id)
    form = EditUserForm(user.username, user.email)
    
    if request.method == 'GET':
        form.username.data = user.username
        form.email.data = user.email
        form.role.data = user.role
        form.can_manage_patients.data = user.can_manage_patients
        form.can_manage_finances.data = user.can_manage_finances
        form.can_manage_employees.data = user.can_manage_employees
        form.can_manage_therapy.data = user.can_manage_therapy
        form.can_manage_users.data = user.can_manage_users
        form.can_view_reports.data = user.can_view_reports
    
    if form.validate_on_submit():
        user.username = form.username.data
        user.email = form.email.data
        user.role = form.role.data
        user.can_manage_patients = form.can_manage_patients.data
        user.can_manage_finances = form.can_manage_finances.data
        user.can_manage_employees = form.can_manage_employees.data
        user.can_manage_therapy = form.can_manage_therapy.data
        user.can_manage_users = form.can_manage_users.data
        user.can_view_reports = form.can_view_reports.data
        
        if form.change_password.data and form.password.data:
            user.password_hash = generate_password_hash(form.password.data)
            
        db.session.commit()
        flash('تم تحديث بيانات المستخدم بنجاح', 'success')
        return redirect(url_for('main.users'))
    
    return render_template('users/edit.html', form=form, user=user)

# تم حذف مسار toggle_user_status المكرر هنا

@main_bp.route('/therapy_reports/<int:id>')
@login_required
def view_therapy_report(id):
    report = TherapyReport.query.get_or_404(id)
    group = report.group
    
    # Check permissions - المعالجين يمكنهم عرض تقارير أي مجموعة علاجية
    can_view_report = current_user.can_manage_therapy
    if current_user.role == 'therapist':
        can_view_report = True
    
    if not can_view_report:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    return render_template('therapy/report.html', report=report, group=group)

# Expenses routes
@main_bp.route('/expenses')
@login_required
def expenses():
    if not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    expenses_list = Expense.query.order_by(Expense.date.desc()).all()
    return render_template('expenses/index.html', expenses=expenses_list)

@main_bp.route('/expenses/add', methods=['GET', 'POST'])
@login_required
def add_expense():
    if not current_user.can_manage_finances:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = ExpenseForm()
    form.date.data = date.today()
    
    if form.validate_on_submit():
        expense = Expense(
            category=form.category.data,
            amount=form.amount.data,
            description=form.description.data,
            date=form.date.data,
            created_by=current_user.id
        )
        db.session.add(expense)
        db.session.commit()
        flash('تم إضافة المصروف بنجاح', 'success')
        return redirect(url_for('main.expenses'))
        
    return render_template('expenses/add.html', form=form)

# Reports routes
@main_bp.route('/reports/daily', methods=['GET', 'POST'])
@login_required
def daily_report():
    if not current_user.can_view_reports:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = SearchDateRangeForm()
    form.start_date.data = form.start_date.data or date.today()
    form.end_date.data = form.end_date.data or date.today()
    
    report_data = None
    
    if form.validate_on_submit() or request.method == 'GET':
        start_date = form.start_date.data or date.today()
        end_date = form.end_date.data or date.today()
        
        # Get data for each day in the range
        current_date = start_date
        report_data = []
        
        while current_date <= end_date:
            # Calculate collections
            day_collections = db.session.query(func.sum(Collection.amount)).filter(
                Collection.date == current_date
            ).scalar() or 0
            
            # Calculate expenses
            day_expenses = db.session.query(func.sum(Expense.amount)).filter(
                Expense.date == current_date
            ).scalar() or 0
            
            # Add to report data
            report_data.append({
                'date': current_date,
                'collections': day_collections,
                'expenses': day_expenses,
                'balance': day_collections - day_expenses
            })
            
            # Move to next day
            current_date += timedelta(days=1)
        
    return render_template('reports/daily.html', 
                          form=form, 
                          report_data=report_data)

@main_bp.route('/reports/monthly', methods=['GET', 'POST'])
@login_required
def monthly_report():
    if not current_user.can_view_reports:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    # Get current year and month
    today = date.today()
    current_year = today.year
    
    # Create years list for form
    years = list(range(current_year - 5, current_year + 1))
    
    # Get selected year from form
    selected_year = request.form.get('year', str(current_year))
    
    # Prepare report data
    report_data = []
    
    for month in range(1, 13):
        month_start = date(int(selected_year), month, 1)
        
        # Calculate month end
        if month == 12:
            month_end = date(int(selected_year), month, 31)
        else:
            next_month_start = date(int(selected_year), month + 1, 1)
            month_end = next_month_start - timedelta(days=1)
        
        # Skip future months
        if month_start > today:
            continue
            
        # Calculate collections
        month_collections = db.session.query(func.sum(Collection.amount)).filter(
            Collection.date >= month_start,
            Collection.date <= month_end
        ).scalar() or 0
        
        # Calculate expenses
        month_expenses = db.session.query(func.sum(Expense.amount)).filter(
            Expense.date >= month_start,
            Expense.date <= month_end
        ).scalar() or 0
        
        # Add to report data
        report_data.append({
            'month': month_start.strftime('%B'),
            'collections': month_collections,
            'expenses': month_expenses,
            'balance': month_collections - month_expenses
        })
    
    return render_template('reports/monthly.html', 
                          years=years,
                          selected_year=selected_year,
                          report_data=report_data)

@main_bp.route('/reports/profit_loss', methods=['GET', 'POST'])
@login_required
def profit_loss_report():
    if not current_user.can_view_reports:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = SearchDateRangeForm()
    form.start_date.data = form.start_date.data or date(date.today().year, date.today().month, 1)  # First day of current month
    form.end_date.data = form.end_date.data or date.today()
    
    report_data = None
    
    if form.validate_on_submit() or request.method == 'GET':
        start_date = form.start_date.data or date(date.today().year, date.today().month, 1)
        end_date = form.end_date.data or date.today()
        
        # Calculate income
        collections = db.session.query(func.sum(Collection.amount)).filter(
            Collection.date >= start_date,
            Collection.date <= end_date
        ).scalar() or 0
        
        # Calculate expenses by category
        expenses_by_category = {}
        all_expenses = Expense.query.filter(
            Expense.date >= start_date,
            Expense.date <= end_date
        ).all()
        
        total_expenses = 0
        for expense in all_expenses:
            category = expense.category
            if category not in expenses_by_category:
                expenses_by_category[category] = 0
            expenses_by_category[category] += expense.amount
            total_expenses += expense.amount
        
        # Prepare expenses list for display
        expenses_list = []
        for category, amount in expenses_by_category.items():
            category_name = dict(ExpenseForm.category.kwargs['choices']).get(category, category)
            expenses_list.append({
                'category': category_name,
                'amount': amount,
                'percentage': (amount / total_expenses * 100) if total_expenses > 0 else 0
            })
        
        # Sort expenses list by amount (descending)
        expenses_list.sort(key=lambda x: x['amount'], reverse=True)
        
        # Calculate profit/loss
        profit_loss = collections - total_expenses
        
        report_data = {
            'start_date': start_date,
            'end_date': end_date,
            'collections': collections,
            'expenses': expenses_list,
            'total_expenses': total_expenses,
            'profit_loss': profit_loss,
            'profit_loss_percentage': (profit_loss / collections * 100) if collections > 0 else 0
        }
        
    return render_template('reports/profit_loss.html', 
                          form=form, 
                          report_data=report_data)

@main_bp.route('/reports/negative_balance')
@login_required
def negative_balance_report():
    if not current_user.can_view_reports:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    # Get all active patients
    patients = Patient.query.filter_by(is_active=True).all()
    
    # Filter patients with negative balance
    negative_balance_patients = []
    for patient in patients:
        if patient.balance < 0:
            negative_balance_patients.append({
                'id': patient.id,
                'name': patient.name,
                'admission_date': patient.admission_date,
                'days': patient.total_stay_days,
                'balance': patient.balance
            })
    
    # Sort by balance amount (most negative first)
    negative_balance_patients.sort(key=lambda x: x['balance'])
    
    # Calculate total debt
    total_debt = sum(p['balance'] for p in negative_balance_patients)
    
    return render_template('reports/negative_balance.html', 
                          patients=negative_balance_patients,
                          total_debt=total_debt)

# User management routes
@main_bp.route('/users')
@login_required
def users():
    if not current_user.can_manage_users:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    users_list = User.query.all()
    return render_template('users/index.html', users=users_list)

@main_bp.route('/users/add', methods=['GET', 'POST'])
@login_required
def add_user():
    if not current_user.can_manage_users:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    form = RegisterForm()
    
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            role=form.role.data,
            can_manage_patients=form.can_manage_patients.data,
            can_manage_finances=form.can_manage_finances.data,
            can_manage_employees=form.can_manage_employees.data,
            can_manage_therapy=form.can_manage_therapy.data,
            can_manage_users=form.can_manage_users.data,
            can_view_reports=form.can_view_reports.data
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        flash('تم إنشاء الحساب بنجاح', 'success')
        return redirect(url_for('main.users'))
        
    return render_template('users/add.html', form=form)

@main_bp.route('/users/<int:id>/toggle_status', methods=['POST'])
@login_required
def toggle_user_status(id):
    if not current_user.can_manage_users:
        flash('ليس لديك صلاحية للوصول لهذه الصفحة', 'danger')
        return redirect(url_for('main.dashboard'))
        
    user = User.query.get_or_404(id)
    
    # Don't allow deactivating your own account
    if user.id == current_user.id:
        flash('لا يمكنك تعطيل حسابك الشخصي', 'danger')
        return redirect(url_for('main.users'))
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = "تنشيط" if user.is_active else "تعطيل"
    flash(f'تم {status} الحساب بنجاح', 'success')
    return redirect(url_for('main.users'))
