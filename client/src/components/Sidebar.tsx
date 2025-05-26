import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Hospital, 
  LayoutDashboard, 
  UserRound, 
  Users, 
  Banknote, 
  BarChart3, 
  Settings 
} from "lucide-react";

const navigation = [
  { name: "لوحة التحكم", href: "/", icon: LayoutDashboard },
  { name: "إدارة المرضى", href: "/patients", icon: UserRound },
  { name: "إدارة الموظفين", href: "/staff", icon: Users },
  { name: "الإدارة المالية", href: "/finance", icon: Banknote },
  { name: "التقارير", href: "/reports", icon: BarChart3 },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

export default function Sidebar() {
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
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-800">د. أحمد محمد</p>
            <p className="text-sm text-gray-500">مدير النظام</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
