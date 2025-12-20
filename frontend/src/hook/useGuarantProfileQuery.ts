// src/hook/useGuarantProfileQuery.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuarantProfile, GuarantProfile } from "src/api/guarant-api";

export function useGuarantProfileQuery() {
  return useQuery<GuarantProfile>({
    queryKey: ["guarant-profile"],
    queryFn: getGuarantProfile,
  });
}
