// frontend\src\features\student\_components\DocumentUploadCard.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { Internship, InternshipDocument } from "@shared-types/internship";
import { buildMediaUrl, getDocumentStatusInfo } from "@utils/documents";
import { useUploadDocumentMutation } from "../hooks";
import { getErrorMessage } from "@utils/errorActions";

type InternshipWithDocuments = Internship & {
  documents?: InternshipDocument[];
};

type DocumentUploadCardProps = {
  internship: InternshipWithDocuments;
  onSuccess?: () => void;
};

export default function DocumentUploadCard({
  internship,
  onSuccess,
}: Readonly<DocumentUploadCardProps>) {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const isNotApproved = (internship.stav || "").toLowerCase() !== "schvalena";

  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedType, setSelectedType] = useState<"zmluva" | "vykaz">(
    isNotApproved ? "vykaz" : "zmluva",
  );

  // Dokumenty
  const contractDoc = internship.documents?.find((d) => d.typ_dokumentu === "dohoda");
  const agreementDoc = internship.documents?.find((d) => d.typ_dokumentu === "zmluva");
  const reportDoc = internship.documents?.find((d) => d.typ_dokumentu === "vykaz");

  const currentDoc = selectedType === "zmluva" ? agreementDoc : reportDoc;

  /* -------------------------------
   * react-query upload mutácia
   * ------------------------------ */
  const uploadMutation = useUploadDocumentMutation();
  const uploading = uploadMutation.isPending;

  /* -------------------------------
   * Status badge + text
   * ------------------------------ */
  const documentStatusLabels = useMemo(
    () => ({
      uploaded: msgs.common.documents.statusUploaded,
      approved: msgs.common.documents.statusApproved,
      rejected: msgs.common.documents.statusRejected,
      missing: msgs.common.documents.statusMissing,
      unknown: msgs.common.documents.statusUnknown,
    }),
    [
      msgs.common.documents.statusUploaded,
      msgs.common.documents.statusApproved,
      msgs.common.documents.statusRejected,
      msgs.common.documents.statusMissing,
      msgs.common.documents.statusUnknown,
    ],
  );

  const statusInfo = useMemo(
    () => ({
      agreement: getDocumentStatusInfo(agreementDoc, documentStatusLabels),
      report: getDocumentStatusInfo(reportDoc, documentStatusLabels),
      contract: getDocumentStatusInfo(contractDoc, documentStatusLabels),
    }),
    [agreementDoc, reportDoc, contractDoc, documentStatusLabels],
  );

  /* -------------------------------
   * switching upload type on state change
   * ------------------------------ */
  useEffect(() => {
    if (isNotApproved && selectedType === "zmluva") {
      setSelectedType("vykaz");
    }
  }, [isNotApproved, selectedType]);

  /* -------------------------------
   * UPLOAD HANDLER
   * ------------------------------ */
  async function uploadDocument() {
    if (!file || !currentDoc) return false;

    const isAgreementLocked = selectedType === "zmluva" && isNotApproved;
    if (isAgreementLocked) {
      notifyWarning({
        title: msgs.common.documents.errorTitle,
        description: msgs.common.documents.agreementLocked,
      });
      return false;
    }

    try {
      await uploadMutation.mutateAsync({ docId: currentDoc.id, file });

      notifySuccess({
        title: msgs.common.documents.successTitle,
        description: msgs.common.documents.successDescription,
      });

      setFile(null);
      onSuccess?.();
      return true;
    } catch (error: any) {
      notifyWarning({
        title: msgs.common.documents.errorTitle,
        description: getErrorMessage(error, msgs.common.documents.uploadError),
      });
      return false;
    }
  }

  /* -------------------------------
   * DRAG & DROP
   * ------------------------------ */
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  };

  const isAgreementLocked = isNotApproved;

  /* -------------------------------
   * UI
   * ------------------------------ */
  return (
    <>
      <div className="mt-4 space-y-3 rounded-2xl border border-primary-100 bg-primary-50/90 p-4">
        {/* SECTION HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {msgs.common.documents.sectionTitle}
            </p>
            <p className="text-xs text-ink-700">{msgs.common.documents.sectionDescription}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Icon name="upload" className="h-4 w-4" />
            {msgs.common.documents.openUpload}
          </button>
        </div>

        {/* CONTRACT (only download) */}
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Icon name="file-text" className="h-4 w-4" />
                {msgs.common.documents.contractTitle}
              </div>
              <p className="text-xs text-ink-700">{msgs.common.documents.contractDescription}</p>
            </div>

            {contractDoc?.subor_url && (
              <a
                href={buildMediaUrl(contractDoc.subor_url)}
                download={`Dohoda_prax_${internship.id}.pdf`}
                className="inline-flex items-center gap-1 rounded-full border border-primary-600 px-3 py-1.5 text-[11px] font-semibold text-primary-600 transition hover:bg-primary-50"
              >
                <Icon name="download" className="h-3.5 w-3.5" />
                {msgs.common.documents.downloadLabel}
              </a>
            )}
          </div>
        </div>

        {/* AGREEMENT */}
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Icon name="badge-check" className="h-4 w-4" />
              {msgs.common.documents.agreementTitle}
            </div>

            <p className="text-xs text-ink-700">{msgs.common.documents.agreementDescription}</p>

            {isAgreementLocked && (
              <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-700">
                <Icon name="lock-keyhole" className="h-3.5 w-3.5" />
                {msgs.common.documents.agreementLocked}
              </div>
            )}

            <span
              className={`inline-flex items-center justify-center text-center rounded-full px-3 py-0.5 text-[11px] font-semibold ${statusInfo.agreement.badge}`}
            >
              {statusInfo.agreement.label}
            </span>
          </div>
        </div>

        {/* REPORT */}
        <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Icon name="workflow" className="h-4 w-4" />
              {msgs.common.documents.reportTitle}
            </div>

            <p className="text-xs text-ink-700">{msgs.common.documents.reportDescription}</p>

            <span
              className={`inline-flex items-center justify-center text-center rounded-full px-3 py-0.5 text-[11px] font-semibold ${statusInfo.report.badge}`}
            >
              {statusInfo.report.label}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-ink-900">
                  {msgs.common.documents.modalTitle}
                </h3>
                <p className="text-sm text-ink-700">{msgs.common.documents.modalSubtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                }}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                aria-label={msgs.common.close}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            {/* TYPE SWITCH */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-ink-900">
              <span>{msgs.common.documents.typeLabel}</span>

              <div className="inline-flex rounded-full border border-primary-200 p-1">
                {(["zmluva", "vykaz"] as const).map((type) => {
                  const disabled = type === "zmluva" && isAgreementLocked;
                  const active = selectedType === type;

                  const baseClasses = "rounded-full px-3 py-1";

                  let stateClasses = "text-primary-200 hover:bg-primary-50";
                  if (active) {
                    stateClasses = "bg-primary-600 text-white";
                  } else if (disabled) {
                    stateClasses = "cursor-not-allowed text-primary-300";
                  }

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedType(type)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      {type === "zmluva"
                        ? msgs.common.documents.typeAgreement
                        : msgs.common.documents.typeReport}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAgreementLocked && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                <Icon name="lock-keyhole" className="h-4 w-4" />
                {msgs.common.documents.agreementLocked}
              </div>
            )}

            {/* UPLOAD PANEL */}
            {currentDoc ? (
              <>
                <label
                  htmlFor={`upload-input-${internship.id}-${selectedType}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center ${
                    isDragging
                      ? "border-primary-400 bg-primary-50"
                      : "border-primary-200 bg-primary-50/50 hover:border-primary-400"
                  }`}
                >
                  <Icon name="upload" className="h-10 w-10 text-primary-600" />
                  <p className="mt-3 text-sm font-semibold text-primary-900">
                    {msgs.common.documents.dropTitle}
                  </p>
                  <p className="text-xs text-priamry-700">{msgs.common.documents.dropSubtitle}</p>
                  <span className="mt-3 inline-flex items-center rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white">
                    {msgs.common.documents.browseCta}
                  </span>
                </label>

                <input
                  id={`upload-input-${internship.id}-${selectedType}`}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file && (
                  <p className="mt-3 text-xs text-primary-900">
                    {msgs.common.documents.selectedFile}: <strong>{file.name}</strong>
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
                  >
                    {msgs.common.close}
                  </button>

                  <button
                    type="button"
                    disabled={!file || uploading}
                    onClick={async () => {
                      const ok = await uploadDocument();
                      if (ok) setIsModalOpen(false);
                    }}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    {uploading ? msgs.common.loading.loading : msgs.common.documents.uploadButton}
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-6 text-xs text-primary-800">
                {msgs.common.documents.noContractError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
