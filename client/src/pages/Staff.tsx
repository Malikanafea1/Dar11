import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, Mail, Phone, Briefcase } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Staff } from "@shared/schema";
import StaffModal from "@/components/StaffModal";

export default function Staff() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "doctor":
      case "طبيب":
        return "bg-blue-100 text-blue-800";
      case "nurse":
      case "ممرض":
      case "ممرضة":
        return "bg-green-100 text-green-800";
      case "admin":
      case "إداري":
        return "bg-purple-100 text-purple-800";
      case "technician":
      case "فني":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupStaffByDepartment = (staff: Staff[]) => {
    return staff.reduce((groups, member) => {
      const dept = member.department;
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(member);
      return groups;
    }, {} as Record<string, Staff[]>);
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const groupedStaff = staff ? groupStaffByDepartment(staff) : {};

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
            <p className="text-gray-600">إدارة جميع الموظفين في المستشفى</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="ml-2 w-4 h-4" />
            إضافة موظف جديد
          </Button>
        </div>

        {staff && staff.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">لا يوجد موظفون</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة أول موظف في النظام</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="ml-2 w-4 h-4" />
                إضافة موظف جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedStaff).map(([department, members]) => (
              <Card key={department}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    قسم {department}
                    <Badge variant="outline" className="mr-2">
                      {members.length} موظف
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="bg-green-100 p-3 rounded-full">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                              <Badge className={getRoleBadgeColor(member.role)}>
                                {member.role}
                              </Badge>
                              {!member.isActive && (
                                <Badge variant="destructive">غير نشط</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 ml-2" />
                                <span className="text-sm">تاريخ التوظيف: {formatDate(member.hireDate)}</span>
                              </div>
                              
                              {member.email && (
                                <div className="flex items-center text-gray-600">
                                  <Mail className="w-4 h-4 ml-2" />
                                  <span className="text-sm">{member.email}</span>
                                </div>
                              )}
                              
                              {member.phoneNumber && (
                                <div className="flex items-center text-gray-600">
                                  <Phone className="w-4 h-4 ml-2" />
                                  <span className="text-sm">{member.phoneNumber}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-700">
                                الراتب الشهري: {formatCurrency(member.monthlySalary)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member);
                              setIsModalOpen(true);
                            }}
                          >
                            تعديل
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <StaffModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
    </>
  );
}
