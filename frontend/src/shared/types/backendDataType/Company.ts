export interface Company {
  id: number;
  nazov: string;
  adresa?: string | null;
  kontakt_meno?: string | null;
  kontakt_email?: string | null;
  kontakt_telefon?: string | null;
  vytvorene_at?: string;
  zmenene_at?: string;
}
