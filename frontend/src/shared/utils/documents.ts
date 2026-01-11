import { BASE_URL } from "@constants";
import {
  DOCUMENT_STATUS_BADGE_CLASS,
  DocumentStatusType,
  isDocumentStatusType,
} from "@shared-types/documentStatus";
import { InternshipDocument } from "@shared-types/internship";

export type DocumentStatusLabels = {
  uploaded: string;
  approved: string;
  rejected: string;
  missing: string;
  unknown?: string;
};

export type DocumentTypeLabels = {
  contract: string;
  agreement: string;
  report: string;
  fallback?: (docType?: string) => string;
};

export const buildMediaUrl = (path: string) => {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const backend = BASE_URL.replace(/\/api\/?$/, "");
  return `${backend}/media/${path.replace(/^\/?/, "")}`;
};

export const getDocumentStatusInfo = (
  doc: InternshipDocument | undefined,
  labels: DocumentStatusLabels,
) => {
  if (!doc?.subor_url) {
    return {
      label: labels.missing,
      badge: "bg-gray-100 text-gray-500",
      code: undefined,
    };
  }

  const raw = doc.stav_dokumentu ?? "nahrany";
  const normalized: DocumentStatusType | null = isDocumentStatusType(raw) ? raw : null;
  const code: DocumentStatusType = normalized ?? "nahrany";

  let label: string;

  if (code === "potvrdeny") {
    label = labels.approved;
  } else if (code === "zamietnuty") {
    label = labels.rejected;
  } else if (normalized) {
    label = labels.uploaded;
  } else {
    label = labels.unknown ?? labels.uploaded;
  }

  return {
    label,
    badge: normalized ? DOCUMENT_STATUS_BADGE_CLASS[code] : "bg-gray-100 text-gray-600",
    code: normalized ?? undefined,
  };
};

export const getDocumentTypeLabel = (docType: string | undefined, labels: DocumentTypeLabels) => {
  switch (docType) {
    case "dohoda":
      return labels.contract;
    case "zmluva":
      return labels.agreement;
    case "vykaz":
      return labels.report;
    default:
      return labels.fallback ? labels.fallback(docType) : docType?.toUpperCase() || "N/A";
  }
};
