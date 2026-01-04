// src/api/register-api.ts
import { api } from "@lib/ApiProvider";
import { RegisterStudentPayload } from "@shared-types/student";
import { CompanyRegistration } from "@shared-types/company";
import { ENDPOINTS } from "@constants";

export async function registerStudent(payload: RegisterStudentPayload) {
  return api.post(ENDPOINTS.REGISTER_STUDENT, payload);
}

export async function registerCompany(payload: CompanyRegistration) {
  return api.post(ENDPOINTS.REGISTER_COMPANY, payload);
}
