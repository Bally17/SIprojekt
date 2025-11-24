import { Stav } from "@type/props/common/StateInternship";

export interface InternshipHistory {
  id: number;
  stary_stav?: Stav | null;
  novy_stav: Stav;
  poznamka?: string | null;
  zmena_at?: string;
  prax: number;
  zmenil?: number | null;
}
