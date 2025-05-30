import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { IStorage } from "./storage";
import type { 
  Patient, InsertPatient,
  Staff, InsertStaff,
  Expense, InsertExpense,
  Payment, InsertPayment,
  User, InsertUser,
  Settings, InsertSettings,
  Payroll, InsertPayroll,
  Bonus, InsertBonus,
  Advance, InsertAdvance,
  Deduction, InsertDeduction
} from "@shared/schema";

export class FirebaseStorage implements IStorage {
  
  constructor() {
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    try {
      // التحقق من وجود المدير الافتراضي
      const existingAdmin = await this.getUserByUsername("عاطف نافع");
      
      if (!existingAdmin) {
        // إنشاء المدير الافتراضي
        await this.createUser({
          username: "عاطف نافع",
          password: "123456",
          fullName: "عاطف نافع",
          role: "admin",
          permissions: ["all"],
          isActive: true,
        });
        console.log("تم إنشاء المدير الافتراضي بنجاح");
      }
    } catch (error) {
      console.error("خطأ في إنشاء المدير الافتراضي:", error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(db, "users", id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return { 
          id, 
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin
        } as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        return { 
          id: userDoc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin
        } as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const userDoc = await addDoc(collection(db, "users"), {
        ...insertUser,
        createdAt: serverTimestamp()
      });
      return { 
        id: userDoc.id, 
        ...insertUser,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, updates);
      
      const updatedUser = await this.getUser(id);
      if (!updatedUser) {
        throw new Error("المستخدم غير موجود");
      }
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin
        };
      }) as User[];
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin
        };
      }) as User[];
    } catch (error) {
      console.error("Error getting active users:", error);
      return [];
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    try {
      const q = query(collection(db, "patients"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
    } catch (error) {
      console.error("Error getting patients:", error);
      return [];
    }
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    try {
      const patientDoc = await getDoc(doc(db, "patients", id));
      if (patientDoc.exists()) {
        return { id, ...patientDoc.data() } as Patient;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting patient:", error);
      return undefined;
    }
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    try {
      // Remove undefined values to avoid Firebase validation errors
      const patientData = {
        ...insertPatient,
        totalPaid: 0,
        createdAt: serverTimestamp()
      };
      
      const patientDoc = await addDoc(collection(db, "patients"), patientData);
      return { 
        id: patientDoc.id, 
        ...insertPatient, 
        totalPaid: 0
      } as Patient;
    } catch (error) {
      console.error("Error creating patient:", error);
      throw new Error("Failed to create patient");
    }
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    try {
      const patientRef = doc(db, "patients", id);
      await updateDoc(patientRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      const updatedPatient = await this.getPatient(id);
      if (!updatedPatient) {
        throw new Error("Patient not found after update");
      }
      return updatedPatient;
    } catch (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
  }

  async deletePatient(id: string): Promise<void> {
    try {
      const patientRef = doc(db, "patients", id);
      await deleteDoc(patientRef);
    } catch (error) {
      console.error("Error deleting patient:", error);
      throw new Error("Failed to delete patient");
    }
  }

  async getActivePatients(): Promise<Patient[]> {
    try {
      const q = query(collection(db, "patients"), where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
    } catch (error) {
      console.error("Error getting active patients:", error);
      return [];
    }
  }

  // Staff methods
  async getStaff(): Promise<Staff[]> {
    try {
      const q = query(collection(db, "staff"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
    } catch (error) {
      console.error("Error getting staff:", error);
      return [];
    }
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    try {
      const staffDoc = await getDoc(doc(db, "staff", id));
      if (staffDoc.exists()) {
        return { id, ...staffDoc.data() } as Staff;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting staff member:", error);
      return undefined;
    }
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    try {
      const staffData = {
        ...insertStaff,
        createdAt: serverTimestamp()
      };
      const staffDoc = await addDoc(collection(db, "staff"), staffData);
      return { id: staffDoc.id, ...insertStaff } as Staff;
    } catch (error) {
      console.error("Error creating staff:", error);
      throw error;
    }
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    try {
      const staffRef = doc(db, "staff", id);
      await updateDoc(staffRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      const updatedStaff = await this.getStaffMember(id);
      if (!updatedStaff) {
        throw new Error("Staff member not found after update");
      }
      return updatedStaff;
    } catch (error) {
      console.error("Error updating staff:", error);
      throw error;
    }
  }

  async getActiveStaff(): Promise<Staff[]> {
    try {
      const q = query(collection(db, "staff"), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
    } catch (error) {
      console.error("Error getting active staff:", error);
      return [];
    }
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    try {
      const q = query(collection(db, "expenses"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
    } catch (error) {
      console.error("Error getting expenses:", error);
      return [];
    }
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    try {
      const expenseDoc = await getDoc(doc(db, "expenses", id));
      if (expenseDoc.exists()) {
        return { id, ...expenseDoc.data() } as Expense;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting expense:", error);
      return undefined;
    }
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    try {
      const expenseData = {
        ...insertExpense,
        createdAt: serverTimestamp()
      };
      const expenseDoc = await addDoc(collection(db, "expenses"), expenseData);
      return { id: expenseDoc.id, ...insertExpense } as Expense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const expenseRef = doc(db, "expenses", id);
      await updateDoc(expenseRef, updates);
      const updatedExpense = await this.getExpense(id);
      if (!updatedExpense) {
        throw new Error("Expense not found after update");
      }
      return updatedExpense;
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      const expenseRef = doc(db, "expenses", id);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, "expenses"), 
        where("date", ">=", startDate.toISOString()),
        where("date", "<=", endDate.toISOString()),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
    } catch (error) {
      console.error("Error getting expenses by date range:", error);
      return [];
    }
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    try {
      const q = query(collection(db, "payments"), orderBy("paymentDate", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error("Error getting payments:", error);
      return [];
    }
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    try {
      const paymentDoc = await getDoc(doc(db, "payments", id));
      if (paymentDoc.exists()) {
        return { id, ...paymentDoc.data() } as Payment;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting payment:", error);
      return undefined;
    }
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      const paymentData = {
        ...insertPayment,
        createdAt: serverTimestamp()
      };
      const paymentDoc = await addDoc(collection(db, "payments"), paymentData);
      
      // تحديث المبلغ المدفوع للمريض
      const patient = await this.getPatient(insertPayment.patientId);
      if (patient) {
        const currentTotal = patient.totalPaid || 0;
        const newTotal = currentTotal + insertPayment.amount;
        await this.updatePatient(patient.id, { totalPaid: newTotal });
      }
      
      return { id: paymentDoc.id, ...insertPayment } as Payment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, "payments"), 
        where("patientId", "==", patientId),
        orderBy("paymentDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error("Error getting payments by patient:", error);
      return [];
    }
  }

  // Dashboard stats
  async getDashboardStats() {
    try {
      const [activePatients, activeStaff, allExpenses, allPayments] = await Promise.all([
        this.getActivePatients(),
        this.getActiveStaff(),
        this.getExpenses(),
        this.getPayments()
      ]);

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

      // حساب المدفوعات المعلقة
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
        occupancyRate: Math.min(100, (activePatients.length / 100) * 100),
        dailyIncome,
        dailyExpenses,
        netProfit: dailyIncome - dailyExpenses,
        pendingPayments
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        currentPatients: 0,
        activeStaff: 0,
        dailyRevenue: 0,
        occupancyRate: 0,
        dailyIncome: 0,
        dailyExpenses: 0,
        netProfit: 0,
        pendingPayments: 0
      };
    }
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "main"));
      if (settingsDoc.exists()) {
        return {
          id: settingsDoc.id,
          ...settingsDoc.data()
        } as Settings;
      }
      // إنشاء إعدادات افتراضية إذا لم توجد
      const defaultSettings: InsertSettings = {
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
        dataCompression: false
      };
      const newSettings = await this.updateSettings(defaultSettings);
      return newSettings;
    } catch (error) {
      console.error("Error getting settings:", error);
      return undefined;
    }
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    try {
      const settingsRef = doc(db, "settings", "main");
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(settingsRef, updatedData, { merge: true });
      
      const updatedSettings = await this.getSettings();
      if (!updatedSettings) {
        throw new Error("Settings not found after update");
      }
      return updatedSettings;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }

  // Database management methods
  async createBackup(): Promise<any> {
    try {
      const [patients, staff, expenses, payments, settings] = await Promise.all([
        this.getPatients(),
        this.getStaff(),
        this.getExpenses(),
        this.getPayments(),
        this.getSettings()
      ]);

      return {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          patients,
          staff,
          expenses,
          payments,
          settings
        }
      };
    } catch (error) {
      console.error("Error creating backup:", error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      // Delete all collections
      const collections = ['patients', 'staff', 'expenses', 'payments'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        const batch = [];
        
        for (const doc of snapshot.docs) {
          batch.push(deleteDoc(doc.ref));
        }
        
        await Promise.all(batch);
      }

      // Reset settings to default
      const defaultSettings: InsertSettings = {
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
        dataCompression: false
      };

      await this.updateSettings(defaultSettings);
      
    } catch (error) {
      console.error("Error resetting database:", error);
      throw error;
    }
  }

  async importBackup(backupData: any): Promise<void> {
    try {
      if (!backupData.data) {
        throw new Error("Invalid backup format");
      }

      // Reset database first
      await this.resetDatabase();

      const { patients, staff, expenses, payments, settings } = backupData.data;

      // Import patients
      if (patients && Array.isArray(patients)) {
        for (const patient of patients) {
          const patientRef = doc(db, "patients", patient.id);
          await setDoc(patientRef, patient);
        }
      }

      // Import staff
      if (staff && Array.isArray(staff)) {
        for (const staffMember of staff) {
          const staffRef = doc(db, "staff", staffMember.id);
          await setDoc(staffRef, staffMember);
        }
      }

      // Import expenses
      if (expenses && Array.isArray(expenses)) {
        for (const expense of expenses) {
          const expenseRef = doc(db, "expenses", expense.id);
          await setDoc(expenseRef, expense);
        }
      }

      // Import payments
      if (payments && Array.isArray(payments)) {
        for (const payment of payments) {
          const paymentRef = doc(db, "payments", payment.id);
          await setDoc(paymentRef, payment);
        }
      }

      // Import settings
      if (settings) {
        await this.updateSettings(settings);
      }

    } catch (error) {
      console.error("Error importing backup:", error);
      throw error;
    }
  }

  // Payroll methods
  async getPayrolls(): Promise<Payroll[]> {
    try {
      const snapshot = await getDocs(collection(db, "payrolls"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payroll[];
    } catch (error) {
      console.error("Error getting payrolls:", error);
      return [];
    }
  }

  async getPayroll(id: string): Promise<Payroll | undefined> {
    try {
      const payrollDoc = await getDoc(doc(db, "payrolls", id));
      if (payrollDoc.exists()) {
        return {
          id: payrollDoc.id,
          ...payrollDoc.data()
        } as Payroll;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting payroll:", error);
      return undefined;
    }
  }

  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    try {
      const payrollData = {
        ...insertPayroll,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "payrolls"), payrollData);
      
      return {
        id: docRef.id,
        ...payrollData
      } as Payroll;
    } catch (error) {
      console.error("Error creating payroll:", error);
      throw error;
    }
  }

  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll> {
    try {
      const payrollRef = doc(db, "payrolls", id);
      await updateDoc(payrollRef, updates);
      
      const updatedPayroll = await this.getPayroll(id);
      if (!updatedPayroll) {
        throw new Error("Payroll not found after update");
      }
      return updatedPayroll;
    } catch (error) {
      console.error("Error updating payroll:", error);
      throw error;
    }
  }

  async getPayrollsByStaff(staffId: string): Promise<Payroll[]> {
    try {
      const q = query(collection(db, "payrolls"), where("staffId", "==", staffId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payroll[];
    } catch (error) {
      console.error("Error getting payrolls by staff:", error);
      return [];
    }
  }

  async getPayrollsByMonth(month: string): Promise<Payroll[]> {
    try {
      const q = query(collection(db, "payrolls"), where("month", "==", month));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payroll[];
    } catch (error) {
      console.error("Error getting payrolls by month:", error);
      return [];
    }
  }

  // Bonus methods
  async getBonuses(): Promise<Bonus[]> {
    try {
      const snapshot = await getDocs(collection(db, "bonuses"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bonus[];
    } catch (error) {
      console.error("Error getting bonuses:", error);
      return [];
    }
  }

  async getBonus(id: string): Promise<Bonus | undefined> {
    try {
      const bonusDoc = await getDoc(doc(db, "bonuses", id));
      if (bonusDoc.exists()) {
        return {
          id: bonusDoc.id,
          ...bonusDoc.data()
        } as Bonus;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting bonus:", error);
      return undefined;
    }
  }

  async createBonus(insertBonus: InsertBonus): Promise<Bonus> {
    try {
      const bonusData = {
        ...insertBonus,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "bonuses"), bonusData);
      
      return {
        id: docRef.id,
        ...bonusData
      } as Bonus;
    } catch (error) {
      console.error("Error creating bonus:", error);
      throw error;
    }
  }

  async updateBonus(id: string, updates: Partial<Bonus>): Promise<Bonus> {
    try {
      const bonusRef = doc(db, "bonuses", id);
      await updateDoc(bonusRef, updates);
      
      const updatedBonus = await this.getBonus(id);
      if (!updatedBonus) {
        throw new Error("Bonus not found after update");
      }
      return updatedBonus;
    } catch (error) {
      console.error("Error updating bonus:", error);
      throw error;
    }
  }

  async getBonusesByStaff(staffId: string): Promise<Bonus[]> {
    try {
      const q = query(collection(db, "bonuses"), where("staffId", "==", staffId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bonus[];
    } catch (error) {
      console.error("Error getting bonuses by staff:", error);
      return [];
    }
  }

  // Advance methods
  async getAdvances(): Promise<Advance[]> {
    try {
      const snapshot = await getDocs(collection(db, "advances"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advance[];
    } catch (error) {
      console.error("Error getting advances:", error);
      return [];
    }
  }

  async getAdvance(id: string): Promise<Advance | undefined> {
    try {
      const advanceDoc = await getDoc(doc(db, "advances", id));
      if (advanceDoc.exists()) {
        return {
          id: advanceDoc.id,
          ...advanceDoc.data()
        } as Advance;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting advance:", error);
      return undefined;
    }
  }

  async createAdvance(insertAdvance: InsertAdvance): Promise<Advance> {
    try {
      const monthlyDeduction = insertAdvance.amount / insertAdvance.repaymentMonths;
      
      const advanceData = {
        ...insertAdvance,
        requestDate: new Date().toISOString(),
        status: "pending" as const,
        monthlyDeduction,
        remainingAmount: insertAdvance.amount,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "advances"), advanceData);
      
      return {
        id: docRef.id,
        ...advanceData
      } as Advance;
    } catch (error) {
      console.error("Error creating advance:", error);
      throw error;
    }
  }

  async updateAdvance(id: string, updates: Partial<Advance>): Promise<Advance> {
    try {
      const advanceRef = doc(db, "advances", id);
      await updateDoc(advanceRef, updates);
      
      const updatedAdvance = await this.getAdvance(id);
      if (!updatedAdvance) {
        throw new Error("Advance not found after update");
      }
      return updatedAdvance;
    } catch (error) {
      console.error("Error updating advance:", error);
      throw error;
    }
  }

  async getAdvancesByStaff(staffId: string): Promise<Advance[]> {
    try {
      const q = query(collection(db, "advances"), where("staffId", "==", staffId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advance[];
    } catch (error) {
      console.error("Error getting advances by staff:", error);
      return [];
    }
  }

  // Deduction methods
  async getDeductions(): Promise<Deduction[]> {
    try {
      const snapshot = await getDocs(collection(db, "deductions"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deduction[];
    } catch (error) {
      console.error("Error getting deductions:", error);
      return [];
    }
  }

  async getDeduction(id: string): Promise<Deduction | undefined> {
    try {
      const deductionDoc = await getDoc(doc(db, "deductions", id));
      if (deductionDoc.exists()) {
        return {
          id: deductionDoc.id,
          ...deductionDoc.data()
        } as Deduction;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting deduction:", error);
      return undefined;
    }
  }

  async createDeduction(insertDeduction: InsertDeduction): Promise<Deduction> {
    try {
      const deductionData = {
        ...insertDeduction,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "deductions"), deductionData);
      
      return {
        id: docRef.id,
        ...deductionData
      } as Deduction;
    } catch (error) {
      console.error("Error creating deduction:", error);
      throw error;
    }
  }

  async updateDeduction(id: string, updates: Partial<Deduction>): Promise<Deduction> {
    try {
      const deductionRef = doc(db, "deductions", id);
      await updateDoc(deductionRef, updates);
      
      const updatedDeduction = await this.getDeduction(id);
      if (!updatedDeduction) {
        throw new Error("Deduction not found after update");
      }
      return updatedDeduction;
    } catch (error) {
      console.error("Error updating deduction:", error);
      throw error;
    }
  }

  async getDeductionsByStaff(staffId: string): Promise<Deduction[]> {
    try {
      const q = query(collection(db, "deductions"), where("staffId", "==", staffId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deduction[];
    } catch (error) {
      console.error("Error getting deductions by staff:", error);
      return [];
    }
  }
}