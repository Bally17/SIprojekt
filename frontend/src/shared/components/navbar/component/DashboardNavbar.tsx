"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import axiosClient, { clearAuthTokens } from "@lib/axiosClient";
import Icon from "@icons/index";
import { RoleType } from "@type/props/common/globalTypes";

type DashboardUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  meno?: string;
  priezvisko?: string;
  full_name?: string;
  rola?: RoleType;
  role?: RoleType;
  firma?: {
    nazov?: string | null;
  };
  musi_zmenit_heslo?: boolean;
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
  const mustChangePassword = Boolean(user?.musi_zmenit_heslo);

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
      return <Icon name="building-2" className="h-5 w-5 text-primary-800" aria-hidden />;
    }
    if (roleKey === "garant") {
      return <Icon name="shield-check" className="h-5 w-5 text-primary-800" aria-hidden />;
    }
    return <Icon name="graduation-cap" className="h-5 w-5 text-primary-800" aria-hidden />;
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
    <>
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                aria-label={msgs.common.language.switcher}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition hover:bg-primary-100"
              >
                <Icon name="globe" className="h-5 w-5" />
              </Button>
              {langMenuOpen ? (
                <div className="absolute right-0 mt-2 w-28 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  <Button
                    type="button"
                    variant="ghost"
                    className="block w-full px-3 py-2 text-left hover:bg-primary-50"
                    onClick={() => setLangMenuOpen(false)}
                  >
                    {msgs.common.language.sk}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="block w-full px-3 py-2 text-left hover:bg-primary-50"
                    onClick={() => setLangMenuOpen(false)}
                  >
                    {msgs.common.language.en}
                  </Button>
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={handleLogout}
              aria-label={msgs.auth.logout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <Icon name="log-out" className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {mustChangePassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary-100 p-3 text-primary-900">
                <Icon name="lock-keyhole" className="h-6 w-6" aria-hidden />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-ink-900">{msgs.auth.mustChangeTitle}</h2>
                <p className="text-sm text-ink-500">{msgs.auth.mustChangeDescription}</p>
                <p className="text-xs text-ink-400">{msgs.auth.mustChangeNote}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push("/auth/change-password")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-soft"
              >
                {msgs.auth.changePasswordNow}
                <Icon name="arrow-right" className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={loadProfile}
                disabled={loadingUser}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                <Icon
                  name="refresh-cw"
                  className={`h-4 w-4 ${loadingUser ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {msgs.auth.refreshStatus}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DashboardNavbar;
