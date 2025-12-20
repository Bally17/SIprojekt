"use client";

import { useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { api, getAccessToken } from "@lib/ApiProvider";
import { Internship } from "@type/backend/Internship";
import InternshipDocument from "@type/backend/InternshipDocument";

type Props = {
  internship: Internship;
  onChange?: () => void;
};

const STATUS_BADGE: Record<string, string> = {
  nahrany: "bg-yellow-50 text-yellow-700",
  potvrdeny: "bg-emerald-50 text-emerald-700",
  zamietnuty: "bg-red-50 text-red-700",
};

const buildMediaUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  const backend = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
  return `${backend}/media/${path.replace(/^\/?/, "")}`;
};

const CompanyDocumentsCard = ({ internship, onChange }: Props) => {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const [uploading, setUploading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const reportDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "vykaz");
  const uploadInputId = useMemo(() => `company-doc-upload-${internship.id}`, [internship.id]);
  const closeActions = () => setActionsOpen(false);

  const statusLabel = (doc?: InternshipDocument) => {
    if (!doc || !doc.subor_url) return msgs.common.documents.statusMissing;
    if (doc.stav_dokumentu === "potvrdeny") return msgs.common.documents.statusApproved;
    if (doc.stav_dokumentu === "zamietnuty") return msgs.common.documents.statusRejected;
    return msgs.common.documents.statusUploaded;
  };

  const badgeClass = (doc?: InternshipDocument) => {
    if (!doc || !doc.subor_url) return "bg-gray-100 text-gray-500";
    return STATUS_BADGE[doc.stav_dokumentu || "nahrany"] || "bg-gray-100 text-gray-500";
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!reportDoc) {
      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description: msgs.common.companyDocs.noReport,
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${baseURL}/documents/${reportDoc.id}/upload/`, {
        method: "POST",
        headers: {
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        let errorBody: any = null;
        try {
          errorBody = await res.json();
        } catch {
          // ignore
        }

        const description =
          errorBody?.detail || errorBody?.error || msgs.common.companyDocs.uploadError;

        throw new Error(description);
      }

      notifySuccess({
        title: msgs.common.companyDocs.uploadSuccess,
        description: msgs.common.companyDocs.uploadDescription,
      });
      onChange?.();
      closeActions();
    } catch (error: any) {
      notifyWarning({
        title: msgs.common.companyDocs.uploadError,
        description: error?.message || msgs.common.companyDocs.uploadError,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleApprove = async () => {
    if (!reportDoc || !reportDoc.subor_url) return;

    try {
      await api.post<unknown>(`/documents/${reportDoc.id}/approve-company/`, {});

      notifySuccess({
        title: msgs.common.companyDocs.approved,
        description: "",
      });
      onChange?.();
      closeActions();
    } catch (err: any) {
      const data = err?.response?.data;
      const description =
        data?.detail || data?.error || err?.message || msgs.common.companyDocs.actionError;

      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description,
      });
    }
  };

  const handleReject = async () => {
    if (!reportDoc || !reportDoc.subor_url) return;

    const reason = window.prompt(msgs.common.companyDocs.rejectPrompt);
    if (!reason) return;

    try {
      await api.post<unknown>(`/documents/${reportDoc.id}/reject-company/`, { reason });

      notifySuccess({
        title: msgs.common.companyDocs.rejected,
        description: "",
      });
      onChange?.();
      closeActions();
    } catch (err: any) {
      const data = err?.response?.data;
      const description =
        data?.detail || data?.error || err?.message || msgs.common.companyDocs.actionError;

      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description,
      });
    }
  };

  return (
    <tr key={internship.id} className="border-t text-sm">
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col">
          <span className="font-semibold text-primary-900">
            {internship.student_full_name || `#${internship.student}`}
          </span>
          <span className="text-xs text-gray-500">{internship.student_email || "—"}</span>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="text-sm text-gray-700">
          <p className="font-medium">
            {internship.rok} • {internship.semester}
          </p>
          <p className="text-xs text-gray-500">
            {internship.datum_zaciatku} – {internship.datum_konca}
          </p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-primary-900">{msgs.common.documents.reportTitle}</span>
          {reportDoc?.subor_url ? (
            <a
              href={buildMediaUrl(reportDoc.subor_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:underline"
            >
              <Icon name="download" className="h-3.5 w-3.5" />
              {msgs.common.documents.downloadLabel}
            </a>
          ) : (
            <span className="text-xs text-gray-400">{msgs.common.companyDocs.noReport}</span>
          )}
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <span
          className={`inline-flex min-w-[150px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold leading-tight ${badgeClass(
            reportDoc,
          )}`}
        >
          {statusLabel(reportDoc)}
        </span>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            aria-haspopup="dialog"
            aria-expanded={actionsOpen}
          >
            <Icon name="more-horizontal" className="h-5 w-5" />
          </button>

          {actionsOpen ? (
            <div
              className="fixed inset-0 z-[10] flex items-center justify-center bg-black/50 px-4 py-6"
              onClick={closeActions}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 text-sm shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {msgs.common.companyDocs.sectionTitle}
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-primary-900">
                      {internship.student_full_name || `#${internship.student}`}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {msgs.common.companyDocs.termLabel}: {internship.rok} • {internship.semester}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeActions}
                    className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100"
                    aria-label={msgs.common.close}
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <label
                      htmlFor={uploadInputId}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-primary-100 px-3 py-2 text-xs font-semibold text-primary-900 transition hover:bg-primary-50"
                    >
                      <span>
                        {uploading
                          ? msgs.common.loading.loading
                          : msgs.common.companyDocs.uploadButton}
                      </span>
                      <Icon name="upload" className="h-4 w-4" />
                    </label>
                    <input
                      id={uploadInputId}
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      disabled={uploading}
                      onChange={handleUpload}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!reportDoc?.subor_url}
                    className="flex w-full items-center justify-between rounded-lg border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {msgs.common.companyDocs.approveButton}
                    <Icon name="check-circle-2" className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!reportDoc?.subor_url}
                    className="flex w-full items-center justify-between rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    {msgs.common.companyDocs.rejectButton}
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
};

export default CompanyDocumentsCard;
