// src/hook/useCompanyProfileQuery.ts
"use client";

import { CompanyProfile } from "@shared-types/company";
import { useQuery } from "@tanstack/react-query";
import { getCompanyProfile } from "src/api/company-api";

export function useCompanyProfileQuery() {
  return useQuery<CompanyProfile>({
    queryKey: ["company-profile"],
    queryFn: getCompanyProfile,
  });
}
