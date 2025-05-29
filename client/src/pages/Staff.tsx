import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  UserCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  DollarSign,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Staff } from "@shared/schema";
import StaffModal from "@/components/StaffModal";

export default function Staff() {
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const { toast } = useToast();

  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("فشل في حذف الموظف");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الموظف بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الموظف",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsStaffModalOpen(true);
  };

  const handleDelete = (staffMember: Staff) => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف "${staffMember.name}"؟`)) {
      deleteMutation.mutate(staffMember.id);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      "طبيب": "bg-blue-100 text-blue-800",
      "ممرض": "bg-green-100 text-green-800",
      "مدير": "bg-purple-100 text-purple-800",
      "محاسب": "bg-yellow-100 text-yellow-800",
      "موظف استقبال": "bg-gray-100 text-gray-800",
    };
    
    return (
      <Badge className={roleColors[role] || "bg-gray-100 text-gray-800"}>
        {role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const activeStaff = staff?.filter(s => s.isActive) || [];
  const totalSalaries = staff?.reduce((sum, s) => sum + s.monthlySalary, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
          <p className="text-gray-600">إدارة بيانات ومعلومات الموظفين</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedStaff(null);
            setIsStaffModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة موظف جديد
        </Button>
      </div>

      {/* إحصائيات الموظفين */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الموظفين</p>
                <p className="text-2xl font-bold">{staff?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الموظفين النشطين</p>
                <p className="text-2xl font-bold">{activeStaff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الرواتب</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSalaries)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط الراتب</p>
                <p className="text-2xl font-bold">
                  {staff?.length ? formatCurrency(totalSalaries / staff.length) : formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الموظفين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            قائمة الموظفين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المنصب</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الراتب الشهري</TableHead>
                <TableHead>تاريخ التوظيف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>معلومات الاتصال</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">{staffMember.name}</TableCell>
                  <TableCell>{getRoleBadge(staffMember.role)}</TableCell>
                  <TableCell>{staffMember.department}</TableCell>
                  <TableCell>{formatCurrency(staffMember.monthlySalary)}</TableCell>
                  <TableCell>{formatDate(staffMember.hireDate)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={staffMember.isActive ? "default" : "secondary"}
                      className={staffMember.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {staffMember.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {staffMember.phoneNumber && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {staffMember.phoneNumber}
                        </div>
                      )}
                      {staffMember.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {staffMember.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(staffMember)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(staffMember)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!staff?.length && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد موظفين مسجلين</p>
            </div>
          )}
        </CardContent>
      </Card>

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
    </div>
  );
}