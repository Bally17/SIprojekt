"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axiosClient, { clearAuthTokens } from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";
import { LogOut, GraduationCap, Building2, ShieldCheck, Globe } from "lucide-react";

type DashboardRole = "student" | "firma" | "garant" | string;

type DashboardUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  meno?: string;
  priezvisko?: string;
  full_name?: string;
  rola?: DashboardRole;
  role?: DashboardRole;
  firma?: {
    nazov?: string | null;
  };
};

// Pomocník pre localStorage, aby mal klient hneď dostupné dáta
const getStoredUser = (): DashboardUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as DashboardUser) : null;
  } catch {
    return null;
  }
};

const storeUser = (user: DashboardUser) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
};

const DashboardNavbar = () => {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const router = useRouter();
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const roleKey = (user?.rola || user?.role || "student").toLowerCase();

  // Firma -> názov spoločnosti, inak zlož meno + priezvisko
  const displayName = useMemo(() => {
    if (!user) return msgs.auth.loginRegister;
    if (roleKey === "firma") {
      return user.firma?.nazov || user.full_name || user.email;
    }
    const composed = [user.first_name, user.last_name, user.meno, user.priezvisko]
      .filter(Boolean)
      .join(" ");
    return composed || user.full_name || user.email;
  }, [user, roleKey, msgs.auth.loginRegister]);

  // Podľa role meníme ikonu, aby bolo hneď jasné kto je prihlásený
  const roleIcon = useMemo(() => {
    if (roleKey === "firma") {
      return <Building2 className="h-5 w-5 text-primary-800" aria-hidden />;
    }
    if (roleKey === "garant") {
      return <ShieldCheck className="h-5 w-5 text-primary-800" aria-hidden />;
    }
    return <GraduationCap className="h-5 w-5 text-primary-800" aria-hidden />;
  }, [roleKey]);

  const roleLabel = useMemo(() => {
    if (!user) return null;
    if (roleKey === "firma") return msgs.common.entities.company;
    if (roleKey === "garant") return msgs.common.entities.guarant;
    return msgs.common.entities.student;
  }, [
    msgs.common.entities.company,
    msgs.common.entities.guarant,
    msgs.common.entities.student,
    roleKey,
    user,
  ]);

  // Po mount-e načítaj profil, prípadne použi cache z localStorage
  const loadProfile = useCallback(async () => {
    setLoadingUser(true);
    try {
      const res = await axiosClient.get("/auth/profile/");
      const profile = res.data?.user as DashboardUser | undefined;
      if (profile) {
        setUser(profile);
        storeUser(profile);
      }
    } catch (err: any) {
      notifyWarning({
        title: msgs.common.error.errorAction,
        description: err?.response?.data?.detail || msgs.common.error.errorAction,
      });
    } finally {
      setLoadingUser(false);
    }
  }, [msgs.common.error.errorAction, notifyWarning]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setLoadingUser(false);
      return;
    }
    loadProfile();
  }, [loadProfile]);

  // Logout vyčistí tokeny, zavolá backend a presmeruje na login
  const handleLogout = useCallback(async () => {
    try {
      const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
      if (refresh) {
        await axiosClient.post("/auth/logout/", { refresh_token: refresh });
      }
      notifySuccess({
        title: msgs.auth.logout,
        description: msgs.auth.successLogin,
      });
    } catch (err: any) {
      notifyWarning({
        title: msgs.auth.logout,
        description: err?.response?.data?.detail || msgs.common.error.errorAction,
      });
    } finally {
      clearAuthTokens();
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      router.push("/auth/login");
    }
  }, [
    msgs.auth.logout,
    msgs.auth.successLogin,
    msgs.common.error.errorAction,
    notifySuccess,
    notifyWarning,
    router,
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3">
        <div className="flex flex-1 items-center gap-3 text-2xl font-bold text-primary-900">
          <div className="rounded-md bg-primary-900 px-2 py-1 text-white">
            {msgs.common.brand.logoLetter}
          </div>
          <div className="text-primary-800 flex items-baseline gap-2">
            <span>{msgs.common.brand.logoText}</span>
            {roleLabel ? (
              <span className="text-base font-semibold text-primary-600">{roleLabel}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3 text-base font-medium text-ink-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            {roleIcon}
          </div>
          <p className="text-sm font-semibold text-ink-900">
            {loadingUser ? msgs.common.loading.loading : displayName}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              aria-label={msgs.common.language.switcher}
            >
              <Globe className="h-5 w-5" />
            </button>
            {langMenuOpen ? (
              <div className="absolute right-0 mt-2 w-28 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-primary-50"
                  onClick={() => setLangMenuOpen(false)}
                >
                  {msgs.common.language.sk}
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-primary-50"
                  onClick={() => setLangMenuOpen(false)}
                >
                  {msgs.common.language.en}
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={msgs.auth.logout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
