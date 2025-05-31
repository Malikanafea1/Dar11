import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCigarettePaymentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { Patient, Staff, Graduate } from "@shared/schema";
import { z } from "zod";

const formSchema = insertCigarettePaymentSchema.extend({
  amount: z.string().min(1, "المبلغ مطلوب").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "المبلغ يجب أن يكون رقماً أكبر من الصفر"
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CigarettePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CigarettePaymentModal({ isOpen, onClose }: CigarettePaymentModalProps) {
  const { toast } = useToast();
  
  // Fetch all people who can receive cigarette payments
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: graduates = [] } = useQuery<Graduate[]>({
    queryKey: ["/api/graduates/active"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personId: "",
      personType: "patient",
      personName: "",
      paymentType: "cash",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      createdBy: "admin", // This should come from auth context
    },
  });

  const selectedPersonType = form.watch("personType");
  const selectedPersonId = form.watch("personId");

  // Get available people based on selected type
  const getAvailablePeople = () => {
    switch (selectedPersonType) {
      case "patient":
        return patients.filter(p => p.status === "active" && p.dailyCigaretteType !== "none");
      case "staff":
        return staff.filter(s => s.isActive && s.dailyCigaretteType !== "none");
      case "graduate":
        return graduates.filter(g => g.isActive && g.dailyCigaretteType !== "none");
      default:
        return [];
    }
  };

  // Update person name when person is selected
  const handlePersonChange = (personId: string) => {
    const people = getAvailablePeople();
    const selectedPerson = people.find(p => p.id === personId);
    if (selectedPerson) {
      form.setValue("personName", selectedPerson.name);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
      };
      return apiRequest("POST", "/api/cigarette-payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cigarette-payments"] });
      toast({
        title: "تم إضافة التسديد بنجاح",
        description: "تم تسجيل تسديد السجائر في النظام",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error creating cigarette payment:", error);
      toast({
        title: "خطأ في حفظ التسديد",
        description: error.message || "فشل في حفظ تسديد السجائر",
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
            إضافة تسديد سجائر
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* نوع الشخص */}
            <FormField
              control={form.control}
              name="personType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">نوع الشخص</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("personId", "");
                    form.setValue("personName", "");
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الشخص" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="patient">مريض</SelectItem>
                      <SelectItem value="graduate">خريج</SelectItem>
                      <SelectItem value="staff">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* اختيار الشخص */}
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">الشخص</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handlePersonChange(value);
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الشخص" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getAvailablePeople().map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name} - {person.dailyCigaretteType === "full_pack" ? "علبة كاملة" : "نصف علبة"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* نوع التسديد */}
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">نوع التسديد</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التسديد" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="cigarettes">سجائر</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* المبلغ أو الكمية */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {form.watch("paymentType") === "cash" ? "المبلغ (ج.م)" : "عدد العلب"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder={form.watch("paymentType") === "cash" ? "50" : "2"}
                      min="0"
                      step={form.watch("paymentType") === "cash" ? "0.01" : "1"}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* التاريخ */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">تاريخ التسديد</FormLabel>
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

            {/* ملاحظات */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أي ملاحظات إضافية..."
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
                {mutation.isPending ? "جاري الحفظ..." : "حفظ التسديد"}
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