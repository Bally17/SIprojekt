"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { useAuth } from "@lib/AuthProvider";
import { useLogoutMutation } from "src/hook/useLogoutMutation";
import Image from "next/image";
import { getErrorMessage } from "@utils/errorActions";

const DashboardNavbar = () => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const router = useRouter();
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const { user, isLoading, isFetchingProfile, isAuthenticated, logout, refetchProfile } = useAuth();

  const roleKey = user?.rola || user?.role || "student";
  const mustChangePassword = Boolean(user?.musi_zmenit_heslo);

  // NEW — react-query logout
  const logoutMutation = useLogoutMutation();

  const handleLogout = useCallback(async () => {
    const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

    try {
      await logoutMutation.mutateAsync(refresh);

      if (typeof window !== "undefined") {
        localStorage.removeItem("refresh_token");
      }

      notifySuccess({
        title: msgs.auth.logout,
        description: msgs.auth.successLogout,
      });

      logout();
    } catch (err: any) {
      const msg = getErrorMessage(err, msgs.common.error.errorAction);

      notifyWarning({
        title: msgs.auth.logout,
        description: msg,
      });

      logout();
    }
  }, [logoutMutation, logout, msgs, notifySuccess, notifyWarning]);

  const handleRefreshProfile = useCallback(() => {
    refetchProfile();
  }, [refetchProfile]);

  const displayName = useMemo(() => {
    if (!user) return msgs.auth.loginRegister;

    if (roleKey === "firma") {
      return user.full_name || user.email;
    }

    const composed = [user.first_name, user.last_name, user.meno, user.priezvisko]
      .filter(Boolean)
      .join(" ");

    return composed || user.full_name || user.email;
  }, [user, roleKey, msgs.auth.loginRegister]);

  const roleIcon = useMemo(() => {
    switch (roleKey) {
      case "firma":
        return <Icon name="building-2" className="h-5 w-5 text-primary-800" aria-hidden />;
      case "garant":
        return <Icon name="shield-check" className="h-5 w-5 text-primary-800" aria-hidden />;
      default:
        return <Icon name="graduation-cap" className="h-5 w-5 text-primary-800" aria-hidden />;
    }
  }, [roleKey]);

  const roleLabel = useMemo(() => {
    if (!user) return null;

    if (roleKey === "firma") return msgs.common.entities.company;
    if (roleKey === "garant") return msgs.common.entities.guarant;

    return msgs.common.entities.student;
  }, [user, roleKey, msgs]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3">
          {/* LOGO + ROLE */}
          <div className="flex flex-1 items-center gap-3">
            <Image
              src="/images/logo_fpvai.png"
              alt={msgs.common.brand.logoText}
              width={180}
              height={48}
              className="h-10 w-auto"
              priority
            />
            {roleLabel ? (
              <span className="text-base font-semibold text-primary-600">{roleLabel}</span>
            ) : null}
          </div>

          {/* USER INFO */}
          <div className="flex flex-1 items-center justify-center gap-3 text-base font-medium text-ink-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              {roleIcon}
            </div>
            <p className="text-sm font-semibold text-ink-900">
              {isLoading ? msgs.common.loading.loading : displayName}
            </p>
          </div>

          {/* LANGUAGE + LOGOUT */}
          <div className="flex flex-1 items-center justify-end gap-3">
            {/* LANGUAGE SWITCHER */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                aria-label={msgs.common.language.switcher}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100"
              >
                <Icon name="globe" className="h-5 w-5" />
              </Button>

              {langMenuOpen && (
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
              )}
            </div>

            {/* LOGOUT */}
            {isAuthenticated && (
              <Button
                type="button"
                variant="danger"
                disabled={logoutMutation.isPending}
                onClick={handleLogout}
                aria-label={msgs.auth.logout}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
              >
                <Icon
                  name={logoutMutation.isPending ? "refresh-cw" : "log-out"}
                  className={`h-5 w-5 ${logoutMutation.isPending ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* PASSWORD CHANGE REQUIRED */}
      {mustChangePassword && (
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
                <Icon name="arrow-right" className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleRefreshProfile}
                disabled={isFetchingProfile}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                <Icon
                  name="refresh-cw"
                  className={`h-4 w-4 ${isFetchingProfile ? "animate-spin" : ""}`}
                />
                {msgs.auth.refreshStatus}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardNavbar;
