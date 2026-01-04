"use client";

import { useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { getAccessToken } from "@lib/ApiProvider";
import {
  SEMESTER_LABEL,
  STAV_BADGE_CLASS,
  STAV_LABEL,
  Nullable,
  StringOrNull,
  Stav,
  STAV_OPTIONS,
} from "@shared-types/index";
import { Internship, GarantInternshipUpdate } from "@shared-types/internship";
import { BASE_URL } from "@constants";
import {
  useGarantInternshipsQuery,
  useStudentSearchQuery,
  useCompanySearchQuery,
  useUpdateGarantInternshipMutation,
} from "../hooks";
import { DatePicker } from "@components/datePicker";

// ---------------------------------------------
// FILTERS
// ---------------------------------------------
const DEFAULT_FILTERS = {
  rok: "",
  firma: "",
  student: "",
  odbor: "",
  stav: "",
};

type Filters = typeof DEFAULT_FILTERS;

// ---------------------------------------------
// QUERY STRING BUILDER
// ---------------------------------------------
const buildQueryString = (params: Record<string, string>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== "" && sp.append(k, v));
  return sp.toString() ? `?${sp.toString()}` : "";
};

// ---------------------------------------------
// NORMALIZÁCIA
// ---------------------------------------------
const normalizeInternships = (res: any): Internship[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.results)) return res.results;
  if (Array.isArray(res.internships)) return res.internships;
  return [];
};

// ---------------------------------------------
// TABLE COMPONENT
// ---------------------------------------------
interface GarantInternshipsTableSectionProps {
  internships: Internship[];
  loading: boolean;
  errorMessage: string | null;
  msgs: any;
  onEdit: (i: Internship) => void;
}

function GarantInternshipsTableSection({
  internships,
  loading,
  errorMessage,
  msgs,
  onEdit,
}: Readonly<GarantInternshipsTableSectionProps>) {
  let body = null;

  if (loading) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-500">
          {msgs.common.loading.internships}
        </td>
      </tr>
    );
  } else if (errorMessage) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-red-600">
          {errorMessage}
        </td>
      </tr>
    );
  } else if (!internships.length) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-400">
          {msgs.common.error.errorFilterLoad}
        </td>
      </tr>
    );
  } else {
    body = (
      <>
        {internships.map((i) => (
          <tr key={i.id}>
            <td className="px-4 py-4 text-sm text-ink-900">
              <div className="font-semibold">{i.student_full_name || `#${i.student}`}</div>
              <div className="text-xs text-ink-400">{i.student_email}</div>
            </td>

            <td className="px-4 py-4 text-sm text-ink-900">{i.company_name || "-"}</td>

            <td className="px-4 py-4 text-sm text-ink-900">{i.study_program || "-"}</td>

            <td className="px-4 py-4 text-sm text-ink-900">
              <div>
                {i.rok} - {SEMESTER_LABEL[i.semester] ?? i.semester}
              </div>
              <div className="text-xs text-ink-400">
                {i.datum_zaciatku} - {i.datum_konca}
              </div>
            </td>

            <td className="px-4 py-4 text-sm">
              <span
                className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                  i.stav ? STAV_BADGE_CLASS[i.stav] : "bg-gray-100 text-gray-600"
                }`}
              >
                {i.stav ? STAV_LABEL[i.stav] : i.stav}
              </span>
            </td>

            <td className="px-4 py-4 text-sm">
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary-600 bg-white text-primary-600 hover:bg-primary-50"
              >
                <Icon name="pencil" className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-primary-200 bg-white p-6 shadow-sm">
      <h2 className="text-3xl font-semibold text-ink-900">{msgs.common.guarant.tableTitle}</h2>
      <p className="text-sm text-ink-500">{msgs.common.guarant.tableSubtitle}</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50">
            <tr>
              {[
                msgs.common.guarant.table.student,
                msgs.common.guarant.table.company,
                msgs.common.guarant.table.program,
                msgs.common.guarant.table.term,
                msgs.common.internships.state,
                msgs.common.guarant.table.actions,
              ].map((t) => (
                <th
                  key={t}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-900"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{body}</tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------
// DASHBOARD
// ---------------------------------------------

export default function GarantInternshipsDashboard() {
  const { msgs } = useLocalization();
  const { success, warning, info } = useSystemNotifications();

  const [editingInternship, setEditingInternship] = useState<Nullable<Internship>>(null);
  const [editForm, setEditForm] = useState<GarantInternshipUpdate>({
    firma_id: "",
    student_id: "",
    datum_zaciatku: "",
    datum_konca: "",
    stav: "vytvorena",
    status_note: "",
  });

  const [editError, setEditError] = useState<StringOrNull>(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [studentQuery, setStudentQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");

  const apiFilters = useMemo(
    () =>
      Object.fromEntries(Object.entries(appliedFilters).filter(([_, v]) => v !== "")) as Record<
        string,
        string
      >,
    [appliedFilters],
  );

  // Fetch list
  const internshipsQuery = useGarantInternshipsQuery(apiFilters);
  const internships = normalizeInternships(internshipsQuery.data);

  const filteredInternships = useMemo(() => {
    const { firma, student, odbor, rok, stav } = appliedFilters;

    return internships.filter((i) => {
      const mf = firma ? (i.company_name || "").toLowerCase().includes(firma.toLowerCase()) : true;
      const ms = student
        ? (i.student_full_name || "").toLowerCase().includes(student.toLowerCase())
        : true;
      const mo = odbor ? (i.study_program || "").toLowerCase().includes(odbor.toLowerCase()) : true;
      const my = rok ? String(i.rok) === rok : true;
      const mst = stav ? i.stav === stav : true;
      return mf && ms && mo && my && mst;
    });
  }, [internships, appliedFilters]);

  // Search
  const studentSearch = useStudentSearchQuery(studentQuery, {
    enabled: editingInternship != null && studentQuery.length >= 2,
  });

  const companySearch = useCompanySearchQuery(companyQuery, {
    enabled: editingInternship != null && companyQuery.length >= 2,
  });

  // ---------------------------------------------
  // EDIT HANDLING
  // ---------------------------------------------
  const openEditModal = (i: Internship) => {
    setEditingInternship(i);

    setEditForm({
      datum_zaciatku: i.datum_zaciatku,
      datum_konca: i.datum_konca,
      stav: i.stav as Stav,
      student_id: i.student ? String(i.student) : "",
      firma_id: i.firma ? String(i.firma) : "",
      status_note: "",
    });

    setStudentQuery(i.student_full_name || i.student_email || (i.student ? `#${i.student}` : ""));
    setCompanyQuery(i.company_name || (typeof i.firma === "number" ? `#${i.firma}` : ""));
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingInternship(null);
    setEditForm({
      firma_id: "",
      student_id: "",
      datum_zaciatku: "",
      datum_konca: "",
      stav: "vytvorena",
      status_note: "",
    });
    setEditError(null);
    setStudentQuery("");
    setCompanyQuery("");
  };

  const handleEditInput = (e: any) => {
    const { name, value } = e.target;
    if (!editForm) return;
    setEditForm({ ...editForm, [name]: value });
  };

  const updateMutation = useUpdateGarantInternshipMutation();

  const handleSubmitEdit = async (e: any) => {
    e.preventDefault();
    if (!editingInternship || !editForm) return;

    try {
      await updateMutation.mutateAsync({
        id: editingInternship.id,
        payload: editForm,
      });

      success({
        title: msgs.common.guarant.edit.title,
        description: msgs.common.guarant.edit.success,
      });

      internshipsQuery.refetch();
      closeEditModal();
    } catch (err: any) {
      const errorMsg = err?.message || msgs.common.guarant.edit.error;
      setEditError(errorMsg);
      warning({ title: msgs.common.guarant.edit.error, description: errorMsg });
    }
  };

  // ---------------------------------------------
  // FILTER HANDLER
  // ---------------------------------------------

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const applyFilters = (e?: any) => {
    e?.preventDefault();
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  // ---------------------------------------------
  // EXPORT
  // ---------------------------------------------
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      info({
        title: msgs.common.guarant.exportTitle,
        description: msgs.common.guarant.exportPending,
      });

      const qs = buildQueryString(apiFilters);

      const res = await fetch(`${BASE_URL}/internships/garant/internships/export/${qs}`, {
        headers: {
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "internships_export.csv";
      link.click();

      URL.revokeObjectURL(url);

      success({
        title: msgs.common.guarant.exportTitle,
        description: msgs.common.guarant.exportSuccess,
      });
    } catch {
      warning({ title: msgs.common.guarant.exportError });
    } finally {
      setExporting(false);
    }
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  return (
    <div className="space-y-10">
      {/* FILTER PANEL */}
      <section className="space-y-6 rounded-lg border border-primary-200 bg-white p-6 shadow-sm">
        <p className="text-3xl font-semibold text-ink-900">{msgs.common.guarant.filtersTitle}</p>
        <p className="text-sm text-ink-500">{msgs.common.guarant.filtersDescription}</p>

        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          onSubmit={applyFilters}
        >
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.year}
            </label>
            <input
              type="number"
              name="rok"
              value={filters.rok}
              onChange={handleFilterChange}
              className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.company}
            </label>
            <input
              type="text"
              name="firma"
              value={filters.firma}
              onChange={handleFilterChange}
              className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.student}
            </label>
            <input
              type="text"
              name="student"
              value={filters.student}
              onChange={handleFilterChange}
              className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.field}
            </label>
            <input
              type="text"
              name="odbor"
              value={filters.odbor}
              onChange={handleFilterChange}
              className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.state}
            </label>
            <select
              name="stav"
              value={filters.stav}
              onChange={handleFilterChange}
              className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{msgs.common.guarant.filters.statePlaceholder}</option>
              {STAV_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {STAV_LABEL[o.value]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {msgs.common.filter}
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 rounded-md border border-primary-600 text-primary-600 px-4 py-2 text-sm font-semibold"
            >
              {msgs.common.reset}
            </button>
          </div>
        </form>
      </section>

      {/* TABLE */}
      <GarantInternshipsTableSection
        internships={filteredInternships}
        loading={internshipsQuery.isLoading}
        errorMessage={internshipsQuery.error ? msgs.common.error.errorLoadInternships : null}
        msgs={msgs}
        onEdit={openEditModal}
      />

      {/* EXPORT */}
      <section className="flex flex-col gap-4 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/70 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary-900">
            {msgs.common.guarant.exportTitle}
          </h2>
          <p className="text-sm text-primary-800">{msgs.common.guarant.exportDescription}</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center justify-center rounded-md border border-primary-600 px-4 py-2 text-sm text-primary-600 font-semibold disabled:opacity-60"
        >
          {exporting ? msgs.common.guarant.exporting : msgs.common.guarant.exportButton}
        </button>
      </section>

      {/* EDIT MODAL */}
      {editingInternship && editForm ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-ink-900">
                  {msgs.common.guarant.edit.title} #{editingInternship.id}
                </h3>
                <p className="text-sm text-ink-500">{msgs.common.guarant.edit.description}</p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border p-2 hover:bg-gray-50"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-2 text-red-700 text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="mt-6 space-y-6">
              {/* STUDENT SEARCH */}
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.guarant.edit.studentSearch}
                </label>

                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />

                {studentSearch.isFetching && (
                  <p className="text-xs text-ink-400 mt-1">{msgs.common.loading.loading}</p>
                )}

                {studentSearch.data?.length ? (
                  <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto divide-y">
                    {studentSearch.data.map((s: any) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((f) => f && { ...f, student_id: String(s.id) });
                            const label =
                              `${s.meno ?? ""} ${s.priezvisko ?? ""}`.trim() ||
                              s.email ||
                              `#${s.id}`;

                            setStudentQuery(label);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-primary-50"
                        >
                          <span className="font-medium">
                            {`${s.meno ?? ""} ${s.priezvisko ?? ""}`.trim()}
                          </span>
                          <div className="text-xs text-ink-500">{s.email}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {/* COMPANY SEARCH */}
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.guarant.edit.companySearch}
                </label>

                <input
                  type="text"
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />

                {companySearch.isFetching && (
                  <p className="text-xs text-ink-400 mt-1">{msgs.common.loading.loading}</p>
                )}

                {companySearch.data?.length ? (
                  <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto divide-y">
                    {companySearch.data.map((c: any) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((f) => f && { ...f, firma_id: String(c.id) });
                            setCompanyQuery(c.nazov || `#${c.id}`);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-primary-50"
                        >
                          <span className="font-medium">{c.nazov || `#${c.id}`}</span>
                          <div className="text-xs text-ink-500">{c.kontakt_email}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {/* DATES */}
              <DatePicker
                className="mt-1"
                startLabel={msgs.common.guarant.edit.startDate}
                endLabel={msgs.common.guarant.edit.endDate}
                startValue={editForm.datum_zaciatku}
                endValue={editForm.datum_konca}
                onChange={(field, value) => setEditForm((p) => ({ ...p, [field]: value }))}
              />

              {/* STATE */}
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.guarant.filters.state}
                </label>
                <select
                  name="stav"
                  value={editForm.stav}
                  onChange={handleEditInput}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {STAV_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {STAV_LABEL[o.value]}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATUS NOTE */}
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.guarant.edit.statusNote}
                </label>
                <textarea
                  name="status_note"
                  value={editForm.status_note}
                  onChange={handleEditInput}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                />
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md border border-primary-600 px-4 py-2 text-sm text-primary-600 font-semibold"
                >
                  {msgs.common.close}
                </button>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {updateMutation.isPending
                    ? msgs.common.loading.loading
                    : msgs.common.guarant.edit.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
