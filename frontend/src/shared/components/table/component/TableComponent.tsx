import { useLocalization } from "@/shared/i18n/client";
import TableProps, { Action } from "@/shared/types/components/table/TableProps";
import { useLoadTableData } from "@/shared/utils/actions";
import React, { FC, useState } from "react";
import { Button } from "../../button";
import { InternshipDocument } from "@/shared/types/internship/components/InternshipDocument";

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
  } = props;

  const { subTitle, title, columns } = useLoadTableData(name);
  const { msgs } = useLocalization();
  const [busy, setBusy] = useState<Record<number, Action | undefined>>({});

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
  const colSpan = Math.max(1, columns.length + extraCols);

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
              <button
                type="button"
                onClick={onApplyFilters}
                className="rounded bg-cyan-700 px-3 py-1 text-white text-sm hover:bg-cyan-800"
              >
                {msgs.common.tryAgain}
              </button>
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
    bodyRows = data.map((item) => (
      <tr key={item.id} className="border-t text-sm">
        <td className="px-4 py-3 font-medium">#{item.id}</td>
        <td className="px-4 py-3">{item.student}</td>
        <td className="px-4 py-3">{item.rok}</td>
        <td className="px-4 py-3 capitalize">{item.semester}</td>
        <td className="px-4 py-3">{item.datum_zaciatku}</td>
        <td className="px-4 py-3">{item.datum_konca}</td>

        {document && (
          <>
            <td className="px-4 py-3 capitalize">{item.stav}</td>
            <td className="px-4 py-3">
              {item.documents?.length ? (
                <div className="space-y-1">
                  {item.documents.filter(hasFileUrl).map((doc) => (
                    <a
                      key={doc.id}
                      href={buildMediaUrl(doc.subor_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-cyan-700 hover:underline"
                    >
                      {doc.typ_dokumentu.toUpperCase()}
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
          </>
        )}

        {rowActions && (
          <td className="px-4 py-3 space-x-2">
            <Button
              variant="primary"
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
    ));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-cyan-700">{title}</h2>
          <p className="text-sm text-gray-600">{subTitle}</p>
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

            <select
              name="semester"
              value={filters.semester}
              onChange={handleLocalChange}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">{msgs.common.date.semester}</option>
              {semesterOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              name="stav"
              value={filters.stav}
              onChange={handleLocalChange}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">{msgs.common.internships.state}</option>
              {stavOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onApplyFilters}
                className="flex-1 bg-cyan-700 text-white px-4 py-2 rounded text-sm hover:bg-cyan-800"
              >
                {msgs.common.filter}
              </button>
              <button
                type="button"
                onClick={onResetFilters}
                className="flex-1 border border-gray-300 text-sm rounded px-4 py-2 hover:bg-gray-100"
              >
                {msgs.common.reset}
              </button>
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
    </div>
  );
};

export default TableComponent;
