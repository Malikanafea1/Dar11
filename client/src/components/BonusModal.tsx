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
import { insertBonusSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Staff } from "@shared/schema";
import { z } from "zod";

const formSchema = insertBonusSchema.extend({
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

interface BonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function BonusModal({ isOpen, onClose, user }: BonusModalProps) {
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
      type: "performance",
      approvedBy: user.id,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/bonuses", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bonuses"] });
      toast({
        title: "تم إضافة المكافأة",
        description: "تم إضافة المكافأة بنجاح",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المكافأة",
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
          <DialogTitle>إضافة مكافأة جديدة</DialogTitle>
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
            <Label htmlFor="amount">مبلغ المكافأة</Label>
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
            <Label htmlFor="type">نوع المكافأة</Label>
            <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">أداء متميز</SelectItem>
                <SelectItem value="holiday">عيد أو مناسبة</SelectItem>
                <SelectItem value="overtime">ساعات إضافية</SelectItem>
                <SelectItem value="special">مكافأة خاصة</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">السبب</Label>
            <Textarea
              id="reason"
              {...form.register("reason")}
              placeholder="اذكر سبب المكافأة..."
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
              إضافة المكافأة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}