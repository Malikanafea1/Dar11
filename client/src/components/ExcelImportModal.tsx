import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (patients: any[]) => Promise<void>;
}

interface ImportedPatient {
  name: string;
  nationalId: string;
  admissionDate: string;
  dailyCost: string;
  roomNumber?: string;
  insurance?: string;
  notes?: string;
}

export default function ExcelImportModal({ isOpen, onClose, onImport }: ExcelImportModalProps) {
  const [importedData, setImportedData] = useState<ImportedPatient[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // تحويل البيانات إلى تنسيق المرضى
        const patients: ImportedPatient[] = jsonData.map((row: any, index: number) => {
          try {
            return {
              name: row['الاسم'] || row['Name'] || row['اسم المريض'] || '',
              nationalId: row['رقم الهوية'] || row['National ID'] || row['الرقم القومي'] || '',
              admissionDate: formatDate(row['تاريخ الدخول'] || row['Admission Date'] || row['تاريخ الإدخال']),
              dailyCost: String(row['التكلفة اليومية'] || row['Daily Cost'] || row['التكلفة'] || 0),
              roomNumber: row['رقم الغرفة'] || row['Room Number'] || row['الغرفة'] || '',
              insurance: row['التأمين'] || row['Insurance'] || row['نوع التأمين'] || '',
              notes: row['ملاحظات'] || row['Notes'] || row['التفاصيل'] || ''
            };
          } catch (error) {
            throw new Error(`خطأ في الصف ${index + 2}: ${error}`);
          }
        });

        // التحقق من صحة البيانات
        const validationErrors: string[] = [];
        patients.forEach((patient, index) => {
          if (!patient.name) {
            validationErrors.push(`الصف ${index + 2}: اسم المريض مطلوب`);
          }
          if (!patient.nationalId) {
            validationErrors.push(`الصف ${index + 2}: رقم الهوية مطلوب`);
          }
          if (!patient.admissionDate) {
            validationErrors.push(`الصف ${index + 2}: تاريخ الدخول مطلوب`);
          }
          if (!patient.dailyCost || isNaN(Number(patient.dailyCost))) {
            validationErrors.push(`الصف ${index + 2}: التكلفة اليومية يجب أن تكون رقماً صحيحاً`);
          }
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }

        setImportedData(patients);
        setErrors([]);
        toast({
          title: "تم تحليل الملف بنجاح",
          description: `تم العثور على ${patients.length} مريض في الملف`,
        });
      } catch (error) {
        setErrors([`خطأ في قراءة الملف: ${error}`]);
        toast({
          title: "خطأ في قراءة الملف",
          description: "تأكد من أن الملف بتنسيق Excel صحيح",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      // إذا كانت القيمة رقماً (Excel serial date)
      if (typeof dateValue === 'number') {
        const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
        return excelDate.toISOString().split('T')[0];
      }
      
      // إذا كانت القيمة نصاً
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      return '';
    } catch {
      return '';
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (importedData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // محاكاة التقدم أثناء الاستيراد
      for (let i = 0; i < importedData.length; i++) {
        await onImport([importedData[i]]);
        setImportProgress(((i + 1) / importedData.length) * 100);
        
        // تأخير صغير لإظهار التقدم
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "تم استيراد البيانات بنجاح",
        description: `تم إضافة ${importedData.length} مريض جديد`,
      });

      // إعادة تعيين البيانات وإغلاق النافذة
      setImportedData([]);
      setErrors([]);
      onClose();
    } catch (error) {
      toast({
        title: "خطأ في استيراد البيانات",
        description: "حدث خطأ أثناء إضافة المرضى",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setImportedData([]);
      setErrors([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>استيراد مرضى من ملف Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* منطقة رفع الملف */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">اسحب الملف هنا...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  اسحب ملف Excel هنا أو انقر للاختيار
                </p>
                <p className="text-sm text-gray-500">
                  يدعم ملفات .xlsx و .xls فقط
                </p>
              </div>
            )}
          </div>

          {/* نموذج البيانات المطلوبة */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>تنسيق الملف المطلوب:</strong>
              <br />
              الأعمدة المطلوبة: الاسم، رقم الهوية، تاريخ الدخول، التكلفة اليومية
              <br />
              الأعمدة الاختيارية: رقم الغرفة، التأمين، ملاحظات
            </AlertDescription>
          </Alert>

          {/* عرض الأخطاء */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>أخطاء في البيانات:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                  {errors.length > 5 && (
                    <li className="text-sm">...وأخطاء أخرى ({errors.length - 5})</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* معاينة البيانات المستوردة */}
          {importedData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                معاينة البيانات ({importedData.length} مريض)
              </h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-right">الاسم</th>
                      <th className="p-2 text-right">رقم الهوية</th>
                      <th className="p-2 text-right">تاريخ الدخول</th>
                      <th className="p-2 text-right">التكلفة اليومية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.slice(0, 5).map((patient, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{patient.name}</td>
                        <td className="p-2">{patient.nationalId}</td>
                        <td className="p-2">{patient.admissionDate}</td>
                        <td className="p-2">{patient.dailyCost} ج.م</td>
                      </tr>
                    ))}
                    {importedData.length > 5 && (
                      <tr className="border-t">
                        <td colSpan={4} className="p-2 text-center text-gray-500">
                          ...و{importedData.length - 5} مريض آخر
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* شريط التقدم */}
          {isImporting && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">جاري استيراد البيانات...</span>
                <span className="text-sm text-gray-500">{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleImport}
              disabled={importedData.length === 0 || isImporting || errors.length > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="ml-2 w-4 h-4" />
              {isImporting ? 'جاري الاستيراد...' : `استيراد ${importedData.length} مريض`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}