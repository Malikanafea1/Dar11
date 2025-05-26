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
  getDoc
} from "firebase/firestore";
import { db } from "../client/src/lib/firebase";
import { IStorage } from "./storage";
import type { 
  Patient, InsertPatient,
  Staff, InsertStaff,
  Expense, InsertExpense,
  Payment, InsertPayment,
  User, InsertUser 
} from "@shared/schema";

export class FirebaseStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(db, "users", id.toString()));
      if (userDoc.exists()) {
        return { id, ...userDoc.data() } as User;
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
        return { id: parseInt(userDoc.id), ...userDoc.data() } as User;
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
      return { id: parseInt(userDoc.id), ...insertUser };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    try {
      const q = query(collection(db, "patients"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Patient[];
    } catch (error) {
      console.error("Error getting patients:", error);
      return [];
    }
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    try {
      const patientDoc = await getDoc(doc(db, "patients", id.toString()));
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
      const patientData = {
        ...insertPatient,
        totalPaid: "0",
        dischargeDate: null,
        createdAt: serverTimestamp()
      };
      const patientDoc = await addDoc(collection(db, "patients"), patientData);
      return { id: parseInt(patientDoc.id), ...patientData } as Patient;
    } catch (error) {
      console.error("Error creating patient:", error);
      throw error;
    }
  }

  async updatePatient(id: number, updates: Partial<Patient>): Promise<Patient> {
    try {
      const patientRef = doc(db, "patients", id.toString());
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

  async getActivePatients(): Promise<Patient[]> {
    try {
      const q = query(collection(db, "patients"), where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
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
        id: parseInt(doc.id),
        ...doc.data()
      })) as Staff[];
    } catch (error) {
      console.error("Error getting staff:", error);
      return [];
    }
  }

  async getStaffMember(id: number): Promise<Staff | undefined> {
    try {
      const staffDoc = await getDoc(doc(db, "staff", id.toString()));
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
      return { id: parseInt(staffDoc.id), ...staffData } as Staff;
    } catch (error) {
      console.error("Error creating staff:", error);
      throw error;
    }
  }

  async updateStaff(id: number, updates: Partial<Staff>): Promise<Staff> {
    try {
      const staffRef = doc(db, "staff", id.toString());
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
        id: parseInt(doc.id),
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
        id: parseInt(doc.id),
        ...doc.data()
      })) as Expense[];
    } catch (error) {
      console.error("Error getting expenses:", error);
      return [];
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const expenseDoc = await getDoc(doc(db, "expenses", id.toString()));
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
      return { id: parseInt(expenseDoc.id), ...expenseData } as Expense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, "expenses"), 
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
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
        id: parseInt(doc.id),
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error("Error getting payments:", error);
      return [];
    }
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const paymentDoc = await getDoc(doc(db, "payments", id.toString()));
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
        const currentTotal = parseFloat(patient.totalPaid || "0");
        const newTotal = currentTotal + parseFloat(insertPayment.amount);
        await this.updatePatient(patient.id, { totalPaid: newTotal.toString() });
      }
      
      return { id: parseInt(paymentDoc.id), ...paymentData } as Payment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  async getPaymentsByPatient(patientId: number): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, "payments"), 
        where("patientId", "==", patientId),
        orderBy("paymentDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
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

      const dailyExpenses = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const dailyIncome = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // حساب المدفوعات المعلقة
      const pendingPayments = activePatients.reduce((sum, patient) => {
        const daysSinceAdmission = Math.ceil((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
        const estimatedCost = daysSinceAdmission * parseFloat(patient.dailyCost);
        const totalPaid = parseFloat(patient.totalPaid || "0");
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
}