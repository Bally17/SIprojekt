import { Stav } from "@type/props/common/StateInternship";

export interface GarantInternshipUpdate {
  firma_id: string;
  student_id: string;
  datum_zaciatku: string;
  datum_konca: string;
  stav: Stav;
  status_note: string;
}
