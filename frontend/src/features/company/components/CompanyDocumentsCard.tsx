"use client";

import { useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";
import Icon from "@/shared/icons";
import type { Internship } from "@/shared/types/internship/internship";
import type { InternshipDocument } from "@/shared/types/internship/components/InternshipDocument";

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
  const reportDoc = internship.documents?.find((doc) => doc.typ_dokumentu === "vykaz");
  const uploadInputId = useMemo(() => `company-doc-upload-${internship.id}`, [internship.id]);

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
      await axiosClient.post(`/documents/${reportDoc.id}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notifySuccess({
        title: msgs.common.companyDocs.uploadSuccess,
        description: msgs.common.companyDocs.uploadDescription,
      });
      onChange?.();
    } catch (error: any) {
      notifyWarning({
        title: msgs.common.companyDocs.uploadError,
        description: error?.response?.data?.detail || msgs.common.companyDocs.uploadError,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleApprove = async () => {
    if (!reportDoc || !reportDoc.subor_url) return;
    try {
      await axiosClient.post(`/documents/${reportDoc.id}/approve-company/`);
      notifySuccess({ title: msgs.common.companyDocs.approved, description: "" });
      onChange?.();
    } catch (error: any) {
      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description: error?.response?.data?.detail || msgs.common.companyDocs.actionError,
      });
    }
  };

  const handleReject = async () => {
    if (!reportDoc || !reportDoc.subor_url) return;
    const reason = window.prompt(msgs.common.companyDocs.rejectPrompt);
    if (!reason) return;
    try {
      await axiosClient.post(`/documents/${reportDoc.id}/reject-company/`, { reason });
      notifySuccess({ title: msgs.common.companyDocs.rejected, description: "" });
      onChange?.();
    } catch (error: any) {
      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description: error?.response?.data?.detail || msgs.common.companyDocs.actionError,
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
          <label
            htmlFor={uploadInputId}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50"
          >
            <Icon name="upload" className="h-4 w-4" />
            {uploading ? msgs.common.loading.loading : msgs.common.companyDocs.uploadButton}
          </label>
          <input
            id={uploadInputId}
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={uploading}
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={handleApprove}
            disabled={!reportDoc?.subor_url}
            className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
          >
            {msgs.common.companyDocs.approveButton}
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={!reportDoc?.subor_url}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
          >
            {msgs.common.companyDocs.rejectButton}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CompanyDocumentsCard;
