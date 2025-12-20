// src/hook/useRegisterCompanyMutation.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { CompanyRegistration } from "@type/backend/CompanyRegistration";
import { registerCompany } from "src/api/company-api";

export function useRegisterCompanyMutation() {
  return useMutation({
    mutationFn: (payload: CompanyRegistration) => registerCompany(payload),
  });
}
