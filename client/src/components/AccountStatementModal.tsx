import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Building,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, formatDate, calculateDaysBetween } from "@/lib/utils";
import jsPDF from "jspdf";

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personType: "patient" | "staff";
  personName: string;
}

export default function AccountStatementModal({
  isOpen,
  onClose,
  personId,
  personType,
  personName,
}: AccountStatementModalProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // جلب بيانات الشخص (مريض أو موظف)
  const { data: person, isLoading: personLoading, error: personError } = useQuery({
    queryKey: [`/api/${personType === 'patient' ? 'patients' : 'staff'}/${personId}`],
    enabled: isOpen && !!personId,
  });

  // جلب المدفوعات/الرواتب
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: personType === 'patient' 
      ? [`/api/payments/patient/${personId}`]
      : [`/api/payrolls/staff/${personId}`],
    enabled: isOpen && !!personId,
  });

  // جلب المكافآت والسلف للموظفين
  const { data: bonuses, isLoading: bonusesLoading } = useQuery({
    queryKey: [`/api/bonuses/staff/${personId}`],
    enabled: isOpen && personType === 'staff' && !!personId,
  });

  const { data: advances, isLoading: advancesLoading } = useQuery({
    queryKey: [`/api/advances/staff/${personId}`],
    enabled: isOpen && personType === 'staff' && !!personId,
  });

  const { data: deductions, isLoading: deductionsLoading } = useQuery({
    queryKey: [`/api/deductions/staff/${personId}`],
    enabled: isOpen && personType === 'staff' && !!personId,
  });

  const isLoading = personLoading || transactionsLoading || 
    (personType === 'staff' && (bonusesLoading || advancesLoading || deductionsLoading));

  if (!isOpen) return null;
  
  if (personError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
            <p className="text-red-600">خطأ في تحميل البيانات</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!person) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">لم يتم العثور على البيانات</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // حساب البيانات للمريض
  const calculatePatientAccount = () => {
    if (!person || !(person as any).admissionDate) return { 
      totalCost: 0, 
      totalPaid: 0, 
      balance: 0, 
      days: 0, 
      admissionDate: null,
      dischargeDate: null,
      dailyCost: 0,
      cigaretteCost: 0,
      totalCigaretteCost: 0,
      grandTotal: 0
    };
    
    const patientData = person as any;
    const admissionDate = new Date(patientData.admissionDate);
    const dischargeDate = patientData.dischargeDate ? new Date(patientData.dischargeDate) : new Date();
    const days = calculateDaysBetween(patientData.admissionDate, patientData.dischargeDate || new Date());
    
    const dailyCost = patientData.dailyCost || 0;
    const totalCost = days * dailyCost;
    
    // حساب تكلفة السجائر
    const cigaretteCost = patientData.cigaretteCost || 0;
    const totalCigaretteCost = days * cigaretteCost;
    
    // الإجمالي الكلي
    const grandTotal = totalCost + totalCigaretteCost;
    
    const totalPaid = Array.isArray(transactions) ? transactions.reduce((sum: number, payment: any) => sum + payment.amount, 0) : 0;
    const balance = grandTotal - totalPaid;
    
    return { 
      totalCost, 
      totalPaid, 
      balance, 
      days,
      admissionDate,
      dischargeDate,
      dailyCost,
      cigaretteCost,
      totalCigaretteCost,
      grandTotal
    };
  };

  // حساب البيانات للموظف
  const calculateStaffAccount = () => {
    const totalSalary = Array.isArray(transactions) ? transactions.reduce((sum: number, payroll: any) => sum + payroll.amount, 0) : 0;
    const totalBonuses = Array.isArray(bonuses) ? bonuses.reduce((sum: number, bonus: any) => sum + bonus.amount, 0) : 0;
    const totalAdvances = Array.isArray(advances) ? advances.reduce((sum: number, advance: any) => sum + advance.amount, 0) : 0;
    const totalDeductions = Array.isArray(deductions) ? deductions.reduce((sum: number, deduction: any) => sum + deduction.amount, 0) : 0;
    const netTotal = totalSalary + totalBonuses - totalAdvances - totalDeductions;
    
    return { totalSalary, totalBonuses, totalAdvances, totalDeductions, netTotal };
  };

  const patientAccount = personType === 'patient' ? calculatePatientAccount() : null;
  const staffAccount = personType === 'staff' ? calculateStaffAccount() : null;

  // إنشاء PDF
  const generatePDF = () => {
    if (!person) return;
    
    const doc = new jsPDF();
    
    // إعداد الخط العربي (يحتاج خط عربي مناسب)
    doc.setFont("helvetica");
    doc.setFontSize(16);
    
    // العنوان
    doc.text(`Account Statement - ${personName}`, 20, 20);
    doc.text(`كشف حساب - ${personName}`, 20, 30);
    
    let yPosition = 50;
    
    if (personType === 'patient' && patientAccount) {
      doc.setFontSize(12);
      doc.text(`Patient ID: ${(person as any).nationalId || (person as any).id}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Admission Date: ${formatDate((person as any).admissionDate)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Days: ${patientAccount.days}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Daily Cost: ${formatCurrency((person as any).dailyCost || 0)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Cost: ${formatCurrency(patientAccount.totalCost)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Paid: ${formatCurrency(patientAccount.totalPaid)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Balance: ${formatCurrency(patientAccount.balance)}`, 20, yPosition);
      
      // قائمة المدفوعات
      yPosition += 20;
      doc.text('Payments:', 20, yPosition);
      yPosition += 10;
      
      if (Array.isArray(transactions)) {
        transactions.forEach((payment: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. ${formatDate(payment.paymentDate)} - ${formatCurrency(payment.amount)} - ${payment.paymentMethod}`, 20, yPosition);
          yPosition += 10;
        });
      }
    } else if (personType === 'staff' && staffAccount) {
      doc.setFontSize(12);
      doc.text(`Staff ID: ${(person as any).nationalId || (person as any).id}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Position: ${(person as any).position || 'N/A'}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Department: ${(person as any).department || 'N/A'}`, 20, yPosition);
      yPosition += 20;
      
      doc.text(`Total Salary: ${formatCurrency(staffAccount.totalSalary)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Bonuses: ${formatCurrency(staffAccount.totalBonuses)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Advances: ${formatCurrency(staffAccount.totalAdvances)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Deductions: ${formatCurrency(staffAccount.totalDeductions)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Net Total: ${formatCurrency(staffAccount.netTotal)}`, 20, yPosition);
    }
    
    doc.save(`account-statement-${personName}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-blue-600" />
            كشف حساب - {personName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الشخص */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الاسم</p>
                  <p className="font-medium">{(person as any).name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {personType === 'patient' ? 'الرقم المدني' : 'رقم الموظف'}
                  </p>
                  <p className="font-medium">{(person as any).nationalId || (person as any).id}</p>
                </div>
                {(person as any).phone && (
                  <div>
                    <p className="text-sm text-gray-600">الهاتف</p>
                    <p className="font-medium">{(person as any).phone}</p>
                  </div>
                )}
                {personType === 'staff' && (
                  <div>
                    <p className="text-sm text-gray-600">المنصب</p>
                    <p className="font-medium">{(person as any).position || 'غير محدد'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ملخص الحساب */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                ملخص الحساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personType === 'patient' && patientAccount ? (
                <div className="space-y-6">
                  {/* بيانات التواريخ والمدة */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">تاريخ الدخول</p>
                      <p className="text-lg font-bold text-blue-600">
                        {patientAccount.admissionDate ? formatDate(patientAccount.admissionDate.toString()) : 'غير محدد'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {(person as any).status === 'discharged' ? 'تاريخ الخروج' : 'التاريخ الحالي'}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {patientAccount.dischargeDate ? formatDate(patientAccount.dischargeDate.toString()) : 'غير محدد'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">مدة الإقامة</p>
                      <p className="text-2xl font-bold text-blue-600">{patientAccount.days} يوم</p>
                    </div>
                  </div>

                  {/* تفاصيل التكاليف */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">تفاصيل التكاليف اليومية</h4>
                      
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600">التكلفة اليومية للعلاج</span>
                        <span className="font-bold text-blue-600">{formatCurrency(patientAccount.dailyCost)}</span>
                      </div>
                      
                      {patientAccount.cigaretteCost > 0 && (
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm text-gray-600">تكلفة السجائر اليومية</span>
                          <span className="font-bold text-yellow-600">{formatCurrency(patientAccount.cigaretteCost)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm text-gray-600">إجمالي تكلفة العلاج</span>
                        <span className="font-bold text-orange-600">{formatCurrency(patientAccount.totalCost)}</span>
                      </div>
                      
                      {patientAccount.totalCigaretteCost > 0 && (
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm text-gray-600">إجمالي تكلفة السجائر</span>
                          <span className="font-bold text-yellow-600">{formatCurrency(patientAccount.totalCigaretteCost)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">ملخص المدفوعات</h4>
                      
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm text-gray-600">الإجمالي الكلي</span>
                        <span className="font-bold text-purple-600">{formatCurrency(patientAccount.grandTotal)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-600">إجمالي المدفوع</span>
                        <span className="font-bold text-green-600">{formatCurrency(patientAccount.totalPaid)}</span>
                      </div>
                      
                      <div className={`flex justify-between items-center p-3 rounded-lg ${
                        patientAccount.balance > 0 ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        <span className="text-sm text-gray-600">الرصيد المتبقي</span>
                        <span className={`font-bold text-xl ${
                          patientAccount.balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(patientAccount.balance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* حالة الدفع */}
                  <div className={`p-4 rounded-lg text-center ${
                    patientAccount.balance === 0 ? 'bg-green-100 border border-green-300' : 
                    patientAccount.balance < 0 ? 'bg-blue-100 border border-blue-300' :
                    'bg-red-100 border border-red-300'
                  }`}>
                    <p className={`font-semibold ${
                      patientAccount.balance === 0 ? 'text-green-800' : 
                      patientAccount.balance < 0 ? 'text-blue-800' :
                      'text-red-800'
                    }`}>
                      {patientAccount.balance === 0 ? '✓ الحساب مسدد بالكامل' : 
                       patientAccount.balance < 0 ? '💰 يوجد مبلغ زائد مدفوع' :
                       '⚠️ يوجد مبلغ مستحق'}
                    </p>
                  </div>
                </div>
              ) : staffAccount ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي الراتب</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(staffAccount.totalSalary)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">المكافآت</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(staffAccount.totalBonuses)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">السلف</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {formatCurrency(staffAccount.totalAdvances)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">الاستقطاعات</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(staffAccount.totalDeductions)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">الصافي</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(staffAccount.netTotal)}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* تفاصيل المعاملات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                {personType === 'patient' ? 'تاريخ المدفوعات' : 'تاريخ الرواتب'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Array.isArray(transactions) && transactions.length > 0 ? (
                  transactions.map((transaction: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">
                            {formatDate(transaction.paymentDate || transaction.month)}
                          </p>
                          {transaction.paymentMethod && (
                            <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                          )}
                          {transaction.description && (
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>لا توجد معاملات</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل إضافية للموظف */}
          {personType === 'staff' && (
            <div className="grid gap-4 md:grid-cols-3">
              {/* المكافآت */}
              {Array.isArray(bonuses) && bonuses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-green-600">المكافآت</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(bonuses as any[]).map((bonus: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{formatDate(bonus.date)}</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(bonus.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* السلف */}
              {Array.isArray(advances) && advances.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-600">السلف</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(advances as any[]).map((advance: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{formatDate(advance.date)}</span>
                          <span className="font-medium text-yellow-600">
                            {formatCurrency(advance.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* الاستقطاعات */}
              {Array.isArray(deductions) && deductions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-600">الاستقطاعات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(deductions as any[]).map((deduction: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{formatDate(deduction.date)}</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(deduction.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            تم إنشاء التقرير في: {formatDate(new Date())}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              تحميل PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}