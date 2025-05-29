import Header from "./Header";
import Sidebar from "./Sidebar";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function Layout({ children, user }: LayoutProps) {
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header user={user} onLogout={handleLogout} />
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
