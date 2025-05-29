import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, User, Bell, Shield, Database, Cog, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Settings, InsertSettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const [localSettings, setLocalSettings] = useState<Partial<InsertSettings>>({
    username: "",
    email: "",
    phone: "",
    hospitalName: "",
    defaultCurrency: "",
    patientAlerts: false,
    paymentAlerts: false,
    staffAlerts: false,
    financialAlerts: false,
    autoBackup: false,
    dataCompression: false
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<InsertSettings>) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ جميع التغييرات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });

  const handleSaveProfile = () => {
    const profileData = {
      username: localSettings.username,
      email: localSettings.email,
      phone: localSettings.phone,
      hospitalName: localSettings.hospitalName,
      defaultCurrency: localSettings.defaultCurrency
    };
    updateSettingsMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    toast({
      title: "تنبيه",
      description: "وظيفة تغيير كلمة المرور ستكون متاحة قريباً",
    });
  };

  const handleToggleSwitch = (key: keyof InsertSettings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleInputChange = (key: keyof InsertSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>جارٍ تحميل الإعدادات...</span>
        </div>
      </div>
    );
  }

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
              <Input 
                id="username" 
                value={settings.username}
                onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                type="email" 
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input 
                id="phone" 
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleSaveProfile}>
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
              <Switch 
                id="patient-alerts" 
                checked={settings.patientAlerts}
                onCheckedChange={() => handleToggleSwitch('patientAlerts')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-alerts">تنبيهات المدفوعات</Label>
              <Switch 
                id="payment-alerts" 
                checked={settings.paymentAlerts}
                onCheckedChange={() => handleToggleSwitch('paymentAlerts')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-alerts">تنبيهات الموظفين</Label>
              <Switch 
                id="staff-alerts" 
                checked={settings.staffAlerts}
                onCheckedChange={() => handleToggleSwitch('staffAlerts')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="financial-alerts">التنبيهات المالية</Label>
              <Switch 
                id="financial-alerts" 
                checked={settings.financialAlerts}
                onCheckedChange={() => handleToggleSwitch('financialAlerts')}
              />
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
            <Button variant="outline" className="w-full" onClick={handleChangePassword}>
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