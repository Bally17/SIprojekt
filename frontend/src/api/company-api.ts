// src/api/company-api.ts
import { api } from "@lib/ApiProvider";
import { CompanyRegistration, CompanyProfile } from "@shared-types/company";
import { ENDPOINTS } from "src/constants/Endpoints";

/* ----------------------------------------
 * API FUNCTIONS
 * ---------------------------------------- */

export async function registerCompany(payload: CompanyRegistration) {
  return api.post(ENDPOINTS.REGISTER_COMPANY, payload);
}

//do buducna
export async function getCompanyProfile() {
  return api.get<CompanyProfile>("/companies/me/");
}

export async function updateCompanyProfile(payload: Partial<CompanyProfile>) {
  return api.patch<CompanyProfile>("/companies/me/", payload);
}

export async function getCompanyById(id: number) {
  return api.get<CompanyProfile>(`/companies/${id}/`);
}
