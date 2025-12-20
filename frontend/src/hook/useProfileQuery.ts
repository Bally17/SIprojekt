// src/hook/useProfileQuery.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfile, type ProfileUser } from "src/api/auth-api";

export function useProfileQuery() {
  return useQuery<ProfileUser | null>({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}
