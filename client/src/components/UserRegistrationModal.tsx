import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertUserSchema.extend({
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "accountant"], {
    errorMap: () => ({ message: "يرجى اختيار دور صحيح" })
  }),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function UserRegistrationModal({ isOpen, onClose, currentUser }: UserRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define role-based permissions
  const rolePermissions = {
    admin: ["manage_users", "manage_patients", "manage_staff", "manage_finance", "manage_payroll", "view_reports", "manage_settings"],
    accountant: ["manage_patients", "manage_finance", "manage_payroll", "view_reports"],
    doctor: ["manage_patients", "view_staff", "view_reports"],
    nurse: ["view_patients", "view_staff"],
    receptionist: ["manage_patients", "view_staff"]
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "receptionist",
      permissions: rolePermissions.receptionist,
      isActive: true,
      createdBy: currentUser.id,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إنشاء المستخدم");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم إنشاء المستخدم",
        description: "تم إنشاء المستخدم الجديد بنجاح",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Auto-assign permissions based on role
    const permissions = rolePermissions[data.role as keyof typeof rolePermissions];
    createUserMutation.mutate({ ...data, permissions });
  };

  const selectedRole = form.watch('role');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input
              id="fullName"
              {...form.register("fullName")}
              placeholder="أدخل الاسم الكامل"
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              {...form.register("username")}
              placeholder="أدخل اسم المستخدم"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              placeholder="أدخل كلمة المرور"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">الدور الوظيفي</Label>
            <Select value={form.watch('role')} onValueChange={(value) => form.setValue('role', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور الوظيفي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير النظام</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
                <SelectItem value="doctor">طبيب</SelectItem>
                <SelectItem value="nurse">ممرض</SelectItem>
                <SelectItem value="receptionist">موظف استقبال</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
            )}
          </div>

          <div>
            <Label>الصلاحيات</Label>
            <div className="mt-2 space-y-2 p-3 border rounded-lg bg-gray-50">
              {rolePermissions[selectedRole as keyof typeof rolePermissions]?.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox checked={true} disabled />
                  <span className="text-sm">
                    {permission === "manage_users" && "إدارة المستخدمين"}
                    {permission === "manage_patients" && "إدارة المرضى"}
                    {permission === "manage_staff" && "إدارة الموظفين"}
                    {permission === "manage_finance" && "إدارة المالية"}
                    {permission === "manage_payroll" && "إدارة الرواتب"}
                    {permission === "view_reports" && "عرض التقارير"}
                    {permission === "manage_settings" && "إدارة الإعدادات"}
                    {permission === "view_patients" && "عرض المرضى"}
                    {permission === "view_staff" && "عرض الموظفين"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', !!checked)}
            />
            <Label htmlFor="isActive">تفعيل الحساب</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              إنشاء المستخدم
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}