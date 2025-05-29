import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Printer
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Patient, Staff, Expense, Payment } from "@shared/schema";

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const generateReport = () => {
    if (!reportType) {
      alert("يرجى اختيار نوع التقرير");
      return;
    }

    const data = getFilteredData();
    
    switch (reportType) {
      case "patients":
        generatePatientsReport(data.patients);
        break;
      case "financial":
        generateFinancialReport(data.expenses, data.payments);
        break;
      case "staff":
        generateStaffReport(staff || []);
        break;
      case "daily":
        generateDailyReport(data);
        break;
      case "monthly":
        generateMonthlyReport(data);
        break;
      default:
        alert("نوع تقرير غير مدعوم");
    }
  };

  const generatePatientsReport = (patients: Patient[]) => {
    const reportContent = `
تقرير المرضى
============

الفترة: ${startDate || "غير محدد"} إلى ${endDate || "غير محدد"}
عدد المرضى: ${patients.length}

تفاصيل المرضى:
${patients.map((p, index) => `
${index + 1}. ${p.name}
   - الرقم القومي: ${p.nationalId}
   - تاريخ الدخول: ${formatDate(p.admissionDate)}
   - رقم الغرفة: ${p.roomNumber || "غير محدد"}
   - التكلفة اليومية: ${formatCurrency(p.dailyCost)}
   - الحالة: ${p.status === "active" ? "نشط" : "خرج"}
   - إجمالي المدفوع: ${formatCurrency(p.totalPaid)}
`).join("\n")}

إجمالي التكلفة اليومية: ${formatCurrency(patients.reduce((sum, p) => sum + p.dailyCost, 0))}
إجمالي المبالغ المدفوعة: ${formatCurrency(patients.reduce((sum, p) => sum + p.totalPaid, 0))}
    `;
    
    downloadReport(reportContent, `تقرير_المرضى_${new Date().toISOString().split('T')[0]}.txt`);
  };

  const generateFinancialReport = (expenses: Expense[], payments: Payment[]) => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const reportContent = `
التقرير المالي
=============

الفترة: ${startDate || "غير محدد"} إلى ${endDate || "غير محدد"}

الإيرادات:
----------
عدد المدفوعات: ${payments.length}
إجمالي الإيرادات: ${formatCurrency(totalPayments)}

تفاصيل المدفوعات:
${payments.map((p, index) => `
${index + 1}. مريض #${p.patientId} - ${formatCurrency(p.amount)} - ${p.paymentMethod} - ${formatDate(p.paymentDate)}
`).join("")}

المصروفات:
----------
عدد المصروفات: ${expenses.length}
إجمالي المصروفات: ${formatCurrency(totalExpenses)}

تفاصيل المصروفات:
${expenses.map((e, index) => `
${index + 1}. ${e.description} - ${formatCurrency(e.amount)} - ${e.category} - ${formatDate(e.date)}
`).join("")}

الملخص المالي:
--------------
إجمالي الإيرادات: ${formatCurrency(totalPayments)}
إجمالي المصروفات: ${formatCurrency(totalExpenses)}
صافي الربح: ${formatCurrency(totalPayments - totalExpenses)}
    `;
    
    downloadReport(reportContent, `التقرير_المالي_${new Date().toISOString().split('T')[0]}.txt`);
  };

  const generateStaffReport = (staffList: Staff[]) => {
    const totalSalaries = staffList.reduce((sum, s) => sum + s.monthlySalary, 0);
    
    const reportContent = `
تقرير الموظفين
==============

إجمالي عدد الموظفين: ${staffList.length}
الموظفين النشطين: ${staffList.filter(s => s.isActive).length}
إجمالي الرواتب الشهرية: ${formatCurrency(totalSalaries)}

تفاصيل الموظفين:
${staffList.map((s, index) => `
${index + 1}. ${s.name}
   - المنصب: ${s.role}
   - القسم: ${s.department}
   - الراتب الشهري: ${formatCurrency(s.monthlySalary)}
   - تاريخ التوظيف: ${formatDate(s.hireDate)}
   - الحالة: ${s.isActive ? "نشط" : "غير نشط"}
   - الهاتف: ${s.phoneNumber || "غير محدد"}
   - البريد الإلكتروني: ${s.email || "غير محدد"}
`).join("\n")}
    `;
    
    downloadReport(reportContent, `تقرير_الموظفين_${new Date().toISOString().split('T')[0]}.txt`);
  };

  const generateDailyReport = (data: any) => {
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = data.expenses.filter((e: Expense) => e.date.split('T')[0] === today);
    const todayPayments = data.payments.filter((p: Payment) => p.paymentDate.split('T')[0] === today);
    
    const reportContent = `
التقرير اليومي
=============

التاريخ: ${formatDate(new Date())}

المرضى النشطين: ${data.patients.filter((p: Patient) => p.status === "active").length}
إجمالي المرضى: ${data.patients.length}

الأنشطة المالية اليوم:
--------------------
المدفوعات: ${todayPayments.length} - ${formatCurrency(todayPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0))}
المصروفات: ${todayExpenses.length} - ${formatCurrency(todayExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0))}

صافي الدخل اليومي: ${formatCurrency(todayPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0) - todayExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0))}
    `;
    
    downloadReport(reportContent, `التقرير_اليومي_${today}.txt`);
  };

  const generateMonthlyReport = (data: any) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = data.expenses.filter((e: Expense) => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const monthlyPayments = data.payments.filter((p: Payment) => {
      const date = new Date(p.paymentDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const reportContent = `
التقرير الشهري
=============

الشهر: ${currentMonth + 1}/${currentYear}

ملخص الشهر:
-----------
إجمالي المرضى: ${data.patients.length}
المرضى النشطين: ${data.patients.filter((p: Patient) => p.status === "active").length}

الأنشطة المالية الشهرية:
-----------------------
إجمالي الإيرادات: ${formatCurrency(monthlyPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0))}
إجمالي المصروفات: ${formatCurrency(monthlyExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0))}
صافي الربح: ${formatCurrency(monthlyPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0) - monthlyExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0))}

عدد المعاملات:
المدفوعات: ${monthlyPayments.length}
المصروفات: ${monthlyExpenses.length}
    `;
    
    downloadReport(reportContent, `التقرير_الشهري_${currentMonth + 1}_${currentYear}.txt`);
  };

  const downloadReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredData = () => {
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
      }) || []
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h1>
        <p className="text-gray-600">إنشاء وعرض التقارير المختلفة للمركز</p>
      </div>

      {/* فلاتر التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            إنشاء تقرير جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patients">تقرير المرضى</SelectItem>
                  <SelectItem value="financial">التقرير المالي</SelectItem>
                  <SelectItem value="staff">تقرير الموظفين</SelectItem>
                  <SelectItem value="daily">التقرير اليومي</SelectItem>
                  <SelectItem value="monthly">التقرير الشهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} className="w-full">
                <BarChart3 className="ml-2 w-4 h-4" />
                إنشاء التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">إجمالي المرضى</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredData.patients.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredData.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(filteredData.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0))}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">عدد الموظفين</p>
                <p className="text-2xl font-bold text-purple-600">
                  {staff?.length || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التقارير المحفوظة */}
      <Card>
        <CardHeader>
          <CardTitle>التقارير المحفوظة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg ml-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">التقرير المالي الشهري</h3>
                  <p className="text-sm text-gray-500">تم إنشاؤه في {formatDate(new Date())}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg ml-3">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">تقرير المرضى الأسبوعي</h3>
                  <p className="text-sm text-gray-500">تم إنشاؤه في {formatDate(new Date())}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-lg ml-3">
                  <BarChart3 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium">تقرير الإحصائيات العامة</h3>
                  <p className="text-sm text-gray-500">تم إنشاؤه في {formatDate(new Date())}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* خيارات التصدير */}
      <Card>
        <CardHeader>
          <CardTitle>تصدير البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <FileSpreadsheet className="w-6 h-6 mb-2 text-green-600" />
              تصدير Excel
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <FileText className="w-6 h-6 mb-2 text-blue-600" />
              تصدير PDF
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <PieChart className="w-6 h-6 mb-2 text-purple-600" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}