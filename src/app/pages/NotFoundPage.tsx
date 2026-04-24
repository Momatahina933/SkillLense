import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <FileQuestion className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/app/dashboard">
          <Button size="lg">
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
