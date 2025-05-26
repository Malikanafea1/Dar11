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

const formSchema = insertPatientSchema.extend({
  admissionDate: z.string().min(1, "تاريخ الدخول مطلوب"),
  dailyCost: z.string().min(1, "التكلفة اليومية مطلوبة"),
});

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
}

export default function PatientModal({ isOpen, onClose, patient }: PatientModalProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: patient ? {
      name: patient.name,
      nationalId: patient.nationalId,
      admissionDate: new Date(patient.admissionDate).toISOString().split('T')[0],
      roomNumber: patient.roomNumber || "",
      dailyCost: patient.dailyCost,
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
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        ...data,
        admissionDate: new Date(data.admissionDate).toISOString(),
        dailyCost: data.dailyCost,
      };
      
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
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ بيانات المريض",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{patient ? "تعديل بيانات المريض" : "إضافة مريض جديد"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المريض الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المريض" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهوية</FormLabel>
                    <FormControl>
                      <Input placeholder="١٢٣٤٥٦٧٨٩٠" className="font-inter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الدخول</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الغرفة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الغرفة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="101">١٠١</SelectItem>
                        <SelectItem value="102">١٠٢</SelectItem>
                        <SelectItem value="201">٢٠١</SelectItem>
                        <SelectItem value="202">٢٠٢</SelectItem>
                        <SelectItem value="301">٣٠١</SelectItem>
                        <SelectItem value="302">٣٠٢</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dailyCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تكلفة الإقامة اليومية (جنيه مصري)</FormLabel>
                    <FormControl>
                      <Input placeholder="٥٠٠" className="font-inter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="insurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع التأمين</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع التأمين" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="government">حكومي</SelectItem>
                        <SelectItem value="private">خاص</SelectItem>
                        <SelectItem value="none">بدون تأمين</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أضف أي ملاحظات خاصة بالمريض"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                <Save className="ml-2 w-4 h-4" />
                {mutation.isPending ? "جاري الحفظ..." : (patient ? "تحديث المريض" : "حفظ المريض")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
