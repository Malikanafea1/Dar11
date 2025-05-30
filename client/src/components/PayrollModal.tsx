import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { insertPayrollSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Payroll, Staff } from "@shared/schema";
import { z } from "zod";

const formSchema = insertPayrollSchema.extend({
  staffId: z.string().min(1, "يرجى اختيار موظف"),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll?: Payroll | null;
  user: User;
}

export default function PayrollModal({ isOpen, onClose, payroll, user }: PayrollModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: payroll?.staffId || "",
      month: payroll?.month || new Date().toISOString().slice(0, 7),
      baseSalary: payroll?.baseSalary || 0,
      bonuses: payroll?.bonuses || 0,
      advances: payroll?.advances || 0,
      deductions: payroll?.deductions || 0,
      netSalary: payroll?.netSalary || 0,
      status: payroll?.status || "pending",
      notes: payroll?.notes || "",
      createdBy: user.id,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/payrolls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create payroll");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({
        title: "تم إنشاء الراتب",
        description: "تم إنشاء سجل الراتب بنجاح",
      });
      onClose();
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/payrolls/${payroll?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update payroll");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({
        title: "تم تحديث الراتب",
        description: "تم تحديث سجل الراتب بنجاح",
      });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    // Calculate net salary
    const netSalary = data.baseSalary + data.bonuses - data.advances - data.deductions;
    const payrollData = { ...data, netSalary };

    if (payroll) {
      updateMutation.mutate(payrollData);
    } else {
      createMutation.mutate(payrollData);
    }
  };

  const watchedValues = form.watch(['baseSalary', 'bonuses', 'advances', 'deductions']);
  const calculatedNetSalary = watchedValues[0] + watchedValues[1] - watchedValues[2] - watchedValues[3];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {payroll ? "تعديل راتب" : "إضافة راتب جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="staffId">الموظف</Label>
            <Select value={form.watch('staffId')} onValueChange={(value) => form.setValue('staffId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظف" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s: Staff) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} - {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.staffId && (
              <p className="text-sm text-red-600">{form.formState.errors.staffId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="month">الشهر</Label>
            <Input
              id="month"
              type="month"
              {...form.register("month")}
            />
            {form.formState.errors.month && (
              <p className="text-sm text-red-600">{form.formState.errors.month.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="baseSalary">الراتب الأساسي</Label>
            <Input
              id="baseSalary"
              type="number"
              step="0.01"
              {...form.register("baseSalary", { valueAsNumber: true })}
            />
            {form.formState.errors.baseSalary && (
              <p className="text-sm text-red-600">{form.formState.errors.baseSalary.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bonuses">المكافآت</Label>
            <Input
              id="bonuses"
              type="number"
              step="0.01"
              {...form.register("bonuses", { valueAsNumber: true })}
            />
            {form.formState.errors.bonuses && (
              <p className="text-sm text-red-600">{form.formState.errors.bonuses.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="advances">السلف</Label>
            <Input
              id="advances"
              type="number"
              step="0.01"
              {...form.register("advances", { valueAsNumber: true })}
            />
            {form.formState.errors.advances && (
              <p className="text-sm text-red-600">{form.formState.errors.advances.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deductions">الخصومات</Label>
            <Input
              id="deductions"
              type="number"
              step="0.01"
              {...form.register("deductions", { valueAsNumber: true })}
            />
            {form.formState.errors.deductions && (
              <p className="text-sm text-red-600">{form.formState.errors.deductions.message}</p>
            )}
          </div>

          <div>
            <Label>صافي الراتب</Label>
            <div className="text-lg font-bold text-green-600">
              {calculatedNetSalary.toLocaleString()} ج.م
            </div>
          </div>

          <div>
            <Label htmlFor="status">الحالة</Label>
            <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {payroll ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}