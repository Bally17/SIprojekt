"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthTokens } from "@lib/api-client";
import type { ProfileUser } from "@lib/api";
import { useProfileQuery } from "@hook/useProfileQuery";

type AuthContextValue = {
  user: ProfileUser | null;
  isLoading: boolean;
  isFetchingProfile: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refetchProfile: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Readonly<Props>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isFetching, refetch } = useProfileQuery();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      isFetchingProfile: isFetching,
      isAuthenticated: !!user,
      logout: () => {
        clearAuthTokens();
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
        // profile cache sa vyčistí, aby UI neukazovalo staré dáta
        queryClient.setQueryData(["profile"], null);
        queryClient.removeQueries({ queryKey: ["profile"] });
        router.push("/auth/login");
      },
      refetchProfile: () => {
        refetch();
      },
    }),
    [user, isLoading, isFetching, queryClient, router, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
