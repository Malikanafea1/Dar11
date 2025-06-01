import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertStaffSchema, 
  insertExpenseSchema, 
  insertPaymentSchema, 
  insertSettingsSchema, 
  insertUserSchema,
  insertPayrollSchema,
  insertBonusSchema,
  insertAdvanceSchema,
  insertDeductionSchema,
  insertGraduateSchema,
  insertCigarettePaymentSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  requireAuth, 
  requirePermission, 
  requireRole,
  requireSelfOrPermission,
  PERMISSIONS 
} from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Patient routes - محمية بالصلاحيات
  app.get("/api/patients", requireAuth, requirePermission(PERMISSIONS.VIEW_PATIENTS), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", requireAuth, requirePermission(PERMISSIONS.VIEW_PATIENTS), async (req, res) => {
    try {
      const id = req.params.id;
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.patch("/api/patients/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      const id = req.params.id;
      const patient = await storage.updatePatient(id, req.body);
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deletePatient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Staff routes - محمية بالصلاحيات
  app.get("/api/staff", requireAuth, requirePermission(PERMISSIONS.VIEW_STAFF), async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", requireAuth, requirePermission(PERMISSIONS.MANAGE_STAFF), async (req, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(validatedData);
      res.status(201).json(staff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid staff data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.patch("/api/staff/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_STAFF), async (req, res) => {
    try {
      const id = req.params.id;
      const staff = await storage.updateStaff(id, req.body);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  // مسار لتحديث حقول السجائر للموظفين الموجودين
  app.post("/api/staff/update-cigarette-fields", requireAuth, requirePermission(PERMISSIONS.MANAGE_STAFF), async (req, res) => {
    try {
      await storage.updateExistingStaffWithCigaretteFields();
      res.json({ message: "Staff cigarette fields updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update staff cigarette fields" });
    }
  });

  // Expense routes - محمية بالصلاحيات
  app.get("/api/expenses", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, requirePermission(PERMISSIONS.MANAGE_FINANCE), async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_FINANCE), async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.updateExpense(id, validatedData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_FINANCE), async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteExpense(id);
      res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Payment routes - محمية بالصلاحيات
  app.get("/api/payments", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/patient/:patientId", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const payments = await storage.getPaymentsByPatient(patientId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient payments" });
    }
  });

  app.post("/api/payments", requireAuth, requirePermission(PERMISSIONS.MANAGE_FINANCE), async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Dashboard stats - محمي بالصلاحيات
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Settings routes - محمية بالصلاحيات الإدارية
  app.get("/api/settings", requireAuth, requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // User routes - محمية بصلاحيات إدارة المستخدمين
  app.get("/api/users", requireAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/active", requireAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
    try {
      const users = await storage.getActiveUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active users" });
    }
  });

  app.post("/api/users", requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireSelfOrPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.updateUser(id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "الحساب غير نشط" });
      }

      // تحديث آخر تسجيل دخول
      await storage.updateLastLogin(user.id);

      // إرسال بيانات المستخدم (بدون كلمة المرور)
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "فشل في تسجيل الدخول" });
    }
  });

  // Database management routes - محمية بصلاحيات إدارة قاعدة البيانات
  app.post("/api/database/backup", requireAuth, requirePermission(PERMISSIONS.MANAGE_DATABASE), async (req, res) => {
    try {
      const backup = await storage.createBackup();
      res.setHeader('Content-Disposition', 'attachment; filename="hospital-backup.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/database/reset", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      await storage.resetDatabase();
      res.json({ message: "Database reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset database" });
    }
  });

  app.post("/api/database/import", requireAuth, requirePermission(PERMISSIONS.MANAGE_DATABASE), async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: "No data provided for import" });
      }
      await storage.importBackup(data);
      res.json({ message: "Database imported successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to import database" });
    }
  });

  // Payroll routes - محمية بصلاحيات إدارة الرواتب
  app.get("/api/payrolls", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const payrolls = await storage.getPayrolls();
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  });

  app.get("/api/payrolls/:id", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const payroll = await storage.getPayroll(req.params.id);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post("/api/payrolls", requireAuth, requirePermission(PERMISSIONS.MANAGE_PAYROLL), async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse(req.body);
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payroll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payroll" });
    }
  });

  app.patch("/api/payrolls/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_PAYROLL), async (req, res) => {
    try {
      const payroll = await storage.updatePayroll(req.params.id, req.body);
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payroll" });
    }
  });

  app.get("/api/payrolls/staff/:staffId", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const payrolls = await storage.getPayrollsByStaff(req.params.staffId);
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls for staff" });
    }
  });

  app.get("/api/payrolls/month/:month", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const payrolls = await storage.getPayrollsByMonth(req.params.month);
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls for month" });
    }
  });

  // Bonus routes - محمية بصلاحيات إدارة الرواتب
  app.get("/api/bonuses", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const bonuses = await storage.getBonuses();
      res.json(bonuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bonuses" });
    }
  });

  app.post("/api/bonuses", requireAuth, requirePermission(PERMISSIONS.MANAGE_PAYROLL), async (req, res) => {
    try {
      const validatedData = insertBonusSchema.parse(req.body);
      const bonus = await storage.createBonus(validatedData);
      res.status(201).json(bonus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bonus data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bonus" });
    }
  });

  app.get("/api/bonuses/staff/:staffId", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const bonuses = await storage.getBonusesByStaff(req.params.staffId);
      res.json(bonuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bonuses for staff" });
    }
  });

  // Advance routes - محمية بصلاحيات إدارة الرواتب
  app.get("/api/advances", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const advances = await storage.getAdvances();
      res.json(advances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advances" });
    }
  });

  app.post("/api/advances", requireAuth, requirePermission(PERMISSIONS.MANAGE_PAYROLL), async (req, res) => {
    try {
      const validatedData = insertAdvanceSchema.parse(req.body);
      const advance = await storage.createAdvance(validatedData);
      res.status(201).json(advance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid advance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create advance" });
    }
  });

  app.patch("/api/advances/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_PAYROLL), async (req, res) => {
    try {
      const advance = await storage.updateAdvance(req.params.id, req.body);
      res.json(advance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update advance" });
    }
  });

  app.get("/api/advances/staff/:staffId", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const advances = await storage.getAdvancesByStaff(req.params.staffId);
      res.json(advances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advances for staff" });
    }
  });

  // Deduction routes - محمية بصلاحيات إدارة الرواتب
  app.get("/api/deductions", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const deductions = await storage.getDeductions();
      res.json(deductions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deductions" });
    }
  });

  app.post("/api/deductions", requireAuth, requirePermission(PERMISSIONS.MANAGE_PAYROLL), async (req, res) => {
    try {
      const validatedData = insertDeductionSchema.parse(req.body);
      const deduction = await storage.createDeduction(validatedData);
      res.status(201).json(deduction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deduction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deduction" });
    }
  });

  app.get("/api/deductions/staff/:staffId", requireAuth, requirePermission(PERMISSIONS.VIEW_PAYROLL), async (req, res) => {
    try {
      const deductions = await storage.getDeductionsByStaff(req.params.staffId);
      res.json(deductions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deductions for staff" });
    }
  });

  // Graduate routes - محمية بصلاحيات إدارة المرضى
  app.get("/api/graduates", requireAuth, requirePermission(PERMISSIONS.VIEW_PATIENTS), async (req, res) => {
    try {
      const graduates = await storage.getGraduates();
      res.json(graduates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch graduates" });
    }
  });

  app.get("/api/graduates/active", requireAuth, requirePermission(PERMISSIONS.VIEW_PATIENTS), async (req, res) => {
    try {
      const graduates = await storage.getActiveGraduates();
      res.json(graduates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active graduates" });
    }
  });

  app.get("/api/graduates/:id", requireAuth, requirePermission(PERMISSIONS.VIEW_PATIENTS), async (req, res) => {
    try {
      const graduate = await storage.getGraduate(req.params.id);
      if (!graduate) {
        return res.status(404).json({ message: "Graduate not found" });
      }
      res.json(graduate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch graduate" });
    }
  });

  app.post("/api/graduates", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      const validatedData = insertGraduateSchema.parse(req.body);
      const graduate = await storage.createGraduate(validatedData);
      res.status(201).json(graduate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid graduate data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create graduate" });
    }
  });

  app.patch("/api/graduates/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      const graduate = await storage.updateGraduate(req.params.id, req.body);
      res.json(graduate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update graduate" });
    }
  });

  app.delete("/api/graduates/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      await storage.deleteGraduate(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete graduate" });
    }
  });

  // Cigarette Payment routes - محمية بصلاحيات إدارة الدفعات
  app.get("/api/cigarette-payments", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const payments = await storage.getCigarettePayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cigarette payments" });
    }
  });

  app.get("/api/cigarette-payments/:id", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const payment = await storage.getCigarettePayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Cigarette payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cigarette payment" });
    }
  });

  app.post("/api/cigarette-payments", requireAuth, requirePermission(PERMISSIONS.MANAGE_FINANCE), async (req, res) => {
    try {
      const validatedData = insertCigarettePaymentSchema.parse(req.body);
      const payment = await storage.createCigarettePayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cigarette payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cigarette payment" });
    }
  });

  app.patch("/api/cigarette-payments/:id", requireAuth, requirePermission(PERMISSIONS.MANAGE_FINANCE), async (req, res) => {
    try {
      const payment = await storage.updateCigarettePayment(req.params.id, req.body);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cigarette payment" });
    }
  });

  app.get("/api/cigarette-payments/person/:personId", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const payments = await storage.getCigarettePaymentsByPerson(req.params.personId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cigarette payments for person" });
    }
  });

  app.get("/api/cigarette-payments/date-range", requireAuth, requirePermission(PERMISSIONS.VIEW_FINANCE), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const payments = await storage.getCigarettePaymentsByDateRange(new Date(startDate as string), new Date(endDate as string));
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cigarette payments by date range" });
    }
  });

  // إضافة endpoint لتحديث المرضى الموجودين
  app.post("/api/patients/update-cigarette-fields", requireAuth, requirePermission(PERMISSIONS.MANAGE_PATIENTS), async (req, res) => {
    try {
      if (storage.updateExistingPatientsWithCigaretteFields) {
        await storage.updateExistingPatientsWithCigaretteFields();
        res.json({ message: "Successfully updated existing patients with cigarette fields" });
      } else {
        res.status(400).json({ message: "Update function not available" });
      }
    } catch (error) {
      console.error("Error updating patients:", error);
      res.status(500).json({ message: "Failed to update existing patients" });
    }
  });

  // إضافة endpoint لتحديث الموظفين الموجودين
  app.post("/api/staff/update-cigarette-fields", requireAuth, requirePermission(PERMISSIONS.MANAGE_STAFF), async (req, res) => {
    try {
      if (storage.updateExistingStaffWithCigaretteFields) {
        await storage.updateExistingStaffWithCigaretteFields();
        res.json({ message: "Successfully updated existing staff with cigarette fields" });
      } else {
        res.status(400).json({ message: "Update function not available" });
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update existing staff" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
