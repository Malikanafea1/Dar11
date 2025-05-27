import { z } from "zod";

// Patient types and schemas
export interface Patient {
  id: string;
  name: string;
  nationalId: string;
  admissionDate: string;
  roomNumber?: string;
  dailyCost: number;
  insurance?: string;
  status: "active" | "discharged";
  notes?: string;
  totalPaid: number;
  dischargeDate?: string;
}

export const insertPatientSchema = z.object({
  name: z.string().min(1, "اسم المريض مطلوب"),
  nationalId: z.string().min(1, "رقم الهوية مطلوب"),
  admissionDate: z.string(),
  roomNumber: z.string().optional(),
  dailyCost: z.number().min(0, "التكلفة اليومية يجب أن تكون أكبر من الصفر"),
  insurance: z.string().optional(),
  status: z.enum(["active", "discharged"]).default("active"),
  notes: z.string().optional(),
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;

// Staff types and schemas
export interface Staff {
  id: string;
  name: string;
  role: string; // doctor, nurse, admin, etc.
  department: string;
  monthlySalary: number;
  hireDate: string;
  isActive: boolean;
  phoneNumber?: string;
  email?: string;
}

export const insertStaffSchema = z.object({
  name: z.string().min(1, "اسم الموظف مطلوب"),
  role: z.string().min(1, "المنصب مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  monthlySalary: z.number().min(0, "الراتب الشهري يجب أن يكون أكبر من الصفر"),
  hireDate: z.string(),
  isActive: z.boolean().default(true),
  phoneNumber: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional(),
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;

// Expense types and schemas
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // medical_supplies, salaries, utilities, etc.
  date: string;
  createdBy: string;
}

export const insertExpenseSchema = z.object({
  description: z.string().min(1, "وصف المصروف مطلوب"),
  amount: z.number().min(0, "المبلغ يجب أن يكون أكبر من الصفر"),
  category: z.string().min(1, "فئة المصروف مطلوبة"),
  date: z.string(),
  createdBy: z.string().min(1, "المنشئ مطلوب"),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Payment types and schemas
export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string; // cash, card, transfer
  notes?: string;
}

export const insertPaymentSchema = z.object({
  patientId: z.string().min(1, "معرف المريض مطلوب"),
  amount: z.number().min(0, "مبلغ الدفع يجب أن يكون أكبر من الصفر"),
  paymentDate: z.string(),
  paymentMethod: z.string().min(1, "طريقة الدفع مطلوبة"),
  notes: z.string().optional(),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// User types and schemas
export interface User {
  id: string;
  username: string;
  password: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
