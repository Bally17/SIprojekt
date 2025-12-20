import { api } from "@lib/ApiProvider";
import { CompanySearchResponse } from "@shared-types/company";
import { StudentInternshipsResponse, CreateInternshipPayload } from "@shared-types/internship";
import { ENDPOINTS } from "src/constants/Endpoints";

export function getStudentInternships() {
  return api.get<StudentInternshipsResponse>(ENDPOINTS.INTERNSHIPS_STUDENT);
}

export function createInternship(payload: CreateInternshipPayload) {
  return api.post(ENDPOINTS.INTERNSHIPS_CREATE, payload);
}
