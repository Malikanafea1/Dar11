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
import html2canvas from "html2canvas";

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
      },
      details: {
        patients: data.patients.map(p => ({
          name: p.name,
          nationalId: p.nationalId,
          admissionDate: formatDate(p.admissionDate),
          roomNumber: p.roomNumber || "غير محدد",
          dailyCost: formatCurrency(p.dailyCost),
          status: p.status === "active" ? "نشط" : "خرج"
        })),
        staff: data.staff.map(s => ({
          name: s.name,
          role: s.role,
          department: s.department,
          salary: formatCurrency(s.monthlySalary),
          status: s.isActive ? "نشط" : "غير نشط"
        })),
        payments: data.payments.map(p => ({
          patientId: p.patientId,
          amount: formatCurrency(p.amount),
          method: p.paymentMethod,
          date: formatDate(p.paymentDate)
        })),
        expenses: data.expenses.map(e => ({
          description: e.description,
          amount: formatCurrency(e.amount),
          category: e.category,
          date: formatDate(e.date)
        }))
      }
    };
  };

  const generateComprehensiveHTML = () => {
    if (!selectedReport || selectedReport.type !== 'comprehensive') return;

    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const currentTime = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التقرير الشامل</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .overview-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #3b82f6;
        }
        .card h3 {
            margin: 0 0 10px 0;
            color: #1e293b;
            font-size: 18px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-value {
            font-weight: bold;
            color: #059669;
        }
        .metric-negative {
            color: #dc2626;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            background: #f1f5f9;
            padding: 15px;
            margin: 0 0 20px 0;
            border-radius: 8px;
            color: #334155;
            font-size: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #3b82f6;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .status-active {
            background: #dcfce7;
            color: #166534;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-inactive {
            background: #fee2e2;
            color: #991b1b;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            color: #64748b;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .header { break-inside: avoid; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>التقرير الشامل</h1>
        <p>الفترة: ${selectedReport.period}</p>
        <p>تاريخ الإنشاء: ${currentDate} - ${currentTime}</p>
    </div>

    <div class="overview-grid">
        <div class="card">
            <h3>المرضى</h3>
            <div class="metric">
                <span>إجمالي المرضى</span>
                <span class="metric-value">${selectedReport.overview.totalPatients}</span>
            </div>
            <div class="metric">
                <span>المرضى النشطين</span>
                <span class="metric-value">${selectedReport.overview.activePatients}</span>
            </div>
        </div>

        <div class="card">
            <h3>الموظفون</h3>
            <div class="metric">
                <span>إجمالي الموظفين</span>
                <span class="metric-value">${selectedReport.overview.totalStaff}</span>
            </div>
            <div class="metric">
                <span>الموظفون النشطون</span>
                <span class="metric-value">${selectedReport.overview.activeStaff}</span>
            </div>
        </div>

        <div class="card">
            <h3>الإيرادات والمصروفات</h3>
            <div class="metric">
                <span>إجمالي الإيرادات</span>
                <span class="metric-value">${formatCurrency(selectedReport.overview.totalRevenue)}</span>
            </div>
            <div class="metric">
                <span>إجمالي المصروفات</span>
                <span class="metric-value metric-negative">${formatCurrency(selectedReport.overview.totalExpenses)}</span>
            </div>
        </div>

        <div class="card">
            <h3>المؤشرات المالية</h3>
            <div class="metric">
                <span>صافي الربح</span>
                <span class="metric-value ${selectedReport.overview.netProfit < 0 ? 'metric-negative' : ''}">${formatCurrency(selectedReport.overview.netProfit)}</span>
            </div>
            <div class="metric">
                <span>هامش الربح</span>
                <span class="metric-value">${selectedReport.kpis.profitMargin.toFixed(1)}%</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>تفاصيل المرضى (أول 10)</h2>
        <table>
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>الرقم المدني</th>
                    <th>رقم الغرفة</th>
                    <th>التكلفة اليومية</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${selectedReport.details.patients.slice(0, 10).map(patient => `
                    <tr>
                        <td>${patient.name}</td>
                        <td>${patient.nationalId}</td>
                        <td>${patient.roomNumber}</td>
                        <td>${patient.dailyCost}</td>
                        <td><span class="${patient.status === 'نشط' ? 'status-active' : 'status-inactive'}">${patient.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${selectedReport.details.patients.length > 10 ? `<p>تم عرض أول 10 مرضى من إجمالي ${selectedReport.details.patients.length} مريض</p>` : ''}
    </div>

    <div class="section">
        <h2>تفاصيل الموظفين (أول 10)</h2>
        <table>
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>المنصب</th>
                    <th>القسم</th>
                    <th>الراتب</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${selectedReport.details.staff.slice(0, 10).map(staff => `
                    <tr>
                        <td>${staff.name}</td>
                        <td>${staff.role}</td>
                        <td>${staff.department}</td>
                        <td>${staff.salary}</td>
                        <td><span class="${staff.status === 'نشط' ? 'status-active' : 'status-inactive'}">${staff.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${selectedReport.details.staff.length > 10 ? `<p>تم عرض أول 10 موظفين من إجمالي ${selectedReport.details.staff.length} موظف</p>` : ''}
    </div>

    <div class="section">
        <h2>آخر المدفوعات (أول 8)</h2>
        <table>
            <thead>
                <tr>
                    <th>معرف المريض</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>التاريخ</th>
                </tr>
            </thead>
            <tbody>
                ${selectedReport.details.payments.slice(0, 8).map(payment => `
                    <tr>
                        <td>${payment.patientId}</td>
                        <td style="color: #059669; font-weight: bold;">${payment.amount}</td>
                        <td>${payment.method}</td>
                        <td>${payment.date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${selectedReport.details.payments.length > 8 ? `<p>تم عرض أول 8 مدفوعات من إجمالي ${selectedReport.details.payments.length} مدفوعة</p>` : ''}
    </div>

    <div class="section">
        <h2>آخر المصروفات (أول 8)</h2>
        <table>
            <thead>
                <tr>
                    <th>الوصف</th>
                    <th>المبلغ</th>
                    <th>الفئة</th>
                    <th>التاريخ</th>
                </tr>
            </thead>
            <tbody>
                ${selectedReport.details.expenses.slice(0, 8).map(expense => `
                    <tr>
                        <td>${expense.description}</td>
                        <td style="color: #dc2626; font-weight: bold;">${expense.amount}</td>
                        <td>${expense.category}</td>
                        <td>${expense.date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${selectedReport.details.expenses.length > 8 ? `<p>تم عرض أول 8 مصروفات من إجمالي ${selectedReport.details.expenses.length} مصروف</p>` : ''}
    </div>

    <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المستشفى</p>
        <p>تاريخ الإنشاء: ${currentDate} في ${currentTime}</p>
    </div>
</body>
</html>`;

    // Create and download HTML file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "تم بنجاح",
      description: "تم تنزيل التقرير الشامل بصيغة HTML",
    });
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
      // إنشاء عنصر HTML مخفي للتقرير
      const reportElement = document.createElement('div');
      reportElement.style.direction = 'rtl';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.padding = '40px';
      reportElement.style.width = '210mm';
      reportElement.style.minHeight = '297mm';
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';

      // إنشاء محتوى التقرير
      const reportHTML = createReportHTML(selectedReport);
      reportElement.innerHTML = reportHTML;
      
      document.body.appendChild(reportElement);

      // تحويل HTML إلى صورة
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // إنشاء PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // حفظ الملف
      const fileName = `${selectedReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // إزالة العنصر المؤقت
      document.body.removeChild(reportElement);

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

  const createReportHTML = (report: any): string => {
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const currentTime = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let contentHTML = '';

    // محتوى التقرير حسب النوع
    if (report.type === 'patients') {
      contentHTML = `
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 20px;">ملخص المرضى</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #dbeafe; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #1d4ed8; font-size: 24px; margin: 0;">${report.summary.total}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">إجمالي المرضى</p>
          </div>
          <div style="background: #dcfce7; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #16a34a; font-size: 24px; margin: 0;">${report.summary.active}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">المرضى النشطين</p>
          </div>
          <div style="background: #fed7aa; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #ea580c; font-size: 24px; margin: 0;">${report.summary.discharged}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">المرضى المخرجين</p>
          </div>
          <div style="background: #e9d5ff; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #9333ea; font-size: 24px; margin: 0;">${formatCurrency(report.summary.totalDailyCost)}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">إجمالي التكلفة اليومية</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">تفاصيل المرضى</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #e2e8f0;">
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">اسم المريض</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">رقم الغرفة</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">التكلفة اليومية</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${report.details.slice(0, 10).map((patient: any, index: number) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${patient.name}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${patient.roomNumber}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${patient.dailyCost}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">
                    <span style="padding: 4px 8px; border-radius: 6px; font-size: 12px; color: white; background: ${patient.status === 'نشط' ? '#16a34a' : '#dc2626'};">
                      ${patient.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${report.details.length > 10 ? `<p style="margin-top: 15px; color: #6b7280; font-style: italic;">تم عرض أول 10 مرضى من إجمالي ${report.details.length} مريض</p>` : ''}
        </div>
      `;
    } 
    
    else if (report.type === 'financial') {
      contentHTML = `
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 20px;">الملخص المالي</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #dcfce7; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #16a34a; font-size: 20px; margin: 0;">${formatCurrency(report.summary.totalRevenue)}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">إجمالي الإيرادات</p>
          </div>
          <div style="background: #fee2e2; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #dc2626; font-size: 20px; margin: 0;">${formatCurrency(report.summary.totalExpenses)}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">إجمالي المصروفات</p>
          </div>
          <div style="background: #dbeafe; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #2563eb; font-size: 20px; margin: 0;">${formatCurrency(report.summary.netProfit)}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">صافي الربح</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">تفاصيل الإيرادات</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #e2e8f0;">
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">معرف المريض</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">المبلغ</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">طريقة الدفع</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${report.revenue.payments.slice(0, 8).map((payment: any, index: number) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${payment.patientId}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">${payment.amount}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${payment.method}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${payment.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${report.revenue.payments.length > 8 ? `<p style="margin-top: 15px; color: #6b7280; font-style: italic;">تم عرض أول 8 مدفوعات من إجمالي ${report.revenue.payments.length} مدفوعة</p>` : ''}
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
          <h4 style="color: #92400e; margin: 0 0 10px 0;">ملخص الأداء المالي</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div>
              <p style="margin: 0; color: #78350f;"><strong>عدد المدفوعات:</strong> ${report.summary.paymentsCount}</p>
              <p style="margin: 5px 0 0 0; color: #78350f;"><strong>عدد المصروفات:</strong> ${report.summary.expensesCount}</p>
            </div>
            <div>
              <p style="margin: 0; color: #78350f;"><strong>هامش الربح:</strong> ${report.summary.profitMargin}%</p>
              <p style="margin: 5px 0 0 0; color: #78350f;"><strong>حالة الأداء:</strong> ${parseFloat(report.summary.profitMargin) > 0 ? '✅ ربح' : '⚠️ خسارة'}</p>
            </div>
          </div>
        </div>
      `;
    } 
    
    else if (report.type === 'staff') {
      contentHTML = `
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 20px;">تقرير الموظفين</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #e9d5ff; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #7c3aed; font-size: 24px; margin: 0;">${report.summary.total}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">إجمالي الموظفين</p>
          </div>
          <div style="background: #dcfce7; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #16a34a; font-size: 24px; margin: 0;">${report.summary.active}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">الموظفين النشطين</p>
          </div>
          <div style="background: #fef3c7; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #d97706; font-size: 20px; margin: 0;">${formatCurrency(report.summary.totalSalaries)}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">إجمالي الرواتب</p>
          </div>
          <div style="background: #ddd6fe; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #7c3aed; font-size: 20px; margin: 0;">${formatCurrency(report.summary.averageSalary)}</h3>
            <p style="margin: 5px 0 0 0; color: #374151;">متوسط الراتب</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">تفاصيل الموظفين</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #e2e8f0;">
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">اسم الموظف</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">المنصب</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">القسم</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">الراتب</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${report.details.slice(0, 10).map((staff: any, index: number) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${staff.name}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${staff.role}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${staff.department}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1; color: #059669; font-weight: bold;">${staff.salary}</td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">
                    <span style="padding: 4px 8px; border-radius: 6px; font-size: 12px; color: white; background: ${staff.status === 'نشط' ? '#16a34a' : '#dc2626'};">
                      ${staff.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${report.details.length > 10 ? `<p style="margin-top: 15px; color: #6b7280; font-style: italic;">تم عرض أول 10 موظفين من إجمالي ${report.details.length} موظف</p>` : ''}
        </div>
      `;
    }

    return `
      <div style="font-family: 'Arial', sans-serif; direction: rtl; color: #1e293b; line-height: 1.6;">
        <!-- رأس التقرير -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #e2e8f0; padding-bottom: 30px;">
          <h1 style="color: #1e40af; font-size: 28px; margin: 0 0 10px 0;">${settings?.hospitalName || 'مركز دار الحياة'}</h1>
          <h2 style="color: #374151; font-size: 22px; margin: 0 0 20px 0;">${report.title}</h2>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 15px; border-radius: 8px;">
            <div>
              <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>الفترة:</strong> ${report.period}</p>
            </div>
            <div style="text-align: left;">
              <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>تاريخ الإنشاء:</strong> ${currentDate}</p>
              <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>الوقت:</strong> ${currentTime}</p>
            </div>
          </div>
        </div>

        ${contentHTML}

        <!-- تذييل التقرير -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">تم إنشاء هذا التقرير بواسطة نظام إدارة ${settings?.hospitalName || 'المركز'}</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">جميع البيانات محدثة حتى تاريخ إنشاء التقرير</p>
          </div>
        </div>
      </div>
    `;
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
                {selectedReport.type === 'comprehensive' && (
                  <Button 
                    onClick={generateComprehensiveHTML}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileText className="w-4 h-4 ml-2" />
                    تقرير HTML
                  </Button>
                )}
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