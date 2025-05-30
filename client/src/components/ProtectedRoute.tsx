import { ReactNode } from 'react';
import { usePermissions, User } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  user: User | null;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredRole?: string | string[];
  requireAll?: boolean; // إذا كان true، يتطلب جميع الصلاحيات، وإلا يتطلب واحدة فقط
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  user,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requireAll = false,
  fallback
}: ProtectedRouteProps) {
  const permissions = usePermissions(user);

  // إذا لم يكن المستخدم مسجل دخول
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            يجب تسجيل الدخول للوصول لهذه الصفحة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // إذا كان الحساب غير نشط
  if (!user.isActive) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            حسابك غير نشط. يرجى التواصل مع الإدارة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // التحقق من الدور المطلوب
  if (requiredRole && !permissions.hasRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            ليس لديك الدور المطلوب للوصول لهذه الصفحة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // التحقق من صلاحية واحدة
  if (requiredPermission && !permissions.hasPermission(requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            ليس لديك صلاحية للوصول لهذه الميزة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // التحقق من عدة صلاحيات
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? permissions.hasAllPermissions(requiredPermissions)
      : permissions.hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              ليس لديك {requireAll ? 'جميع' : 'إحدى'} الصلاحيات المطلوبة للوصول لهذه الميزة
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // إذا تم تمرير جميع الفحوصات، اعرض المحتوى
  return <>{children}</>;
}

// مكون مساعد للتحقق من الصلاحيات داخل المكونات
interface PermissionGateProps {
  children: ReactNode;
  user: User | null;
  permission?: string;
  permissions?: string[];
  role?: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  user,
  permission,
  permissions,
  role,
  requireAll = false,
  fallback = null
}: PermissionGateProps) {
  const userPermissions = usePermissions(user);

  if (!user || !user.isActive) {
    return <>{fallback}</>;
  }

  // التحقق من الدور
  if (role && !userPermissions.hasRole(role)) {
    return <>{fallback}</>;
  }

  // التحقق من صلاحية واحدة
  if (permission && !userPermissions.hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // التحقق من عدة صلاحيات
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? userPermissions.hasAllPermissions(permissions)
      : userPermissions.hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}