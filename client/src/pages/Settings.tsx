import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, User, Bell, Shield, Database, Cog } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>
        <p className="text-gray-600">إدارة إعدادات النظام والتفضيلات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إعدادات الحساب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              إعدادات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input id="username" defaultValue="مسؤول النظام" />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" defaultValue="admin@hospital.com" />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" defaultValue="01234567890" />
            </div>
            <Button className="w-full">
              <Save className="ml-2 w-4 h-4" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        {/* إعدادات التنبيهات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              إعدادات التنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="patient-alerts">تنبيهات المرضى</Label>
              <Switch id="patient-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-alerts">تنبيهات المدفوعات</Label>
              <Switch id="payment-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-alerts">تنبيهات الموظفين</Label>
              <Switch id="staff-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="financial-alerts">التنبيهات المالية</Label>
              <Switch id="financial-alerts" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الأمان */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              إعدادات الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input id="current-password" type="password" />
            </div>
            <div>
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button variant="outline" className="w-full">
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>

        {/* إعدادات النظام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hospital-name">اسم المركز</Label>
              <Input id="hospital-name" defaultValue="مركز دار الحياة لعلاج الإدمان" />
            </div>
            <div>
              <Label htmlFor="default-currency">العملة الافتراضية</Label>
              <Input id="default-currency" defaultValue="جنيه مصري (ج.م)" readOnly />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup">النسخ الاحتياطي التلقائي</Label>
              <Switch id="auto-backup" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="data-compression">ضغط البيانات</Label>
              <Switch id="data-compression" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إعدادات متقدمة */}
      <Card>
        <CardHeader>
          <CardTitle>الإعدادات المتقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Database className="w-6 h-6 mb-2" />
              تصدير البيانات
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Cog className="w-6 h-6 mb-2" />
              استعادة النظام
            </Button>
            <Button variant="destructive" className="h-20 flex flex-col">
              <Shield className="w-6 h-6 mb-2" />
              إعادة تعيين النظام
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}