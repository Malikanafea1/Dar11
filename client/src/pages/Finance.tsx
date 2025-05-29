import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Expense, Payment } from "@shared/schema";
import ExpenseModal from "@/components/ExpenseModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Finance() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: stats } = useQuery<{
    currentPatients: number;
    activeStaff: number;
    dailyRevenue: number;
    occupancyRate: number;
    dailyIncome: number;
    dailyExpenses: number;
    netProfit: number;
    pendingPayments: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم حذف المصروف",
        description: "تم حذف المصروف بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المصروف",
        variant: "destructive",
      });
    },
  });

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "medical_supplies":
      case "المستلزمات الطبية":
        return "🏥";
      case "salaries":
      case "الرواتب":
        return "👥";
      case "utilities":
      case "المرافق":
        return "⚡";
      case "maintenance":
      case "الصيانة":
        return "🔧";
      default:
        return "📋";
    }
  };

  if (expensesLoading || paymentsLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الإدارة المالية</h1>
            <p className="text-gray-600">إدارة المصروفات والمدفوعات</p>
          </div>
          <Button onClick={() => setIsExpenseModalOpen(true)} className="bg-yellow-600 hover:bg-yellow-700">
            <Plus className="ml-2 w-4 h-4" />
            إضافة مصروف جديد
          </Button>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">الدخل اليومي</p>
                  <p className="text-2xl font-bold text-green-600 font-inter">
                    {formatCurrency(stats?.dailyIncome || 0)}
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
                  <p className="text-gray-500 text-sm font-medium">المصروفات اليومية</p>
                  <p className="text-2xl font-bold text-red-600 font-inter">
                    {formatCurrency(stats?.dailyExpenses || 0)}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">صافي الربح</p>
                  <p className="text-2xl font-bold text-blue-600 font-inter">
                    {formatCurrency(stats?.netProfit || 0)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">المدفوعات المعلقة</p>
                  <p className="text-2xl font-bold text-yellow-600 font-inter">
                    {formatCurrency(stats?.pendingPayments || 0)}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                المصروفات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses && expenses.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد مصروفات مسجلة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses?.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl ml-3">{getCategoryIcon(expense.category)}</span>
                        <div>
                          <p className="font-medium text-gray-800">{expense.description}</p>
                          <p className="text-sm text-gray-500">
                            {expense.category} • {formatDateTime(expense.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deleteExpenseMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                المدفوعات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد مدفوعات مسجلة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments?.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full ml-3">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">دفعة من مريض #{payment.patientId}</p>
                          <p className="text-sm text-gray-500">
                            {payment.paymentMethod} • {formatDateTime(payment.paymentDate)}
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        +{formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={handleCloseModal}
        expense={selectedExpense}
      />
    </>
  );
}
