// src/api/company-api.ts
import { api } from "@lib/ApiProvider";
import type { CompanyRegistration } from "@type/backend/CompanyRegistration";

/* ----------------------------------------
 * TYPES
 * ---------------------------------------- */

export type CompanyProfile = {
  id: number;
  nazov: string;
  ico: string;
  dic?: string | null;
  ic_dph?: string | null;
  adresa?: string | null;
  email: string;
  telefon?: string | null;
  web?: string | null;

  // pre dashboard
  status?: string | null;
  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
};

/* ----------------------------------------
 * API FUNCTIONS
 * ---------------------------------------- */

export async function registerCompany(payload: CompanyRegistration) {
  return api.post("/auth/register/company/", payload);
}

export async function getCompanyProfile() {
  return api.get<CompanyProfile>("/companies/me/");
}

export async function updateCompanyProfile(payload: Partial<CompanyProfile>) {
  return api.patch<CompanyProfile>("/companies/me/", payload);
}

export async function getCompanyById(id: number) {
  return api.get<CompanyProfile>(`/companies/${id}/`);
}
