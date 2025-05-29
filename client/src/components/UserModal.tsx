import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { z } from "zod";

const formSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيد كلمة المرور غير متطابقتان",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const permissions = [
  { id: "patients", label: "إدارة المرضى" },
  { id: "staff", label: "إدارة الموظفين" },
  { id: "finance", label: "إدارة المالية" },
  { id: "reports", label: "عرض التقارير" },
  { id: "settings", label: "إعدادات النظام" },
  { id: "users", label: "إدارة المستخدمين" },
];

export default function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "receptionist",
      permissions: [],
      isActive: true,
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        password: "",
        confirmPassword: "",
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
      });
      setSelectedPermissions(user.permissions);
    } else {
      reset({
        username: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        role: "receptionist",
        permissions: [],
        isActive: true,
      });
      setSelectedPermissions([]);
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { confirmPassword, ...submitData } = data;
      const payload = {
        ...submitData,
        permissions: selectedPermissions,
      };

      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في حفظ المستخدم");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم بنجاح",
        description: user ? "تم تحديث المستخدم بنجاح" : "تم إنشاء المستخدم بنجاح",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case "admin":
        return permissions.map(p => p.id);
      case "doctor":
        return ["patients", "reports"];
      case "nurse":
        return ["patients"];
      case "receptionist":
        return ["patients"];
      case "accountant":
        return ["finance", "reports"];
      default:
        return [];
    }
  };

  const handleRoleChange = (role: string) => {
    setValue("role", role as any);
    const defaultPerms = getDefaultPermissions(role);
    setSelectedPermissions(defaultPerms);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder="أدخل الاسم الكامل"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="أدخل اسم المستخدم"
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder={user ? "اتركها فارغة لعدم التغيير" : "أدخل كلمة المرور"}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="أعد إدخال كلمة المرور"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">الدور</Label>
            <Select
              value={selectedRole}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير النظام</SelectItem>
                <SelectItem value="doctor">طبيب</SelectItem>
                <SelectItem value="nurse">ممرض</SelectItem>
                <SelectItem value="receptionist">موظف استقبال</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>الصلاحيات</Label>
            <div className="grid grid-cols-2 gap-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={permission.id} className="text-sm">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              {...register("isActive")}
              defaultChecked={true}
            />
            <Label htmlFor="isActive">المستخدم نشط</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {user ? "تحديث" : "إنشاء"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}