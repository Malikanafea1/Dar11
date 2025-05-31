import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
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

const formSchema = z.object({
  name: z.string().min(1, "اسم الموظف مطلوب"),
  role: z.string().min(1, "المنصب مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  monthlySalary: z.string().min(1, "الراتب الشهري مطلوب").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "الراتب الشهري يجب أن يكون رقماً أكبر من الصفر"
  }),
  hireDate: z.string().min(1, "تاريخ التوظيف مطلوب"),
  isActive: z.boolean().default(true),
  phoneNumber: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  dailyCigaretteType: z.enum(["full_pack", "half_pack", "none"]).default("none"),
  dailyCigaretteCost: z.number().min(0, "تكلفة السجائر يجب أن تكون أكبر من أو تساوي الصفر").default(0),
});

type FormData = z.infer<typeof formSchema>;

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff | null;
}

export default function StaffModal({ isOpen, onClose, staff }: StaffModalProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "",
      department: "",
      monthlySalary: "",
      hireDate: new Date().toISOString().split('T')[0],
      isActive: true,
      phoneNumber: "",
      email: "",
      dailyCigaretteType: "none",
      dailyCigaretteCost: 0,
    },
  });

  // Reset form with staff data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (staff) {
        // Editing existing staff - populate with current data
        form.reset({
          name: staff.name,
          role: staff.role,
          department: staff.department,
          monthlySalary: staff.monthlySalary.toString(),
          hireDate: new Date(staff.hireDate).toISOString().split('T')[0],
          isActive: staff.isActive ?? true,
          phoneNumber: staff.phoneNumber || "",
          email: staff.email || "",
          dailyCigaretteType: staff.dailyCigaretteType || "none",
          dailyCigaretteCost: staff.dailyCigaretteCost || 0,
        });
      } else {
        // Adding new staff - reset to defaults
        form.reset({
          name: "",
          role: "",
          department: "",
          monthlySalary: "",
          hireDate: new Date().toISOString().split('T')[0],
          isActive: true,
          phoneNumber: "",
          email: "",
          dailyCigaretteType: "none",
          dailyCigaretteCost: 0,
        });
      }
    }
  }, [staff, form, isOpen]);

  // Update cigarette cost when type changes
  const handleCigaretteTypeChange = (value: string) => {
    const cost = value === "full_pack" ? 50 : value === "half_pack" ? 25 : 0;
    form.setValue("dailyCigaretteCost", cost);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        hireDate: new Date(data.hireDate).toISOString(),
        monthlySalary: parseFloat(data.monthlySalary),
        email: data.email || undefined,
        phoneNumber: data.phoneNumber || undefined,
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
          <DialogTitle>{staff ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <SelectItem value="معالج">معالج</SelectItem>
                        <SelectItem value="مدير شيفت ريكفري">مدير شيفت ريكفري</SelectItem>
                        <SelectItem value="مدير شيفت ديتوكس">مدير شيفت ديتوكس</SelectItem>
                        <SelectItem value="مشرف ريكفري">مشرف ريكفري</SelectItem>
                        <SelectItem value="مشرف ديتوكس">مشرف ديتوكس</SelectItem>
                        <SelectItem value="عامل">عامل</SelectItem>
                        <SelectItem value="إداري">إداري</SelectItem>
                        <SelectItem value="طبيب">طبيب</SelectItem>
                        <SelectItem value="ممرض">ممرض</SelectItem>
                        <SelectItem value="مطبخ">مطبخ</SelectItem>
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
                        <SelectItem value="ديتوكس">ديتوكس</SelectItem>
                        <SelectItem value="ريكفري">ريكفري</SelectItem>
                        <SelectItem value="إدارة">إدارة</SelectItem>
                        <SelectItem value="بوفيه">بوفيه</SelectItem>
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
                    <FormLabel>الراتب الشهري (جنيه مصري)</FormLabel>
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 sm:col-span-2">
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
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={mutation.isPending} 
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2"
              >
                <Save className="ml-2 w-4 h-4" />
                {mutation.isPending ? "جاري الحفظ..." : (staff ? "تحديث الموظف" : "حفظ الموظف")}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="w-full sm:w-auto order-2 sm:order-1"
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
