export interface CompanyRegistration {
  email: string;
  password?: string;
  nazov: string;
  kontaktna_osoba_meno: string;
  kontaktna_osoba_email: string;
  kontaktna_osoba_telefon: string;
  adresa?: string | null;
}
