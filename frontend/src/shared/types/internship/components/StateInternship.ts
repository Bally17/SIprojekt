export const SEMESTERS = ["zimny", "letny"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const STAVY = [
  "vytvorena",
  "potvrdena",
  "zamietnuta",
  "schvalena",
  "obhajena",
  "neobhajena",
] as const;
export type Stav = (typeof STAVY)[number];

export const SEMESTER_LABEL: Record<Semester, string> = { zimny: "Zimný", letny: "Letný" };
export const STAV_LABEL: Record<Stav, string> = {
  vytvorena: "Vytvorená",
  potvrdena: "Potvrdená",
  zamietnuta: "Zamietnutá",
  schvalena: "Schválená",
  obhajena: "Obhájená",
  neobhajena: "Neobhájená",
};

export const SEMESTER_OPTIONS = SEMESTERS.map((v) => ({ value: v, label: SEMESTER_LABEL[v] }));
export const STAV_OPTIONS = STAVY.map((v) => ({ value: v, label: STAV_LABEL[v] }));

export const isSemester = (v: string): v is Semester =>
  (SEMESTERS as readonly string[]).includes(v);
export const isStav = (v: string): v is Stav => (STAVY as readonly string[]).includes(v);

export const getSemesterLabel = (v: string) => (isSemester(v) ? SEMESTER_LABEL[v] : v);
export const getStavLabel = (v: string) => (isStav(v) ? STAV_LABEL[v] : v);
