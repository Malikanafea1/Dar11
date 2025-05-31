import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Plus, Users, GraduationCap, Briefcase, RefreshCw, Cigarette, CigaretteOff, Edit3 } from "lucide-react";
import { Patient, Staff, Graduate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CigarettePaymentModal from "@/components/CigarettePaymentModal";

// Helper function to get cigarette display text
const getCigaretteTypeText = (type: string) => {
  switch (type) {
    case "full_pack": return "علبة كاملة";
    case "half_pack": return "نصف علبة";
    case "none": return "لا يدخن";
    default: return "غير محدد";
  }
};

// Helper function to calculate cigarette cost
const calculateCigaretteCost = (type: string) => {
  switch (type) {
    case "full_pack": return 50;
    case "half_pack": return 25;
    case "none": return 0;
    default: return 0;
  }
};

export default function CigaretteManagement() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch data
  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: graduates = [], isLoading: graduatesLoading } = useQuery<Graduate[]>({
    queryKey: ["/api/graduates/active"],
  });

  // Mutation لتحديث بيانات المرضى
  const updatePatientsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/patients/update-cigarette-fields", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "تم تحديث بيانات المرضى",
        description: "تم إضافة حقول السجائر للمرضى الموجودين بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث بيانات المرضى",
        variant: "destructive",
      });
    }
  });

  // Mutation لتحديث بيانات الموظفين
  const updateStaffMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/staff/update-cigarette-fields", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "تم تحديث بيانات الموظفين",
        description: "تم إضافة حقول السجائر للموظفين الموجودين بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث بيانات الموظفين",
        variant: "destructive",
      });
    }
  });

  // Mutation لتحديث حالة السجائر للموظفين
  const updateStaffCigaretteMutation = useMutation({
    mutationFn: async ({ staffId, newType }: { staffId: string; newType: string }) => {
      const cost = newType === "full_pack" ? 50 : newType === "half_pack" ? 25 : 0;
      return apiRequest("PATCH", `/api/staff/${staffId}`, {
        dailyCigaretteType: newType,
        dailyCigaretteCost: cost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة السجائر للموظف بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة السجائر للموظف",
        variant: "destructive",
      });
    },
  });

  // Mutation لتحديث حالة السجائر للخريجين
  const updateGraduateCigaretteMutation = useMutation({
    mutationFn: async ({ graduateId, newType }: { graduateId: string; newType: string }) => {
      const cost = newType === "full_pack" ? 50 : newType === "half_pack" ? 25 : 0;
      return apiRequest("PATCH", `/api/graduates/${graduateId}`, {
        dailyCigaretteType: newType,
        dailyCigaretteCost: cost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graduates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/graduates/active"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة السجائر للخريج بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة السجائر للخريج",
        variant: "destructive",
      });
    },
  });

  // Mutation لتحديث حالة السجائر للمرضى
  const updatePatientCigaretteMutation = useMutation({
    mutationFn: async ({ patientId, newType }: { patientId: string; newType: string }) => {
      const cost = newType === "full_pack" ? 50 : newType === "half_pack" ? 25 : 0;
      return apiRequest("PATCH", `/api/patients/${patientId}`, {
        dailyCigaretteType: newType,
        dailyCigaretteCost: cost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة السجائر للمريض بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة السجائر للمريض",
        variant: "destructive",
      });
    },
  });

  const handleUpdateData = async () => {
    try {
      await updatePatientsMutation.mutateAsync();
      await updateStaffMutation.mutateAsync();
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  // Filter active patients and separate by type - only show those with cigarettes
  const activePatients = patients.filter(p => p.status === "active");
  const detoxPatients = activePatients.filter(p => 
    p.patientType === "detox" && 
    (p.dailyCigaretteType && p.dailyCigaretteType !== "none")
  );
  const recoveryPatients = activePatients.filter(p => 
    p.patientType === "recovery" && 
    (p.dailyCigaretteType && p.dailyCigaretteType !== "none")
  );
  
  // Filter staff and graduates to only show those with cigarettes
  const activeStaff = staff.filter(s => 
    s.isActive && 
    (s.dailyCigaretteType && s.dailyCigaretteType !== "none")
  );
  
  // Filter graduates to only show active ones with cigarettes
  const activeGraduatesWithCigarettes = graduates.filter(g => 
    g.isActive && 
    (g.dailyCigaretteType && g.dailyCigaretteType !== "none")
  );

  // Calculate totals for each section
  const calculateSectionTotals = (items: any[]) => {
    const totalDaily = items.reduce((sum, item) => {
      const cost = item.dailyCigaretteCost || calculateCigaretteCost(item.dailyCigaretteType || "none");
      return sum + cost;
    }, 0);
    
    const totalCount = items.filter(item => 
      (item.dailyCigaretteType || "none") !== "none"
    ).length;

    return { totalDaily, totalCount };
  };

  const detoxTotals = calculateSectionTotals(detoxPatients);
  const recoveryTotals = calculateSectionTotals(recoveryPatients);
  const graduatesTotals = calculateSectionTotals(activeGraduatesWithCigarettes);
  const staffTotals = calculateSectionTotals(activeStaff);

  const grandTotal = detoxTotals.totalDaily + recoveryTotals.totalDaily + 
                    graduatesTotals.totalDaily + staffTotals.totalDaily;
  const grandTotalCount = detoxTotals.totalCount + recoveryTotals.totalCount + 
                         graduatesTotals.totalCount + staffTotals.totalCount;

  const handlePrintSection = (sectionName: string) => {
    // Print functionality will be implemented
    console.log(`Printing section: ${sectionName}`);
  };

  // وظائف التحكم في السجائر
  const handleToggleCigarette = (item: any, type: 'patient' | 'staff' | 'graduate') => {
    const currentType = item.dailyCigaretteType || "none";
    let newType = "none";
    
    if (currentType === "none") {
      newType = "half_pack";
    } else if (currentType === "half_pack") {
      newType = "full_pack";
    } else {
      newType = "none";
    }
    
    switch (type) {
      case 'patient':
        updatePatientCigaretteMutation.mutate({ patientId: item.id, newType });
        break;
      case 'staff':
        updateStaffCigaretteMutation.mutate({ staffId: item.id, newType });
        break;
      case 'graduate':
        updateGraduateCigaretteMutation.mutate({ graduateId: item.id, newType });
        break;
    }
  };

  const formatCurrency = (amount: number) => `${amount} ج.م`;

  const SectionCard = ({ 
    title, 
    icon: Icon, 
    items, 
    sectionKey, 
    color,
    showAllItems = false
  }: { 
    title: string; 
    icon: any; 
    items: any[]; 
    sectionKey: string; 
    color: string;
    showAllItems?: boolean;
  }) => {
    const totals = calculateSectionTotals(items);
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <p className="text-sm text-gray-600">
                  {totals.totalCount} شخص يحصل على سجائر - {formatCurrency(totals.totalDaily)} يومياً
                </p>
              </div>
            </div>
            <Button
              onClick={() => handlePrintSection(sectionKey)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة القسم
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد بيانات في هذا القسم</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 font-semibold">الاسم</th>
                      <th className="text-right p-3 font-semibold">النوع/القسم</th>
                      <th className="text-right p-3 font-semibold">نوع السجائر</th>
                      <th className="text-right p-3 font-semibold">التكلفة اليومية</th>
                      <th className="text-right p-3 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const cigaretteType = item.dailyCigaretteType || "none";
                      const cost = item.dailyCigaretteCost || calculateCigaretteCost(cigaretteType);
                      let itemType: 'patient' | 'staff' | 'graduate' = 'patient';
                      
                      if (item.role) itemType = 'staff';
                      else if (!item.patientType) itemType = 'graduate';
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3">
                            {item.patientType && (
                              <Badge variant="outline">
                                {item.patientType === "detox" ? "ديتوكس" : "ريكفري"}
                              </Badge>
                            )}
                            {item.role && (
                              <Badge variant="outline">{item.role}</Badge>
                            )}
                            {!item.patientType && !item.role && (
                              <Badge variant="outline">خريج</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={cigaretteType === "none" ? "secondary" : "default"}
                                className={cigaretteType === "none" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-800"}
                              >
                                {getCigaretteTypeText(cigaretteType)}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 font-semibold">
                            {formatCurrency(cost)}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleCigarette(item, itemType)}
                              disabled={updatePatientCigaretteMutation.isPending || updateStaffCigaretteMutation.isPending || updateGraduateCigaretteMutation.isPending}
                              className="p-1 h-7 w-7"
                              title={cigaretteType === "none" ? "تفعيل السجائر" : "تغيير نوع السجائر"}
                            >
                              {cigaretteType === "none" ? (
                                <Cigarette className="w-3 h-3" />
                              ) : (
                                <CigaretteOff className="w-3 h-3" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">إجمالي القسم:</span>
                <div className="text-left">
                  <p className="font-bold text-lg">{formatCurrency(totals.totalDaily)}</p>
                  <p className="text-sm text-gray-600">{totals.totalCount} أشخاص</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (patientsLoading || staffLoading || graduatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات السجائر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة السجائر اليومية</h1>
          <p className="text-gray-600 mt-2">متابعة توزيع السجائر اليومية للمرضى والخريجين والموظفين</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleUpdateData}
            variant="outline"
            disabled={updatePatientsMutation.isPending || updateStaffMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${(updatePatientsMutation.isPending || updateStaffMutation.isPending) ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة تسديد سجائر
          </Button>
        </div>
      </div>

      {/* Grand Total Summary */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">الإحصائيات الإجمالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{detoxTotals.totalCount}</p>
              <p className="text-sm text-gray-600">مرضى ديتوكس</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-green-600">{recoveryTotals.totalCount}</p>
              <p className="text-sm text-gray-600">مرضى ريكفري</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{graduatesTotals.totalCount}</p>
              <p className="text-sm text-gray-600">خريجين</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-orange-600">{staffTotals.totalCount}</p>
              <p className="text-sm text-gray-600">موظفين</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">الإجمالي الكلي</h3>
            <p className="text-3xl font-bold text-blue-600 mb-1">{formatCurrency(grandTotal)}</p>
            <p className="text-gray-600">إجمالي التكلفة اليومية للسجائر</p>
            <p className="text-sm text-gray-500 mt-2">{grandTotalCount} شخص يحصل على سجائر</p>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <SectionCard
        title="قسم مرضى الديتوكس"
        icon={Users}
        items={detoxPatients}
        sectionKey="detox"
        color="bg-blue-600"
      />

      <SectionCard
        title="قسم مرضى الريكفري"
        icon={Users}
        items={recoveryPatients}
        sectionKey="recovery"
        color="bg-green-600"
      />

      <SectionCard
        title="قسم المرضى الخريجين"
        icon={GraduationCap}
        items={activeGraduatesWithCigarettes}
        sectionKey="graduates"
        color="bg-purple-600"
      />

      <SectionCard
        title="قسم الموظفين والعاملين"
        icon={Briefcase}
        items={activeStaff}
        sectionKey="staff"
        color="bg-orange-600"
      />

      {/* Cigarette Payment Modal */}
      <CigarettePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}