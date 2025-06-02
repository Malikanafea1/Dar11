import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, DollarSign, CreditCard, Receipt, Plus, Search, Clock, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditPaymentModal from "@/components/EditPaymentModal";
import type { Patient, Payment } from "@shared/schema";

export default function Collections() {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest("POST", "/api/payments", paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم تسجيل الدفعة بنجاح",
        description: "تم إضافة الدفعة الجديدة للمريض",
      });
      // Reset form
      setSelectedPatientId("");
      setAmount("");
      setPaymentMethod("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: error.message || "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive",
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiRequest("DELETE", `/api/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم حذف الدفعة بنجاح",
        description: "تم حذف الدفعة من النظام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الدفعة",
        description: error.message || "حدث خطأ أثناء حذف الدفعة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId || !amount || !paymentMethod) {
      toast({
        title: "بيانات مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      patientId: selectedPatientId,
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
      notes: notes || undefined,
    });
  };

  const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId);
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nationalId.includes(searchTerm)
  );

  const patientPayments = selectedPatientId 
    ? payments.filter((payment) => payment.patientId === selectedPatientId)
    : [];

  const getTotalPaid = (patientId: string) => {
    return payments
      .filter((payment) => payment.patientId === patientId)
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const calculateDaysBetween = (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalCost = (patient: Patient) => {
    const days = calculateDaysBetween(patient.admissionDate);
    return days * patient.dailyCost;
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    deletePaymentMutation.mutate(paymentId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-800">تحصيلات المرضى</h1>
          <p className="text-slate-600">إدارة مدفوعات وتحصيلات المرضى</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              تسجيل دفعة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient-search">اختيار المريض</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث عن المريض..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المريض" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{patient.name}</span>
                            <span className="text-sm text-gray-500 mr-2">
                              {patient.nationalId}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPatient && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-900">{selectedPatient.name}</p>
                      <p className="text-sm text-blue-700">
                        غرفة: {selectedPatient.roomNumber || "غير محدد"}
                      </p>
                      <p className="text-sm text-blue-700">
                        أيام الإقامة: {calculateDaysBetween(selectedPatient.admissionDate)} يوم
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">
                        التكلفة الإجمالية: {formatCurrency(calculateTotalCost(selectedPatient))}
                      </p>
                      <p className="text-sm text-blue-700">
                        المدفوع: {formatCurrency(getTotalPaid(selectedPatient.id))}
                      </p>
                      <p className="text-sm font-medium text-blue-900">
                        المتبقي: {formatCurrency(calculateTotalCost(selectedPatient) - getTotalPaid(selectedPatient.id))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">مبلغ الدفعة *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment-date">تاريخ الدفعة *</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">طريقة الدفع *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="card">بطاقة ائتمان</SelectItem>
                    <SelectItem value="transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  placeholder="ملاحظات إضافية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createPaymentMutation.isPending}
              >
                {createPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Patient Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              سجل المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {selectedPatient.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">إجمالي التكلفة:</span>
                      <p className="font-medium">{formatCurrency(calculateTotalCost(selectedPatient))}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">إجمالي المدفوع:</span>
                      <p className="font-medium text-green-600">{formatCurrency(getTotalPaid(selectedPatient.id))}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {patientPayments.length > 0 ? (
                    patientPayments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(payment.paymentDate)}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {payment.paymentMethod === "cash" && "نقدي"}
                              {payment.paymentMethod === "card" && "بطاقة ائتمان"}
                              {payment.paymentMethod === "transfer" && "تحويل بنكي"}
                              {payment.paymentMethod === "check" && "شيك"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPayment(payment)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف هذه الدفعة؟ سيتم خصم المبلغ من إجمالي المدفوعات للمريض.
                                    هذا الإجراء لا يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>لا توجد مدفوعات مسجلة لهذا المريض</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>اختر مريض لعرض سجل المدفوعات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            آخر المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payments.slice(0, 6).map((payment) => {
              const patient = patients.find((p) => p.id === payment.patientId);
              return (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient?.name || "مريض غير معروف"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.paymentDate)}
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {payment.paymentMethod === "cash" && "نقدي"}
                    {payment.paymentMethod === "card" && "بطاقة ائتمان"}
                    {payment.paymentMethod === "transfer" && "تحويل بنكي"}
                    {payment.paymentMethod === "check" && "شيك"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Payment Modal */}
      <EditPaymentModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPayment(null);
        }}
        payment={editingPayment}
      />
    </div>
  );
}