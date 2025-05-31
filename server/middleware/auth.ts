import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// إضافة معلومات المستخدم إلى Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        fullName: string;
        role: string;
        permissions: string[];
        isActive: boolean;
      };
      session?: {
        userId?: string;
        [key: string]: any;
      };
    }
  }
}

// تعريف الصلاحيات المطلوبة لكل عملية
export const PERMISSIONS = {
  // صلاحيات المرضى
  VIEW_PATIENTS: "view_patients",
  MANAGE_PATIENTS: "manage_patients",
  
  // صلاحيات الموظفين
  VIEW_STAFF: "view_staff",
  MANAGE_STAFF: "manage_staff",
  
  // صلاحيات المالية
  VIEW_FINANCE: "view_finance",
  MANAGE_FINANCE: "manage_finance",
  
  // صلاحيات الرواتب
  VIEW_PAYROLL: "view_payroll",
  MANAGE_PAYROLL: "manage_payroll",
  
  // صلاحيات المستخدمين
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  
  // صلاحيات التقارير
  VIEW_REPORTS: "view_reports",
  
  // صلاحيات الإعدادات
  MANAGE_SETTINGS: "manage_settings",
  
  // صلاحيات قاعدة البيانات
  MANAGE_DATABASE: "manage_database",
} as const;

// تعريف الصلاحيات لكل دور
export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.MANAGE_FINANCE,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_DATABASE,
  ],
  doctor: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.VIEW_REPORTS,
  ],
  nurse: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_STAFF,
  ],
  receptionist: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.MANAGE_FINANCE,
  ],
  accountant: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.MANAGE_FINANCE,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

// التحقق من وجود جلسة صحيحة
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const userIdCookie = req.cookies?.userId;
    const userIdHeader = req.headers['x-user-id'] as string;
    
    // للتطوير: السماح بتمرير معرف المستخدم في header
    if (!authHeader && !userIdCookie && !userIdHeader) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }

    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // استخدام JWT أو token
      userId = authHeader.substring(7); // إزالة "Bearer "
    } else if (userIdCookie) {
      // استخدام cookie
      userId = userIdCookie;
    } else if (userIdHeader) {
      // استخدام header للتطوير
      userId = userIdHeader;
    } else {
      return res.status(401).json({ message: "طريقة المصادقة غير صحيحة" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "المستخدم غير موجود" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "الحساب غير نشط" });
    }

    // إضافة معلومات المستخدم إلى الطلب
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    res.status(500).json({ message: "خطأ في التحقق من الهوية" });
  }
}

// التحقق من صلاحية معينة
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }

    // المدير له جميع الصلاحيات
    if (req.user.role === 'admin') {
      return next();
    }

    // التحقق من وجود الصلاحية في قائمة صلاحيات المستخدم
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: "ليس لديك صلاحية للوصول لهذه الميزة",
        requiredPermission: permission 
      });
    }

    next();
  };
}

// التحقق من عدة صلاحيات (يجب أن يمتلك المستخدم إحداها على الأقل)
export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }

    // المدير له جميع الصلاحيات
    if (req.user.role === 'admin') {
      return next();
    }

    // التحقق من وجود إحدى الصلاحيات المطلوبة
    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: "ليس لديك صلاحية للوصول لهذه الميزة",
        requiredPermissions: permissions 
      });
    }

    next();
  };
}

// التحقق من جميع الصلاحيات (يجب أن يمتلك المستخدم جميعها)
export function requireAllPermissions(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }

    // المدير له جميع الصلاحيات
    if (req.user.role === 'admin') {
      return next();
    }

    // التحقق من وجود جميع الصلاحيات المطلوبة
    const hasAllPermissions = permissions.every(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        message: "ليس لديك جميع الصلاحيات المطلوبة",
        requiredPermissions: permissions 
      });
    }

    next();
  };
}

// التحقق من الدور
export function requireRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }

    const allowedRoles = Array.isArray(role) ? role : [role];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "ليس لديك صلاحية الوصول - دور غير مسموح",
        requiredRole: role 
      });
    }

    next();
  };
}

// التحقق من أن المستخدم يحاول الوصول لبياناته الخاصة أو لديه صلاحية إدارية
export function requireSelfOrPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }

    const targetUserId = req.params.id || req.params.userId;
    
    // السماح بالوصول إذا كان المستخدم يحاول الوصول لبياناته الخاصة
    if (req.user.id === targetUserId) {
      return next();
    }

    // أو إذا كان لديه الصلاحية المطلوبة
    if (req.user.role === 'admin' || req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      message: "يمكنك فقط الوصول لبياناتك الشخصية أو تحتاج صلاحية إضافية" 
    });
  };
}