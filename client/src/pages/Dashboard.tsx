import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Activity,
  Clock,
  Calendar,
  Heart,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bed,
  Stethoscope,
  CreditCard,
  FileText,
  BarChart3,
  PieChart,
  Eye,
  Download,
  Filter,
  Search,
  UserX,
  CalendarCheck,
  Cigarette
} from "lucide-react";
import { formatCurrency, formatDate, calculateDaysBetween } from "@/lib/utils";
import type { Patient } from "@shared/schema";
import PatientModal from "@/components/PatientModal";
import StaffModal from "@/components/StaffModal";
import ExpenseModal from "@/components/ExpenseModal";
import CollectionModal from "@/components/CollectionModal";
import { Link } from "wouter";

export default function Dashboard() {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedPatientForCollection, setSelectedPatientForCollection] = useState<Patient | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [activeTab, setActiveTab] = useState("today-collections");
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: payments } = useQuery({
    queryKey: ["/api/payments"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const activePatients = patients?.filter((p: any) => p.status === "active") || [];
  const recentPatients = showAllPatients ? activePatients : activePatients.slice(0, 6);
  
  // حساب المرضى الذين يحتاجون متابعة (أكثر من 7 أيام)
  const criticalPatients = activePatients.filter((p: any) => {
    if (!p.admissionDate) return false;
    const daysSinceAdmission = calculateDaysBetween(p.admissionDate, new Date());
    return daysSinceAdmission > 7;
  });

  // حساب متوسط مدة الإقامة
  const avgStayDuration = activePatients.length > 0 
    ? activePatients
        .filter(p => p.admissionDate)
        .reduce((sum, p) => sum + calculateDaysBetween(p.admissionDate, new Date()), 0) / activePatients.filter(p => p.admissionDate).length
    : 0;

  // الحصول على آخر المدفوعات
  const recentPayments = Array.isArray(payments) ? payments.slice(0, 3) : [];

  // تحليل الإيرادات الشهرية
  const monthlyRevenue = Array.isArray(payments) ? payments.reduce((sum: number, payment: any) => {
    const paymentDate = new Date(payment.paymentDate);
    const currentMonth = new Date().getMonth();
    if (paymentDate.getMonth() === currentMonth) {
      return sum + payment.amount;
    }
    return sum;
  }, 0) : 0;

  // حساب المرضى الذين موعدهم اليوم للتحصيل (مضى عليهم 7 أيام أو أكثر ولم يدفعوا اليوم)
  const getTodayCollectionPatients = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return activePatients.filter((patient: any) => {
      if (!patient.admissionDate) return false;
      
      const daysSinceAdmission = calculateDaysBetween(patient.admissionDate, today);
      
      // المرضى الذين أكملوا أسبوع أو أكثر
      if (daysSinceAdmission >= 7) {
        // التحقق من عدم وجود دفعات اليوم
        const todayPayments = Array.isArray(payments) ? payments.filter((payment: any) => 
          payment.patientId === patient.id && 
          payment.paymentDate === todayStr
        ) : [];
        
        return todayPayments.length === 0;
      }
      
      return false;
    });
  };

  // المرضى الذين تم دفع تحصيلهم اليوم
  const getPatientsWithTodayPayments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return activePatients.filter((patient: any) => {
      const todayPayments = Array.isArray(payments) ? payments.filter((payment: any) => 
        payment.patientId === patient.id && 
        payment.paymentDate === todayStr
      ) : [];
      
      return todayPayments.length > 0;
    });
  };

  // المرضى الذين خرجوا من المستشفى
  const getDischargedPatients = () => {
    return patients?.filter((p: any) => p.status === "discharged") || [];
  };

  const todayCollectionPatients = getTodayCollectionPatients();
  const patientsWithTodayPayments = getPatientsWithTodayPayments();
  const dischargedPatients = getDischargedPatients();

  // حساب المبلغ المتوقع تحصيله اليوم
  const expectedTodayCollection = todayCollectionPatients.reduce((sum, patient: any) => {
    if (!patient.admissionDate || !patient.dailyCost) return sum;
    const days = calculateDaysBetween(patient.admissionDate, new Date());
    const totalCost = days * patient.dailyCost;
    const totalPaid = Array.isArray(payments) ? payments.filter((p: any) => p.patientId === patient.id)
      .reduce((total: number, payment: any) => total + payment.amount, 0) : 0;
    return sum + Math.max(0, totalCost - totalPaid);
  }, 0);

  // حساب إجمالي التحصيلات اليوم
  const todayTotalCollections = Array.isArray(payments) ? 
    payments.filter((payment: any) => {
      const paymentDate = new Date(payment.paymentDate);
      const today = new Date();
      return paymentDate.toDateString() === today.toDateString();
    }).reduce((sum, payment) => sum + payment.amount, 0) : 0;

  // حساب تكلفة السجائر اليومية
  const calculateCigaretteCost = (patient: any) => {
    return (patient.dailyCigarettes || 0) * (patient.cigarettePrice || 0);
  };

  const handleOpenCollectionModal = (patient: Patient) => {
    setSelectedPatientForCollection(patient);
    setIsCollectionModalOpen(true);
  };

  // إنشاء تقرير شامل
  const generateComprehensiveReport = () => {
    const reportData = {
      date: new Date().toISOString(),
      stats: stats,
      totalPatients: patients?.length || 0,
      activePatients: activePatients.length,
      dischargedPatients: dischargedPatients.length,
      todayCollections: todayTotalCollections,
      expectedCollections: expectedTodayCollection,
      monthlyRevenue: monthlyRevenue,
      expenses: expenses || [],
      payments: payments || [],
      staff: staff || []
    };
    
    // تنزيل التقرير كملف JSON
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleCloseCollectionModal = () => {
    setSelectedPatientForCollection(null);
    setIsCollectionModalOpen(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                نظام إدارة المستشفى
              </h1>
              <p className="text-lg text-slate-600 mt-2 font-medium">
                لوحة التحكم الرئيسية - {formatDate(new Date())}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={generateComprehensiveReport}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                تقرير شامل
              </Button>
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                النظام نشط
              </Badge>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">المرضى النشطون</p>
                  <p className="text-3xl font-bold">{activePatients.length}</p>
                </div>
                <Bed className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">تحصيلات اليوم</p>
                  <p className="text-3xl font-bold">{formatCurrency(todayTotalCollections)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">مستحق التحصيل</p>
                  <p className="text-3xl font-bold">{formatCurrency(expectedTodayCollection)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">المرضى المخرجون</p>
                  <p className="text-3xl font-bold">{dischargedPatients.length}</p>
                </div>
                <UserX className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات الرئيسية */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="today-collections" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <CalendarCheck className="w-4 h-4 mr-2" />
              تحصيلات اليوم
            </TabsTrigger>
            <TabsTrigger value="all-patients" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              جميع المرضى
            </TabsTrigger>
            <TabsTrigger value="discharged" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <UserX className="w-4 h-4 mr-2" />
              المرضى المخرجون
            </TabsTrigger>
            <TabsTrigger value="cigarettes" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Cigarette className="w-4 h-4 mr-2" />
              حساب السجائر
            </TabsTrigger>
          </TabsList>

          {/* تبويب تحصيلات اليوم */}
          <TabsContent value="today-collections">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* المرضى المستحقين للتحصيل اليوم */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-5 h-5" />
                    مستحق التحصيل اليوم ({todayCollectionPatients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayCollectionPatients.length > 0 ? (
                    todayCollectionPatients.map((patient: any) => (
                      <div key={patient.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-500">
                            مدة الإقامة: {calculateDaysBetween(patient.admissionDate, new Date())} يوم
                          </p>
                          <p className="text-sm text-orange-600 font-medium">
                            المستحق: {formatCurrency(calculateDaysBetween(patient.admissionDate, new Date()) * (patient.dailyCost || 0))}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenCollectionModal(patient)}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          تحصيل
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>لا توجد تحصيلات مستحقة اليوم</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* المرضى الذين تم تحصيلهم اليوم */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    تم التحصيل اليوم ({patientsWithTodayPayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patientsWithTodayPayments.length > 0 ? (
                    patientsWithTodayPayments.map((patient: any) => {
                      const todayPayments = Array.isArray(payments) ? payments.filter((payment: any) => 
                        payment.patientId === patient.id && 
                        payment.paymentDate === new Date().toISOString().split('T')[0]
                      ) : [];
                      const totalPaid = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
                      
                      return (
                        <div key={patient.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <p className="font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500">
                              مدة الإقامة: {calculateDaysBetween(patient.admissionDate, new Date())} يوم
                            </p>
                            <p className="text-sm text-green-600 font-medium">
                              تم التحصيل: {formatCurrency(totalPaid)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            مكتمل
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>لم يتم أي تحصيل اليوم بعد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تبويب جميع المرضى */}
          <TabsContent value="all-patients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Users className="w-5 h-5" />
                  جميع المرضى النشطون ({activePatients.length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllPatients(!showAllPatients)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showAllPatients ? "إخفاء التفاصيل" : "عرض المزيد"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPatients.map((patient: any) => {
                    const totalPaid = Array.isArray(payments) ? payments
                      .filter((p: any) => p.patientId === patient.id)
                      .reduce((total: number, payment: any) => total + payment.amount, 0) : 0;
                    const totalCost = calculateDaysBetween(patient.admissionDate, new Date()) * (patient.dailyCost || 0);
                    const remaining = totalCost - totalPaid;
                    
                    return (
                      <div key={patient.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{patient.name}</h3>
                            <Badge variant="outline" className={`text-xs ${
                              patient.status === 'active' ? 'text-green-600 border-green-300 bg-green-50' : 
                              'text-gray-600 border-gray-300 bg-gray-50'
                            }`}>
                              {patient.status === 'active' ? 'نشط' : patient.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">الرقم المدني:</span>
                              <p>{patient.nationalId}</p>
                            </div>
                            <div>
                              <span className="font-medium">مدة الإقامة:</span>
                              <p>{calculateDaysBetween(patient.admissionDate, new Date())} يوم</p>
                            </div>
                            <div>
                              <span className="font-medium">التكلفة الإجمالية:</span>
                              <p className="text-blue-600 font-medium">{formatCurrency(totalCost)}</p>
                            </div>
                            <div>
                              <span className="font-medium">المتبقي:</span>
                              <p className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(remaining)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenCollectionModal(patient)}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            تحصيل
                          </Button>
                          <Link href={`/patients/${patient.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              عرض
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب المرضى المخرجون */}
          <TabsContent value="discharged">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <UserX className="w-5 h-5" />
                  المرضى المخرجون ({dischargedPatients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dischargedPatients.length > 0 ? (
                    dischargedPatients.map((patient: any) => {
                      const totalPaid = Array.isArray(payments) ? payments
                        .filter((p: any) => p.patientId === patient.id)
                        .reduce((total: number, payment: any) => total + payment.amount, 0) : 0;
                      const totalCost = patient.dischargeDate ? 
                        calculateDaysBetween(patient.admissionDate, patient.dischargeDate) * (patient.dailyCost || 0) :
                        calculateDaysBetween(patient.admissionDate, new Date()) * (patient.dailyCost || 0);
                      
                      return (
                        <div key={patient.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-gray-900">{patient.name}</h3>
                              <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100">
                                مخرج
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">تاريخ الدخول:</span>
                                <p>{formatDate(patient.admissionDate)}</p>
                              </div>
                              <div>
                                <span className="font-medium">تاريخ الخروج:</span>
                                <p>{formatDate(patient.dischargeDate || new Date())}</p>
                              </div>
                              <div>
                                <span className="font-medium">إجمالي المدفوع:</span>
                                <p className="text-green-600 font-medium">{formatCurrency(totalPaid)}</p>
                              </div>
                              <div>
                                <span className="font-medium">التكلفة الإجمالية:</span>
                                <p className="text-blue-600 font-medium">{formatCurrency(totalCost)}</p>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            كشف حساب
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserX className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>لا يوجد مرضى مخرجون</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب حساب السجائر */}
          <TabsContent value="cigarettes">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Cigarette className="w-5 h-5" />
                    تكلفة السجائر اليومية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activePatients.filter((p: any) => p.dailyCigarettes > 0).map((patient: any) => (
                      <div key={patient.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            {patient.dailyCigarettes || 0} سيجارة × {formatCurrency(patient.cigarettePrice || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">
                            {formatCurrency(calculateCigaretteCost(patient))} / يوم
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <BarChart3 className="w-5 h-5" />
                    إحصائيات السجائر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>إجمالي السجائر اليومية</span>
                      <span className="font-bold">
                        {activePatients.reduce((sum, p: any) => sum + (p.dailyCigarettes || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>التكلفة اليومية</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(activePatients.reduce((sum, p: any) => sum + calculateCigaretteCost(p), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>التكلفة الشهرية المتوقعة</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(activePatients.reduce((sum, p: any) => sum + calculateCigaretteCost(p), 0) * 30)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* التحليلات المالية */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <FinancialCard
            title="إجمالي الدخل اليومي"
            value={formatCurrency(stats?.dailyIncome || 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
            description="المبالغ المحصلة اليوم"
            percentage={((stats?.dailyIncome || 0) / (monthlyRevenue || 1) * 100).toFixed(1)}
          />
          <FinancialCard
            title="المصروفات اليومية"
            value={formatCurrency(stats?.dailyExpenses || 0)}
            icon={<TrendingDown className="h-5 w-5" />}
            color="red"
            description="إجمالي المصروفات المسجلة"
            percentage={((stats?.dailyExpenses || 0) / (stats?.dailyIncome || 1) * 100).toFixed(1)}
          />
          <FinancialCard
            title="صافي الربح"
            value={formatCurrency(stats?.netProfit || 0)}
            icon={<BarChart3 className="h-5 w-5" />}
            color="blue"
            description="الدخل - المصروفات"
            percentage={((stats?.netProfit || 0) / (stats?.dailyIncome || 1) * 100).toFixed(1)}
          />
          <FinancialCard
            title="المدفوعات المعلقة"
            value={formatCurrency(stats?.pendingPayments || 0)}
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
            description="مستحقات لم تُحصل بعد"
            percentage="15.2"
          />
        </div>

        {/* قسم التحصيلات اليومية */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-green-600" />
                  <span className="text-xl">مواعيد التحصيل اليوم</span>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-700">
                  {todayCollectionPatients.length} مريض
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">المرضى المطلوب تحصيلهم</p>
                      <p className="text-2xl font-bold text-green-600">{todayCollectionPatients.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">المبلغ المتوقع</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(expectedTodayCollection)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">متوسط الفترة</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {todayCollectionPatients.length > 0 
                          ? Math.round(todayCollectionPatients.reduce((sum, p) => sum + calculateDaysBetween(p.admissionDate, new Date()), 0) / todayCollectionPatients.length)
                          : 0} يوم
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {todayCollectionPatients.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 mb-3">قائمة المرضى:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {todayCollectionPatients.slice(0, 6).map((patient) => {
                      const days = calculateDaysBetween(patient.admissionDate, new Date());
                      const totalCost = days * patient.dailyCost;
                      const totalPaid = payments?.filter(p => p.patientId === patient.id)
                        .reduce((total, payment) => total + payment.amount, 0) || 0;
                      const remainingAmount = totalCost - totalPaid;

                      return (
                        <div key={patient.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{patient.name}</h4>
                              <p className="text-sm text-gray-600">غرفة: {patient.roomNumber || "غير محدد"}</p>
                              <p className="text-sm text-gray-600">{days} يوم إقامة</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">المبلغ المطلوب:</p>
                              <p className="font-bold text-green-600">{formatCurrency(remainingAmount)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <Badge variant="outline" className="text-xs">
                              تكلفة يومية: {formatCurrency(patient.dailyCost)}
                            </Badge>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleOpenCollectionModal(patient)}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              تحصيل
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {todayCollectionPatients.length > 6 && (
                    <div className="text-center pt-4">
                      <Link href="/collections">
                        <Button variant="outline" className="text-green-600 border-green-600">
                          عرض جميع المرضى ({todayCollectionPatients.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">لا توجد مواعيد تحصيل لليوم</p>
                  <p className="text-sm text-gray-500">جميع المدفوعات محدثة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* إحصائيات المرضى */}
          <Card className="col-span-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Heart className="h-6 w-6 text-red-500" />
                تحليل المرضى
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">مرضى نشطون</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {activePatients.length}
                  </Badge>
                </div>
                <Progress value={(activePatients.length / (patients?.length || 1)) * 100} className="h-3" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">حالات تحتاج متابعة</span>
                  <Badge variant="destructive" className="bg-red-50 text-red-700">
                    {criticalPatients.length}
                  </Badge>
                </div>
                <Progress 
                  value={(criticalPatients.length / (activePatients.length || 1)) * 100} 
                  className="h-3"
                />
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">متوسط مدة الإقامة</span>
                  <Badge variant="outline" className="font-semibold">
                    {avgStayDuration.toFixed(1)} أيام
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">إجمالي المرضى</span>
                  <span className="text-lg font-bold text-blue-600">{patients?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* آخر المرضى */}
          <Card className="col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xl">
                  <Users className="h-6 w-6 text-blue-500" />
                  آخر المرضى المسجلين
                </div>
                <Badge variant="outline" className="text-xs px-3">
                  {recentPatients.length} مريض
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients.map((patient: any, index) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{patient.name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-3 w-3" />
                          <span>دخول: {formatDate(patient.admissionDate)}</span>
                          <span className="text-slate-400">•</span>
                          <span>{calculateDaysBetween(patient.admissionDate, new Date())} أيام</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">
                          غرفة {patient.roomNumber || "غير محدد"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(patient.dailyCost)}/يوم
                        </p>
                      </div>
                      <Badge 
                        variant={patient.status === "active" ? "default" : "secondary"}
                        className={patient.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {patient.status === "active" ? "نشط" : "مخرج"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentPatients.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">لا توجد بيانات مرضى</p>
                    <p className="text-sm">ابدأ بإضافة مريض جديد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الإجراءات السريعة والتنبيهات */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
          {/* الإجراءات السريعة */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-6 w-6 text-green-500" />
                الإجراءات السريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setIsPatientModalOpen(true)}
                className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                size="lg"
              >
                <Users className="ml-3 w-5 h-5" />
                إضافة مريض جديد
              </Button>
              <Button 
                onClick={() => setIsStaffModalOpen(true)}
                className="w-full justify-start h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
                size="lg"
              >
                <UserCheck className="ml-3 w-5 h-5" />
                إضافة موظف جديد
              </Button>
              <Button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="w-full justify-start h-12 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg"
                size="lg"
              >
                <CreditCard className="ml-3 w-5 h-5" />
                تسجيل مصروف جديد
              </Button>

              <Button 
                className="w-full justify-start h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
                size="lg"
              >
                <FileText className="ml-3 w-5 h-5" />
                إنشاء تقرير شامل
              </Button>
            </CardContent>
          </Card>

          {/* التنبيهات المهمة */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                التنبيهات والإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalPatients.length > 0 && (
                <div 
                  className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedNotification('critical-patients')}
                >
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">مرضى يحتاجون متابعة</p>
                    <p className="text-sm text-amber-700">
                      {criticalPatients.length} مريض في المستشفى لأكثر من 7 أيام
                    </p>
                  </div>
                </div>
              )}
              
              {(stats?.pendingPayments || 0) > 5000 && (
                <div 
                  className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedNotification('pending-payments')}
                >
                  <DollarSign className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">مدفوعات معلقة عالية</p>
                    <p className="text-sm text-red-700">
                      مدفوعات معلقة بقيمة {formatCurrency(stats?.pendingPayments || 0)}
                    </p>
                  </div>
                </div>
              )}

              {(stats?.occupancyRate || 0) > 85 && (
                <div 
                  className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedNotification('high-occupancy')}
                >
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800">معدل إشغال عالي</p>
                    <p className="text-sm text-blue-700">
                      معدل الإشغال {Math.round(stats?.occupancyRate || 0)}% - تحقق من توفر الأسرة
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">النظام يعمل بكفاءة</p>
                  <p className="text-sm text-green-700">
                    جميع الأنظمة تعمل بشكل طبيعي وقاعدة البيانات متصلة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
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

      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={handleCloseCollectionModal}
        patient={selectedPatientForCollection}
        payments={payments || []}
      />
    </>
  );
}

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  subtitle: string;
  trend: number;
  description: string;
}

function EnhancedStatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  iconBg, 
  subtitle, 
  trend,
  description 
}: EnhancedStatCardProps) {
  const trendIcon = trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  const trendColor = trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-slate-500";

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`${iconBg} p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
          <div className={`flex items-center ${trendColor} bg-slate-50 px-2 py-1 rounded-full`}>
            {trendIcon}
            <span className="text-sm font-semibold mr-1">{change}</span>
          </div>
        </div>
        <div>
          <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
          <p className="text-xs text-slate-500 mb-2">{subtitle}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface FinancialCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "green" | "red" | "blue" | "yellow";
  description: string;
  percentage: string;
}

function FinancialCard({ title, value, icon, color, description, percentage }: FinancialCardProps) {
  const colorClasses = {
    green: "from-green-500 to-emerald-600 text-green-600",
    red: "from-red-500 to-rose-600 text-red-600", 
    blue: "from-blue-500 to-indigo-600 text-blue-600",
    yellow: "from-yellow-500 to-amber-600 text-yellow-600"
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6 text-center">
        <div className={`bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} p-4 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
        <p className="text-xs text-slate-500 mb-2">{description}</p>
        <Badge variant="outline" className={`${colorClasses[color].split(' ')[2]} border-current`}>
          {percentage}%
        </Badge>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-lg border-0 bg-white/80">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 rounded-lg"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-lg border-0 bg-white/80">
              <CardContent className="p-6">
                <div className="h-24 bg-slate-200 rounded-lg"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}