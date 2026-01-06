import type { StringOrNull } from "./core/primitives";

export type StudentProfile = {
  id: number;
  meno: string;
  priezvisko: string;
  email: string;
  alternativny_email?: StringOrNull;
  adresa?: StringOrNull;
  telefon?: StringOrNull;
  studijny_program?: StringOrNull;
  [key: string]: unknown;
};

export type RegisterStudentPayload = {
  meno: string;
  priezvisko: string;
  adresa: string;
  email: string;
  alternativny_email?: string;
  telefon: string;
  studijny_program: string;
};

export type StudentSearchResponse = StudentProfile[] | { results?: StudentProfile[] };

export type RegisterStudentFormState = {
  firstName: string;
  lastName: string;
  address: string;
  studentEmail: string;
  altEmail: string;
  phone: string;
  studyField: string;
};
