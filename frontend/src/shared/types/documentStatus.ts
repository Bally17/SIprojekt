export const DOCUMENT_STATUSES = ["nahrany", "potvrdeny", "zamietnuty"] as const;
export type DocumentStatusType = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUS_BADGE_CLASS: Record<DocumentStatusType, string> = {
  nahrany: "bg-yellow-50 text-yellow-700",
  potvrdeny: "bg-emerald-50 text-emerald-700",
  zamietnuty: "bg-red-50 text-red-700",
};

export const isDocumentStatusType = (v: string): v is DocumentStatusType =>
  (DOCUMENT_STATUSES as readonly string[]).includes(v);

/**
 * Voliteľné – ak labely riešiš cez i18n (msgs), pokojne tento blok vyhoď.
 */
export const DOCUMENT_STATUS_LABEL: Record<DocumentStatusType, string> = {
  nahrany: "Nahrany",
  potvrdeny: "Potvrdeny",
  zamietnuty: "Zamietnuty",
};

export const getDocumentStatusLabel = (v: string) =>
  isDocumentStatusType(v) ? DOCUMENT_STATUS_LABEL[v] : v;

export const DOCUMENT_STATUS_OPTIONS = DOCUMENT_STATUSES.map((v) => ({
  value: v,
  label: DOCUMENT_STATUS_LABEL[v],
}));
