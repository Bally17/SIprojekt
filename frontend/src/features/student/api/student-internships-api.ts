import { ENDPOINTS } from "@constants";
import { api } from "@lib/ApiProvider";
import { StudentInternshipsResponse, CreateInternshipPayload } from "@shared-types/internship";

export function getStudentInternships() {
  return api.get<StudentInternshipsResponse>(ENDPOINTS.INTERNSHIPS_STUDENT);
}

export function createInternship(payload: CreateInternshipPayload) {
  return api.post(ENDPOINTS.INTERNSHIPS_CREATE, payload);
}
