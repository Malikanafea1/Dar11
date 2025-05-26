import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, UserRound, Calendar, MapPin, DollarSign, CreditCard } from "lucide-react";
import { formatCurrency, formatDate, calculateDaysBetween } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@shared/schema";
import PatientModal from "@/components/PatientModal";

export default function Patients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const dischargeMutation = useMutation({
    mutationFn: async (patientId: number) => {
      return apiRequest("PATCH", `/api/patients/${patientId}`, {
        status: "discharged",
        dischargeDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "تم تسجيل خروج المريض بنجاح",
        description: "تم تحديث حالة المريض إلى مُخرّج",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل خروج المريض",
        variant: "destructive",
      });
    },
  });

  const handleDischarge = (patient: Patient) => {
    if (confirm(`هل أنت متأكد من تسجيل خروج المريض ${patient.name}؟`)) {
      dischargeMutation.mutate(patient.id);
    }
  };

  const calculateTotalCost = (patient: Patient) => {
    const days = calculateDaysBetween(patient.admissionDate, patient.dischargeDate);
    return days * parseFloat(patient.dailyCost);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case "discharged":
        return <Badge className="bg-gray-100 text-gray-800">مُخرّج</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة المرضى</h1>
            <p className="text-gray-600">إدارة جميع المرضى في المستشفى</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="ml-2 w-4 h-4" />
            إضافة مريض جديد
          </Button>
        </div>

        {patients && patients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserRound className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد مرضى</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة أول مريض في النظام</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="ml-2 w-4 h-4" />
                إضافة مريض جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {patients?.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <UserRound className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">{patient.name}</h3>
                          {getStatusBadge(patient.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 ml-2" />
                            <span className="text-sm">دخول: {formatDate(patient.admissionDate)}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 ml-2" />
                            <span className="text-sm">غرفة: {patient.roomNumber || "غير محدد"}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 ml-2" />
                            <span className="text-sm">تكلفة يومية: {formatCurrency(patient.dailyCost)}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <CreditCard className="w-4 h-4 ml-2" />
                            <span className="text-sm">مدفوع: {formatCurrency(patient.totalPaid || 0)}</span>
                          </div>
                        </div>

                        {patient.status === "active" && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-yellow-800">
                                أيام الإقامة: {calculateDaysBetween(patient.admissionDate)} يوم
                              </span>
                              <span className="text-sm font-medium text-yellow-900">
                                التكلفة الإجمالية: {formatCurrency(calculateTotalCost(patient))}
                              </span>
                            </div>
                          </div>
                        )}

                        {patient.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{patient.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {patient.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDischarge(patient)}
                          disabled={dischargeMutation.isPending}
                        >
                          تسجيل خروج
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setIsModalOpen(true);
                        }}
                      >
                        تعديل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
    </>
  );
}
