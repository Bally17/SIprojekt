// src/hook/useProfileQuery.ts
"use client";

import { ProfileUser } from "@shared-types/auth";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "src/api/auth-api";

export function useProfileQuery() {
  return useQuery<ProfileUser | null>({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}
