export type StudentProfile = {
  id: number;
  meno: string;
  priezvisko: string;
  email: string;
  alternativny_email?: string | null;
  adresa?: string | null;
  telefon?: string | null;
  studijny_program?: string | null;
  [key: string]: unknown;
};
