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
import jsPDF from 'jspdf';

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

  // Show all active patients (including those without cigarettes)
  const activePatients = patients.filter(p => p.status === "active");
  const detoxPatients = activePatients.filter(p => p.patientType === "detox");
  const recoveryPatients = activePatients.filter(p => p.patientType === "recovery");
  
  // Show all active staff (including those without cigarettes)
  const activeStaff = staff.filter(s => s.isActive);
  
  // Show all active graduates (including those without cigarettes)
  const activeGraduatesAll = graduates.filter(g => g.isActive);

  // Calculate totals for each section
  const calculateSectionTotals = (items: any[]) => {
    const totalDaily = items.reduce((sum, item) => {
      const cost = item.dailyCigaretteCost || calculateCigaretteCost(item.dailyCigaretteType || "none");
      return sum + cost;
    }, 0);
    
    const totalCount = items.filter(item => 
      (item.dailyCigaretteType || "none") !== "none"
    ).length;

    // حساب عدد علب السجائر
    const fullPacks = items.filter(item => 
      (item.dailyCigaretteType || "none") === "full_pack"
    ).length;
    
    const halfPacks = items.filter(item => 
      (item.dailyCigaretteType || "none") === "half_pack"
    ).length;

    // إجمالي عدد العلب (نصف علبة = 0.5)
    const totalPacks = fullPacks + (halfPacks * 0.5);

    // عدد الأشخاص النشطين (الذين يحصلون على سجائر)
    const activeCount = items.filter(item => 
      (item.dailyCigaretteType || "none") !== "none"
    ).length;

    // عدد الأشخاص المتوقفين (الذين لا يحصلون على سجائر)
    const inactiveCount = items.filter(item => 
      (item.dailyCigaretteType || "none") === "none"
    ).length;

    return { 
      totalDaily, 
      totalCount, 
      fullPacks, 
      halfPacks, 
      totalPacks, 
      activeCount, 
      inactiveCount 
    };
  };

  const detoxTotals = calculateSectionTotals(detoxPatients);
  const recoveryTotals = calculateSectionTotals(recoveryPatients);
  const graduatesTotals = calculateSectionTotals(activeGraduatesAll);
  const staffTotals = calculateSectionTotals(activeStaff);

  const grandTotal = detoxTotals.totalDaily + recoveryTotals.totalDaily + 
                    graduatesTotals.totalDaily + staffTotals.totalDaily;
  const grandTotalCount = detoxTotals.totalCount + recoveryTotals.totalCount + 
                         graduatesTotals.totalCount + staffTotals.totalCount;
  const grandTotalPacks = detoxTotals.totalPacks + recoveryTotals.totalPacks + 
                         graduatesTotals.totalPacks + staffTotals.totalPacks;
  const grandTotalFullPacks = detoxTotals.fullPacks + recoveryTotals.fullPacks + 
                             graduatesTotals.fullPacks + staffTotals.fullPacks;
  const grandTotalHalfPacks = detoxTotals.halfPacks + recoveryTotals.halfPacks + 
                             graduatesTotals.halfPacks + staffTotals.halfPacks;

  const handlePrintSection = (sectionName: string) => {
    let sectionData: any[] = [];
    let sectionTitle = "";
    let totals: any = {};
    
    switch (sectionName) {
      case 'detox':
        sectionData = detoxPatients;
        sectionTitle = "قسم مرضى الديتوكس";
        totals = detoxTotals;
        break;
      case 'recovery':
        sectionData = recoveryPatients;
        sectionTitle = "قسم مرضى الريكفري";
        totals = recoveryTotals;
        break;
      case 'graduates':
        sectionData = activeGraduatesAll;
        sectionTitle = "قسم المرضى الخريجين";
        totals = graduatesTotals;
        break;
      case 'staff':
        sectionData = activeStaff;
        sectionTitle = "قسم الموظفين والعاملين";
        totals = staffTotals;
        break;
      default:
        return;
    }

    generateHTMLReport(sectionTitle, sectionData, totals);
  };

  const generateHTMLReport = (title: string, data: any[], totals: any) => {
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير السجائر اليومي - ${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Cairo', Arial, sans-serif;
                direction: rtl;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1000px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2980b9, #3498db);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .header h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 1rem;
                opacity: 0.9;
            }
            
            .stats-section {
                background: linear-gradient(135deg, #27ae60, #2ecc71);
                color: white;
                padding: 25px;
                margin: 20px;
                border-radius: 10px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }
            
            .stat-item {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }
            
            .stat-number {
                font-size: 2rem;
                font-weight: 700;
                display: block;
            }
            
            .stat-label {
                font-size: 0.9rem;
                opacity: 0.9;
            }
            
            .table-container {
                margin: 20px;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            
            th {
                background: linear-gradient(135deg, #34495e, #2c3e50);
                color: white;
                padding: 15px 10px;
                text-align: center;
                font-weight: 600;
            }
            
            td {
                padding: 12px 10px;
                text-align: center;
                border-bottom: 1px solid #ecf0f1;
            }
            
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            tr:hover {
                background-color: #e3f2fd;
            }
            
            .status-active {
                background: #d4edda;
                color: #155724;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            
            .status-inactive {
                background: #f8d7da;
                color: #721c24;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            
            .type-badge {
                background: #cce5ff;
                color: #0056b3;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-top: 3px solid #3498db;
            }
            
            .total-section {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                padding: 20px;
                margin: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .buttons {
                text-align: center;
                padding: 20px;
                background: #f8f9fa;
            }
            
            .btn {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                border: none;
                padding: 12px 25px;
                margin: 0 10px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                font-size: 1rem;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .btn-success {
                background: linear-gradient(135deg, #27ae60, #229954);
            }
            
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                .buttons {
                    display: none;
                }
                .container {
                    box-shadow: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>تقرير السجائر اليومي</h1>
                <h2>${title}</h2>
                <p>تاريخ التقرير: ${currentDate}</p>
            </div>
            
            <div class="stats-section">
                <h3 style="text-align: center; margin-bottom: 15px;">الإحصائيات الإجمالية</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${totals.totalPacks}</span>
                        <span class="stat-label">إجمالي العلب المطلوبة</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${formatCurrency(totals.totalDaily)}</span>
                        <span class="stat-label">التكلفة اليومية</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totals.fullPacks}</span>
                        <span class="stat-label">العلب الكاملة</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totals.halfPacks}</span>
                        <span class="stat-label">الأنصاف</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totals.activeCount}</span>
                        <span class="stat-label">الأشخاص النشطين</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totals.inactiveCount}</span>
                        <span class="stat-label">المتوقفين</span>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>النوع/القسم</th>
                            <th>حالة السجائر</th>
                            <th>نوع السجائر</th>
                            <th>التكلفة اليومية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => {
                          const cigaretteType = item.dailyCigaretteType || "none";
                          const cost = item.dailyCigaretteCost || calculateCigaretteCost(cigaretteType);
                          
                          let typeText = '';
                          if (item.patientType) {
                            typeText = item.patientType === "detox" ? "ديتوكس" : "ريكفري";
                          } else if (item.role) {
                            typeText = item.role;
                          } else {
                            typeText = "خريج";
                          }
                          
                          const statusText = cigaretteType === "none" ? "متوقف" : "نشط";
                          const statusClass = cigaretteType === "none" ? "status-inactive" : "status-active";
                          const cigaretteTypeText = getCigaretteTypeText(cigaretteType);
                          
                          return `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                <td><span class="type-badge">${typeText}</span></td>
                                <td><span class="${statusClass}">${statusText}</span></td>
                                <td>${cigaretteTypeText}</td>
                                <td><strong>${formatCurrency(cost)}</strong></td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <h3>إجمالي القسم: ${formatCurrency(totals.totalDaily)}</h3>
                <p>عدد الأشخاص: ${totals.totalCount}</p>
            </div>
            
            <div class="buttons">
                <button class="btn" onclick="window.print()">🖨️ طباعة التقرير</button>
                <button class="btn btn-success" onclick="downloadReport()">💾 تنزيل التقرير</button>
            </div>
            
            <div class="footer">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المستشفى</p>
                <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
            </div>
        </div>
        
        <script>
            function downloadReport() {
                const element = document.querySelector('.container');
                const filename = '${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html';
                
                const htmlContent = document.documentElement.outerHTML;
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                
                URL.revokeObjectURL(url);
            }
        </script>
    </body>
    </html>
    `;

    // فتح التقرير في نافذة جديدة
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const generatePDF = (title: string, data: any[], totals: any) => {
    const pdf = new jsPDF();
    
    // إعداد الخط والألوان
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    
    // إضافة خلفية ملونة للعنوان
    pdf.setFillColor(41, 128, 185); // أزرق
    pdf.rect(10, 10, 190, 25, 'F');
    
    // عنوان التقرير
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    pdf.setTextColor(255, 255, 255); // أبيض
    pdf.text('تقرير السجائر اليومي', 105, 20, { align: 'center' });
    pdf.setFontSize(14);
    
    pdf.text(title, 105, 30, { align: 'center' });
    
    // تاريخ التقرير
    pdf.setTextColor(0, 0, 0); // أسود
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`تاريخ التقرير: ${currentDate}`, 105, 45, { align: 'center' });
    
    // قسم الإحصائيات الإجمالية
    let yPos = 65;
    pdf.setFillColor(46, 204, 113); // أخضر فاتح
    pdf.rect(10, yPos - 5, 190, 45, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text('الإحصائيات الإجمالية', 105, yPos + 5, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    yPos += 15;
    
    // صف الإحصائيات الأول
    pdf.text(`إجمالي العلب المطلوبة: ${totals.totalPacks}`, 20, yPos);
    pdf.text(`التكلفة اليومية: ${formatCurrency(totals.totalDaily)}`, 110, yPos);
    yPos += 8;
    
    // صف الإحصائيات الثاني
    pdf.text(`العلب الكاملة: ${totals.fullPacks}`, 20, yPos);
    pdf.text(`الأنصاف: ${totals.halfPacks}`, 110, yPos);
    yPos += 8;
    
    // صف الإحصائيات الثالث
    pdf.text(`الأشخاص النشطين: ${totals.activeCount}`, 20, yPos);
    pdf.text(`المتوقفين: ${totals.inactiveCount}`, 110, yPos);
    
    // بداية الجدول
    yPos += 20;
    
    // رأس الجدول
    pdf.setFillColor(52, 73, 94); // رمادي داكن
    pdf.rect(10, yPos, 190, 12, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    
    // عناوين الأعمدة
    pdf.text('الاسم', 15, yPos + 8);
    pdf.text('النوع/القسم', 55, yPos + 8);
    pdf.text('حالة السجائر', 95, yPos + 8);
    pdf.text('نوع السجائر', 135, yPos + 8);
    pdf.text('التكلفة', 175, yPos + 8);
    
    yPos += 12;
    
    // بيانات الجدول
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    
    data.forEach((item, index) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
        
        // إعادة رسم رأس الجدول في الصفحة الجديدة
        pdf.setFillColor(52, 73, 94);
        pdf.rect(10, yPos, 190, 12, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        
        pdf.text('الاسم', 15, yPos + 8);
        pdf.text('النوع/القسم', 55, yPos + 8);
        pdf.text('حالة السجائر', 95, yPos + 8);
        pdf.text('نوع السجائر', 135, yPos + 8);
        pdf.text('التكلفة', 175, yPos + 8);
        
        yPos += 12;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
      }
      
      // ألوان متناوبة للصفوف
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250); // رمادي فاتح جداً
      } else {
        pdf.setFillColor(255, 255, 255); // أبيض
      }
      pdf.rect(10, yPos, 190, 10, 'F');
      
      const cigaretteType = item.dailyCigaretteType || "none";
      const cost = item.dailyCigaretteCost || calculateCigaretteCost(cigaretteType);
      
      // الاسم
      pdf.text(item.name || '', 15, yPos + 7);
      
      // النوع/القسم
      let typeText = '';
      if (item.patientType) {
        typeText = item.patientType === "detox" ? "ديتوكس" : "ريكفري";
      } else if (item.role) {
        typeText = item.role;
      } else {
        typeText = "خريج";
      }
      pdf.text(typeText, 55, yPos + 7);
      
      // حالة السجائر مع لون
      const statusText = cigaretteType === "none" ? "متوقف" : "نشط";
      if (cigaretteType === "none") {
        pdf.setTextColor(231, 76, 60); // أحمر للمتوقفين
      } else {
        pdf.setTextColor(39, 174, 96); // أخضر للنشطين
      }
      pdf.text(statusText, 95, yPos + 7);
      
      // إعادة تعيين اللون للأسود
      pdf.setTextColor(0, 0, 0);
      
      // نوع السجائر
      const cigaretteTypeArabic = cigaretteType === "full_pack" ? "علبة كاملة" : 
                                  cigaretteType === "half_pack" ? "نصف علبة" : "لا يدخن";
      pdf.text(cigaretteTypeArabic, 135, yPos + 7);
      
      // التكلفة
      pdf.text(formatCurrency(cost), 175, yPos + 7);
      
      yPos += 10;
    });
    
    // عرض خيارات الطباعة والتنزيل
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // فتح نافذة المعاينة مع خيارات الطباعة والتنزيل
    const pdfOutput = pdf.output('blob');
    const url = URL.createObjectURL(pdfOutput);
    
    // إنشاء نافذة جديدة للمعاينة
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        // إضافة أزرار للطباعة والتنزيل
        const buttonContainer = printWindow.document.createElement('div');
        buttonContainer.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        const printBtn = printWindow.document.createElement('button');
        printBtn.textContent = 'طباعة';
        printBtn.style.cssText = `
          margin-right: 10px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        `;
        printBtn.onclick = () => printWindow.print();
        
        const downloadBtn = printWindow.document.createElement('button');
        downloadBtn.textContent = 'تنزيل';
        downloadBtn.style.cssText = `
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        `;
        downloadBtn.onclick = () => {
          const link = printWindow.document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
        };
        
        buttonContainer.appendChild(printBtn);
        buttonContainer.appendChild(downloadBtn);
        printWindow.document.body.appendChild(buttonContainer);
      };
    }
    
    // تنظيف الذاكرة بعد فترة
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // وظيفة طباعة شاملة محسنة لجميع الأقسام
  const generateComprehensivePDF = (title: string, allData: any[], totals: any) => {
    const pdf = new jsPDF();
    
    // إعداد الخط والألوان
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    
    // إضافة خلفية ملونة للعنوان الرئيسي
    pdf.setFillColor(142, 68, 173); // بنفسجي
    pdf.rect(5, 5, 200, 30, 'F');
    
    // عنوان التقرير الرئيسي
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    pdf.setTextColor(255, 255, 255);
    pdf.text('تقرير السجائر الشامل', 105, 15, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text('جميع الأقسام - مرضى وموظفين', 105, 25, { align: 'center' });
    
    // تاريخ التقرير
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`تاريخ التقرير: ${currentDate}`, 105, 45, { align: 'center' });
    
    // الإحصائيات الإجمالية الشاملة
    let yPos = 60;
    pdf.setFillColor(231, 76, 60); // أحمر فاتح
    pdf.rect(5, yPos - 5, 200, 55, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text('الإحصائيات الإجمالية لجميع الأقسام', 105, yPos + 5, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    yPos += 20;
    
    // الصف الأول من الإحصائيات
    pdf.text(`إجمالي العلب المطلوبة: ${totals.totalPacks}`, 15, yPos);
    pdf.text(`التكلفة الإجمالية: ${formatCurrency(totals.totalDaily)}`, 110, yPos);
    yPos += 10;
    
    // الصف الثاني
    pdf.text(`العلب الكاملة: ${totals.fullPacks}`, 15, yPos);
    pdf.text(`الأنصاف: ${totals.halfPacks}`, 110, yPos);
    yPos += 10;
    
    // الصف الثالث
    pdf.text(`الأشخاص النشطين: ${totals.activeCount}`, 15, yPos);
    pdf.text(`المتوقفين: ${totals.inactiveCount}`, 110, yPos);
    
    // تجميع البيانات حسب القسم
    const sections = {
      'ديتوكس': allData.filter(item => item.section === 'ديتوكس'),
      'ريكفري': allData.filter(item => item.section === 'ريكفري'),
      'خريجين': allData.filter(item => item.section === 'خريجين'),
      'موظفين': allData.filter(item => item.section === 'موظفين')
    };
    
    yPos += 25;
    
    // طباعة كل قسم منفصل
    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      if (sectionData.length === 0) return;
      
      // التحقق من الحاجة لصفحة جديدة
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      // عنوان القسم
      pdf.setFillColor(52, 152, 219); // أزرق
      pdf.rect(5, yPos, 200, 15, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`قسم ${sectionName}`, 105, yPos + 10, { align: 'center' });
      
      yPos += 20;
      
      // رأس الجدول للقسم
      pdf.setFillColor(44, 62, 80);
      pdf.rect(5, yPos, 200, 12, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      
      pdf.text('الاسم', 10, yPos + 8);
      pdf.text('حالة السجائر', 70, yPos + 8);
      pdf.text('نوع السجائر', 120, yPos + 8);
      pdf.text('التكلفة', 170, yPos + 8);
      
      yPos += 12;
      
      // بيانات القسم
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      
      sectionData.forEach((item, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
          
          // إعادة رسم رأس الجدول
          pdf.setFillColor(44, 62, 80);
          pdf.rect(5, yPos, 200, 12, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          
          pdf.text('الاسم', 10, yPos + 8);
          pdf.text('حالة السجائر', 70, yPos + 8);
          pdf.text('نوع السجائر', 120, yPos + 8);
          pdf.text('التكلفة', 170, yPos + 8);
          
          yPos += 12;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
        }
        
        // لون متناوب للصفوف
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.rect(5, yPos, 200, 10, 'F');
        
        const cigaretteType = item.dailyCigaretteType || "none";
        const cost = item.dailyCigaretteCost || calculateCigaretteCost(cigaretteType);
        
        // الاسم
        pdf.text(item.name || '', 10, yPos + 7);
        
        // حالة السجائر مع لون
        const statusText = cigaretteType === "none" ? "متوقف" : "نشط";
        if (cigaretteType === "none") {
          pdf.setTextColor(231, 76, 60);
        } else {
          pdf.setTextColor(39, 174, 96);
        }
        pdf.text(statusText, 70, yPos + 7);
        
        pdf.setTextColor(0, 0, 0);
        
        // نوع السجائر
        pdf.text(getCigaretteTypeText(cigaretteType), 120, yPos + 7);
        
        // التكلفة
        pdf.text(formatCurrency(cost), 170, yPos + 7);
        
        yPos += 10;
      });
      
      // إحصائيات القسم
      const sectionTotals = calculateSectionTotals(sectionData);
      yPos += 5;
      
      pdf.setFillColor(236, 240, 241);
      pdf.rect(5, yPos, 200, 20, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      pdf.text(`إحصائيات ${sectionName}:`, 10, yPos + 8);
      pdf.text(`العلب: ${sectionTotals.totalPacks}`, 10, yPos + 15);
      pdf.text(`النشطين: ${sectionTotals.activeCount}`, 80, yPos + 8);
      pdf.text(`المتوقفين: ${sectionTotals.inactiveCount}`, 80, yPos + 15);
      pdf.text(`التكلفة: ${formatCurrency(sectionTotals.totalDaily)}`, 150, yPos + 12);
      
      yPos += 30;
    });
    
    // عرض خيارات الطباعة والتنزيل
    const fileName = `تقرير_السجائر_الشامل_${new Date().toISOString().split('T')[0]}.pdf`;
    
    const pdfOutput = pdf.output('blob');
    const url = URL.createObjectURL(pdfOutput);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        const buttonContainer = printWindow.document.createElement('div');
        buttonContainer.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 2px solid #007bff;
        `;
        
        const printBtn = printWindow.document.createElement('button');
        printBtn.textContent = '🖨️ طباعة';
        printBtn.style.cssText = `
          margin-right: 10px;
          padding: 10px 20px;
          background: linear-gradient(45deg, #007bff, #0056b3);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        `;
        printBtn.onclick = () => printWindow.print();
        
        const downloadBtn = printWindow.document.createElement('button');
        downloadBtn.textContent = '💾 تنزيل';
        downloadBtn.style.cssText = `
          padding: 10px 20px;
          background: linear-gradient(45deg, #28a745, #1e7e34);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        `;
        downloadBtn.onclick = () => {
          const link = printWindow.document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
        };
        
        buttonContainer.appendChild(printBtn);
        buttonContainer.appendChild(downloadBtn);
        printWindow.document.body.appendChild(buttonContainer);
      };
    }
    
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handlePrintAll = () => {
    const allData = [
      ...detoxPatients.map(p => ({ ...p, section: 'ديتوكس' })),
      ...recoveryPatients.map(p => ({ ...p, section: 'ريكفري' })),
      ...activeGraduatesAll.map(g => ({ ...g, section: 'خريجين' })),
      ...activeStaff.map(s => ({ ...s, section: 'موظفين' }))
    ];

    const allTotals = {
      totalDaily: grandTotal,
      totalCount: grandTotalCount,
      fullPacks: grandTotalFullPacks,
      halfPacks: grandTotalHalfPacks,
      totalPacks: grandTotalPacks,
      activeCount: allData.filter(item => (item.dailyCigaretteType || "none") !== "none").length,
      inactiveCount: allData.filter(item => (item.dailyCigaretteType || "none") === "none").length
    };

    generateComprehensiveHTMLReport("تقرير شامل لجميع الأقسام", allData, allTotals);
  };

  const generateComprehensiveHTMLReport = (title: string, allData: any[], totals: any) => {
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // تجميع البيانات حسب القسم
    const sections = {
      'ديتوكس': allData.filter(item => item.section === 'ديتوكس'),
      'ريكفري': allData.filter(item => item.section === 'ريكفري'),
      'خريجين': allData.filter(item => item.section === 'خريجين'),
      'موظفين': allData.filter(item => item.section === 'موظفين')
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Cairo', Arial, sans-serif;
                direction: rtl;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #8e44ad, #9b59b6);
                color: white;
                padding: 40px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 15px;
            }
            
            .header p {
                font-size: 1.2rem;
                opacity: 0.9;
            }
            
            .grand-stats {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                padding: 30px;
                margin: 20px;
                border-radius: 15px;
            }
            
            .grand-stats h2 {
                text-align: center;
                font-size: 2rem;
                margin-bottom: 25px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .stat-card {
                background: rgba(255,255,255,0.2);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                border: 2px solid rgba(255,255,255,0.3);
            }
            
            .stat-number {
                font-size: 2.5rem;
                font-weight: 700;
                display: block;
                margin-bottom: 10px;
            }
            
            .stat-label {
                font-size: 1rem;
                opacity: 0.9;
            }
            
            .section {
                margin: 30px 20px;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }
            
            .section-header {
                padding: 20px;
                color: white;
                text-align: center;
                font-size: 1.5rem;
                font-weight: 700;
            }
            
            .detox-header { background: linear-gradient(135deg, #3498db, #2980b9); }
            .recovery-header { background: linear-gradient(135deg, #27ae60, #229954); }
            .graduates-header { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
            .staff-header { background: linear-gradient(135deg, #f39c12, #e67e22); }
            
            .section-stats {
                background: #f8f9fa;
                padding: 15px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                text-align: center;
            }
            
            .section-stat {
                background: white;
                padding: 10px;
                border-radius: 8px;
                border-left: 4px solid #3498db;
            }
            
            .section-stat-number {
                font-size: 1.5rem;
                font-weight: 700;
                color: #2c3e50;
            }
            
            .section-stat-label {
                font-size: 0.8rem;
                color: #7f8c8d;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                background: white;
            }
            
            th {
                background: #34495e;
                color: white;
                padding: 15px 10px;
                text-align: center;
                font-weight: 600;
            }
            
            td {
                padding: 12px 10px;
                text-align: center;
                border-bottom: 1px solid #ecf0f1;
            }
            
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            tr:hover {
                background-color: #e3f2fd;
            }
            
            .status-active {
                background: #d4edda;
                color: #155724;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            
            .status-inactive {
                background: #f8d7da;
                color: #721c24;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            
            .type-badge {
                background: #cce5ff;
                color: #0056b3;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            
            .buttons {
                text-align: center;
                padding: 30px;
                background: #f8f9fa;
            }
            
            .btn {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                border: none;
                padding: 15px 30px;
                margin: 0 10px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                font-size: 1.1rem;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .btn-success {
                background: linear-gradient(135deg, #27ae60, #229954);
            }
            
            .footer {
                background: #2c3e50;
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                .buttons {
                    display: none;
                }
                .container {
                    box-shadow: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <p>تاريخ التقرير: ${currentDate}</p>
            </div>
            
            <div class="grand-stats">
                <h2>الإحصائيات الإجمالية الشاملة</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-number">${totals.totalPacks}</span>
                        <span class="stat-label">إجمالي العلب المطلوبة</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${formatCurrency(totals.totalDaily)}</span>
                        <span class="stat-label">التكلفة الإجمالية اليومية</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${totals.fullPacks}</span>
                        <span class="stat-label">العلب الكاملة</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${totals.halfPacks}</span>
                        <span class="stat-label">الأنصاف</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${totals.activeCount}</span>
                        <span class="stat-label">الأشخاص النشطين</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${totals.inactiveCount}</span>
                        <span class="stat-label">المتوقفين</span>
                    </div>
                </div>
            </div>
            
            ${Object.entries(sections).map(([sectionName, sectionData], index) => {
              if (sectionData.length === 0) return '';
              
              const sectionTotals = calculateSectionTotals(sectionData);
              const headerClass = ['detox-header', 'recovery-header', 'graduates-header', 'staff-header'][index];
              
              return `
                <div class="section">
                    <div class="section-header ${headerClass}">
                        قسم ${sectionName}
                    </div>
                    
                    <div class="section-stats">
                        <div class="section-stat">
                            <div class="section-stat-number">${sectionTotals.totalPacks}</div>
                            <div class="section-stat-label">علبة مطلوبة</div>
                        </div>
                        <div class="section-stat">
                            <div class="section-stat-number">${formatCurrency(sectionTotals.totalDaily)}</div>
                            <div class="section-stat-label">تكلفة يومية</div>
                        </div>
                        <div class="section-stat">
                            <div class="section-stat-number">${sectionTotals.activeCount}</div>
                            <div class="section-stat-label">نشط</div>
                        </div>
                        <div class="section-stat">
                            <div class="section-stat-number">${sectionTotals.inactiveCount}</div>
                            <div class="section-stat-label">متوقف</div>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>حالة السجائر</th>
                                <th>نوع السجائر</th>
                                <th>التكلفة اليومية</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sectionData.map(item => {
                              const cigaretteType = item.dailyCigaretteType || "none";
                              const cost = item.dailyCigaretteCost || calculateCigaretteCost(cigaretteType);
                              const statusText = cigaretteType === "none" ? "متوقف" : "نشط";
                              const statusClass = cigaretteType === "none" ? "status-inactive" : "status-active";
                              const cigaretteTypeText = getCigaretteTypeText(cigaretteType);
                              
                              return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td><span class="${statusClass}">${statusText}</span></td>
                                    <td>${cigaretteTypeText}</td>
                                    <td><strong>${formatCurrency(cost)}</strong></td>
                                </tr>
                              `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
              `;
            }).join('')}
            
            <div class="buttons">
                <button class="btn" onclick="window.print()">🖨️ طباعة التقرير الشامل</button>
                <button class="btn btn-success" onclick="downloadReport()">💾 تنزيل التقرير الشامل</button>
            </div>
            
            <div class="footer">
                <h3>ملخص نهائي</h3>
                <p>إجمالي التكلفة اليومية لجميع الأقسام: ${formatCurrency(totals.totalDaily)}</p>
                <p>إجمالي عدد الأشخاص النشطين: ${totals.activeCount}</p>
                <p>إجمالي العلب المطلوبة: ${totals.totalPacks}</p>
                <hr style="margin: 20px 0; border: 1px solid #34495e;">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المستشفى</p>
                <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
            </div>
        </div>
        
        <script>
            function downloadReport() {
                const filename = '${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html';
                
                const htmlContent = document.documentElement.outerHTML;
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                
                URL.revokeObjectURL(url);
            }
        </script>
    </body>
    </html>
    `;

    // فتح التقرير في نافذة جديدة
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  // وظائف التحكم في السجائر
  const handleToggleCigarette = (item: any, type: 'patient' | 'staff' | 'graduate') => {
    const currentType = item.dailyCigaretteType || "none";
    let newType = "none";
    
    // إذا كان متوقفاً، فعّل بنصف علبة
    // إذا كان نشطاً، أوقفه
    if (currentType === "none") {
      newType = "half_pack";
    } else {
      newType = "none";
    }
    
    console.log(`Toggling cigarette for ${item.name}: ${currentType} → ${newType}`);
    
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

  // وظيفة منفصلة لتعديل نوع السجائر
  const handleEditCigaretteType = (item: any, type: 'patient' | 'staff' | 'graduate') => {
    const currentType = item.dailyCigaretteType || "none";
    let newType = "none";
    
    // دورة تغيير نوع السجائر: none → half_pack → full_pack → none
    if (currentType === "none") {
      newType = "half_pack";
    } else if (currentType === "half_pack") {
      newType = "full_pack";
    } else {
      newType = "none";
    }
    
    console.log(`Editing cigarette type for ${item.name}: ${currentType} → ${newType}`);
    
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
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {totals.totalPacks} علبة مطلوبة ({totals.fullPacks} كاملة + {totals.halfPacks} نصف)
                  </p>
                  <p className="text-sm text-green-600">
                    ✓ {totals.activeCount} نشط
                  </p>
                  <p className="text-sm text-red-600">
                    ✗ {totals.inactiveCount} متوقف
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatCurrency(totals.totalDaily)} يومياً
                  </p>
                </div>
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
                      <th className="text-right p-3 font-semibold">حالة السجائر</th>
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
                        <tr key={item.id} className={`border-b hover:bg-gray-50 ${cigaretteType === "none" ? "bg-red-50" : "bg-green-50"}`}>
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
                              {cigaretteType === "none" ? (
                                <Badge variant="destructive" className="bg-red-100 text-red-800">
                                  ✗ متوقف
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ✓ نشط
                                </Badge>
                              )}
                            </div>
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
                            <div className="flex gap-1">
                              {/* زر تفعيل/إيقاف السجائر */}
                              <Button
                                variant={cigaretteType === "none" ? "default" : "destructive"}
                                size="sm"
                                onClick={() => handleToggleCigarette(item, itemType)}
                                disabled={updatePatientCigaretteMutation.isPending || updateStaffCigaretteMutation.isPending || updateGraduateCigaretteMutation.isPending}
                                className="p-1 h-7 w-7"
                                title={cigaretteType === "none" ? "تفعيل السجائر" : "إيقاف السجائر"}
                              >
                                {cigaretteType === "none" ? (
                                  <Cigarette className="w-3 h-3" />
                                ) : (
                                  <CigaretteOff className="w-3 h-3" />
                                )}
                              </Button>
                              
                              {/* زر تعديل نوع السجائر - يظهر فقط عندما تكون السجائر مفعلة */}
                              {cigaretteType !== "none" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCigaretteType(item, itemType)}
                                  disabled={updatePatientCigaretteMutation.isPending || updateStaffCigaretteMutation.isPending || updateGraduateCigaretteMutation.isPending}
                                  className="p-1 h-7 w-7"
                                  title="تغيير نوع السجائر"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
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
            onClick={handlePrintAll}
            variant="outline"
            className="flex items-center gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Printer className="w-4 h-4" />
            طباعة جميع الأقسام
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-2xl font-bold text-blue-600">{detoxTotals.totalPacks}</p>
              <p className="text-sm text-gray-600">علبة ديتوكس</p>
              <p className="text-xs text-gray-500">{detoxTotals.activeCount} نشط</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-2xl font-bold text-green-600">{recoveryTotals.totalPacks}</p>
              <p className="text-sm text-gray-600">علبة ريكفري</p>
              <p className="text-xs text-gray-500">{recoveryTotals.activeCount} نشط</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-2xl font-bold text-purple-600">{graduatesTotals.totalPacks}</p>
              <p className="text-sm text-gray-600">علبة خريجين</p>
              <p className="text-xs text-gray-500">{graduatesTotals.activeCount} نشط</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
              <p className="text-2xl font-bold text-orange-600">{staffTotals.totalPacks}</p>
              <p className="text-sm text-gray-600">علبة موظفين</p>
              <p className="text-xs text-gray-500">{staffTotals.activeCount} نشط</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-blue-800">إجمالي علب السجائر المطلوبة</h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">{grandTotalPacks}</p>
              <div className="text-sm text-blue-700">
                <p>{grandTotalFullPacks} علبة كاملة</p>
                <p>{grandTotalHalfPacks} نصف علبة</p>
              </div>
            </div>
            
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-green-800">الأشخاص النشطين</h3>
              <p className="text-4xl font-bold text-green-600 mb-2">{grandTotalCount}</p>
              <p className="text-sm text-green-700">يحصلون على سجائر</p>
            </div>
            
            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-purple-800">التكلفة اليومية</h3>
              <p className="text-4xl font-bold text-purple-600 mb-2">{formatCurrency(grandTotal)}</p>
              <p className="text-sm text-purple-700">إجمالي تكلفة السجائر</p>
            </div>
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
        items={activeGraduatesAll}
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