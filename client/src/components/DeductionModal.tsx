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
import { insertDeductionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Staff } from "@shared/schema";
import { z } from "zod";

const formSchema = insertDeductionSchema.extend({
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

interface DeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function DeductionModal({ isOpen, onClose, user }: DeductionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: "",
      amount: 0,
      reason: "",
      date: new Date().toISOString().split('T')[0],
      type: "penalty",
      approvedBy: user.id,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/deductions", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      toast({
        title: "تم إضافة الخصم",
        description: "تم إضافة الخصم بنجاح",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الخصم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة خصم جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="staffId">الموظف</Label>
            <Select value={form.watch('staffId')} onValueChange={(value) => form.setValue('staffId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظف" />
              </SelectTrigger>
              <SelectContent>
                {(staff as Staff[]).map((s: Staff) => (
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
            <Label htmlFor="amount">مبلغ الخصم</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">نوع الخصم</Label>
            <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absence">غياب</SelectItem>
                <SelectItem value="late">تأخير</SelectItem>
                <SelectItem value="penalty">جزاء أو مخالفة</SelectItem>
                <SelectItem value="insurance">تأمينات</SelectItem>
                <SelectItem value="tax">ضرائب</SelectItem>
                <SelectItem value="loan_repayment">سداد قرض</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">السبب</Label>
            <Textarea
              id="reason"
              {...form.register("reason")}
              placeholder="اذكر سبب الخصم..."
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date">التاريخ</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
            )}
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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              إضافة الخصم
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}