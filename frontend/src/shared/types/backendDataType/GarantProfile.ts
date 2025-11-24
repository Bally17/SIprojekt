export interface GarantProfile {
  id: number;
  meno: string;
  priezvisko: string;
  email: string;
  pracovisko?: string | null;
}
