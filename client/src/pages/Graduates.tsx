import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2, GraduationCap, Users } from "lucide-react";
import { Graduate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GraduateModal from "@/components/GraduateModal";

// Helper function to get cigarette display text
const getCigaretteTypeText = (type: string) => {
  switch (type) {
    case "full_pack": return "علبة كاملة";
    case "half_pack": return "نصف علبة";
    case "none": return "لا يدخن";
    default: return "غير محدد";
  }
};

const formatCurrency = (amount: number) => `${amount} ج.م`;

export default function Graduates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGraduate, setSelectedGraduate] = useState<Graduate | null>(null);
  const { toast } = useToast();

  const { data: graduates = [], isLoading } = useQuery<Graduate[]>({
    queryKey: ["/api/graduates"],
  });

  const deleteGraduateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/graduates/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graduates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/graduates/active"] });
      toast({
        title: "تم حذف الخريج بنجاح",
        description: "تم إزالة الخريج من النظام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الخريج",
        description: error.message || "فشل في حذف الخريج",
        variant: "destructive",
      });
    },
  });



  // Filter graduates based on search term
  const filteredGraduates = graduates.filter(graduate =>
    graduate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeGraduates = filteredGraduates.filter(g => g.isActive);
  const inactiveGraduates = filteredGraduates.filter(g => !g.isActive);

  // Calculate cigarette statistics
  const cigaretteStats = {
    totalWithCigarettes: activeGraduates.filter(g => g.dailyCigaretteType !== "none").length,
    totalCost: activeGraduates.reduce((sum, g) => sum + (g.dailyCigaretteCost || 0), 0),
    fullPackUsers: activeGraduates.filter(g => g.dailyCigaretteType === "full_pack").length,
    halfPackUsers: activeGraduates.filter(g => g.dailyCigaretteType === "half_pack").length,
  };

  const handleAddGraduate = () => {
    setSelectedGraduate(null);
    setIsModalOpen(true);
  };

  const handleEditGraduate = (graduate: Graduate) => {
    setSelectedGraduate(graduate);
    setIsModalOpen(true);
  };

  const handleDeleteGraduate = (id: string) => {
    deleteGraduateMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الخريجين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المرضى الخريجين</h1>
          <p className="text-gray-600 mt-2">إدارة بيانات المرضى الخريجين وسجائرهم اليومية</p>
        </div>
        <Button onClick={handleAddGraduate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة خريج جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{activeGraduates.length}</p>
                <p className="text-sm text-gray-600">إجمالي الخريجين النشطين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{cigaretteStats.totalWithCigarettes}</p>
                <p className="text-sm text-gray-600">يحصل على سجائر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{cigaretteStats.fullPackUsers}</p>
                <p className="text-sm text-gray-600">علبة كاملة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(cigaretteStats.totalCost)}</p>
                <p className="text-sm text-gray-600">التكلفة اليومية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث في الخريجين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Graduates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            الخريجين النشطين ({activeGraduates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeGraduates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد خريجين نشطين</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 font-semibold">الاسم</th>
                    <th className="text-right p-3 font-semibold">نوع السجائر</th>
                    <th className="text-right p-3 font-semibold">التكلفة اليومية</th>
                    <th className="text-right p-3 font-semibold">تاريخ الإضافة</th>
                    <th className="text-right p-3 font-semibold">ملاحظات</th>
                    <th className="text-right p-3 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGraduates.map((graduate) => (
                    <tr key={graduate.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{graduate.name}</td>
                      <td className="p-3">
                        <Badge 
                          variant={graduate.dailyCigaretteType === "none" ? "secondary" : "default"}
                          className={graduate.dailyCigaretteType === "none" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-800"}
                        >
                          {getCigaretteTypeText(graduate.dailyCigaretteType)}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold">
                        {formatCurrency(graduate.dailyCigaretteCost || 0)}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {graduate.addedDate ? new Date(graduate.addedDate).toLocaleDateString('ar-EG') : '-'}
                      </td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                        {graduate.notes || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditGraduate(graduate)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف الخريج "{graduate.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteGraduate(graduate.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Graduates */}
      {inactiveGraduates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600">
              <GraduationCap className="w-5 h-5" />
              الخريجين غير النشطين ({inactiveGraduates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 font-semibold">الاسم</th>
                    <th className="text-right p-3 font-semibold">نوع السجائر</th>
                    <th className="text-right p-3 font-semibold">التكلفة اليومية</th>
                    <th className="text-right p-3 font-semibold">ملاحظات</th>
                    <th className="text-right p-3 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveGraduates.map((graduate) => (
                    <tr key={graduate.id} className="border-b hover:bg-gray-50 opacity-75">
                      <td className="p-3 font-medium">{graduate.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          {getCigaretteTypeText(graduate.dailyCigaretteType)}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-gray-500">
                        {formatCurrency(graduate.dailyCigaretteCost || 0)}
                      </td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                        {graduate.notes || '-'}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGraduate(graduate)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graduate Modal */}
      <GraduateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        graduate={selectedGraduate}
      />
    </div>
  );
}