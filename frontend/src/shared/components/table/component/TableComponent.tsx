import React, { useState } from "react";
import { Button } from "@components/button";
import { Select } from "@components/select";
import { useLocalization } from "@i18n/client";
import useLoadTableData from "@utils/useLoadTableData";
import Icon from "@icons/index";
import {
  TableProps,
  Action,
  Nullable,
  Semester,
  isSemester,
  Stav,
  isStav,
  SEMESTER_OPTIONS,
  STAV_OPTIONS,
  STAV_BADGE_CLASS,
} from "@shared-types/index";
import { Internship } from "@shared-types/internship";
import { buildMediaUrl, getDocumentStatusInfo, getDocumentTypeLabel } from "@utils/documents";
import { getInternshipStatusLabel, getInternshipStatusOptions } from "@utils/internshipStatus";
import {
  getInternshipSemesterLabel,
  getInternshipSemesterOptions,
} from "@utils/internshipSemester";

export const TableComponent = ({
  data,
  name,
  document = false,
  rowActions = false,
  onAction,
  showFilters = false,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  semesterOptions = [],
  stavOptions = [],
  isError,
  isLoading,
  actionMessage,
  showEmpty,
  renderRow,
  columnCountOverride,
}: TableProps) => {
  const { msgs, locale } = useLocalization();
  const { subTitle, title, columns } = useLoadTableData(name, locale);
  const [busy, setBusy] = useState<Record<number, Action | undefined>>({});
  const [docPreview, setDocPreview] = useState<Nullable<Internship>>(null);

  // pred return:
  const semesterValue: Semester | "" = isSemester(String(filters?.semester))
    ? (filters!.semester as Semester)
    : "";

  const stavValue: Stav | "" = isStav(String(filters?.stav)) ? (filters!.stav as Stav) : "";

  const fallbackSemesterValues = SEMESTER_OPTIONS.map((o) => o.value).filter(
    (value): value is Semester => isSemester(value),
  );
  const rawSemesterValues = (semesterOptions?.length ? semesterOptions : SEMESTER_OPTIONS)
    .map((o) => o.value)
    .filter((value): value is Semester => isSemester(value));
  const semesterValues = rawSemesterValues.length ? rawSemesterValues : fallbackSemesterValues;
  const semesterOpts = getInternshipSemesterOptions(msgs, semesterValues);

  const fallbackStavValues = STAV_OPTIONS.map((o) => o.value).filter((value): value is Stav =>
    isStav(value),
  );
  const rawStavValues = (stavOptions?.length ? stavOptions : STAV_OPTIONS)
    .map((o) => o.value)
    .filter((value): value is Stav => isStav(value));
  const stavValues = rawStavValues.length ? rawStavValues : fallbackStavValues;
  const stavOpts = getInternshipStatusOptions(msgs, stavValues);

  const runAction = async (id: number, action: Action) => {
    if (!onAction) return;
    try {
      setBusy((p) => ({ ...p, [id]: action }));
      await onAction(id, action);
    } finally {
      setBusy((p) => ({ ...p, [id]: undefined }));
    }
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!filters || !onFiltersChange) return;
    const { name, value } = e.target;
    onFiltersChange({ ...filters, [name]: value });
  };

  const extraCols = (document ? 2 : 0) + (rowActions ? 1 : 0);
  const colSpan = columnCountOverride ?? Math.max(1, columns.length + extraCols);

  const renderStavBadge = (value: string) => {
    const normalized: Stav | null = isStav(value) ? value : null;
    const badgeClass = normalized ? STAV_BADGE_CLASS[normalized] : "bg-gray-100 text-gray-600";
    const label = normalized ? getInternshipStatusLabel(normalized, msgs) : value;
    return (
      <span
        className={`inline-flex min-w-[150px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold leading-tight ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  const documentStatusLabels = {
    uploaded: msgs.common.documents.statusUploaded,
    approved: msgs.common.documents.statusApproved,
    rejected: msgs.common.documents.statusRejected,
    missing: msgs.common.documents.statusMissing,
  };

  const documentTypeLabels = {
    contract: msgs.common.documents.contractTitle,
    agreement: msgs.common.documents.agreementTitle,
    report: msgs.common.documents.reportTitle,
    fallback: (docType?: string) => docType?.toUpperCase() || "N/A",
  };

  const closeDocPreview = () => setDocPreview(null);

  const shouldShowActionEmpty =
    !!showEmpty && !isLoading && !isError && data.length === 0 && !!actionMessage;

  let bodyRows: React.ReactNode;
  if (isLoading) {
    bodyRows = (
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-6 text-center text-sm text-gray-500"
          aria-live="polite"
        >
          {msgs.common.loading.internships}
        </td>
      </tr>
    );
  } else if (isError) {
    bodyRows = (
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-6 text-center text-sm text-red-600"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-3">
            <span>{isError}</span>
            {onApplyFilters && (
              <Button variant="primary" onClick={onApplyFilters}>
                {msgs.common.tryAgain}
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  } else if (shouldShowActionEmpty) {
    bodyRows = (
      <tr>
        <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-green-600">
          {actionMessage}
        </td>
      </tr>
    );
  } else if (data.length === 0) {
    bodyRows = (
      <tr>
        <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-gray-500">
          {msgs.common.error.errorFilterLoad}
        </td>
      </tr>
    );
  } else {
    bodyRows = data.map((item) => {
      if (renderRow) {
        const row = renderRow(item);
        if (React.isValidElement(row)) {
          return React.cloneElement(row, {
            key: row.key ?? item.id,
          });
        }
        return <React.Fragment key={item.id}>{row}</React.Fragment>;
      }

      return (
        <tr key={item.id} className="border-t text-sm">
          <td className="px-4 py-3 font-medium">#{item.id}</td>
          <td className="px-4 py-3">{item.student}</td>
          <td className="px-4 py-3">{item.rok}</td>
          <td className="px-4 py-3 capitalize">
            {getInternshipSemesterLabel(item.semester, msgs)}
          </td>
          <td className="px-4 py-3">{item.datum_zaciatku}</td>
          <td className="px-4 py-3">{item.datum_konca}</td>

          {document && (
            <>
              <td className="px-4 py-3">{renderStavBadge(String(item.stav))}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setDocPreview(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50"
                >
                  <Icon name="file-text" className="h-4 w-4" />
                  {msgs.common.documents.openPreview}
                </button>
              </td>
            </>
          )}

          {rowActions && (
            <td className="px-4 py-3 space-x-2">
              <Button
                variant="primary"
                className="bg-primary-600 hover:bg-primary-700"
                loading={busy[item.id] === "confirm"}
                onClick={() => runAction(item.id, "confirm")}
              >
                {msgs.common.confirm}
              </Button>
              <Button
                variant="danger"
                loading={busy[item.id] === "reject"}
                onClick={() => runAction(item.id, "reject")}
              >
                {msgs.common.reject}
              </Button>
            </td>
          )}
        </tr>
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-ink-900">{title}</h2>
          <p className="text-sm text-ink-700">{subTitle}</p>
        </div>

        {showFilters && filters && (
          <form
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full md:w-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="number"
              name="rok"
              value={filters.rok}
              onChange={handleLocalChange}
              placeholder={msgs.common.date.year}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />

            <Select<Semester>
              name="semester"
              value={semesterValue}
              options={semesterOpts}
              emptyOptionLabel={msgs.common.date.semester}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              onChangeValue={(val) =>
                handleLocalChange({
                  target: { name: "semester", value: val } as any,
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            />

            <Select<Stav>
              name="stav"
              value={stavValue}
              options={stavOpts}
              emptyOptionLabel={msgs.common.internships.state}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              onChangeValue={(val) =>
                handleLocalChange({
                  target: { name: "stav", value: val } as any,
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            />

            <div className="flex gap-2">
              <div className="flex gap-2">
                <Button type="button" onClick={onApplyFilters} variant="primary" className="flex-1">
                  {msgs.common.filter}
                </Button>
                <Button
                  type="button"
                  onClick={onResetFilters}
                  variant="ghost"
                  className="flex-1 border border-primary-600 bg-white text-primary-600 hover:bg-primary-50"
                >
                  {msgs.common.reset}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="overflow-x-auto">
        {showEmpty && data.length === 0 && actionMessage ? (
          <p className="text-green-600">{actionMessage}</p>
        ) : (
          <table className="min-w-full bg-white border border-primary-100">
            <thead className="border-b border-primary-100">
              <tr className="bg-primary-50 text-left text-sm font-semibold text-ink-900">
                {columns.map((c) => (
                  <th key={c} scope="col" className="px-4 py-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-live="polite">{bodyRows}</tbody>
          </table>
        )}
      </div>
      {docPreview ? (
        <div
          className="fixed inset-0 z-[10] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={closeDocPreview}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {msgs.common.documents.sectionTitle}
                </p>
                <h4 className="text-lg font-semibold text-primary-900">
                  {docPreview.student_full_name || `#${docPreview.student}`}
                </h4>
                <p className="text-xs text-gray-500">
                  {docPreview.rok} • {getInternshipSemesterLabel(docPreview.semester, msgs)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDocPreview}
                className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100"
                aria-label={msgs.common.close}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {docPreview.documents?.length ? (
                docPreview.documents.map((doc) => {
                  const status = getDocumentStatusInfo(doc, documentStatusLabels);
                  return (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-primary-200 px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">
                            {getDocumentTypeLabel(doc.typ_dokumentu, documentTypeLabels)}
                          </p>
                          <p className="text-xs text-gray-500">#{doc.id}</p>
                        </div>
                        <span
                          className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-3 py-0.5 text-center text-[11px] font-semibold leading-tight ${status.badge}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      {doc.subor_url ? (
                        <a
                          href={buildMediaUrl(doc.subor_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 hover:underline"
                        >
                          <Icon name="download" className="h-4 w-4" />
                          {msgs.common.documents.downloadLabel}
                        </a>
                      ) : (
                        <p className="mt-3 text-xs text-gray-400">
                          {msgs.common.documents.noDocuments}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-gray-500">
                  {msgs.common.documents.noDocuments}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TableComponent;
