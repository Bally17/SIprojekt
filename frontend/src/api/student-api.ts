// src/api/student-api.ts
import { api } from "@lib/ApiProvider";
import { RegisterStudentPayload, StudentProfile } from "@shared-types/student";
import { ENDPOINTS } from "src/constants/Endpoints";

export async function registerStudent(payload: RegisterStudentPayload) {
  return api.post(ENDPOINTS.REGISTER_STUDENT, payload);
}

//do buducna
export async function getStudentProfile() {
  return api.get<StudentProfile>("/students/me/");
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  return api.patch<StudentProfile>("/students/me/", payload);
}

export async function getStudentById(id: number) {
  return api.get<StudentProfile>(`/students/${id}/`);
}
