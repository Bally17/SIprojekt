export interface StudentRegistration {
  email: string;
  password?: string;
  password_confirm?: string;
  meno?: string | null;
  priezvisko?: string | null;
  telefon?: string | null;
  adresa?: string | null;
  studijny_program: string;
  alternativny_email?: string | null;
}
