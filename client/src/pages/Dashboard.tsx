import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Plus,
  Bed,
  CreditCard,
  FileText,
  Eye,
  Download,
  UserX,
  CalendarCheck,
  Cigarette,
  BarChart3
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
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [activeTab, setActiveTab] = useState("today-collections");

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

  const handleCloseCollectionModal = () => {
    setSelectedPatientForCollection(null);
    setIsCollectionModalOpen(false);
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
      </div>

      {/* Modal Components */}
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
      
      {selectedPatientForCollection && (
        <CollectionModal 
          isOpen={isCollectionModalOpen} 
          onClose={handleCloseCollectionModal} 
          patient={selectedPatientForCollection}
        />
      )}
    </>
  );
}