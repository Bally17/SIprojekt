export interface Notification {
  id: number;
  prijemca_email?: string;
  predmet: string;
  sablona_kluc: string;
  payload_json?: Record<string, unknown> | null;
  stav?: string;
  odoslane_at?: string | null;
  vytvorene_at?: string;
  prax?: number | null;
  prijemca?: number | null;
}
