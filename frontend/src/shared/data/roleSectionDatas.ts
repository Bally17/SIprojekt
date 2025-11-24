import IconName from "@icons/iconName";
import { RoleType, RoleDataType } from "@type/props/common/globalTypes";

export const roleSectionDatas: Record<RoleType, RoleDataType[]> = {
  student: [
    { a: "Vytvoriť prax (dohodnutie, firma, dátumy)", b: "Dohoda o odbornej praxi — Náhľad" },
    { a: "Generovať PDF „Dohoda o odbornej praxi“", b: "Študent • Firma • Garant" },
    { a: "Nahlásiť zmluvu (podmieň. pri stave Schválená)", b: "Zmluva s praxí (PDF) — upload" },
    { a: "Nahrať výkaz praxe (potvrdenie firmy)", b: "Výkaz praxe (nahranie)" },
  ],
  company: [
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

export const tabs: { key: RoleType; label: string; icon: IconName }[] = [
  { key: "student", label: "Študent", icon: "graduation-cap" },
  { key: "company", label: "Firma", icon: "building-2" },
  { key: "garant", label: "Garant", icon: "shield" },
];

export const rolePreviewImages: Record<RoleType, string> = {
  student: "/images/student_dash.jpg",
  company: "/images/firma_dash.jpg",
  garant: "/images/garant_dash.jpg",
};
