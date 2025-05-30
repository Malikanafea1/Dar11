import { 
  type Patient, type InsertPatient,
  type Staff, type InsertStaff,
  type Expense, type InsertExpense,
  type Payment, type InsertPayment,
  type User, type InsertUser,
  type Settings, type InsertSettings,
  type Payroll, type InsertPayroll,
  type Bonus, type InsertBonus,
  type Advance, type InsertAdvance,
  type Deduction, type InsertDeduction
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  updateLastLogin(userId: string): Promise<void>;

  // Patient methods
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient>;
  deletePatient(id: string): Promise<void>;
  getActivePatients(): Promise<Patient[]>;
  
  // Staff methods
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, updates: Partial<Staff>): Promise<Staff>;
  getActiveStaff(): Promise<Staff[]>;
  
  // Expense methods
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  
  // Payment methods
  getPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByPatient(patientId: string): Promise<Payment[]>;
  
  // Payroll methods
  getPayrolls(): Promise<Payroll[]>;
  getPayroll(id: string): Promise<Payroll | undefined>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll>;
  getPayrollsByStaff(staffId: string): Promise<Payroll[]>;
  getPayrollsByMonth(month: string): Promise<Payroll[]>;
  
  // Bonus methods
  getBonuses(): Promise<Bonus[]>;
  getBonus(id: string): Promise<Bonus | undefined>;
  createBonus(bonus: InsertBonus): Promise<Bonus>;
  updateBonus(id: string, updates: Partial<Bonus>): Promise<Bonus>;
  getBonusesByStaff(staffId: string): Promise<Bonus[]>;
  
  // Advance methods
  getAdvances(): Promise<Advance[]>;
  getAdvance(id: string): Promise<Advance | undefined>;
  createAdvance(advance: InsertAdvance): Promise<Advance>;
  updateAdvance(id: string, updates: Partial<Advance>): Promise<Advance>;
  getAdvancesByStaff(staffId: string): Promise<Advance[]>;
  
  // Deduction methods
  getDeductions(): Promise<Deduction[]>;
  getDeduction(id: string): Promise<Deduction | undefined>;
  createDeduction(deduction: InsertDeduction): Promise<Deduction>;
  updateDeduction(id: string, updates: Partial<Deduction>): Promise<Deduction>;
  getDeductionsByStaff(staffId: string): Promise<Deduction[]>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  updateSettings(updates: Partial<InsertSettings>): Promise<Settings>;
  
  // Database management methods
  createBackup(): Promise<any>;
  resetDatabase(): Promise<void>;
  importBackup(data: any): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    currentPatients: number;
    activeStaff: number;
    dailyRevenue: number;
    occupancyRate: number;
    dailyIncome: number;
    dailyExpenses: number;
    netProfit: number;
    pendingPayments: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private staff: Map<string, Staff>;
  private expenses: Map<string, Expense>;
  private payments: Map<string, Payment>;
  private payrolls: Map<string, Payroll>;
  private bonuses: Map<string, Bonus>;
  private advances: Map<string, Advance>;
  private deductions: Map<string, Deduction>;
  private settings: Settings | undefined;
  private currentUserId: number;
  private currentPatientId: number;
  private currentStaffId: number;
  private currentExpenseId: number;
  private currentPaymentId: number;
  private currentPayrollId: number;
  private currentBonusId: number;
  private currentAdvanceId: number;
  private currentDeductionId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.staff = new Map();
    this.expenses = new Map();
    this.payments = new Map();
    this.payrolls = new Map();
    this.bonuses = new Map();
    this.advances = new Map();
    this.deductions = new Map();
    this.settings = {
      id: "1",
      username: "مسؤول النظام",
      email: "admin@hospital.com",
      phone: "01234567890",
      hospitalName: "مركز دار الحياة لعلاج الإدمان",
      defaultCurrency: "ج.م",
      patientAlerts: true,
      paymentAlerts: true,
      staffAlerts: true,
      financialAlerts: true,
      autoBackup: true,
      dataCompression: false,
      updatedAt: new Date().toISOString()
    };
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentStaffId = 1;
    this.currentExpenseId = 1;
    this.currentPaymentId = 1;
    this.currentPayrollId = 1;
    this.currentBonusId = 1;
    this.currentAdvanceId = 1;
    this.currentDeductionId = 1;
    
    // إنشاء المدير الافتراضي
    this.createDefaultAdmin();
  }

  private createDefaultAdmin() {
    const defaultAdmin: User = {
      id: "1",
      username: "عاطف نافع",
      password: "123456",
      fullName: "عاطف نافع",
      role: "admin",
      permissions: ["all"],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set("1", defaultAdmin);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId.toString();
    this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("المستخدم غير موجود");
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  async updateLastLogin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.users.set(userId, user);
    }
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId.toString();
    this.currentPatientId++;
    const patient: Patient = { 
      ...insertPatient, 
      id,
      totalPaid: 0,
      dischargeDate: undefined
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error("Patient not found");
    }
    const updated = { ...patient, ...updates };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: string): Promise<void> {
    if (!this.patients.has(id)) {
      throw new Error("Patient not found");
    }
    this.patients.delete(id);
  }

  async getActivePatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(p => p.status === "active");
  }

  // Staff methods
  async getStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.currentStaffId.toString();
    this.currentStaffId++;
    const staff: Staff = { ...insertStaff, id };
    this.staff.set(id, staff);
    return staff;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    const staff = this.staff.get(id);
    if (!staff) {
      throw new Error("Staff member not found");
    }
    const updated = { ...staff, ...updates };
    this.staff.set(id, updated);
    return updated;
  }

  async getActiveStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter(s => s.isActive);
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId.toString();
    this.currentExpenseId++;
    const expense: Expense = { ...insertExpense, id };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new Error("Expense not found");
    }
    const updated = { ...expense, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    if (!this.expenses.has(id)) {
      throw new Error("Expense not found");
    }
    this.expenses.delete(id);
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId.toString();
    this.currentPaymentId++;
    const payment: Payment = { ...insertPayment, id };
    this.payments.set(id, payment);
    
    // Update patient's total paid amount
    const patient = this.patients.get(insertPayment.patientId);
    if (patient) {
      const currentTotal = patient.totalPaid || 0;
      const newTotal = currentTotal + insertPayment.amount;
      patient.totalPaid = newTotal;
      this.patients.set(patient.id, patient);
    }
    
    return payment;
  }

  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.patientId === patientId);
  }

  // Dashboard stats
  async getDashboardStats() {
    const activePatients = await this.getActivePatients();
    const activeStaff = await this.getActiveStaff();
    const allExpenses = await this.getExpenses();
    const allPayments = await this.getPayments();
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayExpenses = allExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfDay && expenseDate < endOfDay;
    });
    
    const todayPayments = allPayments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= startOfDay && paymentDate < endOfDay;
    });
    
    const dailyExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dailyIncome = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate pending payments (estimated cost - total paid for active patients)
    const pendingPayments = activePatients.reduce((sum, patient) => {
      const daysSinceAdmission = Math.ceil((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
      const estimatedCost = daysSinceAdmission * patient.dailyCost;
      const totalPaid = patient.totalPaid || 0;
      return sum + Math.max(0, estimatedCost - totalPaid);
    }, 0);

    return {
      currentPatients: activePatients.length,
      activeStaff: activeStaff.length,
      dailyRevenue: dailyIncome,
      occupancyRate: Math.min(100, (activePatients.length / 100) * 100), // Assuming 100 total beds
      dailyIncome,
      dailyExpenses,
      netProfit: dailyIncome - dailyExpenses,
      pendingPayments
    };
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    if (!this.settings) {
      this.settings = {
        id: "1",
        username: updates.username || "مسؤول النظام",
        email: updates.email || "admin@hospital.com",
        phone: updates.phone || "01234567890",
        hospitalName: updates.hospitalName || "مركز دار الحياة لعلاج الإدمان",
        defaultCurrency: updates.defaultCurrency || "ج.م",
        patientAlerts: updates.patientAlerts ?? true,
        paymentAlerts: updates.paymentAlerts ?? true,
        staffAlerts: updates.staffAlerts ?? true,
        financialAlerts: updates.financialAlerts ?? true,
        autoBackup: updates.autoBackup ?? true,
        dataCompression: updates.dataCompression ?? false,
        updatedAt: new Date().toISOString()
      };
    } else {
      this.settings = {
        ...this.settings,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
    return this.settings;
  }

  // Database management methods
  async createBackup(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        patients: Array.from(this.patients.values()),
        staff: Array.from(this.staff.values()),
        expenses: Array.from(this.expenses.values()),
        payments: Array.from(this.payments.values()),
        settings: this.settings
      }
    };
  }

  async resetDatabase(): Promise<void> {
    this.patients.clear();
    this.staff.clear();
    this.expenses.clear();
    this.payments.clear();
    this.settings = {
      id: "1",
      username: "مسؤول النظام",
      email: "admin@hospital.com",
      phone: "01234567890",
      hospitalName: "مركز دار الحياة لعلاج الإدمان",
      defaultCurrency: "ج.م",
      patientAlerts: true,
      paymentAlerts: true,
      staffAlerts: true,
      financialAlerts: true,
      autoBackup: true,
      dataCompression: false,
      updatedAt: new Date().toISOString()
    };
    
    // Reset counters
    this.currentPatientId = 1;
    this.currentStaffId = 1;
    this.currentExpenseId = 1;
    this.currentPaymentId = 1;
  }

  async importBackup(backupData: any): Promise<void> {
    if (!backupData.data) {
      throw new Error("Invalid backup format");
    }

    // Clear existing data
    await this.resetDatabase();

    // Import data
    const { patients, staff, expenses, payments, settings } = backupData.data;

    if (patients) {
      patients.forEach((patient: Patient) => {
        this.patients.set(patient.id, patient);
      });
      // Update counter to avoid ID conflicts
      this.currentPatientId = Math.max(...patients.map((p: Patient) => parseInt(p.id)), 0) + 1;
    }

    if (staff) {
      staff.forEach((staffMember: Staff) => {
        this.staff.set(staffMember.id, staffMember);
      });
      this.currentStaffId = Math.max(...staff.map((s: Staff) => parseInt(s.id)), 0) + 1;
    }

    if (expenses) {
      expenses.forEach((expense: Expense) => {
        this.expenses.set(expense.id, expense);
      });
      this.currentExpenseId = Math.max(...expenses.map((e: Expense) => parseInt(e.id)), 0) + 1;
    }

    if (payments) {
      payments.forEach((payment: Payment) => {
        this.payments.set(payment.id, payment);
      });
      this.currentPaymentId = Math.max(...payments.map((p: Payment) => parseInt(p.id)), 0) + 1;
    }

    if (settings) {
      this.settings = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Payroll methods
  async getPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values());
  }

  async getPayroll(id: string): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }

  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    const id = this.currentPayrollId.toString();
    this.currentPayrollId++;
    
    const payroll: Payroll = { 
      ...insertPayroll, 
      id,
      createdAt: new Date().toISOString()
    };
    this.payrolls.set(id, payroll);
    return payroll;
  }

  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll> {
    const existing = this.payrolls.get(id);
    if (!existing) throw new Error("Payroll not found");
    
    const updated = { ...existing, ...updates };
    this.payrolls.set(id, updated);
    return updated;
  }

  async getPayrollsByStaff(staffId: string): Promise<Payroll[]> {
    return Array.from(this.payrolls.values()).filter(p => p.staffId === staffId);
  }

  async getPayrollsByMonth(month: string): Promise<Payroll[]> {
    return Array.from(this.payrolls.values()).filter(p => p.month === month);
  }

  // Bonus methods
  async getBonuses(): Promise<Bonus[]> {
    return Array.from(this.bonuses.values());
  }

  async getBonus(id: string): Promise<Bonus | undefined> {
    return this.bonuses.get(id);
  }

  async createBonus(insertBonus: InsertBonus): Promise<Bonus> {
    const id = this.currentBonusId.toString();
    this.currentBonusId++;
    
    const bonus: Bonus = { 
      ...insertBonus, 
      id,
      createdAt: new Date().toISOString()
    };
    this.bonuses.set(id, bonus);
    return bonus;
  }

  async updateBonus(id: string, updates: Partial<Bonus>): Promise<Bonus> {
    const existing = this.bonuses.get(id);
    if (!existing) throw new Error("Bonus not found");
    
    const updated = { ...existing, ...updates };
    this.bonuses.set(id, updated);
    return updated;
  }

  async getBonusesByStaff(staffId: string): Promise<Bonus[]> {
    return Array.from(this.bonuses.values()).filter(b => b.staffId === staffId);
  }

  // Advance methods
  async getAdvances(): Promise<Advance[]> {
    return Array.from(this.advances.values());
  }

  async getAdvance(id: string): Promise<Advance | undefined> {
    return this.advances.get(id);
  }

  async createAdvance(insertAdvance: InsertAdvance): Promise<Advance> {
    const id = this.currentAdvanceId.toString();
    this.currentAdvanceId++;
    
    const monthlyDeduction = insertAdvance.amount / insertAdvance.repaymentMonths;
    
    const advance: Advance = { 
      ...insertAdvance, 
      id,
      requestDate: new Date().toISOString(),
      status: "pending",
      monthlyDeduction,
      remainingAmount: insertAdvance.amount,
      createdAt: new Date().toISOString()
    };
    this.advances.set(id, advance);
    return advance;
  }

  async updateAdvance(id: string, updates: Partial<Advance>): Promise<Advance> {
    const existing = this.advances.get(id);
    if (!existing) throw new Error("Advance not found");
    
    const updated = { ...existing, ...updates };
    this.advances.set(id, updated);
    return updated;
  }

  async getAdvancesByStaff(staffId: string): Promise<Advance[]> {
    return Array.from(this.advances.values()).filter(a => a.staffId === staffId);
  }

  // Deduction methods
  async getDeductions(): Promise<Deduction[]> {
    return Array.from(this.deductions.values());
  }

  async getDeduction(id: string): Promise<Deduction | undefined> {
    return this.deductions.get(id);
  }

  async createDeduction(insertDeduction: InsertDeduction): Promise<Deduction> {
    const id = this.currentDeductionId.toString();
    this.currentDeductionId++;
    
    const deduction: Deduction = { 
      ...insertDeduction, 
      id,
      createdAt: new Date().toISOString()
    };
    this.deductions.set(id, deduction);
    return deduction;
  }

  async updateDeduction(id: string, updates: Partial<Deduction>): Promise<Deduction> {
    const existing = this.deductions.get(id);
    if (!existing) throw new Error("Deduction not found");
    
    const updated = { ...existing, ...updates };
    this.deductions.set(id, updated);
    return updated;
  }

  async getDeductionsByStaff(staffId: string): Promise<Deduction[]> {
    return Array.from(this.deductions.values()).filter(d => d.staffId === staffId);
  }
}

import { FirebaseStorage } from "./firebaseStorage";

export const storage = new FirebaseStorage();