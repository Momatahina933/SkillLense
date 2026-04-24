import { Outlet, Navigate, Link, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { 
  LayoutDashboard, 
  Upload, 
  Briefcase, 
  History, 
  User, 
  LogOut,
  FileText,
  Menu,
  X,
  Home
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";

export function DashboardLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const navItems = [
    { path: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/app/upload", icon: Upload, label: "Upload CV" },
    { path: "/app/job", icon: Briefcase, label: "Job Description" },
    { path: "/app/history", icon: History, label: "History" },
    { path: "/app/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-gray-900">SkillLens</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 z-30
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">SkillLens</h2>
              <p className="text-xs text-gray-500">CV Analysis Platform</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 mb-3 border-b border-gray-200 pb-3"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}