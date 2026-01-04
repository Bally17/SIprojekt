// src/lib/AuthProvider.tsx
"use client";

import { createContext, useContext, useMemo, type ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthTokens, getRefreshToken, setAuthTokens } from "./ApiProvider";
import { Nillable, Nullable, RoleType } from "@shared-types/index";
import { useLoginMutation, useLogoutMutation, useProfileQuery } from "./hooks";

type AuthUser = {
  rola?: Nullable<RoleType>;
  [key: string]: unknown;
};

type LoginParams = {
  role: RoleType;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: Nullable<AuthUser>;
  isLoading: boolean;
  isFetchingProfile: boolean;
  isAuthenticated: boolean;

  loginLoading: boolean;

  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  refetchProfile: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapRoleToDashboardPath(rawRole: RoleType): string {
  const role = rawRole?.toString().toLowerCase();

  if (role === "firma" || role === "company") {
    return "/dashboard/company";
  }

  if (role === "garant") {
    return "/dashboard/garant";
  }

  return "/dashboard/student";
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // PROFIL
  const { data: user, isLoading, isFetching, refetch } = useProfileQuery();

  // LOGIN + LOGOUT HOOKY
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const loginLoading = loginMutation.isPending;

  // LOGIN FUNKCIA – redirect podľa roly
  const login = useCallback(
    async (params: LoginParams) => {
      const res = await loginMutation.mutateAsync({
        role: params.role as any,
        email: params.email,
        password: params.password,
      });

      const access = res.access_token ?? res.tokens?.access;
      const refresh = res.refresh_token ?? res.tokens?.refresh;

      if (access) {
        setAuthTokens({ access, refresh });
      }

      // voliteľné: cache profilu po logine
      if (res.user) {
        queryClient.setQueryData(["profile"], res.user);
      }

      // pre istotu natiahnuť profil z /auth/profile/
      const profileResult = await refetch();
      const effectiveUser: Nullable<AuthUser> =
        (profileResult.data as Nillable<AuthUser>) ?? (res.user as Nillable<AuthUser>) ?? null;

      const roleFromUser = effectiveUser?.rola ?? params.role;
      const redirectTarget = mapRoleToDashboardPath(roleFromUser);

      router.push(redirectTarget);
    },
    [loginMutation, queryClient, refetch, router],
  );

  // LOGOUT FUNKCIA
  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logoutMutation.mutateAsync(refreshToken);
      }
    } catch {
      // ak sa serverový logout nepodarí, lokálne sa aj tak odhlásime
    } finally {
      clearAuthTokens();
      queryClient.removeQueries({ queryKey: ["profile"] });
      router.push("/auth/login");
    }
  }, [logoutMutation, queryClient, router]);

  const isFetchingProfile = isLoading || isFetching;
  const isAuthenticated = !!user && !isLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: (user as AuthUser) ?? null,
      isLoading,
      isFetchingProfile,
      isAuthenticated,

      loginLoading,

      login,
      logout,
      refetchProfile: () => {
        void refetch();
      },
    }),
    [user, isLoading, isFetchingProfile, isAuthenticated, login, logout, refetch, loginLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
