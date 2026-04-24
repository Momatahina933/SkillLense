import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UploadCVPage } from "./pages/UploadCVPage";
import { JobDescriptionPage } from "./pages/JobDescriptionPage";
import { MatchResultPage } from "./pages/MatchResultPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "auth",
        Component: AuthLayout,
        children: [
          {
            path: "login",
            Component: LoginPage,
          },
          {
            path: "register",
            Component: RegisterPage,
          },
        ],
      },
      {
        path: "app",
        Component: DashboardLayout,
        children: [
          {
            path: "dashboard",
            Component: DashboardPage,
          },
          {
            path: "upload",
            Component: UploadCVPage,
          },
          {
            path: "job",
            Component: JobDescriptionPage,
          },
          {
            path: "result/:matchId",
            Component: MatchResultPage,
          },
          {
            path: "history",
            Component: HistoryPage,
          },
          {
            path: "profile",
            Component: ProfilePage,
          },
        ],
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);