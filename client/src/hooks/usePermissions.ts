import { useMemo } from 'react';

// نفس الصلاحيات المعرفة في الخادم
export const PERMISSIONS = {
  VIEW_PATIENTS: "view_patients",
  MANAGE_PATIENTS: "manage_patients",
  VIEW_STAFF: "view_staff",
  MANAGE_STAFF: "manage_staff",
  VIEW_FINANCE: "view_finance",
  MANAGE_FINANCE: "manage_finance",
  VIEW_PAYROLL: "view_payroll",
  MANAGE_PAYROLL: "manage_payroll",
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  VIEW_REPORTS: "view_reports",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_DATABASE: "manage_database",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

export function usePermissions(user: User | null) {
  const permissions = useMemo(() => {
    if (!user) return {};

    return {
      // التحقق من صلاحية واحدة
      hasPermission: (permission: string): boolean => {
        if (!user.isActive) return false;
        if (user.role === 'admin') return true;
        return user.permissions.includes(permission);
      },

      // التحقق من أي صلاحية من مجموعة
      hasAnyPermission: (permissionList: string[]): boolean => {
        if (!user.isActive) return false;
        if (user.role === 'admin') return true;
        return permissionList.some(permission => user.permissions.includes(permission));
      },

      // التحقق من جميع الصلاحيات في مجموعة
      hasAllPermissions: (permissionList: string[]): boolean => {
        if (!user.isActive) return false;
        if (user.role === 'admin') return true;
        return permissionList.every(permission => user.permissions.includes(permission));
      },

      // التحقق من الدور
      hasRole: (role: string | string[]): boolean => {
        if (!user.isActive) return false;
        const allowedRoles = Array.isArray(role) ? role : [role];
        return allowedRoles.includes(user.role);
      },

      // صلاحيات محددة للميزات
      canViewPatients: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.VIEW_PATIENTS)),
      canManagePatients: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_PATIENTS)),
      canViewStaff: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.VIEW_STAFF)),
      canManageStaff: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_STAFF)),
      canViewFinance: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.VIEW_FINANCE)),
      canManageFinance: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_FINANCE)),
      canViewPayroll: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.VIEW_PAYROLL)),
      canManagePayroll: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_PAYROLL)),
      canViewUsers: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.VIEW_USERS)),
      canManageUsers: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_USERS)),
      canViewReports: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.VIEW_REPORTS)),
      canManageSettings: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_SETTINGS)),
      canManageDatabase: user.isActive && (user.role === 'admin' || user.permissions.includes(PERMISSIONS.MANAGE_DATABASE)),
      
      // معلومات المستخدم
      isAdmin: user.role === 'admin',
      isActive: user.isActive,
      currentRole: user.role,
    };
  }, [user]);

  return permissions;
}

// تعريف الصلاحيات لكل دور (للعرض في الواجهة)
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

// أسماء الصلاحيات بالعربية
export const PERMISSION_NAMES = {
  [PERMISSIONS.VIEW_PATIENTS]: "عرض المرضى",
  [PERMISSIONS.MANAGE_PATIENTS]: "إدارة المرضى",
  [PERMISSIONS.VIEW_STAFF]: "عرض الموظفين",
  [PERMISSIONS.MANAGE_STAFF]: "إدارة الموظفين",
  [PERMISSIONS.VIEW_FINANCE]: "عرض المالية",
  [PERMISSIONS.MANAGE_FINANCE]: "إدارة المالية",
  [PERMISSIONS.VIEW_PAYROLL]: "عرض الرواتب",
  [PERMISSIONS.MANAGE_PAYROLL]: "إدارة الرواتب",
  [PERMISSIONS.VIEW_USERS]: "عرض المستخدمين",
  [PERMISSIONS.MANAGE_USERS]: "إدارة المستخدمين",
  [PERMISSIONS.VIEW_REPORTS]: "عرض التقارير",
  [PERMISSIONS.MANAGE_SETTINGS]: "إدارة الإعدادات",
  [PERMISSIONS.MANAGE_DATABASE]: "إدارة قاعدة البيانات",
};

// أسماء الأدوار بالعربية
export const ROLE_NAMES = {
  admin: "مدير النظام",
  doctor: "طبيب",
  nurse: "ممرض/ممرضة",
  receptionist: "موظف استقبال",
  accountant: "محاسب",
};