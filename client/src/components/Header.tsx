import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Home, Users, UserCheck, DollarSign, FileText, Settings, Menu, LogOut, User, Receipt, Calculator, Shield, Cigarette } from "lucide-react";
import { Link, useLocation } from "wouter";
import PatientModal from "./PatientModal";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [location] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { path: "/", label: "الرئيسية", icon: Home },
    { path: "/patients", label: "المرضى", icon: Users },
    { path: "/staff", label: "الموظفين", icon: UserCheck },
    { path: "/cigarettes", label: "السجائر اليومية", icon: Cigarette },
    { path: "/finance", label: "المالية", icon: DollarSign },
    { path: "/collections", label: "التحصيلات", icon: Receipt },
    { path: "/payroll", label: "الرواتب", icon: Calculator },
    { path: "/reports", label: "التقارير", icon: FileText },
    { path: "/settings", label: "الإعدادات", icon: Settings },
    ...(user.role === "admin" ? [{ path: "/admin", label: "لوحة المدير", icon: Shield }] : []),
  ];

  const getRoleLabel = (role: string) => {
    const roleMap = {
      admin: "مدير النظام",
      doctor: "طبيب", 
      nurse: "ممرض",
      receptionist: "موظف استقبال",
      accountant: "محاسب",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

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
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Home className="text-white w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">مركز دار الحياة</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">نظام إدارة المركز</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 lg:gap-2 mr-4 lg:mr-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 ${
                          isActive 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden lg:inline text-sm">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Quick Actions */}
              <Button 
                onClick={() => setIsPatientModalOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">مريض جديد</span>
              </Button>
              
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 p-2">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>



              {/* Current Date & Time */}
              <div className="text-right hidden xl:block px-2">
                <p className="text-sm font-medium text-gray-800">{formatDate(currentTime)}</p>
                <p className="text-xs text-gray-500">{formatTime(currentTime)}</p>
              </div>

              {/* Logout Button */}
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50 px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">خروج</span>
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="md:hidden mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full flex items-center gap-2 justify-start py-3 ${
                          isActive 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
              

              
              {/* Mobile Date & Time */}
              <div className="xl:hidden text-center mt-3 p-2 bg-white rounded-lg border">
                <p className="text-sm font-medium text-gray-800">{formatDate(currentTime)}</p>
                <p className="text-xs text-gray-500">{formatTime(currentTime)}</p>
              </div>
            </nav>
          )}
        </div>
      </header>

      <PatientModal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
      />
    </>
  );
}
