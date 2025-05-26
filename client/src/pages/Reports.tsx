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
    // هنا يمكن إضافة منطق إنشاء التقرير
    console.log("Generating report:", { reportType, startDate, endDate });
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