import type { StringOrNull } from "./core/primitives";

export interface Company {
  id: number;
  nazov: string;
  adresa?: StringOrNull;
  kontakt_meno?: StringOrNull;
  kontakt_email?: StringOrNull;
  kontakt_telefon?: StringOrNull;
  vytvorene_at?: string;
  zmenene_at?: string;
}

export type CompanyRegistration = {
  email: string;
  password?: string;
  nazov: string;
  kontaktna_osoba_meno: string;
  kontaktna_osoba_email: string;
  kontaktna_osoba_telefon: string;
  adresa?: StringOrNull;
};

export type CompanySearchResponse = Company[] | { results?: Company[] };

export type CompanyProfile = {
  id: number;
  nazov: string;
  ico: string;
  dic?: string | null;
  ic_dph?: string | null;
  adresa?: string | null;
  email: string;
  telefon?: string | null;
  web?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type RegisterCompanyFormState = {
  companyName: string;
  companyEmail: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};
