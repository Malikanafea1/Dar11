import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, Bell, Shield, Database, Cog, Loader2, Download, Upload, RotateCcw, AlertTriangle, Palette, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Settings, InsertSettings } from "@shared/schema";
import { useTheme, type ThemeType, type DateSystemType } from "@/hooks/useTheme";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTheme, changeTheme, dateSystem, changeDateSystem, getThemeConfig } = useTheme();
  
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

  // Database management mutations
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/database/backup", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to create backup");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Download the backup file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تحميل ملف النسخة الاحتياطية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  });

  const resetDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/database/reset", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to reset database");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "تم إعادة تعيين النظام",
        description: "تم حذف جميع البيانات وإعادة النظام للإعدادات الافتراضية",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إعادة التعيين",
        description: "حدث خطأ أثناء إعادة تعيين النظام",
        variant: "destructive",
      });
    }
  });

  const importBackupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/database/import", {
        method: "POST",
        body: JSON.stringify({ data }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to import backup");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "تم استيراد البيانات",
        description: "تم استيراد النسخة الاحتياطية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الاستيراد",
        description: "حدث خطأ أثناء استيراد النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          importBackupMutation.mutate(backupData);
        } catch (error) {
          toast({
            title: "خطأ في قراءة الملف",
            description: "الملف المحدد غير صالح أو تالف",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
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
                value={localSettings.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                type="email" 
                value={localSettings.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input 
                id="phone" 
                value={localSettings.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSaveProfile}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              حفظ البيانات
            </Button>
          </CardContent>
        </Card>

        {/* تغيير كلمة المرور */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              تغيير كلمة المرور
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
              <Input 
                id="hospital-name" 
                value={localSettings.hospitalName || ''}
                onChange={(e) => handleInputChange('hospitalName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="default-currency">العملة الافتراضية</Label>
              <Input 
                id="default-currency" 
                value={localSettings.defaultCurrency || ''}
                onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup">النسخ الاحتياطي التلقائي</Label>
              <Switch 
                id="auto-backup"
                checked={localSettings.autoBackup ?? false}
                onCheckedChange={(checked) => handleToggleSwitch('autoBackup', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="data-compression">ضغط البيانات</Label>
              <Switch 
                id="data-compression"
                checked={localSettings.dataCompression ?? false}
                onCheckedChange={(checked) => handleToggleSwitch('dataCompression', checked)}
              />
            </div>
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
                checked={localSettings.patientAlerts ?? false}
                onCheckedChange={(checked) => handleToggleSwitch('patientAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-alerts">تنبيهات المدفوعات</Label>
              <Switch 
                id="payment-alerts"
                checked={localSettings.paymentAlerts ?? false}
                onCheckedChange={(checked) => handleToggleSwitch('paymentAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-alerts">تنبيهات الموظفين</Label>
              <Switch 
                id="staff-alerts"
                checked={localSettings.staffAlerts ?? false}
                onCheckedChange={(checked) => handleToggleSwitch('staffAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="financial-alerts">التنبيهات المالية</Label>
              <Switch 
                id="financial-alerts"
                checked={localSettings.financialAlerts ?? false}
                onCheckedChange={(checked) => handleToggleSwitch('financialAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* إدارة البيانات */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              إدارة البيانات والنسخ الاحتياطي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* إنشاء نسخة احتياطية */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium">إنشاء نسخة احتياطية</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">حفظ جميع بيانات النظام في ملف آمن</p>
                <Button 
                  onClick={() => createBackupMutation.mutate()}
                  disabled={createBackupMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {createBackupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  تحميل النسخة الاحتياطية
                </Button>
              </div>

              {/* استيراد نسخة احتياطية */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">استيراد البيانات</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">استرداد البيانات من ملف نسخة احتياطية</p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={importBackupMutation.isPending}
                  />
                  <Button 
                    disabled={importBackupMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {importBackupMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    اختيار ملف للاستيراد
                  </Button>
                </div>
              </div>

              {/* إعادة تعيين النظام */}
              <div className="p-4 border rounded-lg border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-700">إعادة تعيين النظام</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">حذف جميع البيانات وإعادة النظام للحالة الافتراضية</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      disabled={resetDatabaseMutation.isPending}
                    >
                      {resetDatabaseMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      إعادة تعيين النظام
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد إعادة تعيين النظام</AlertDialogTitle>
                      <AlertDialogDescription>
                        هذا الإجراء سيحذف جميع البيانات نهائياً بما في ذلك:
                        <br />• جميع بيانات المرضى
                        <br />• بيانات الموظفين
                        <br />• السجلات المالية
                        <br />• المصروفات والمدفوعات
                        <br /><br />
                        هل أنت متأكد من رغبتك في المتابعة؟
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => resetDatabaseMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        نعم، إعادة تعيين النظام
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                نصائح هامة لإدارة البيانات
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• قم بإنشاء نسخة احتياطية بانتظام لضمان أمان البيانات</li>
                <li>• احتفظ بالنسخ الاحتياطية في مكان آمن ومنفصل</li>
                <li>• تأكد من صحة ملف النسخة الاحتياطية قبل الاستيراد</li>
                <li>• إعادة تعيين النظام إجراء نهائي ولا يمكن التراجع عنه</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات المظهر */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="w-5 h-5" />
              إعدادات المظهر والتصميم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-full h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded mb-2"></div>
                <p className="text-sm font-medium">التصميم الافتراضي</p>
                <p className="text-xs text-gray-500">ألوان هادئة ومريحة للعين</p>
              </div>
              <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-full h-20 bg-gradient-to-r from-gray-800 to-gray-900 rounded mb-2"></div>
                <p className="text-sm font-medium">التصميم العصري</p>
                <p className="text-xs text-gray-500">مظهر داكن وعصري</p>
              </div>
              <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-full h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded mb-2"></div>
                <p className="text-sm font-medium">التصميم الكلاسيكي</p>
                <p className="text-xs text-gray-500">مظهر تقليدي وأنيق</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}