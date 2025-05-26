import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  Bed, 
  UserCheck, 
  TrendingUp, 
  PieChart, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  UserPlus,
  Users,
  Receipt,
  FileText,
  AlertCircle,
  Clock,
  Info,
  Plus
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Patient } from "@shared/schema";
import PatientModal from "@/components/PatientModal";
import StaffModal from "@/components/StaffModal";
import ExpenseModal from "@/components/ExpenseModal";

export default function Dashboard() {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  const getRecentPatients = () => {
    if (!recentPatients) return [];
    return recentPatients
      .filter(p => p.status === "active")
      .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())
      .slice(0, 3);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="المرضى الحاليون"
            value={stats?.currentPatients || 0}
            change="+5 من الأمس"
            changeType="positive"
            icon={<Bed className="w-6 h-6" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          
          <StatCard
            title="الموظفون النشطون"
            value={stats?.activeStaff || 0}
            change="لا تغيير"
            changeType="neutral"
            icon={<UserCheck className="w-6 h-6" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          
          <StatCard
            title="الإيرادات اليومية"
            value={formatCurrency(stats?.dailyRevenue || 0)}
            change="+12% من الأسبوع الماضي"
            changeType="positive"
            icon={<TrendingUp className="w-6 h-6" />}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          
          <StatCard
            title="معدل الإشغال"
            value={`${Math.round(stats?.occupancyRate || 0)}%`}
            change="-3% من الشهر الماضي"
            changeType="negative"
            icon={<PieChart className="w-6 h-6" />}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Patients */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">المرضى الجدد</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  عرض الكل
                  <ArrowUp className="mr-1 w-4 h-4 rotate-90" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {patientsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {getRecentPatients().map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center ml-4">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{patient.name}</p>
                          <p className="text-sm text-gray-500">
                            تاريخ الدخول: {formatDate(patient.admissionDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          غرفة {patient.roomNumber || "غير محدد"}
                        </p>
                        <p className="text-xs text-green-600">مستقر</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الإجراءات السريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setIsPatientModalOpen(true)}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="ml-3 w-5 h-5" />
                  إضافة مريض جديد
                </Button>
                <Button 
                  onClick={() => setIsStaffModalOpen(true)}
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                >
                  <Users className="ml-3 w-5 h-5" />
                  إضافة موظف جديد
                </Button>
                <Button 
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="w-full justify-start bg-yellow-600 hover:bg-yellow-700"
                >
                  <Receipt className="ml-3 w-5 h-5" />
                  تسجيل مصروف
                </Button>
                <Button className="w-full justify-start bg-gray-600 hover:bg-gray-700">
                  <FileText className="ml-3 w-5 h-5" />
                  إنشاء تقرير
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">التنبيهات المهمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">دفعة مستحقة</p>
                    <p className="text-xs text-red-600">المريض أحمد محمد - {formatCurrency(5000)}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">موعد تقييم</p>
                    <p className="text-xs text-yellow-600">مراجعة المريض سارة الأحمد - 3:00 مساءً</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">نهاية النوبة</p>
                    <p className="text-xs text-blue-600">د. فاطمة الخالد - العناية المركزة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg">الملخص المالي اليومي</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FinancialStat
                title="الدخل اليومي"
                value={formatCurrency(stats?.dailyIncome || 0)}
                icon={<ArrowUp className="w-6 h-6" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
              />
              
              <FinancialStat
                title="المصروفات اليومية"
                value={formatCurrency(stats?.dailyExpenses || 0)}
                icon={<ArrowDown className="w-6 h-6" />}
                iconBg="bg-red-100"
                iconColor="text-red-600"
              />
              
              <FinancialStat
                title="صافي الربح"
                value={formatCurrency(stats?.netProfit || 0)}
                icon={<TrendingUp className="w-6 h-6" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
              />
              
              <FinancialStat
                title="المدفوعات المعلقة"
                value={formatCurrency(stats?.pendingPayments || 0)}
                icon={<Clock className="w-6 h-6" />}
                iconBg="bg-yellow-100"
                iconColor="text-yellow-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PatientModal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
      />
      <StaffModal 
        isOpen={isStaffModalOpen} 
        onClose={() => setIsStaffModalOpen(false)} 
      />
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
      />
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, change, changeType, icon, iconBg, iconColor }: StatCardProps) {
  const changeIcon = changeType === "positive" ? <ArrowUp className="w-3 h-3" /> : 
                    changeType === "negative" ? <ArrowDown className="w-3 h-3" /> : 
                    <Minus className="w-3 h-3" />;
  
  const changeColor = changeType === "positive" ? "text-green-600" : 
                     changeType === "negative" ? "text-red-600" : 
                     "text-gray-500";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800 font-inter">{value}</p>
            <p className={`text-sm flex items-center mt-1 ${changeColor}`}>
              {changeIcon}
              <span className="mr-1">{change}</span>
            </p>
          </div>
          <div className={`${iconBg} p-4 rounded-full`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FinancialStatProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function FinancialStat({ title, value, icon, iconBg, iconColor }: FinancialStatProps) {
  return (
    <div className="text-center">
      <div className={`${iconBg} p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 font-inter">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
