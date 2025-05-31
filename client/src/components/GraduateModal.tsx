import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertGraduateSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Graduate } from "@shared/schema";
import { z } from "zod";

type FormData = z.infer<typeof insertGraduateSchema>;

interface GraduateModalProps {
  isOpen: boolean;
  onClose: () => void;
  graduate?: Graduate | null;
}

export default function GraduateModal({ isOpen, onClose, graduate }: GraduateModalProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(insertGraduateSchema),
    defaultValues: graduate ? {
      name: graduate.name,
      dailyCigaretteType: graduate.dailyCigaretteType,
      dailyCigaretteCost: graduate.dailyCigaretteCost,
      notes: graduate.notes || "",
      isActive: graduate.isActive,
    } : {
      name: "",
      dailyCigaretteType: "none",
      dailyCigaretteCost: 0,
      notes: "",
      isActive: true,
    },
  });

  // Update cigarette cost when type changes
  const handleCigaretteTypeChange = (value: string) => {
    const cost = value === "full_pack" ? 50 : value === "half_pack" ? 25 : 0;
    form.setValue("dailyCigaretteCost", cost);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (graduate) {
        return apiRequest("PATCH", `/api/graduates/${graduate.id}`, data);
      } else {
        return apiRequest("POST", "/api/graduates", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graduates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/graduates/active"] });
      toast({
        title: graduate ? "تم تحديث الخريج بنجاح" : "تم إضافة الخريج بنجاح",
        description: graduate ? "تم تحديث بيانات الخريج" : "تم إضافة الخريج الجديد للنظام",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error saving graduate:", error);
      toast({
        title: "خطأ في حفظ البيانات",
        description: error.message || "فشل في حفظ بيانات الخريج",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {graduate ? "تعديل بيانات الخريج" : "إضافة خريج جديد"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* اسم الخريج */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">اسم الخريج الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="أحمد محمد علي" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* نوع السجائر اليومية */}
            <FormField
              control={form.control}
              name="dailyCigaretteType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">نوع السجائر اليومية</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handleCigaretteTypeChange(value);
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع السجائر" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">لا يدخن</SelectItem>
                      <SelectItem value="half_pack">نصف علبة (25 ج.م)</SelectItem>
                      <SelectItem value="full_pack">علبة كاملة (50 ج.م)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* تكلفة السجائر اليومية */}
            <FormField
              control={form.control}
              name="dailyCigaretteCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">تكلفة السجائر اليومية (ج.م)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="0"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value}
                      disabled={form.watch("dailyCigaretteType") !== "none"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ملاحظات */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أي ملاحظات أو معلومات إضافية عن الخريج..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 ml-2" />
                {mutation.isPending ? "جاري الحفظ..." : (graduate ? "تحديث البيانات" : "حفظ الخريج")}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}