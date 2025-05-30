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
import { insertAdvanceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Staff } from "@shared/schema";
import { z } from "zod";

const formSchema = insertAdvanceSchema.extend({
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

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function AdvanceModal({ isOpen, onClose, user }: AdvanceModalProps) {
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
      repaymentMonths: 1,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/advances", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advances"] });
      toast({
        title: "تم إرسال طلب السلفة",
        description: "تم إرسال طلب السلفة بنجاح وفي انتظار الموافقة",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إرسال طلب السلفة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const watchedValues = form.watch(['amount', 'repaymentMonths']);
  const monthlyDeduction = watchedValues[0] && watchedValues[1] ? 
    (watchedValues[0] / watchedValues[1]).toFixed(2) : "0.00";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>طلب سلفة جديدة</DialogTitle>
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
            <Label htmlFor="amount">مبلغ السلفة</Label>
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
            <Label htmlFor="repaymentMonths">عدد أشهر السداد</Label>
            <Input
              id="repaymentMonths"
              type="number"
              min="1"
              max="24"
              {...form.register("repaymentMonths", { valueAsNumber: true })}
            />
            {form.formState.errors.repaymentMonths && (
              <p className="text-sm text-red-600">{form.formState.errors.repaymentMonths.message}</p>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <Label className="text-sm font-medium">القسط الشهري</Label>
            <p className="text-lg font-bold text-blue-600">{monthlyDeduction} ج.م</p>
          </div>

          <div>
            <Label htmlFor="reason">سبب السلفة</Label>
            <Textarea
              id="reason"
              {...form.register("reason")}
              placeholder="اذكر سبب طلب السلفة..."
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-600">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="ملاحظات أخرى..."
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
              إرسال الطلب
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}