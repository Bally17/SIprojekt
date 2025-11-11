export default interface InternshipDocument {
  id: number;
  typ_dokumentu: string;
  subor_url?: string | null;
  stav_dokumentu?: string;
  skontrolovane_at?: string | null;
  vytvorene_at: string;
  zmenene_at: string;
  prax: number;
  nahrane_pouzivatel: number;
  skontroloval?: number | null;
}
