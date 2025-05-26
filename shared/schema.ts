import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nationalId: text("national_id").notNull().unique(),
  admissionDate: timestamp("admission_date").notNull(),
  roomNumber: text("room_number"),
  dailyCost: decimal("daily_cost", { precision: 10, scale: 2 }).notNull(),
  insurance: text("insurance"),
  status: text("status").notNull().default("active"), // active, discharged
  notes: text("notes"),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  dischargeDate: timestamp("discharge_date"),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // doctor, nurse, admin, etc.
  department: text("department").notNull(),
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }).notNull(),
  hireDate: timestamp("hire_date").notNull(),
  isActive: boolean("is_active").default(true),
  phoneNumber: text("phone_number"),
  email: text("email"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // medical_supplies, salaries, utilities, etc.
  date: timestamp("date").notNull(),
  createdBy: text("created_by").notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, transfer
  notes: text("notes"),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  totalPaid: true,
  dischargeDate: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
