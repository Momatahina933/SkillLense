import { Outlet } from "react-router";
import { AuthProvider } from "../contexts/AuthContext";
import { DataProvider } from "../contexts/DataContext";
import { Toaster } from "../components/ui/sonner";

export function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Outlet />
        </div>
        <Toaster />
      </DataProvider>
    </AuthProvider>
  );
}
