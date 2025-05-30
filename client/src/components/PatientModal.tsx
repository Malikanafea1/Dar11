import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPatientSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Patient } from "@shared/schema";
import { z } from "zod";

// نموذج النموذج مع تحويل التكلفة اليومية إلى رقم
const formSchema = z.object({
  name: z.string().min(1, "اسم المريض مطلوب"),
  nationalId: z.string().min(1, "رقم الهوية مطلوب"),
  admissionDate: z.string().min(1, "تاريخ الدخول مطلوب"),
  roomNumber: z.string().optional(),
  dailyCost: z.string().min(1, "التكلفة اليومية مطلوبة").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "التكلفة اليومية يجب أن تكون رقماً أكبر من الصفر"
  }),
  insurance: z.string().optional(),
  status: z.enum(["active", "discharged"]).default("active"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
}

export default function PatientModal({ isOpen, onClose, patient }: PatientModalProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: patient ? {
      name: patient.name,
      nationalId: patient.nationalId,
      admissionDate: patient.admissionDate,
      roomNumber: patient.roomNumber || "",
      dailyCost: patient.dailyCost.toString(),
      insurance: patient.insurance || "",
      status: patient.status,
      notes: patient.notes || "",
    } : {
      name: "",
      nationalId: "",
      admissionDate: new Date().toISOString().split('T')[0],
      roomNumber: "",
      dailyCost: "",
      insurance: "",
      status: "active",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // تنظيف البيانات وإزالة القيم الفارغة
      const payload: any = {
        name: data.name,
        nationalId: data.nationalId,
        admissionDate: data.admissionDate,
        dailyCost: parseFloat(data.dailyCost),
        status: data.status,
      };

      // إضافة الحقول الاختيارية فقط إذا كانت لها قيم
      if (data.roomNumber && data.roomNumber.trim()) {
        payload.roomNumber = data.roomNumber.trim();
      }
      if (data.insurance && data.insurance.trim()) {
        payload.insurance = data.insurance.trim();
      }
      if (data.notes && data.notes.trim()) {
        payload.notes = data.notes.trim();
      }
      
      if (patient) {
        return apiRequest("PATCH", `/api/patients/${patient.id}`, payload);
      } else {
        return apiRequest("POST", "/api/patients", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: patient ? "تم تحديث المريض بنجاح" : "تم إضافة المريض بنجاح",
        description: patient ? "تم تحديث بيانات المريض" : "تم إضافة المريض الجديد للنظام",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error saving patient:", error);
      toast({
        title: "خطأ في حفظ البيانات",
        description: error.message || "فشل في حفظ بيانات المريض. تأكد من صحة البيانات المدخلة.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {patient ? "تعديل بيانات المريض" : "إضافة مريض جديد"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اسم المريض الكامل */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">اسم المريض الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="يحي السيد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* رقم الهوية الوطنية */}
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">رقم الهوية الوطنية</FormLabel>
                    <FormControl>
                      <Input placeholder="4352" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* تاريخ الدخول */}
              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">تاريخ الدخول</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* تكلفة الإقامة اليومية */}
              <FormField
                control={form.control}
                name="dailyCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">تكلفة الإقامة اليومية (ريال سعودي)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="150" 
                        min="0"
                        step="0.01"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* رقم الغرفة */}
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">رقم الغرفة</FormLabel>
                    <FormControl>
                      <Input placeholder="101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* نوع التأمين */}
              <FormField
                control={form.control}
                name="insurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">نوع التأمين</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="بدون تأمين" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون تأمين</SelectItem>
                        <SelectItem value="government">تأمين حكومي</SelectItem>
                        <SelectItem value="private">تأمين خاص</SelectItem>
                        <SelectItem value="company">تأمين شركة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ملاحظات إضافية */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أي ملاحظات أو معلومات إضافية عن المريض..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-none"
              >
                <Save className="w-4 h-4 ml-2" />
                {mutation.isPending ? "جاري الحفظ..." : (patient ? "تحديث البيانات" : "حفظ المريض")}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1 w-full sm:w-auto order-2 sm:order-none"
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