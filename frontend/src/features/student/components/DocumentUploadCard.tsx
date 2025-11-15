import React, { useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import type { Internship } from "@/shared/types/internship/internship";
import type { InternshipDocument } from "@/shared/types/internship/components/InternshipDocument";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";
import Icon from "@/shared/icons";

type Props = {
  internship: Internship & { documents?: InternshipDocument[] };
  onSuccess?: () => void;
};

const STATUS_BADGE: Record<string, string> = {
  nahrany: "bg-yellow-50 text-yellow-700",
  potvrdeny: "bg-emerald-50 text-emerald-700",
  zamietnuty: "bg-red-50 text-red-700",
};

// Komponent slúži ako mini dashboard dokumentov praxe.
const DocumentUploadCard: React.FC<Props> = ({ internship, onSuccess }) => {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  // Lokálne stavy pre modal (súbor, progress, drag state, zvolený typ).
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<"dohoda" | "zmluva" | "vykaz">("zmluva");

  // Vyhľadáme existujúce dokumenty priradené k praxi.
  const contractDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "dohoda");
  const agreementDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "zmluva");
  const reportDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "vykaz");
  const currentDoc =
    selectedType === "dohoda" ? contractDoc : selectedType === "zmluva" ? agreementDoc : reportDoc;

  // Slúži na stiahnutie existujúceho PDF.
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:8000";

  // Pre každý typ dokumentu priprav čitateľný text a badge.
  const statusInfo = useMemo(() => {
    const getLabel = (code?: string) => {
      if (!code) return msgs.common.documents.statusMissing;
      if (code === "nahrany") return msgs.common.documents.statusUploaded;
      if (code === "potvrdeny") return msgs.common.documents.statusApproved;
      if (code === "zamietnuty") return msgs.common.documents.statusRejected;
      return msgs.common.documents.statusUnknown;
    };

    const getInfo = (doc?: InternshipDocument) => {
      if (!doc) {
        return { label: msgs.common.documents.statusMissing, badge: "bg-gray-50 text-gray-500" };
      }
      const code = doc.stav_dokumentu || "nahrany";
      return { label: getLabel(code), badge: STATUS_BADGE[code] || "bg-gray-100 text-gray-600" };
    };

    return {
      agreement: getInfo(agreementDoc),
      report: getInfo(reportDoc),
    };
  }, [
    agreementDoc,
    reportDoc,
    msgs.common.documents.statusMissing,
    msgs.common.documents.statusUploaded,
    msgs.common.documents.statusApproved,
    msgs.common.documents.statusRejected,
    msgs.common.documents.statusUnknown,
  ]);

  // Multipart upload na aktuálne zvolený dokument (zmluva/výkaz).
  const uploadDocument = async () => {
    if (!file || !currentDoc) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await axiosClient.post(`/documents/${currentDoc.id}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notifySuccess({
        title: msgs.common.documents.successTitle,
        description: msgs.common.documents.successDescription,
      });
      setFile(null);
      onSuccess?.();
    } catch (err: any) {
      notifyWarning({
        title: msgs.common.documents.errorTitle,
        description: err?.response?.data?.detail || msgs.common.documents.uploadError,
      });
    } finally {
      setUploading(false);
    }
  };

  // Drag & drop handler pre pohodlný výber PDF.
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  return (
    <>
      <div className="mt-4 space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
        {/* Nadpis sekcie + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-900">
              {msgs.common.documents.sectionTitle}
            </p>
            <p className="text-xs text-cyan-700">{msgs.common.documents.sectionDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
          >
            <Icon name="upload" className="h-4 w-4" />
            {msgs.common.documents.openUpload}
          </button>
        </div>

        <div className="space-y-3">
          {/* Dohoda – len na stiahnutie, upload rieši systém */}
          <div className="rounded-xl border border-cyan-100 bg-white/70 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
                  <Icon name="file-text" className="h-4 w-4" />
                  {msgs.common.documents.contractTitle}
                </div>
                <p className="text-xs text-cyan-700">{msgs.common.documents.contractDescription}</p>
              </div>
              {contractDoc?.subor_url ? (
                <a
                  href={`${baseUrl}/media/${contractDoc.subor_url}`}
                  download={`Dohoda_prax_${internship.id}.pdf`}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100"
                >
                  <Icon name="download" className="h-3.5 w-3.5" />
                  {msgs.common.documents.downloadLabel}
                </a>
              ) : null}
            </div>
          </div>

          {/* Zmluva – odlišná ikonka + stav */}
          <div className="rounded-xl border border-cyan-100 bg-white/70 p-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
                <Icon name="badge-check" className="h-4 w-4" />
                {msgs.common.documents.agreementTitle}
              </div>
              <p className="text-xs text-cyan-700">{msgs.common.documents.agreementDescription}</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.agreement.badge}`}
              >
                {statusInfo.agreement.label}
              </span>
            </div>
          </div>

          {/* Výkaz – nahráva sa po ukončení praxe */}
          <div className="rounded-xl border border-cyan-100 bg-white/70 p-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
                <Icon name="workflow" className="h-4 w-4" />
                {msgs.common.documents.reportTitle}
              </div>
              <p className="text-xs text-cyan-700">{msgs.common.documents.reportDescription}</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.report.badge}`}
              >
                {statusInfo.report.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-cyan-900">
                  {msgs.common.documents.modalTitle}
                </h3>
                <p className="text-sm text-cyan-700">{msgs.common.documents.modalSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                }}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50"
                aria-label={msgs.common.close}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            {/* Voliteľný výber typu – mení, ktorý záznam sa uploaduje */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-cyan-900">
              <span>{msgs.common.documents.typeLabel}</span>
              <div className="inline-flex rounded-full border border-cyan-200 p-1">
                {(["zmluva", "vykaz"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`rounded-full px-3 py-1 transition ${
                      selectedType === type
                        ? "bg-cyan-600 text-white"
                        : "text-cyan-700 hover:bg-cyan-50"
                    }`}
                  >
                    {type === "zmluva"
                      ? msgs.common.documents.typeAgreement
                      : msgs.common.documents.typeReport}
                  </button>
                ))}
              </div>
            </div>

            {/* Ak typ ešte nemá pridelený záznam (napr. zmluva neexistuje), upozorníme používateľa */}
            {currentDoc ? (
              <>
                <label
                  htmlFor={`upload-input-${internship.id}-${selectedType}`}
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-cyan-400 bg-cyan-50"
                      : "border-cyan-200 bg-cyan-50/50 hover:border-cyan-400"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <Icon name="upload" className="h-10 w-10 text-cyan-600" />
                  <p className="mt-3 text-sm font-semibold text-cyan-900">
                    {msgs.common.documents.dropTitle}
                  </p>
                  <p className="text-xs text-cyan-700">{msgs.common.documents.dropSubtitle}</p>
                  <span className="mt-3 inline-flex items-center rounded-full bg-cyan-600 px-4 py-1 text-xs font-semibold text-white">
                    {msgs.common.documents.browseCta}
                  </span>
                </label>

                <input
                  id={`upload-input-${internship.id}-${selectedType}`}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] || null;
                    setFile(nextFile);
                  }}
                  className="hidden"
                />

                {file ? (
                  <p className="mt-3 text-xs text-cyan-900">
                    {msgs.common.documents.selectedFile}: <strong>{file.name}</strong>
                  </p>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    {msgs.common.close}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await uploadDocument();
                      if (!uploading) setIsModalOpen(false);
                    }}
                    disabled={!file || uploading}
                    className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
                  >
                    {uploading ? msgs.common.loading.loading : msgs.common.documents.uploadButton}
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-6 text-xs text-cyan-800">{msgs.common.documents.noContractError}</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DocumentUploadCard;
