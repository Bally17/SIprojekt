// src/api/guarant-api.ts
import { api } from "@lib/ApiProvider";

/* ----------------------------------------
 * TYPES
 * ---------------------------------------- */

export type RegisterGuarantPayload = {
  meno: string;
  priezvisko: string;
  email: string;
  telefon?: string;
  fakulta?: string;
  katedra?: string;
};

export type GuarantProfile = {
  id: number;
  meno: string;
  priezvisko: string;
  email: string;
  telefon?: string | null;
  fakulta?: string | null;
  katedra?: string | null;

  full_name?: string;
  rola?: "garant";

  [key: string]: unknown;
};

/* ----------------------------------------
 * API FUNCTIONS
 * ---------------------------------------- */

export async function registerGuarant(payload: RegisterGuarantPayload) {
  return api.post("/auth/register/garant/", payload);
}

export async function getGuarantProfile() {
  return api.get<GuarantProfile>("/garants/me/");
}

export async function updateGuarantProfile(payload: Partial<GuarantProfile>) {
  return api.patch<GuarantProfile>("/garants/me/", payload);
}

export async function getGuarantById(id: number) {
  return api.get<GuarantProfile>(`/garants/${id}/`);
}
