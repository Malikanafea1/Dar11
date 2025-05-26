import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import PatientModal from "./PatientModal";

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
            <p className="text-gray-600">مرحباً بك في نظام إدارة المستشفى</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <Button 
              onClick={() => setIsPatientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="ml-2 w-4 h-4" />
              مريض جديد
            </Button>
            
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>

            {/* Current Date & Time */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{formatDate(currentTime)}</p>
              <p className="text-xs text-gray-500">{formatTime(currentTime)}</p>
            </div>
          </div>
        </div>
      </header>

      <PatientModal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
      />
    </>
  );
}
