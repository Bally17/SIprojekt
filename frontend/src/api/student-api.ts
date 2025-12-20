// src/api/student-api.ts
import { api } from "@lib/ApiProvider";
import type { StudentProfile } from "@type/backend/StudentProfile";

/* ----------------------------------------
 * TYPES
 * ---------------------------------------- */

export type RegisterStudentPayload = {
  meno: string;
  priezvisko: string;
  adresa: string;
  email: string;
  alternativny_email?: string;
  telefon: string;
  studijny_program: string;
};

/* ----------------------------------------
 * API CALLS
 * ---------------------------------------- */

export async function registerStudent(payload: RegisterStudentPayload) {
  return api.post("/auth/register/student/", payload);
}

export async function getStudentProfile() {
  return api.get<StudentProfile>("/students/me/");
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  return api.patch<StudentProfile>("/students/me/", payload);
}

export async function getStudentById(id: number) {
  return api.get<StudentProfile>(`/students/${id}/`);
}

export type StudentSearchResponse = StudentProfile[] | { results?: StudentProfile[] };

export function searchStudents(q: string) {
  return api.get<StudentSearchResponse>(`/users/students/search/?q=${encodeURIComponent(q)}`);
}
