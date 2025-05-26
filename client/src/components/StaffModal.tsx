import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { insertStaffSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Staff } from "@shared/schema";
import { z } from "zod";

const formSchema = insertStaffSchema.extend({
  hireDate: z.string().min(1, "تاريخ التوظيف مطلوب"),
  monthlySalary: z.string().min(1, "الراتب الشهري مطلوب"),
});

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff | null;
}

export default function StaffModal({ isOpen, onClose, staff }: StaffModalProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: staff ? {
      name: staff.name,
      role: staff.role,
      department: staff.department,
      monthlySalary: staff.monthlySalary,
      hireDate: new Date(staff.hireDate).toISOString().split('T')[0],
      isActive: staff.isActive ?? true,
      phoneNumber: staff.phoneNumber || "",
      email: staff.email || "",
    } : {
      name: "",
      role: "",
      department: "",
      monthlySalary: "",
      hireDate: new Date().toISOString().split('T')[0],
      isActive: true,
      phoneNumber: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        ...data,
        hireDate: new Date(data.hireDate).toISOString(),
        monthlySalary: data.monthlySalary,
      };
      
      if (staff) {
        return apiRequest("PATCH", `/api/staff/${staff.id}`, payload);
      } else {
        return apiRequest("POST", "/api/staff", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: staff ? "تم تحديث الموظف بنجاح" : "تم إضافة الموظف بنجاح",
        description: staff ? "تم تحديث بيانات الموظف" : "تم إضافة الموظف الجديد للنظام",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ بيانات الموظف",
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
          <DialogTitle>{staff ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الموظف الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم الموظف" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المنصب</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنصب" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="طبيب">طبيب</SelectItem>
                        <SelectItem value="ممرض">ممرض/ممرضة</SelectItem>
                        <SelectItem value="فني">فني</SelectItem>
                        <SelectItem value="إداري">إداري</SelectItem>
                        <SelectItem value="أمن">أمن</SelectItem>
                        <SelectItem value="نظافة">نظافة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="الطوارئ">الطوارئ</SelectItem>
                        <SelectItem value="العناية المركزة">العناية المركزة</SelectItem>
                        <SelectItem value="الباطنة">الباطنة</SelectItem>
                        <SelectItem value="الجراحة">الجراحة</SelectItem>
                        <SelectItem value="النساء والولادة">النساء والولادة</SelectItem>
                        <SelectItem value="الأطفال">الأطفال</SelectItem>
                        <SelectItem value="المختبر">المختبر</SelectItem>
                        <SelectItem value="الأشعة">الأشعة</SelectItem>
                        <SelectItem value="الإدارة">الإدارة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="monthlySalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الراتب الشهري (ريال)</FormLabel>
                    <FormControl>
                      <Input placeholder="٨٠٠٠" className="font-inter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ التوظيف</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input placeholder="٠٥٠١٢٣٤٥٦٧" className="font-inter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="example@hospital.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        موظف نشط
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700">
                <Save className="ml-2 w-4 h-4" />
                {mutation.isPending ? "جاري الحفظ..." : (staff ? "تحديث الموظف" : "حفظ الموظف")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
