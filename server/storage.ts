import { 
  type Patient, type InsertPatient,
  type Staff, type InsertStaff,
  type Expense, type InsertExpense,
  type Payment, type InsertPayment,
  type User, type InsertUser,
  type Settings, type InsertSettings
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Patient methods
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient>;
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
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  
  // Payment methods
  getPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByPatient(patientId: string): Promise<Payment[]>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  updateSettings(updates: Partial<InsertSettings>): Promise<Settings>;
  
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
  private currentUserId: number;
  private currentPatientId: number;
  private currentStaffId: number;
  private currentExpenseId: number;
  private currentPaymentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.staff = new Map();
    this.expenses = new Map();
    this.payments = new Map();
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentStaffId = 1;
    this.currentExpenseId = 1;
    this.currentPaymentId = 1;
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

import { FirebaseStorage } from "./firebaseStorage";

export const storage = new FirebaseStorage();