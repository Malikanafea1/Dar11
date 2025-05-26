import { useState, useEffect } from "react";
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
  onSnapshot
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Patient, Staff, Expense, Payment } from "@shared/schema";

export const useFirebaseData = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // الاستماع للتغييرات في الوقت الفعلي للمرضى
    const unsubscribePatients = onSnapshot(
      query(collection(db, "patients"), orderBy("name")),
      (snapshot) => {
        const patientsData = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as Patient[];
        setPatients(patientsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients:", error);
        setLoading(false);
      }
    );

    // الاستماع للتغييرات في الوقت الفعلي للموظفين
    const unsubscribeStaff = onSnapshot(
      query(collection(db, "staff"), orderBy("name")),
      (snapshot) => {
        const staffData = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as Staff[];
        setStaff(staffData);
      },
      (error) => {
        console.error("Error fetching staff:", error);
      }
    );

    // الاستماع للتغييرات في الوقت الفعلي للمصروفات
    const unsubscribeExpenses = onSnapshot(
      query(collection(db, "expenses"), orderBy("date", "desc")),
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as Expense[];
        setExpenses(expensesData);
      },
      (error) => {
        console.error("Error fetching expenses:", error);
      }
    );

    // الاستماع للتغييرات في الوقت الفعلي للمدفوعات
    const unsubscribePayments = onSnapshot(
      query(collection(db, "payments"), orderBy("paymentDate", "desc")),
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as Payment[];
        setPayments(paymentsData);
      },
      (error) => {
        console.error("Error fetching payments:", error);
      }
    );

    // تنظيف المستمعين عند إلغاء تحميل المكون
    return () => {
      unsubscribePatients();
      unsubscribeStaff();
      unsubscribeExpenses();
      unsubscribePayments();
    };
  }, []);

  // دوال إضافة البيانات
  const addPatient = async (patientData: any) => {
    try {
      await addDoc(collection(db, "patients"), {
        ...patientData,
        totalPaid: "0",
        status: "active",
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error adding patient:", error);
      throw error;
    }
  };

  const addStaff = async (staffData: any) => {
    try {
      await addDoc(collection(db, "staff"), {
        ...staffData,
        isActive: true,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error adding staff:", error);
      throw error;
    }
  };

  const addExpense = async (expenseData: any) => {
    try {
      await addDoc(collection(db, "expenses"), {
        ...expenseData,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  };

  const addPayment = async (paymentData: any) => {
    try {
      await addDoc(collection(db, "payments"), {
        ...paymentData,
        createdAt: serverTimestamp()
      });
      
      // تحديث المبلغ المدفوع للمريض
      const patient = patients.find(p => p.id === paymentData.patientId);
      if (patient) {
        const currentTotal = parseFloat(patient.totalPaid || "0");
        const newTotal = currentTotal + parseFloat(paymentData.amount);
        await updateDoc(doc(db, "patients", patient.id.toString()), {
          totalPaid: newTotal.toString()
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
  };

  // دوال تحديث البيانات
  const updatePatient = async (patientId: number, updates: any) => {
    try {
      await updateDoc(doc(db, "patients", patientId.toString()), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
  };

  const updateStaff = async (staffId: number, updates: any) => {
    try {
      await updateDoc(doc(db, "staff", staffId.toString()), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error updating staff:", error);
      throw error;
    }
  };

  // حساب الإحصائيات
  const getDashboardStats = () => {
    const activePatients = patients.filter(p => p.status === "active");
    const activeStaff = staff.filter(s => s.isActive);
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfDay && expenseDate < endOfDay;
    });
    
    const todayPayments = payments.filter(p => {
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
  };

  return {
    patients,
    staff,
    expenses,
    payments,
    loading,
    addPatient,
    addStaff,
    addExpense,
    addPayment,
    updatePatient,
    updateStaff,
    getDashboardStats
  };
};