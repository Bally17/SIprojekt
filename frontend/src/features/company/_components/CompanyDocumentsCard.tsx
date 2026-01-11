"use client";

import { useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { Internship } from "@shared-types/internship";
import { getErrorMessage } from "@utils/errorActions";
import { buildMediaUrl, getDocumentStatusInfo } from "@utils/documents";
import {
  useUploadDocumentFileMutation,
  useApproveCompanyDocumentMutation,
  useRejectCompanyDocumentMutation,
} from "../hooks";

type Props = {
  internship: Internship;
  onChange?: () => void;
};

export default function CompanyDocumentsCard({ internship, onChange }: Readonly<Props>) {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const [actionsOpen, setActionsOpen] = useState(false);

  const reportDoc = useMemo(
    () => internship.documents?.find((doc) => doc.typ_dokumentu === "vykaz"),
    [internship.documents],
  );

  const uploadInputId = useMemo(() => `company-doc-upload-${internship.id}`, [internship.id]);
  const closeActions = () => setActionsOpen(false);

  const uploadMutation = useUploadDocumentFileMutation();
  const approveMutation = useApproveCompanyDocumentMutation();
  const rejectMutation = useRejectCompanyDocumentMutation();

  const uploading = uploadMutation.isPending;

  const documentStatusLabels = useMemo(
    () => ({
      uploaded: msgs.common.documents.statusUploaded,
      approved: msgs.common.documents.statusApproved,
      rejected: msgs.common.documents.statusRejected,
      missing: msgs.common.documents.statusMissing,
    }),
    [
      msgs.common.documents.statusUploaded,
      msgs.common.documents.statusApproved,
      msgs.common.documents.statusRejected,
      msgs.common.documents.statusMissing,
    ],
  );

  const docInfo = getDocumentStatusInfo(reportDoc, documentStatusLabels);

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

    try {
      await uploadMutation.mutateAsync({ docId: reportDoc.id, file });

      notifySuccess({
        title: msgs.common.companyDocs.uploadSuccess,
        description: msgs.common.companyDocs.uploadDescription,
      });

      onChange?.();
      closeActions();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.common.companyDocs.uploadError,
        description: getErrorMessage(err, msgs.common.companyDocs.uploadError),
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleApprove = async () => {
    if (!reportDoc?.subor_url) return;

    try {
      await approveMutation.mutateAsync(reportDoc.id);

      notifySuccess({
        title: msgs.common.companyDocs.approved,
        description: "",
      });

      onChange?.();
      closeActions();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description: getErrorMessage(err, msgs.common.companyDocs.actionError),
      });
    }
  };

  const handleReject = async () => {
    if (!reportDoc?.subor_url) return;

    const reason = globalThis.prompt(msgs.common.companyDocs.rejectPrompt);
    if (!reason) return;

    try {
      await rejectMutation.mutateAsync({ docId: reportDoc.id, reason });

      notifySuccess({
        title: msgs.common.companyDocs.rejected,
        description: "",
      });

      onChange?.();
      closeActions();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.common.companyDocs.actionError,
        description: getErrorMessage(err, msgs.common.companyDocs.actionError),
      });
    }
  };

  return (
    <tr key={internship.id} className="border-t text-sm">
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col">
          <span className="font-semibold text-ink-900">
            {internship.student_full_name || `#${internship.student}`}
          </span>
          <span className="text-xs text-gray-500">{internship.student_email || "-"}</span>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="text-sm text-gray-700">
          <p className="font-medium">
            {internship.rok} - {internship.semester}
          </p>
          <p className="text-xs text-gray-500">
            {internship.datum_zaciatku} - {internship.datum_konca}
          </p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-ink-900">{msgs.common.documents.reportTitle}</span>
          {reportDoc?.subor_url ? (
            <a
              href={buildMediaUrl(reportDoc.subor_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ink-700 hover:underline"
            >
              <Icon name="download" className="h-3.5 w-3.5" />
              {msgs.common.documents.downloadLabel}
            </a>
          ) : (
            <span className="text-xs text-ink-400">{msgs.common.companyDocs.noReport}</span>
          )}
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <span
          className={`inline-flex min-w-[150px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold leading-tight ${docInfo.badge}`}
        >
          {docInfo.label}
        </span>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-600 text-primary-600 transition hover:bg-primary-50"
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
                    <h4 className="mt-1 text-base font-semibold text-ink-900">
                      {internship.student_full_name || `#${internship.student}`}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {msgs.common.companyDocs.termLabel}: {internship.rok} - {internship.semester}
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
                    disabled={!reportDoc?.subor_url || approveMutation.isPending}
                    className="flex w-full items-center justify-between rounded-lg border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {approveMutation.isPending
                      ? msgs.common.loading.loading
                      : msgs.common.companyDocs.approveButton}
                    <Icon name="check-circle-2" className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!reportDoc?.subor_url || rejectMutation.isPending}
                    className="flex w-full items-center justify-between rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    {rejectMutation.isPending
                      ? msgs.common.loading.loading
                      : msgs.common.companyDocs.rejectButton}
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
}
