import type { StringOrNull } from "./core/primitives";

export interface GarantProfile {
  id: number;
  meno: string;
  priezvisko: string;
  email: string;
  pracovisko?: StringOrNull;
}
