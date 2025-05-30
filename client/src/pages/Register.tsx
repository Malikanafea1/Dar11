import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "receptionist",
      permissions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<InsertUser, 'permissions'> & { permissions: string[] }) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول باستخدام بيانات الحساب الجديد",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const rolePermissions = {
      admin: ["read", "write", "delete", "manage_users", "manage_settings"],
      doctor: ["read", "write", "manage_patients"],
      nurse: ["read", "write", "manage_patients"],
      receptionist: ["read", "write"],
      accountant: ["read", "write", "manage_finances"]
    };

    const userData = {
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      role: data.role as "admin" | "doctor" | "nurse" | "receptionist" | "accountant",
      permissions: rolePermissions[data.role as keyof typeof rolePermissions] || ["read"],
      isActive: data.isActive,
      createdAt: data.createdAt,
    };

    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-blue-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</CardTitle>
            <p className="text-gray-600 text-sm mt-2">أدخل بيانات المستخدم الجديد</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="أدخل الاسم الكامل" 
                          {...field}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="أدخل اسم المستخدم" 
                          {...field}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور الوظيفي</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدور الوظيفي" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">مدير النظام</SelectItem>
                          <SelectItem value="doctor">طبيب</SelectItem>
                          <SelectItem value="nurse">ممرض/ممرضة</SelectItem>
                          <SelectItem value="receptionist">موظف استقبال</SelectItem>
                          <SelectItem value="accountant">محاسب</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="أدخل كلمة المرور" 
                            {...field}
                            className="text-right pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="أعد إدخال كلمة المرور" 
                            {...field}
                            className="text-right pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    "جاري إنشاء الحساب..."
                  ) : (
                    <>
                      <UserPlus className="ml-2 h-4 w-4" />
                      إنشاء الحساب
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                تم إنشاء الحساب بالفعل؟{" "}
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                  العودة للصفحة الرئيسية
                  <ArrowRight className="inline w-4 h-4 mr-1" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}