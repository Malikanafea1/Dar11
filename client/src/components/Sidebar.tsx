import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Hospital, 
  LayoutDashboard, 
  UserRound, 
  Users, 
  Banknote, 
  BarChart3, 
  Settings,
  User
} from "lucide-react";

interface UserType {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface SidebarProps {
  user: UserType;
}

export default function Sidebar({ user }: SidebarProps) {
  const navigation = [
    { name: "لوحة التحكم", href: "/", icon: LayoutDashboard },
    { name: "إدارة المرضى", href: "/patients", icon: UserRound },
    { name: "إدارة الموظفين", href: "/staff", icon: Users },
    { name: "الإدارة المالية", href: "/finance", icon: Banknote },
    { name: "التقارير", href: "/reports", icon: BarChart3 },
    ...(user.role === "admin" ? [{ name: "إدارة المستخدمين", href: "/users", icon: User }] : []),
    { name: "الإعدادات", href: "/settings", icon: Settings },
  ];
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-l border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <div className="bg-blue-600 p-3 rounded-xl ml-3">
            <Hospital className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">المستشفى الذكي</h2>
            <p className="text-sm text-gray-500">نظام الإدارة المتكامل</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <div
              key={item.name}
              className={cn(
                "rounded-lg transition-colors",
                isActive 
                  ? "bg-blue-50 border-r-4 border-blue-600" 
                  : "hover:bg-gray-50"
              )}
            >
              <Link href={item.href}>
                <a className={cn(
                  "flex items-center p-3 font-medium",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-700 hover:text-blue-600"
                )}>
                  <Icon className="ml-3 w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center p-3 rounded-lg bg-gray-50">
          <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center ml-3">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{user.fullName}</p>
            <p className="text-sm text-gray-500">
              {user.role === "admin" ? "مدير النظام" : 
               user.role === "doctor" ? "طبيب" : 
               user.role === "nurse" ? "ممرض" : 
               user.role === "receptionist" ? "موظف استقبال" : 
               user.role === "accountant" ? "محاسب" : user.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
