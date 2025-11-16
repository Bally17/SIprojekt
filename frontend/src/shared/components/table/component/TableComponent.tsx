import { useLocalization } from "@/shared/i18n/client";
import TableProps, { Action } from "@/shared/types/components/table/TableProps";
import { useLoadTableData } from "@/shared/utils/actions";
import React, { FC, useState } from "react";
import { Button } from "../../button";
import { InternshipDocument } from "@/shared/types/internship/components/InternshipDocument";
import Select from "../../select/component/SelectComponent";
import Icon from "@/shared/icons";
import type { Internship } from "@/shared/types/internship/internship";
import {
  SEMESTER_OPTIONS,
  STAV_OPTIONS,
  type Semester,
  type Stav,
  isSemester,
  isStav,
  getStavLabel,
  STAV_BADGE_CLASS,
} from "@/shared/types/internship/components/StateInternship";

const buildMediaUrl = (path: string) => {
  const backend = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
  return `${backend}/media/${path.replace(/^\/?/, "")}`;
};

const TableComponent: FC<TableProps> = (props) => {
  const {
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
  } = props;

  const { subTitle, title, columns } = useLoadTableData(name);
  const { msgs } = useLocalization();
  const [busy, setBusy] = useState<Record<number, Action | undefined>>({});
  const [docPreview, setDocPreview] = useState<Internship | null>(null);

  // pred return:
  const semesterValue: Semester | "" = isSemester(String(filters?.semester))
    ? (filters!.semester as Semester)
    : "";

  const stavValue: Stav | "" = isStav(String(filters?.stav)) ? (filters!.stav as Stav) : "";

  const semesterOpts = (
    semesterOptions?.length ? semesterOptions.filter((o) => isSemester(o.value)) : SEMESTER_OPTIONS
  ) as readonly { value: Semester; label: string }[];

  const stavOpts = (
    stavOptions?.length ? stavOptions.filter((o) => isStav(o.value)) : STAV_OPTIONS
  ) as readonly { value: Stav; label: string }[];

  const runAction = async (id: number, action: Action) => {
    if (!onAction) return;
    try {
      setBusy((p) => ({ ...p, [id]: action }));
      await onAction(id, action);
    } finally {
      setBusy((p) => ({ ...p, [id]: undefined }));
    }
  };

  const hasFileUrl = (doc: InternshipDocument): doc is InternshipDocument & { subor_url: string } =>
    typeof doc.subor_url === "string" && doc.subor_url.length > 0;

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!filters || !onFiltersChange) return;
    const { name, value } = e.target;
    onFiltersChange({ ...filters, [name]: value });
  };

  const extraCols = (document ? 2 : 0) + (rowActions ? 1 : 0);
  const colSpan = columnCountOverride ?? Math.max(1, columns.length + extraCols);

  const renderStavBadge = (value: string) => {
    const normalized: Stav | null = isStav(value) ? (value as Stav) : null;
    const badgeClass = normalized ? STAV_BADGE_CLASS[normalized] : "bg-gray-100 text-gray-600";
    const label = normalized ? getStavLabel(normalized) : value;
    return (
      <span
        className={`inline-flex min-w-[150px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold leading-tight ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  const documentStatusInfo = (doc?: InternshipDocument) => {
    if (!doc || !doc.subor_url) {
      return { label: msgs.common.documents.statusMissing, badge: "bg-gray-100 text-gray-500" };
    }
    const code = doc.stav_dokumentu || "nahrany";
    const badgeMap: Record<string, string> = {
      nahrany: "bg-yellow-50 text-yellow-700",
      potvrdeny: "bg-emerald-50 text-emerald-700",
      zamietnuty: "bg-red-50 text-red-700",
    };

    const label =
      code === "potvrdeny"
        ? msgs.common.documents.statusApproved
        : code === "zamietnuty"
          ? msgs.common.documents.statusRejected
          : msgs.common.documents.statusUploaded;

    return { label, badge: badgeMap[code] || "bg-gray-100 text-gray-600" };
  };

  const documentTypeLabel = (docType?: string) => {
    switch (docType) {
      case "dohoda":
        return msgs.common.documents.contractTitle;
      case "zmluva":
        return msgs.common.documents.agreementTitle;
      case "vykaz":
        return msgs.common.documents.reportTitle;
      default:
        return docType?.toUpperCase() || "—";
    }
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
          <td className="px-4 py-3 capitalize">{item.semester}</td>
          <td className="px-4 py-3">{item.datum_zaciatku}</td>
          <td className="px-4 py-3">{item.datum_konca}</td>

          {document && (
            <>
              <td className="px-4 py-3">{renderStavBadge(String(item.stav))}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setDocPreview(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-900 transition hover:bg-primary-50"
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
                variant="success"
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
          <h2 className="text-3xl font-semibold text-primary-900">{title}</h2>
          <p className="text-sm text-primary-700">{subTitle}</p>
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
              className="border rounded px-3 py-2 text-sm"
            />

            <Select<Semester>
              name="semester"
              value={semesterValue}
              options={semesterOpts}
              emptyOptionLabel={msgs.common.date.semester}
              className="border rounded px-3 py-2 text-sm"
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
              className="border rounded px-3 py-2 text-sm"
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
                <Button type="button" onClick={onResetFilters} variant="ghost" className="flex-1">
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
          <table className="min-w-full bg-white border border-gray-100">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-600">
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
                  {docPreview.rok} • {docPreview.semester}
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
                  const status = documentStatusInfo(doc);
                  return (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">
                            {documentTypeLabel(doc.typ_dokumentu)}
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
