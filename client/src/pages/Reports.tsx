import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Printer,
  Building2,
  Clock,
  FileCheck
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Staff, Expense, Payment, Settings } from "@shared/schema";
import jsPDF from "jspdf";

interface ReportData {
  patients: Patient[];
  expenses: Expense[];
  payments: Payment[];
  staff: Staff[];
}

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: staff } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const getFilteredData = (): ReportData => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return {
      patients: patients?.filter(p => {
        const admissionDate = new Date(p.admissionDate);
        return (!start || admissionDate >= start) && (!end || admissionDate <= end);
      }) || [],
      expenses: expenses?.filter(e => {
        const expenseDate = new Date(e.date);
        return (!start || expenseDate >= start) && (!end || expenseDate <= end);
      }) || [],
      payments: payments?.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return (!start || paymentDate >= start) && (!end || paymentDate <= end);
      }) || [],
      staff: staff || []
    };
  };

  const generateReport = () => {
    if (!reportType) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نوع التقرير",
        variant: "destructive",
      });
      return;
    }

    const data = getFilteredData();
    let reportData;

    switch (reportType) {
      case "patients":
        reportData = generatePatientsReport(data);
        break;
      case "financial":
        reportData = generateFinancialReport(data);
        break;
      case "staff":
        reportData = generateStaffReport(data);
        break;
      case "daily":
        reportData = generateDailyReport(data);
        break;
      case "monthly":
        reportData = generateMonthlyReport(data);
        break;
      case "comprehensive":
        reportData = generateComprehensiveReport(data);
        break;
      default:
        toast({
          title: "خطأ",
          description: "نوع تقرير غير مدعوم",
          variant: "destructive",
        });
        return;
    }

    setSelectedReport(reportData);
    toast({
      title: "تم بنجاح",
      description: "تم إنشاء التقرير بنجاح",
    });
  };

  const generatePatientsReport = (data: ReportData) => {
    const activePatients = data.patients.filter(p => p.status === "active");
    const dischargedPatients = data.patients.filter(p => p.status === "discharged");
    const totalDailyCost = data.patients.reduce((sum, p) => sum + p.dailyCost, 0);
    const totalPaid = data.patients.reduce((sum, p) => sum + p.totalPaid, 0);

    return {
      title: "تقرير المرضى",
      type: "patients",
      period: `${startDate || "البداية"} إلى ${endDate || "اليوم"}`,
      summary: {
        total: data.patients.length,
        active: activePatients.length,
        discharged: dischargedPatients.length,
        totalDailyCost,
        totalPaid,
        occupancyRate: stats?.occupancyRate || 0
      },
      details: data.patients.map(p => ({
        name: p.name,
        nationalId: p.nationalId,
        admissionDate: formatDate(p.admissionDate),
        roomNumber: p.roomNumber || "غير محدد",
        dailyCost: formatCurrency(p.dailyCost),
        status: p.status === "active" ? "نشط" : "خرج",
        totalPaid: formatCurrency(p.totalPaid),
        insurance: p.insurance || "بدون تأمين",
        dischargeDate: p.dischargeDate ? formatDate(p.dischargeDate) : "-"
      }))
    };
  };

  const generateFinancialReport = (data: ReportData) => {
    const totalRevenue = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // تجميع المصروفات حسب الفئة
    const expensesByCategory = data.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // تجميع المدفوعات حسب طريقة الدفع
    const paymentsByMethod = data.payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      title: "التقرير المالي",
      type: "financial",
      period: `${startDate || "البداية"} إلى ${endDate || "اليوم"}`,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
        paymentsCount: data.payments.length,
        expensesCount: data.expenses.length
      },
      revenue: {
        total: totalRevenue,
        byMethod: paymentsByMethod,
        payments: data.payments.map(p => ({
          patientId: p.patientId,
          amount: formatCurrency(p.amount),
          method: p.paymentMethod,
          date: formatDate(p.paymentDate),
          notes: p.notes || "-"
        }))
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        details: data.expenses.map(e => ({
          description: e.description,
          amount: formatCurrency(e.amount),
          category: e.category,
          date: formatDate(e.date),
          createdBy: e.createdBy
        }))
      }
    };
  };

  const generateStaffReport = (data: ReportData) => {
    const activeStaff = data.staff.filter(s => s.isActive);
    const totalSalaries = data.staff.reduce((sum, s) => sum + s.monthlySalary, 0);
    
    // تجميع الموظفين حسب القسم
    const staffByDepartment = data.staff.reduce((acc, staff) => {
      acc[staff.department] = (acc[staff.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // تجميع الموظفين حسب المنصب
    const staffByRole = data.staff.reduce((acc, staff) => {
      acc[staff.role] = (acc[staff.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      title: "تقرير الموظفين",
      type: "staff",
      period: `${startDate || "البداية"} إلى ${endDate || "اليوم"}`,
      summary: {
        total: data.staff.length,
        active: activeStaff.length,
        inactive: data.staff.length - activeStaff.length,
        totalSalaries,
        averageSalary: data.staff.length > 0 ? totalSalaries / data.staff.length : 0
      },
      distribution: {
        byDepartment: staffByDepartment,
        byRole: staffByRole
      },
      details: data.staff.map(s => ({
        name: s.name,
        role: s.role,
        department: s.department,
        salary: formatCurrency(s.monthlySalary),
        hireDate: formatDate(s.hireDate),
        status: s.isActive ? "نشط" : "غير نشط",
        phone: s.phoneNumber || "غير محدد",
        email: s.email || "غير محدد"
      }))
    };
  };

  const generateDailyReport = (data: ReportData) => {
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = data.expenses.filter(e => e.date.split('T')[0] === today);
    const todayPayments = data.payments.filter(p => p.paymentDate.split('T')[0] === today);
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      title: "التقرير اليومي",
      type: "daily",
      period: formatDate(new Date()),
      summary: {
        date: formatDate(new Date()),
        activePatients: data.patients.filter(p => p.status === "active").length,
        todayPayments: todayPayments.length,
        todayExpenses: todayExpenses.length,
        todayRevenue,
        todayExpensesTotal,
        netIncome: todayRevenue - todayExpensesTotal
      },
      activities: {
        payments: todayPayments.map(p => ({
          patientId: p.patientId,
          amount: formatCurrency(p.amount),
          method: p.paymentMethod,
          time: formatDateTime(p.paymentDate)
        })),
        expenses: todayExpenses.map(e => ({
          description: e.description,
          amount: formatCurrency(e.amount),
          category: e.category,
          time: formatDateTime(e.date)
        }))
      }
    };
  };

  const generateMonthlyReport = (data: ReportData) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = data.expenses.filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const monthlyPayments = data.payments.filter(p => {
      const date = new Date(p.paymentDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyExpensesTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      title: "التقرير الشهري",
      type: "monthly",
      period: `${currentMonth + 1}/${currentYear}`,
      summary: {
        month: currentMonth + 1,
        year: currentYear,
        totalPatients: data.patients.length,
        activePatients: data.patients.filter(p => p.status === "active").length,
        monthlyRevenue,
        monthlyExpensesTotal,
        netProfit: monthlyRevenue - monthlyExpensesTotal,
        transactionsCount: monthlyPayments.length + monthlyExpenses.length
      },
      trends: {
        dailyAverageRevenue: monthlyPayments.length > 0 ? monthlyRevenue / 30 : 0,
        dailyAverageExpenses: monthlyExpenses.length > 0 ? monthlyExpensesTotal / 30 : 0
      }
    };
  };

  const generateComprehensiveReport = (data: ReportData) => {
    const totalRevenue = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaries = data.staff.reduce((sum, s) => sum + s.monthlySalary, 0);

    return {
      title: "التقرير الشامل",
      type: "comprehensive",
      period: `${startDate || "البداية"} إلى ${endDate || "اليوم"}`,
      overview: {
        totalPatients: data.patients.length,
        activePatients: data.patients.filter(p => p.status === "active").length,
        totalStaff: data.staff.length,
        activeStaff: data.staff.filter(s => s.isActive).length,
        totalRevenue,
        totalExpenses,
        totalSalaries,
        netProfit: totalRevenue - totalExpenses - totalSalaries
      },
      kpis: {
        occupancyRate: stats?.occupancyRate || 0,
        revenuePerPatient: data.patients.length > 0 ? totalRevenue / data.patients.length : 0,
        averageStaySalary: data.staff.length > 0 ? totalSalaries / data.staff.length : 0,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0
      }
    };
  };

  const generatePDF = async () => {
    if (!selectedReport) {
      toast({
        title: "خطأ",
        description: "يرجى إنشاء تقرير أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // إعداد الخط العربي (يحتاج خط عربي مناسب)
      pdf.setFont('helvetica');
      
      // العنوان الرئيسي
      pdf.setFontSize(20);
      pdf.text(settings?.hospitalName || 'مركز دار الحياة', 105, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text(selectedReport.title, 105, 35, { align: 'center' });
      
      // معلومات التقرير
      pdf.setFontSize(12);
      pdf.text(`الفترة: ${selectedReport.period}`, 20, 50);
      pdf.text(`تاريخ الإنشاء: ${formatDateTime(new Date())}`, 20, 60);
      
      // خط فاصل
      pdf.line(20, 70, 190, 70);
      
      let yPosition = 80;
      
      // محتوى التقرير حسب النوع
      if (selectedReport.type === 'patients') {
        // ملخص المرضى
        pdf.setFontSize(14);
        pdf.text('ملخص المرضى', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(10);
        pdf.text(`إجمالي المرضى: ${selectedReport.summary.total}`, 20, yPosition);
        pdf.text(`المرضى النشطين: ${selectedReport.summary.active}`, 20, yPosition + 10);
        pdf.text(`المرضى المخرجين: ${selectedReport.summary.discharged}`, 20, yPosition + 20);
        pdf.text(`إجمالي التكلفة اليومية: ${formatCurrency(selectedReport.summary.totalDailyCost)}`, 20, yPosition + 30);
        
        yPosition += 50;
        
        // تفاصيل المرضى
        pdf.setFontSize(12);
        pdf.text('تفاصيل المرضى', 20, yPosition);
        yPosition += 15;
        
        selectedReport.details.forEach((patient: any, index: number) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(10);
          pdf.text(`${index + 1}. ${patient.name}`, 20, yPosition);
          pdf.text(`الرقم القومي: ${patient.nationalId}`, 30, yPosition + 8);
          pdf.text(`رقم الغرفة: ${patient.roomNumber}`, 30, yPosition + 16);
          pdf.text(`التكلفة اليومية: ${patient.dailyCost}`, 30, yPosition + 24);
          
          yPosition += 35;
        });
      }
      
      else if (selectedReport.type === 'financial') {
        // الملخص المالي
        pdf.setFontSize(14);
        pdf.text('الملخص المالي', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(10);
        pdf.text(`إجمالي الإيرادات: ${formatCurrency(selectedReport.summary.totalRevenue)}`, 20, yPosition);
        pdf.text(`إجمالي المصروفات: ${formatCurrency(selectedReport.summary.totalExpenses)}`, 20, yPosition + 10);
        pdf.text(`صافي الربح: ${formatCurrency(selectedReport.summary.netProfit)}`, 20, yPosition + 20);
        pdf.text(`هامش الربح: ${selectedReport.summary.profitMargin}%`, 20, yPosition + 30);
        
        yPosition += 50;
        
        // تفاصيل الإيرادات
        if (selectedReport.revenue.payments.length > 0) {
          pdf.setFontSize(12);
          pdf.text('تفاصيل الإيرادات', 20, yPosition);
          yPosition += 15;
          
          selectedReport.revenue.payments.forEach((payment: any, index: number) => {
            if (yPosition > 250) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.setFontSize(10);
            pdf.text(`${index + 1}. مريض #${payment.patientId} - ${payment.amount}`, 20, yPosition);
            pdf.text(`طريقة الدفع: ${payment.method} - التاريخ: ${payment.date}`, 30, yPosition + 8);
            
            yPosition += 20;
          });
        }
      }
      
      // إضافة تذييل
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`صفحة ${i} من ${pageCount}`, 105, 285, { align: 'center' });
        pdf.text(`تم الإنشاء بواسطة نظام إدارة ${settings?.hospitalName || 'المركز'}`, 105, 290, { align: 'center' });
      }
      
      // حفظ الملف
      const fileName = `${selectedReport.title}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "تم بنجاح",
        description: "تم تصدير التقرير بصيغة PDF بنجاح",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">التقارير والإحصائيات</h1>
        <p className="text-gray-600 mt-2">إنشاء وعرض التقارير المختلفة لإدارة المركز</p>
      </div>

      {/* إعدادات التقرير */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-6 h-6" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="report-type" className="text-sm font-medium">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patients">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      تقرير المرضى
                    </div>
                  </SelectItem>
                  <SelectItem value="financial">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      التقرير المالي
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      تقرير الموظفين
                    </div>
                  </SelectItem>
                  <SelectItem value="daily">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      التقرير اليومي
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      التقرير الشهري
                    </div>
                  </SelectItem>
                  <SelectItem value="comprehensive">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      التقرير الشامل
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">الإجراءات</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={generateReport} 
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={!reportType}
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  إنشاء
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">إجمالي المرضى</p>
                <p className="text-3xl font-bold text-blue-600">
                  {filteredData.patients.length}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  النشطين: {filteredData.patients.filter(p => p.status === "active").length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(filteredData.payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  المعاملات: {filteredData.payments.length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">إجمالي المصروفات</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(filteredData.expenses.reduce((sum, e) => sum + e.amount, 0))}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  المعاملات: {filteredData.expenses.length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">عدد الموظفين</p>
                <p className="text-3xl font-bold text-purple-600">
                  {filteredData.staff.length}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  النشطين: {filteredData.staff.filter(s => s.isActive).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* عرض التقرير المُنشأ */}
      {selectedReport && (
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <FileCheck className="w-6 h-6" />
                {selectedReport.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isGeneratingPDF ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                  تصدير PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">الفترة الزمنية</p>
                  <p className="text-sm text-gray-600">{selectedReport.period}</p>
                </div>
                <div>
                  <p className="font-medium">تاريخ الإنشاء</p>
                  <p className="text-sm text-gray-600">{formatDateTime(new Date())}</p>
                </div>
              </div>

              <Separator />

              {/* عرض محتوى التقرير حسب النوع */}
              {selectedReport.type === 'patients' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedReport.summary.total}</p>
                      <p className="text-sm text-gray-600">إجمالي المرضى</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedReport.summary.active}</p>
                      <p className="text-sm text-gray-600">المرضى النشطين</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{selectedReport.summary.discharged}</p>
                      <p className="text-sm text-gray-600">المرضى المخرجين</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedReport.summary.totalDailyCost)}</p>
                      <p className="text-sm text-gray-600">إجمالي التكلفة اليومية</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.type === 'financial' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedReport.summary.totalRevenue)}</p>
                      <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedReport.summary.totalExpenses)}</p>
                      <p className="text-sm text-gray-600">إجمالي المصروفات</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedReport.summary.netProfit)}</p>
                      <p className="text-sm text-gray-600">صافي الربح</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.type === 'staff' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedReport.summary.total}</p>
                      <p className="text-sm text-gray-600">إجمالي الموظفين</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedReport.summary.active}</p>
                      <p className="text-sm text-gray-600">الموظفين النشطين</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{selectedReport.summary.inactive}</p>
                      <p className="text-sm text-gray-600">الموظفين غير النشطين</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedReport.summary.totalSalaries)}</p>
                      <p className="text-sm text-gray-600">إجمالي الرواتب</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.type === 'daily' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedReport.summary.activePatients}</p>
                      <p className="text-sm text-gray-600">المرضى النشطين</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedReport.summary.todayRevenue)}</p>
                      <p className="text-sm text-gray-600">إيرادات اليوم</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedReport.summary.todayExpensesTotal)}</p>
                      <p className="text-sm text-gray-600">مصروفات اليوم</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedReport.summary.netIncome)}</p>
                      <p className="text-sm text-gray-600">صافي الدخل</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.type === 'monthly' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedReport.summary.totalPatients}</p>
                      <p className="text-sm text-gray-600">إجمالي المرضى</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedReport.summary.monthlyRevenue)}</p>
                      <p className="text-sm text-gray-600">إيرادات الشهر</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedReport.summary.monthlyExpensesTotal)}</p>
                      <p className="text-sm text-gray-600">مصروفات الشهر</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedReport.summary.netProfit)}</p>
                      <p className="text-sm text-gray-600">صافي الربح</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.type === 'comprehensive' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedReport.overview.totalPatients}</p>
                      <p className="text-sm text-gray-600">إجمالي المرضى</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{selectedReport.overview.totalStaff}</p>
                      <p className="text-sm text-gray-600">إجمالي الموظفين</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedReport.overview.totalRevenue)}</p>
                      <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedReport.overview.netProfit)}</p>
                      <p className="text-sm text-gray-600">صافي الربح</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <p className="text-xl font-bold text-indigo-600">{selectedReport.kpis.occupancyRate}%</p>
                      <p className="text-sm text-gray-600">معدل الإشغال</p>
                    </div>
                    <div className="text-center p-4 bg-cyan-50 rounded-lg">
                      <p className="text-xl font-bold text-cyan-600">{formatCurrency(selectedReport.kpis.revenuePerPatient)}</p>
                      <p className="text-sm text-gray-600">الإيراد لكل مريض</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-xl font-bold text-orange-600">{formatCurrency(selectedReport.kpis.averageStaySalary)}</p>
                      <p className="text-sm text-gray-600">متوسط الراتب</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <p className="text-xl font-bold text-emerald-600">{selectedReport.kpis.profitMargin.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">هامش الربح</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة في حالة عدم وجود تقرير */}
      {!selectedReport && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">لم يتم إنشاء أي تقرير بعد</h3>
            <p className="text-gray-500 mb-6">اختر نوع التقرير والفترة الزمنية ثم اضغط على "إنشاء التقرير"</p>
            <Badge variant="outline" className="text-sm px-4 py-2">
              <Clock className="w-4 h-4 ml-2" />
              في انتظار اختيار التقرير
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}