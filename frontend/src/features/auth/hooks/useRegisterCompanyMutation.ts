// src/hook/useRegisterCompanyMutation.ts
"use client";

import { CompanyRegistration } from "@shared-types/company";
import { useMutation } from "@tanstack/react-query";
import { registerCompany } from "../api";

export function useRegisterCompanyMutation() {
  return useMutation({
    mutationFn: (payload: CompanyRegistration) => registerCompany(payload),
  });
}
