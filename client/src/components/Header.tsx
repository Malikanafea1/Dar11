import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Home, Users, UserCheck, DollarSign, FileText, Settings, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import PatientModal from "./PatientModal";

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [location] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { path: "/", label: "الرئيسية", icon: Home },
    { path: "/patients", label: "المرضى", icon: Users },
    { path: "/staff", label: "الموظفين", icon: UserCheck },
    { path: "/finance", label: "المالية", icon: DollarSign },
    { path: "/reports", label: "التقارير", icon: FileText },
    { path: "/settings", label: "الإعدادات", icon: Settings },
  ];

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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">مركز دار الحياة</h1>
                <p className="text-sm text-gray-600 hidden sm:block">نظام إدارة المركز</p>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-2 mr-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={`flex items-center gap-2 ${
                          isActive 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden xl:inline">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quick Actions */}
              <Button 
                onClick={() => setIsPatientModalOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 sm:ml-2" />
                <span className="hidden sm:inline">مريض جديد</span>
              </Button>
              
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Current Date & Time */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{formatDate(currentTime)}</p>
                <p className="text-xs text-gray-500">{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full flex items-center gap-2 justify-start ${
                          isActive 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
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
