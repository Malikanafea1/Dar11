import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, DollarSign, Calendar, User, Receipt } from "lucide-react";
import { formatCurrency, formatDate, calculateDaysBetween } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Payment } from "@shared/schema";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  payments?: Payment[];
}

export default function CollectionModal({ isOpen, onClose, patient, payments = [] }: CollectionModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        throw new Error("Failed to create payment");
      }
      return response.json();
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
      setAmount("");
      setPaymentMethod("");
      setNotes("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: error.message || "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient || !amount || !paymentMethod) {
      toast({
        title: "بيانات مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      patientId: patient.id,
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
      notes: notes || undefined,
    });
  };

  if (!patient) return null;

  const days = calculateDaysBetween(patient.admissionDate, new Date());
  const totalCost = days * patient.dailyCost;
  const totalPaid = payments
    .filter(payment => payment.patientId === patient.id)
    .reduce((total, payment) => total + payment.amount, 0);
  const remainingAmount = totalCost - totalPaid;

  const patientPayments = payments.filter(payment => payment.patientId === patient.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-6 w-6 text-green-600" />
            تحصيل دفعة - {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات المريض */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">معلومات المريض</span>
                  </div>
                  <p className="text-sm"><strong>الاسم:</strong> {patient.name}</p>
                  <p className="text-sm"><strong>الهوية:</strong> {patient.nationalId}</p>
                  <p className="text-sm"><strong>الغرفة:</strong> {patient.roomNumber || "غير محدد"}</p>
                  <p className="text-sm"><strong>تاريخ الدخول:</strong> {formatDate(patient.admissionDate)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">التفاصيل المالية</span>
                  </div>
                  <p className="text-sm"><strong>أيام الإقامة:</strong> {days} يوم</p>
                  <p className="text-sm"><strong>التكلفة اليومية:</strong> {formatCurrency(patient.dailyCost)}</p>
                  <p className="text-sm"><strong>إجمالي التكلفة:</strong> {formatCurrency(totalCost)}</p>
                  <p className="text-sm"><strong>المدفوع:</strong> {formatCurrency(totalPaid)}</p>
                  <p className="text-sm font-bold text-red-600">
                    <strong>المتبقي:</strong> {formatCurrency(remainingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* نموذج الدفع */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* مبلغ الدفعة */}
              <div className="space-y-2">
                <Label htmlFor="amount">مبلغ الدفعة *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(remainingAmount.toString())}
                  >
                    المبلغ كاملاً
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((remainingAmount / 2).toString())}
                  >
                    نصف المبلغ
                  </Button>
                </div>
              </div>

              {/* تاريخ الدفعة */}
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
            </div>

            {/* طريقة الدفع */}
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

            {/* ملاحظات */}
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

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={createPaymentMutation.isPending}
              >
                {createPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            </div>
          </form>

          {/* سجل المدفوعات السابقة */}
          {patientPayments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">المدفوعات السابقة:</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {patientPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <Badge variant="outline">
                      {payment.paymentMethod === "cash" && "نقدي"}
                      {payment.paymentMethod === "card" && "بطاقة ائتمان"}
                      {payment.paymentMethod === "transfer" && "تحويل بنكي"}
                      {payment.paymentMethod === "check" && "شيك"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}