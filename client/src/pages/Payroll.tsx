import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayrollModal from "@/components/PayrollModal";
import BonusModal from "@/components/BonusModal";
import AdvanceModal from "@/components/AdvanceModal";
import DeductionModal from "@/components/DeductionModal";
import type { Payroll, Staff, Bonus, Advance, Deduction } from "@shared/schema";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface PayrollProps {
  user: User;
}

export default function Payroll({ user }: PayrollProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payrolls = [], isLoading: payrollsLoading } = useQuery({
    queryKey: ["/api/payrolls"],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const { data: bonuses = [] } = useQuery({
    queryKey: ["/api/bonuses"],
  });

  const { data: advances = [] } = useQuery({
    queryKey: ["/api/advances"],
  });

  const { data: deductions = [] } = useQuery({
    queryKey: ["/api/deductions"],
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payrolls/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ 
          status: "paid",
          paidDate: new Date().toISOString()
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({
        title: "تم تحديث الراتب",
        description: "تم تسجيل دفع الراتب بنجاح",
      });
    },
  });

  const filteredPayrolls = payrolls.filter((payroll: Payroll) => {
    const monthMatch = selectedMonth === "all" || payroll.month === selectedMonth;
    const staffMatch = selectedStaff === "all" || payroll.staffId === selectedStaff;
    return monthMatch && staffMatch;
  });

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s: Staff) => s.id === staffId);
    return staffMember?.name || "غير معروف";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">معلق</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const generateMonthlyPayroll = useMutation({
    mutationFn: async () => {
      const activeStaff = staff.filter((s: Staff) => s.isActive);
      const promises = activeStaff.map(async (staffMember: Staff) => {
        // Check if payroll already exists for this month
        const existing = payrolls.find((p: Payroll) => 
          p.staffId === staffMember.id && p.month === selectedMonth
        );
        
        if (existing) return existing;

        // Calculate bonuses, advances, and deductions for this staff member and month
        const staffBonuses = bonuses.filter((b: Bonus) => 
          b.staffId === staffMember.id && 
          b.date.startsWith(selectedMonth)
        );
        
        const staffAdvances = advances.filter((a: Advance) => 
          a.staffId === staffMember.id && 
          a.status === "approved"
        );
        
        const staffDeductions = deductions.filter((d: Deduction) => 
          d.staffId === staffMember.id && 
          d.date.startsWith(selectedMonth)
        );

        const totalBonuses = staffBonuses.reduce((sum, b) => sum + b.amount, 0);
        const totalAdvanceDeductions = staffAdvances.reduce((sum, a) => sum + a.monthlyDeduction, 0);
        const totalDeductions = staffDeductions.reduce((sum, d) => sum + d.amount, 0) + totalAdvanceDeductions;
        const netSalary = staffMember.monthlySalary + totalBonuses - totalDeductions;

        return await apiRequest("/api/payrolls", {
          method: "POST",
          body: JSON.stringify({
            staffId: staffMember.id,
            month: selectedMonth,
            baseSalary: staffMember.monthlySalary,
            bonuses: totalBonuses,
            advances: totalAdvanceDeductions,
            deductions: totalDeductions,
            netSalary,
            status: "pending",
            createdBy: user.id,
          }),
        });
      });

      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({
        title: "تم إنشاء كشف الرواتب",
        description: "تم إنشاء كشف رواتب الشهر بنجاح",
      });
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الرواتب</h1>
        <div className="flex gap-2">
          <Button onClick={() => setBonusModalOpen(true)} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            إضافة مكافأة
          </Button>
          <Button onClick={() => setAdvanceModalOpen(true)} variant="outline">
            <DollarSign className="w-4 h-4 mr-2" />
            طلب سلفة
          </Button>
          <Button onClick={() => setDeductionModalOpen(true)} variant="outline">
            <TrendingDown className="w-4 h-4 mr-2" />
            إضافة خصم
          </Button>
          <Button onClick={() => setPayrollModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة راتب
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="month">الشهر</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="staff">الموظف</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر موظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {staff.map((s: Staff) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => generateMonthlyPayroll.mutate()}
              disabled={generateMonthlyPayroll.isPending}
              variant="outline"
            >
              <Calendar className="w-4 h-4 mr-2" />
              إنشاء كشف الشهر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll List */}
      <div className="grid gap-4">
        {payrollsLoading ? (
          <div className="text-center py-8">جاري تحميل البيانات...</div>
        ) : filteredPayrolls.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">لا توجد رواتب للشهر المحدد</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayrolls.map((payroll: Payroll) => (
            <Card key={payroll.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {getStaffName(payroll.staffId)}
                  </CardTitle>
                  {getStatusBadge(payroll.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">الراتب الأساسي</p>
                    <p className="font-semibold">{payroll.baseSalary.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المكافآت</p>
                    <p className="font-semibold text-green-600">+{payroll.bonuses.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">السلف</p>
                    <p className="font-semibold text-orange-600">-{payroll.advances.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الخصومات</p>
                    <p className="font-semibold text-red-600">-{payroll.deductions.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">صافي الراتب</p>
                    <p className="font-bold text-lg">{payroll.netSalary.toLocaleString()} ج.م</p>
                  </div>
                  <div className="flex gap-2">
                    {payroll.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => markPaidMutation.mutate(payroll.id)}
                        disabled={markPaidMutation.isPending}
                      >
                        تسجيل الدفع
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayroll(payroll);
                        setPayrollModalOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <PayrollModal
        isOpen={payrollModalOpen}
        onClose={() => {
          setPayrollModalOpen(false);
          setSelectedPayroll(null);
        }}
        payroll={selectedPayroll}
        user={user}
      />

      <BonusModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        user={user}
      />

      <AdvanceModal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        user={user}
      />

      <DeductionModal
        isOpen={deductionModalOpen}
        onClose={() => setDeductionModalOpen(false)}
        user={user}
      />
    </div>
  );
}