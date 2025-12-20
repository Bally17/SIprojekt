// src/hook/useCompanyProfileQuery.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCompanyProfile, CompanyProfile } from "src/api/company-api";

export function useCompanyProfileQuery() {
  return useQuery<CompanyProfile>({
    queryKey: ["company-profile"],
    queryFn: getCompanyProfile,
  });
}
