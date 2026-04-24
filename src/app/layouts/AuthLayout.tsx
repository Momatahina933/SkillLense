import { Outlet, Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { FileText } from "lucide-react";

export function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SkillLens</h1>
          <p className="text-gray-600 mt-2">
            AI-powered CV analysis and job matching
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
