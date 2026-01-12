// src/hook/useProfileQuery.ts
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@lib/api";
import { getAccessToken } from "@lib/ApiProvider";
import { ProfileUser } from "@shared-types/auth";

export function useProfileQuery() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const accessToken = hasMounted ? getAccessToken() : null;

  return useQuery<ProfileUser | null>({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!accessToken,
  });
}
