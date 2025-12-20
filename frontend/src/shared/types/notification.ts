import type { IntegerOrNull, Nullable, StringOrNull } from "./core/primitives";

export interface Notification {
  id: number;
  prijemca_email?: string;
  predmet: string;
  sablona_kluc: string;
  payload_json?: Nullable<Record<string, unknown>>;
  stav?: string;
  odoslane_at?: StringOrNull;
  vytvorene_at?: string;
  prax?: IntegerOrNull;
  prijemca?: IntegerOrNull;
}
