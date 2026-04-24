import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, tokenStore, type User as ApiUser } from "../api";

export interface Profile {
  educationSummary: string;
  experienceSummary: string;
  targetRole: string;
  careerGoal: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function mapApiUser(apiUser: ApiUser): User {
  return { id: apiUser.userId, name: apiUser.name, email: apiUser.email, createdAt: apiUser.createdAt };
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// ── Mock helpers ──────────────────────────────────────────────────────────────
function mockLogin(email: string, password: string): User {
  const users: any[] = JSON.parse(localStorage.getItem("sl_users") || "[]");
  const found = users.find((u: any) => u.email === email && u.password === password);
  if (!found) throw new Error("Invalid email or password");
  const { password: _, ...u } = found;
  return u;
}

function mockRegister(name: string, email: string, password: string): User {
  const users: any[] = JSON.parse(localStorage.getItem("sl_users") || "[]");
  if (users.some((u: any) => u.email === email)) throw new Error("Email already registered");
  const newUser = { id: `user_${Date.now()}`, name, email, password, createdAt: new Date().toISOString() };
  users.push(newUser);
  localStorage.setItem("sl_users", JSON.stringify(users));
  const { password: _, ...u } = newUser;
  return u;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Profile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      const stored = localStorage.getItem("sl_session");
      if (stored) {
        setUser(JSON.parse(stored));
        const p = localStorage.getItem("sl_profile");
        if (p) setProfile(JSON.parse(p));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (USE_MOCK) {
      const u = mockLogin(email, password);
      setUser(u);
      localStorage.setItem("sl_session", JSON.stringify(u));
      const p = localStorage.getItem(`sl_profile_${u.id}`);
      if (p) { setProfile(JSON.parse(p)); localStorage.setItem("sl_profile", p); }
      return;
    }
    const data = await apiClient.auth.login(email, password);
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    setUser(mapApiUser(data.user));
    try {
      const apiProfile = await apiClient.profile.get();
      setProfile({ educationSummary: apiProfile.educationSummary, experienceSummary: apiProfile.experienceSummary, targetRole: apiProfile.targetRole, careerGoal: apiProfile.careerGoal });
    } catch { setProfile(null); }
  };

  const register = async (name: string, email: string, password: string) => {
    if (USE_MOCK) {
      const u = mockRegister(name, email, password);
      setUser(u);
      localStorage.setItem("sl_session", JSON.stringify(u));
      setProfile(null);
      return;
    }
    const data = await apiClient.auth.register(name, email, password);
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    setUser(mapApiUser(data.user));
    setProfile(null);
  };

  const logout = async () => {
    if (USE_MOCK) {
      localStorage.removeItem("sl_session");
      localStorage.removeItem("sl_profile");
    } else {
      try { await apiClient.auth.logout(); } catch { /* ignore */ }
      tokenStore.clearTokens();
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (newProfile: Profile) => {
    if (USE_MOCK) {
      setProfile(newProfile);
      if (user) {
        localStorage.setItem(`sl_profile_${user.id}`, JSON.stringify(newProfile));
        localStorage.setItem("sl_profile", JSON.stringify(newProfile));
      }
      return;
    }
    await apiClient.profile.update(newProfile);
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAuthenticated: !!user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
