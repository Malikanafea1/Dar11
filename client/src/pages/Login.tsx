import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, UserPlus, Hospital, AlertCircle, CheckCircle } from "lucide-react";

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // محاكاة فحص وجود مستخدم مسؤول
  const [hasAdminUser] = useState(false); // في الواقع، يجب فحص هذا من قاعدة البيانات

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isCreatingAdmin) {
        // التحقق من صحة البيانات لإنشاء مسؤول
        if (!username.trim()) {
          setError("اسم المستخدم مطلوب");
          return;
        }
        if (password.length < 6) {
          setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
          return;
        }
        if (password !== confirmPassword) {
          setError("كلمة المرور وتأكيد كلمة المرور غير متطابقتين");
          return;
        }
        
        // هنا يمكن إضافة منطق إنشاء المستخدم المسؤول
        console.log("Creating admin user:", { username, password });
        
        // محاكاة نجاح إنشاء المستخدم
        setTimeout(() => {
          onLogin(username, password);
        }, 1000);
      } else {
        // منطق تسجيل الدخول العادي
        if (!username.trim() || !password.trim()) {
          setError("اسم المستخدم وكلمة المرور مطلوبان");
          return;
        }
        
        // هنا يمكن إضافة منطق التحقق من المستخدم
        console.log("Logging in:", { username, password });
        
        // محاكاة نجاح تسجيل الدخول
        setTimeout(() => {
          onLogin(username, password);
        }, 1000);
      }
    } catch (err) {
      setError("حدث خطأ أثناء المعالجة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-blue-600 p-4 rounded-full w-20 h-20 flex items-center justify-center">
            <Hospital className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              مركز دار الحياة لعلاج الإدمان
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {isCreatingAdmin ? "إنشاء حساب مسؤول النظام" : "تسجيل الدخول إلى النظام"}
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          {!hasAdminUser && !isCreatingAdmin && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                مرحباً بك في النظام لأول مرة! يجب إنشاء حساب مسؤول النظام أولاً.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-0 h-full px-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {isCreatingAdmin && (
                <div>
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="أعد إدخال كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-0 h-full px-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                "جاري المعالجة..."
              ) : isCreatingAdmin ? (
                <>
                  <UserPlus className="ml-2 w-4 h-4" />
                  إنشاء حساب مسؤول النظام
                </>
              ) : (
                <>
                  <LogIn className="ml-2 w-4 h-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            {!hasAdminUser ? (
              <Button
                variant="link"
                onClick={() => setIsCreatingAdmin(!isCreatingAdmin)}
                className="text-blue-600 hover:text-blue-700"
              >
                {isCreatingAdmin ? "العودة لتسجيل الدخول" : "إنشاء حساب مسؤول النظام"}
              </Button>
            ) : (
              <p className="text-sm text-gray-500">
                تواصل مع مسؤول النظام في حالة نسيان كلمة المرور
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}