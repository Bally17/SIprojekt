import type { StringOrNull } from "./core/primitives";

export interface User {
  id: number;
  email: string;
  meno?: StringOrNull;
  priezvisko?: StringOrNull;
  is_active?: string;
  is_staff?: string;
  is_superuser?: string;
  vytvorene_at?: string;
}
