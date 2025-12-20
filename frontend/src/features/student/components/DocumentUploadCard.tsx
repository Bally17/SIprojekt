"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { Internship } from "@type/backend/Internship";
import InternshipDocument from "@type/backend/InternshipDocument";
import { METHOD, useApi } from "src/hook/useApi";

type InternshipWithDocuments = Internship & {
  documents?: InternshipDocument[];
};

type DocumentUploadCardProps = {
  internship: InternshipWithDocuments;
  onSuccess?: () => void;
};

const STATUS_BADGE: Record<string, string> = {
  nahrany: "bg-yellow-50 text-yellow-700",
  potvrdeny: "bg-emerald-50 text-emerald-700",
  zamietnuty: "bg-red-50 text-red-700",
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:8000";

const DocumentUploadCard = ({ internship, onSuccess }: DocumentUploadCardProps) => {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  // stav praxe – nepoužívame negáciu vo výraze, ale "pozitívne" pomenovanú premennú
  const isNotApproved = (internship.stav || "").toLowerCase() !== "schvalena";

  // Lokálne stavy pre modal (súbor, drag state, zvolený typ).
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Default vyber v modale, dohoda a vykaz sa dá hneď, zmluva až o stave praxe schválená
  const [selectedType, setSelectedType] = useState<"dohoda" | "zmluva" | "vykaz">("dohoda");

  // Vyhľadáme existujúce dokumenty priradené k praxi.
  const agreementDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "dohoda");
  const contractDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "zmluva");
  const reportDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "vykaz");
  const currentDoc =
    selectedType === "zmluva" ? contractDoc : selectedType === "dohoda" ? agreementDoc : reportDoc;
  const hasContractRecord = Boolean(contractDoc?.id);
  const generatedAgreementUrl = `${baseUrl}/media/dohody/dohoda_prax_${internship.id}.pdf`;

  // useApi pre upload (FormData) – url override použijeme pri execute
  const { loading: uploading, execute: executeUpload } = useApi<unknown, FormData, {}>({
    url: "/documents/upload/",
    method: METHOD.POST,
    onSuccess: () => {
      notifySuccess({
        title: msgs.common.documents.successTitle,
        description: msgs.common.documents.successDescription,
      });
      setFile(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const description =
        data?.detail || data?.error || data?.message || msgs.common.documents.uploadError;

      notifyWarning({
        title: msgs.common.documents.errorTitle,
        description,
      });
    },
  });

  // Pre každý typ dokumentu priprav čitateľný text a badge – jednoduchšia logika kvôli complexity
  const statusInfo = useMemo(() => {
    const statusLabels: Record<string, string> = {
      nahrany: msgs.common.documents.statusUploaded,
      potvrdeny: msgs.common.documents.statusApproved,
      zamietnuty: msgs.common.documents.statusRejected,
    };

    const getInfo = (doc?: InternshipDocument) => {
      if (!doc?.subor_url) {
        return {
          label: msgs.common.documents.statusMissing,
          badge: "bg-gray-50 text-gray-500",
        };
      }

      const code = doc.stav_dokumentu || "nahrany";
      const label = statusLabels[code] ?? msgs.common.documents.statusUnknown;
      const badge = STATUS_BADGE[code] || "bg-gray-100 text-gray-600";

      return { label, badge };
    };

    const missingStatus = getInfo(undefined);
    const isGeneratedAgreement = Boolean(
      agreementDoc?.subor_url &&
        (agreementDoc.subor_url.includes("/dohody/") ||
          agreementDoc.subor_url.includes(`/dohoda_prax_${internship.id}.pdf`)),
    );

    return {
      // Dohoda: vygenerovaný súbor (dohody/…) nepočítaj ako nahraný, ukáž "čaká", až reálny upload prepne stav
      contract: agreementDoc && !isGeneratedAgreement ? getInfo(agreementDoc) : missingStatus,
      agreement: getInfo(contractDoc),
      report: getInfo(reportDoc),
    };
  }, [
    agreementDoc,
    contractDoc,
    reportDoc,
    internship.id,
    msgs.common.documents.statusMissing,
    msgs.common.documents.statusUploaded,
    msgs.common.documents.statusApproved,
    msgs.common.documents.statusRejected,
    msgs.common.documents.statusUnknown,
  ]);

  // Zmluva (oficiálna) sa dá nahrávať až keď je prax schválená a existuje záznam "zmluva"
  const isContractLocked = isNotApproved || !hasContractRecord;

  // Zmluvu v modale povoľ len keď je prax schválená a existuje záznam zmluvy
  useEffect(() => {
    if (isContractLocked && selectedType === "zmluva") {
      setSelectedType("dohoda");
    }
  }, [isContractLocked, selectedType]);

  // Multipart upload na aktuálne zvolený dokument (zmluva/výkaz) cez useApi
  const uploadDocument = async (): Promise<boolean> => {
    if (!file || !currentDoc) return false;

    const isContractUploadLocked = selectedType === "zmluva" && isContractLocked;
    if (isContractUploadLocked) {
      notifyWarning({
        title: msgs.common.documents.errorTitle,
        description: msgs.common.documents.agreementLocked,
      });
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await executeUpload({
        body: formData,
        urlOverride: `/documents/${currentDoc.id}/upload/`,
      });
      return true;
    } catch {
      // onError už zobrazil notifikáciu
      return false;
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
            className="inline-flex items-center gap-2 rounded-full bg-primary-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            <Icon name="upload" className="h-4 w-4" />
            {msgs.common.documents.openUpload}
          </button>
        </div>

        <div className="space-y-3">
          {/* Dohoda – generovaná na stiahnutie + možnosť nahrať podpísanú */}
          <div className="rounded-xl border border-cyan-100 bg-white/70 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
                  <Icon name="file-text" className="h-4 w-4" />
                  {msgs.common.documents.contractTitle}
                </div>
                <p className="text-xs text-cyan-700">{msgs.common.documents.contractDescription}</p>
                <span
                  className={`inline-flex min-w-[150px] flex-col items-center justify-center rounded-full px-3 py-0.5 text-center text-[11px] font-semibold leading-tight ${statusInfo.contract.badge}`}
                >
                  {statusInfo.contract.label}
                </span>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                {agreementDoc ? (
                  <a
                    href={generatedAgreementUrl}
                    download={`Dohoda_prax_${internship.id}.pdf`}
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-cyan-200 px-3 py-1.5 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100"
                  >
                    <Icon name="download" className="h-3.5 w-3.5" />
                    {msgs.common.documents.downloadLabel}
                  </a>
                ) : null}
              </div>
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
              {isContractLocked && (
                <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-700">
                  <Icon name="lock-keyhole" className="h-3.5 w-3.5" />
                  {msgs.common.documents.agreementLocked}
                </div>
              )}
              <span
                className={`inline-flex min-w-[150px] flex-col items-center justify-center rounded-full px-3 py-0.5 text-center text-[11px] font-semibold leading-tight ${statusInfo.agreement.badge}`}
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
                className={`inline-flex min-w-[150px] flex-col items-center justify-center rounded-full px-3 py-0.5 text-center text-[11px] font-semibold leading-tight ${statusInfo.report.badge}`}
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
                {(["dohoda", "zmluva", "vykaz"] as const).map((type) => {
                  const isContractType = type === "zmluva";
                  const disabled = isContractType && isContractLocked;
                  const isActive = selectedType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        setSelectedType(type);
                      }}
                      className={`rounded-full px-3 py-1 transition ${
                        isActive
                          ? "bg-cyan-600 text-white"
                          : disabled
                            ? "cursor-not-allowed text-cyan-300"
                            : "text-cyan-700 hover:bg-cyan-50"
                      }`}
                    >
                      {type === "dohoda"
                        ? msgs.common.documents.contractTitle
                        : isContractType
                          ? msgs.common.documents.typeAgreement
                          : msgs.common.documents.typeReport}
                    </button>
                  );
                })}
              </div>
            </div>

            {isContractLocked && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                <Icon name="lock-keyhole" className="h-4 w-4" />
                {msgs.common.documents.agreementLocked}
              </div>
            )}

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
                      const success = await uploadDocument();
                      if (success) {
                        setIsModalOpen(false);
                      }
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
