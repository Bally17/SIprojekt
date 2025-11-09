import { RoleType, RoleDataType } from "@/shared/types/roleTypes";

export const roleSectionDatas: Record<RoleType, RoleDataType[]> = {
  student: [
    { a: "Vytvoriť prax (dohodnutie, firma, dátumy)", b: "Dohoda o odbornej praxi — Náhľad" },
    { a: "Generovať PDF „Dohoda o odbornej praxi“", b: "Študent • Firma • Garant" },
    { a: "Nahlásiť zmluvu (podmieň. pri stave Schválená)", b: "Zmluva s praxí (PDF) — upload" },
    { a: "Nahrať výkaz praxe (potvrdenie firmy)", b: "Výkaz praxe (nahranie)" },
  ],
  firma: [
    { a: "Schválenie dohody o praxi", b: "Podpis / potvrdenie" },
    { a: "Overenie výkazu praxe", b: "Komentár a potvrdenie" },
    { a: "Export reportov", b: "CSV / PDF" },
    { a: "Používateľské účty", b: "Roly a prístupy" },
  ],
  garant: [
    { a: "Kontrola a schvaľovanie", b: "Audit log" },
    { a: "Správa študentov", b: "Hľadanie, filtre" },
    { a: "Notifikácie", b: "E-mail / systémové" },
    { a: "Reporty", b: "Semestre / programy" },
  ],
};
