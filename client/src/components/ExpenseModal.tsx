import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertExpenseSchema, type Expense } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { z } from "zod";
import { useEffect } from "react";

const formSchema = insertExpenseSchema.extend({
  date: z.string().min(1, "تاريخ المصروف مطلوب"),
  amount: z.string().min(1, "المبلغ مطلوب").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "يجب أن يكون المبلغ رقمًا أكبر من الصفر"
  }),
});

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
}

export default function ExpenseModal({ isOpen, onClose, expense }: ExpenseModalProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
      createdBy: "النظام",
    },
  });

  useEffect(() => {
    if (expense) {
      form.setValue("description", expense.description);
      form.setValue("amount", expense.amount.toString());
      form.setValue("category", expense.category);
      form.setValue("date", expense.date.split('T')[0]);
      form.setValue("createdBy", expense.createdBy);
    } else {
      form.reset({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split('T')[0],
        createdBy: "النظام",
      });
    }
  }, [expense, form]);

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        amount: parseFloat(data.amount),
      };
      
      if (expense) {
        return apiRequest("PUT", `/api/expenses/${expense.id}`, payload);
      } else {
        return apiRequest("POST", "/api/expenses", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: expense ? "تم تحديث المصروف بنجاح" : "تم إضافة المصروف بنجاح",
        description: expense ? "تم تحديث بيانات المصروف" : "تم تسجيل المصروف الجديد في النظام",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ المصروف",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "تعديل المصروف" : "إضافة مصروف جديد"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف المصروف</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل وصف المصروف" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ (جنيه مصري)</FormLabel>
                    <FormControl>
                      <Input placeholder="١٠٠٠" className="font-inter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ المصروف</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>فئة المصروف</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة المصروف" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="المستلزمات الطبية">المستلزمات الطبية</SelectItem>
                      <SelectItem value="الرواتب">الرواتب</SelectItem>
                      <SelectItem value="المرافق">المرافق (كهرباء، ماء، إنترنت)</SelectItem>
                      <SelectItem value="الصيانة">الصيانة</SelectItem>
                      <SelectItem value="المعدات">المعدات</SelectItem>
                      <SelectItem value="النظافة">النظافة</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700">
                <Save className="ml-2 w-4 h-4" />
                {mutation.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
