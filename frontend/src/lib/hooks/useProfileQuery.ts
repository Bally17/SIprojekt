// src/hook/useProfileQuery.ts
"use client";

import { ProfileUser } from "@shared-types/auth";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@lib/api";
import { getAccessToken } from "@lib/ApiProvider";

export function useProfileQuery() {
  return useQuery<ProfileUser | null>({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!getAccessToken(),
  });
}
