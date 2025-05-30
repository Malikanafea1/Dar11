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
  insertDeductionSchema
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

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
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

  app.put("/api/expenses/:id", async (req, res) => {
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

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteExpense(id);
      res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/patient/:patientId", async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const payments = await storage.getPaymentsByPatient(patientId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
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

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
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

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/active", async (req, res) => {
    try {
      const users = await storage.getActiveUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active users" });
    }
  });

  app.post("/api/users", async (req, res) => {
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

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.updateUser(id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
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

  // Database management routes
  app.post("/api/database/backup", async (req, res) => {
    try {
      const backup = await storage.createBackup();
      res.setHeader('Content-Disposition', 'attachment; filename="hospital-backup.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/database/reset", async (req, res) => {
    try {
      await storage.resetDatabase();
      res.json({ message: "Database reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset database" });
    }
  });

  app.post("/api/database/import", async (req, res) => {
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

  // Payroll routes
  app.get("/api/payrolls", async (req, res) => {
    try {
      const payrolls = await storage.getPayrolls();
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  });

  app.get("/api/payrolls/:id", async (req, res) => {
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

  app.post("/api/payrolls", async (req, res) => {
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

  app.patch("/api/payrolls/:id", async (req, res) => {
    try {
      const payroll = await storage.updatePayroll(req.params.id, req.body);
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payroll" });
    }
  });

  app.get("/api/payrolls/staff/:staffId", async (req, res) => {
    try {
      const payrolls = await storage.getPayrollsByStaff(req.params.staffId);
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls for staff" });
    }
  });

  app.get("/api/payrolls/month/:month", async (req, res) => {
    try {
      const payrolls = await storage.getPayrollsByMonth(req.params.month);
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls for month" });
    }
  });

  // Bonus routes
  app.get("/api/bonuses", async (req, res) => {
    try {
      const bonuses = await storage.getBonuses();
      res.json(bonuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bonuses" });
    }
  });

  app.post("/api/bonuses", async (req, res) => {
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

  app.get("/api/bonuses/staff/:staffId", async (req, res) => {
    try {
      const bonuses = await storage.getBonusesByStaff(req.params.staffId);
      res.json(bonuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bonuses for staff" });
    }
  });

  // Advance routes
  app.get("/api/advances", async (req, res) => {
    try {
      const advances = await storage.getAdvances();
      res.json(advances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advances" });
    }
  });

  app.post("/api/advances", async (req, res) => {
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

  app.patch("/api/advances/:id", async (req, res) => {
    try {
      const advance = await storage.updateAdvance(req.params.id, req.body);
      res.json(advance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update advance" });
    }
  });

  app.get("/api/advances/staff/:staffId", async (req, res) => {
    try {
      const advances = await storage.getAdvancesByStaff(req.params.staffId);
      res.json(advances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advances for staff" });
    }
  });

  // Deduction routes
  app.get("/api/deductions", async (req, res) => {
    try {
      const deductions = await storage.getDeductions();
      res.json(deductions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deductions" });
    }
  });

  app.post("/api/deductions", async (req, res) => {
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

  app.get("/api/deductions/staff/:staffId", async (req, res) => {
    try {
      const deductions = await storage.getDeductionsByStaff(req.params.staffId);
      res.json(deductions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deductions for staff" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
