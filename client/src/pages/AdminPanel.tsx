import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Settings, Shield, Edit, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserRegistrationModal from "@/components/UserRegistrationModal";
import type { User as UserType } from "@shared/schema";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface AdminPanelProps {
  user: User;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only allow admin access
  if (user.role !== "admin") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">غير مصرح لك بالدخول</h2>
            <p className="text-gray-600">هذه الصفحة مخصصة لمسؤولي النظام فقط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("فشل في تحديث حالة المستخدم");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم تحديث حالة المستخدم",
        description: "تم تغيير حالة المستخدم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  const getRoleLabel = (role: string) => {
    const roleMap = {
      admin: "مدير النظام",
      accountant: "محاسب",
      doctor: "طبيب",
      nurse: "ممرض",
      receptionist: "موظف استقبال",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
        <Button onClick={() => setShowUserForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          إضافة مستخدم جديد
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                قائمة المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري تحميل البيانات...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد مستخدمين مسجلين
                </div>
              ) : (
                <div className="space-y-4">
                  {(users as UserType[]).map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{userItem.fullName}</h3>
                        <p className="text-sm text-gray-600">@{userItem.username}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={userItem.isActive ? "default" : "secondary"}>
                            {userItem.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                          <Badge variant="outline">{getRoleLabel(userItem.role)}</Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            الصلاحيات: {userItem.permissions?.length || 0} صلاحية
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleUserStatusMutation.mutate({
                            userId: userItem.id,
                            isActive: !userItem.isActive
                          })}
                          disabled={toggleUserStatusMutation.isPending || userItem.id === user.id}
                        >
                          {userItem.isActive ? (
                            <>
                              <UserX className="w-4 h-4" />
                              إيقاف
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4" />
                              تفعيل
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">صلاحيات المدير</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• إدارة جميع المستخدمين</li>
                    <li>• إدارة الرواتب والمكافآت</li>
                    <li>• الوصول لجميع التقارير</li>
                    <li>• إدارة إعدادات النظام</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">صلاحيات المحاسب</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• إدارة المدفوعات</li>
                    <li>• إدارة المصروفات</li>
                    <li>• عرض التقارير المالية</li>
                    <li>• إدارة رواتب الموظفين</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">صلاحيات الطبيب</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• إدارة المرضى</li>
                    <li>• عرض السجلات الطبية</li>
                    <li>• إضافة الملاحظات الطبية</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">صلاحيات الممرض</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• متابعة المرضى</li>
                    <li>• تسجيل الملاحظات</li>
                    <li>• عرض جداول العمل</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">النسخ الاحتياطي التلقائي</h4>
                    <p className="text-sm text-gray-600">إنشاء نسخة احتياطية تلقائياً كل يوم</p>
                  </div>
                  <Button variant="outline" size="sm">
                    تفعيل
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">تنبيهات النظام</h4>
                    <p className="text-sm text-gray-600">إرسال تنبيهات عن العمليات المهمة</p>
                  </div>
                  <Button variant="outline" size="sm">
                    إعدادات
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">سجل العمليات</h4>
                    <p className="text-sm text-gray-600">عرض سجل جميع العمليات في النظام</p>
                  </div>
                  <Button variant="outline" size="sm">
                    عرض السجل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Registration Form would go here */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>إضافة مستخدم جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 py-8">
                سيتم إضافة نموذج تسجيل المستخدم هنا
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUserForm(false)}>
                  إلغاء
                </Button>
                <Button>
                  حفظ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}