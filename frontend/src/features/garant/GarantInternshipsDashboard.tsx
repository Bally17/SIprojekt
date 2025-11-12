"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";
import {
  SEMESTER_LABEL,
  STAV_BADGE_CLASS,
  STAV_LABEL,
  STAV_OPTIONS,
  type Stav,
} from "@/shared/types/internship/components/StateInternship";
import type { Internship } from "@/shared/types/internship/internship";
import Icon from "@/shared/icons";

// Default prázdne filtre – slúžia aj na resetovanie formulára.
const DEFAULT_FILTERS = {
  rok: "",
  firma: "",
  student: "",
  odbor: "",
  stav: "",
};

type Filters = typeof DEFAULT_FILTERS;

type GarantInternship = Internship;

type EditFormState = {
  datum_zaciatku: string;
  datum_konca: string;
  stav: Stav;
  studentId: string;
  companyId: string;
  statusNote: string;
};

type StudentOption = {
  id: number;
  meno?: string | null;
  priezvisko?: string | null;
  email?: string | null;
  studijny_program?: string | null;
};

type CompanyOption = {
  id: number;
  nazov: string;
  kontakt_meno?: string | null;
  kontakt_email?: string | null;
};

const getStudentLabel = (
  data: { meno?: string | null; priezvisko?: string | null; email?: string | null } | null,
  fallback?: number | string | null,
) => {
  if (!data && !fallback) return "";
  const name = `${data?.meno ?? ""} ${data?.priezvisko ?? ""}`.trim();
  if (name.length) return name;
  if (data?.email) return data.email;
  if (fallback) return `#${fallback}`;
  return "";
};

const getCompanyLabel = (
  data: { nazov?: string | null } | null,
  fallback?: number | string | null,
) => {
  if (!data && !fallback) return "";
  if (data?.nazov) return data.nazov;
  if (typeof fallback !== "undefined" && fallback !== null) {
    return `#${fallback}`;
  }
  return "";
};

export default function GarantInternshipsDashboard() {
  const { msgs } = useLocalization();
  const {
    success: notifySuccess,
    warning: notifyWarning,
    info: notifyInfo,
  } = useSystemNotifications();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [queryFilters, setQueryFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [internships, setInternships] = useState<GarantInternship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInternship, setEditingInternship] = useState<GarantInternship | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [companySearchLoading, setCompanySearchLoading] = useState(false);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [selectedCompanyLabel, setSelectedCompanyLabel] = useState("");

  // Načíta všetky praxe podľa aktuálne aplikovaných filtrov
  const fetchInternships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(queryFilters)
          .filter(([, value]) => value !== "")
          .map(([key, value]) => [key, value]),
      );

      const response = await axiosClient.get("/internships/garant/internships/", { params });
      const rawPayload =
        response.data?.results ??
        response.data?.internships ??
        (Array.isArray(response.data) ? response.data : []);
      const payload = Array.isArray(rawPayload) ? rawPayload : [];
      setInternships(payload as GarantInternship[]);
    } catch (err: any) {
      const description =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        msgs.common.error.errorLoadInternships;
      setError(description);
      notifyWarning({ title: msgs.common.error.errorLoadInternships, description });
    } finally {
      setLoading(false);
    }
  }, [queryFilters, msgs.common.error.errorLoadInternships, notifyWarning]);

  // Prvé načítanie hneď po prihlásení/otvorení dashboardu
  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  useEffect(() => {
    if (!editingInternship) return;
    const query = studentSearch.trim();
    if (query.length < 2) {
      setStudentOptions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setStudentSearchLoading(true);
      axiosClient
        .get("/users/students/search/", {
          params: { q: query },
          signal: controller.signal,
        })
        .then((response) => {
          const results = Array.isArray(response.data?.results) ? response.data.results : [];
          setStudentOptions(results);
        })
        .catch(() => {
          setStudentOptions([]);
        })
        .finally(() => {
          setStudentSearchLoading(false);
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [editingInternship, studentSearch]);

  useEffect(() => {
    if (!editingInternship) return;
    const query = companySearch.trim();
    if (query.length < 2) {
      setCompanyOptions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setCompanySearchLoading(true);
      axiosClient
        .get("/companies/search/", {
          params: { q: query },
          signal: controller.signal,
        })
        .then((response) => {
          const results = Array.isArray(response.data?.results) ? response.data.results : [];
          setCompanyOptions(results);
        })
        .catch(() => {
          setCompanyOptions([]);
        })
        .finally(() => {
          setCompanySearchLoading(false);
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [editingInternship, companySearch]);

  // Lokálne ovládanie filtrov vo formulári (hodnoty sa aplikujú až po potvrdení)
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Po kliknutí na „Filtrovať“ uloží aktuálne hodnoty a spustí fetch
  const handleApplyFilters = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setQueryFilters(filters);
  };

  // Reset filtrov do pôvodného stavu
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setQueryFilters(DEFAULT_FILTERS);
  };

  // Dodatočné klientské filtrovanie – textové polia, rok aj stav sa kombinujú klientsky.
  const filteredInternships = useMemo(() => {
    if (!Array.isArray(internships)) return [];
    return internships.filter((internship) => {
      const matchFirma = filters.firma
        ? (internship.company_name || "").toLowerCase().includes(filters.firma.toLowerCase())
        : true;
      const matchStudent = filters.student
        ? (internship.student_full_name || "").toLowerCase().includes(filters.student.toLowerCase())
        : true;
      const matchOdbor = filters.odbor
        ? (internship.study_program || "").toLowerCase().includes(filters.odbor.toLowerCase())
        : true;
      const matchYear = filters.rok ? String(internship.rok) === filters.rok.trim() : true;
      const matchState = filters.stav ? internship.stav === filters.stav : true;
      return matchFirma && matchStudent && matchOdbor && matchYear && matchState;
    });
  }, [internships, filters.firma, filters.student, filters.odbor, filters.rok, filters.stav]);

  const handleExport = () => {
    notifyInfo({
      title: msgs.common.guarant.exportTitle,
      description: msgs.common.guarant.exportPending,
    });
  };

  // Pripraví modálne okno s údajmi vybranej praxe – hodnoty zobrazíme aj v editačnom formulári.
  const openEditModal = (internship: GarantInternship) => {
    setEditingInternship(internship);
    setEditForm({
      datum_zaciatku: internship.datum_zaciatku,
      datum_konca: internship.datum_konca,
      stav: internship.stav,
      studentId: internship.student ? String(internship.student) : "",
      companyId: internship.firma ? String(internship.firma) : "",
      statusNote: "",
    });
    const studentLabel =
      internship.student_full_name || internship.student_email || (internship.student ? `#${internship.student}` : "");
    const companyLabel =
      internship.company_name || (typeof internship.firma === "number" ? `#${internship.firma}` : "");
    setStudentSearch(studentLabel);
    setCompanySearch(companyLabel);
    setSelectedStudentLabel(studentLabel);
    setSelectedCompanyLabel(companyLabel);
    setStudentOptions([]);
    setCompanyOptions([]);
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingInternship(null);
    setEditForm(null);
    setEditSaving(false);
    setEditError(null);
    setStudentOptions([]);
    setCompanyOptions([]);
    setStudentSearch("");
    setCompanySearch("");
    setSelectedStudentLabel("");
    setSelectedCompanyLabel("");
  };

  const handleEditFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => {
      if (!prev) return prev;
      if (name === "stav") {
        return { ...prev, stav: value as Stav };
      }
      return { ...prev, [name]: value } as EditFormState;
    });
  };

  const handleStudentSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearch(event.target.value);
  };

  const handleCompanySearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCompanySearch(event.target.value);
  };

  const handleSelectStudent = (option: StudentOption) => {
    setEditForm((prev) => (prev ? { ...prev, studentId: String(option.id) } : prev));
    const label = getStudentLabel(option, option.id);
    setSelectedStudentLabel(label);
    setStudentSearch(label);
    setStudentOptions([]);
  };

  const handleSelectCompany = (option: CompanyOption) => {
    setEditForm((prev) => (prev ? { ...prev, companyId: String(option.id) } : prev));
    const label = getCompanyLabel(option, option.id);
    setSelectedCompanyLabel(label);
    setCompanySearch(label);
    setCompanyOptions([]);
  };

  // PATCH na backend – prepíše všetky editované atribúty (vrátane študenta/firmy) a obnoví tabuľku.
  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingInternship || !editForm) return;

    setEditSaving(true);
    setEditError(null);

    const parseNumber = (value: string, fallback: number) => {
      if (!value.trim()) return fallback;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const payload: Record<string, unknown> = {};

    const studentValue = parseNumber(editForm.studentId, editingInternship.student);
    if (!Number.isNaN(studentValue) && studentValue > 0) {
      payload.student_id = studentValue;
    }

    const companyValue = editForm.companyId.trim().length
      ? parseNumber(editForm.companyId, editingInternship.firma ?? 0)
      : editingInternship.firma ?? 0;
    if (!Number.isNaN(companyValue) && companyValue > 0) {
      payload.firma_id = companyValue;
    }

    if (editForm.datum_zaciatku) {
      payload.datum_zaciatku = editForm.datum_zaciatku;
    }
    if (editForm.datum_konca) {
      payload.datum_konca = editForm.datum_konca;
    }
    if (editForm.stav) {
      payload.stav = editForm.stav;
    }
    const note = editForm.statusNote.trim();
    if (note.length) {
      payload.status_note = note;
    }

    if (Object.keys(payload).length === 0) {
      setEditError(msgs.common.guarant.edit.nothingToUpdate);
      setEditSaving(false);
      return;
    }

    try {
      await axiosClient.patch(`/internships/garant/internships/${editingInternship.id}/`, payload);
      notifySuccess({
        title: msgs.common.guarant.edit.title,
        description: msgs.common.guarant.edit.success,
      });
      await fetchInternships();
      closeEditModal();
    } catch (err: any) {
      const description =
        err?.response?.data?.error || err?.response?.data?.detail || msgs.common.guarant.edit.error;
      setEditError(description);
      notifyWarning({ title: msgs.common.guarant.edit.error, description });
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-10">
        {/* Filter panel */}
        <section className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-3xl font-semibold text-primary-900">
              {msgs.common.guarant.filtersTitle}
            </p>
            <p className="text-sm text-ink-500">{msgs.common.guarant.filtersDescription}</p>
          </div>
          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.guarant.filters.year}
              </label>
              <input
                type="number"
                name="rok"
                value={filters.rok}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
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
                placeholder={msgs.common.guarant.filters.companyPlaceholder}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
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
                placeholder={msgs.common.guarant.filters.studentPlaceholder}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
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
                placeholder={msgs.common.guarant.filters.fieldPlaceholder}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.guarant.filters.state}
              </label>
              <select
                name="stav"
                value={filters.stav}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
              >
                <option value="">{msgs.common.guarant.filters.statePlaceholder}</option>
                {STAV_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {STAV_LABEL[option.value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 rounded-md bg-primary-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"
              >
                {msgs.common.filter}
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-gray-50"
              >
                {msgs.common.reset}
              </button>
            </div>
          </form>
        </section>

        {/* Hlavná tabuľka s praxami */}
        <section className="space-y-4 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-3xl font-semibold text-primary-900">
              {msgs.common.guarant.tableTitle}
            </h2>
            <p className="text-sm text-ink-500">{msgs.common.guarant.tableSubtitle}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.guarant.table.student}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.guarant.table.company}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.guarant.table.program}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.guarant.table.term}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.internships.state}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.guarant.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-500">
                      {msgs.common.loading.internships}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredInternships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-400">
                      {msgs.common.error.errorFilterLoad}
                    </td>
                  </tr>
                ) : (
                  filteredInternships.map((internship) => {
                    return (
                      <tr key={internship.id}>
                        <td className="px-4 py-4 text-sm text-ink-900">
                          <div className="font-semibold">
                            {internship.student_full_name || `#${internship.student}`}
                          </div>
                          <div className="text-xs text-ink-400">{internship.student_email}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-ink-900">
                          {internship.company_name || msgs.common.entities.company}
                        </td>
                        <td className="px-4 py-4 text-sm text-ink-900">
                          {internship.study_program || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-ink-900">
                          <div>{`${internship.rok} · ${SEMESTER_LABEL[internship.semester] ?? internship.semester}`}</div>
                          <div className="text-xs text-ink-400">
                            {internship.datum_zaciatku} – {internship.datum_konca}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                              STAV_BADGE_CLASS[internship.stav as Stav] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STAV_LABEL[internship.stav] || internship.stav}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center justify-start">
                            <button
                              type="button"
                              onClick={() => openEditModal(internship)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary-200 bg-white text-primary-900 transition hover:bg-primary-50"
                              aria-label={`${msgs.common.guarant.edit.trigger} #${internship.id}`}
                            >
                              <Icon name="pencil" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sekcia exportu požadovaných dát */}
        <section className="flex flex-col gap-4 rounded-lg border border-primary-100 bg-primary-50/70 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-900">
              {msgs.common.guarant.exportTitle}
            </h2>
            <p className="text-sm text-primary-800">{msgs.common.guarant.exportDescription}</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-900 transition hover:bg-white"
          >
            {msgs.common.guarant.exportButton}
          </button>
        </section>
      </div>
      {/* Modál pre pokročilé úpravy jednej praxe */}
      {editingInternship && editForm ? (
        <div className="fixed inset-x-0 bottom-0 top-0 z-[10] flex items-center justify-center bg-black/40 px-4 py-10">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-primary-900">
                  {msgs.common.guarant.edit.title} #{editingInternship.id}
                </h3>
                <p className="text-sm text-ink-500">{msgs.common.guarant.edit.description}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-gray-200 p-2 text-ink-500 transition hover:bg-gray-50"
                aria-label={msgs.common.close}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">
              {msgs.common.guarant.edit.legend}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 text-sm text-ink-600 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.guarant.filters.year}
                </p>
                <p className="mt-1 font-medium text-primary-900">{editingInternship.rok}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.date.semester}
                </p>
                <p className="mt-1 font-medium text-primary-900">
                  {SEMESTER_LABEL[editingInternship.semester] ?? editingInternship.semester}
                </p>
              </div>
            </div>
            {editError ? (
              <div className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            ) : null}
            <form className="mt-4 space-y-6" onSubmit={handleSubmitEdit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.studentSearch}
                  </label>
                  <input
                    type="text"
                    name="studentSearch"
                    value={studentSearch}
                    placeholder={msgs.common.guarant.edit.studentSearchPlaceholder}
                    onChange={handleStudentSearchChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                  <p className="mt-1 text-xs text-ink-400">{msgs.common.guarant.edit.searchHint}</p>
                  {studentSearchLoading ? (
                    <p className="mt-2 text-xs text-ink-500">{msgs.common.loading.loading}</p>
                  ) : null}
                  {studentOptions.length ? (
                    <ul className="mt-2 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                      {studentOptions.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectStudent(option)}
                            className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm transition hover:bg-primary-50"
                          >
                            <span className="font-medium text-primary-900">
                              {getStudentLabel(option, option.id)}
                            </span>
                            <span className="text-xs text-ink-500">
                              {[option.email, option.studijny_program].filter(Boolean).join(" • ")}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {selectedStudentLabel ? (
                    <p className="mt-2 text-xs text-ink-500">
                      {msgs.common.guarant.edit.studentSelected}{" "}
                      <span className="font-semibold text-primary-900">{selectedStudentLabel}</span>
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.companySearch}
                  </label>
                  <input
                    type="text"
                    name="companySearch"
                    value={companySearch}
                    placeholder={msgs.common.guarant.edit.companySearchPlaceholder}
                    onChange={handleCompanySearchChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                  <p className="mt-1 text-xs text-ink-400">{msgs.common.guarant.edit.searchHint}</p>
                  {companySearchLoading ? (
                    <p className="mt-2 text-xs text-ink-500">{msgs.common.loading.loading}</p>
                  ) : null}
                  {companyOptions.length ? (
                    <ul className="mt-2 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                      {companyOptions.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectCompany(option)}
                            className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm transition hover:bg-primary-50"
                          >
                            <span className="font-medium text-primary-900">
                              {option.nazov || `#${option.id}`}
                            </span>
                            <span className="text-xs text-ink-500">
                              {[option.kontakt_meno, option.kontakt_email].filter(Boolean).join(" • ")}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {selectedCompanyLabel ? (
                    <p className="mt-2 text-xs text-ink-500">
                      {msgs.common.guarant.edit.companySelected}{" "}
                      <span className="font-semibold text-primary-900">{selectedCompanyLabel}</span>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.startDate}
                  </label>
                  <input
                    type="date"
                    name="datum_zaciatku"
                    value={editForm.datum_zaciatku}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.endDate}
                  </label>
                  <input
                    type="date"
                    name="datum_konca"
                    value={editForm.datum_konca}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.filters.state}
                  </label>
                  <select
                    name="stav"
                    value={editForm.stav}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  >
                    {STAV_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {STAV_LABEL[option.value]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.statusNote}
                  </label>
                  <textarea
                    name="statusNote"
                    value={editForm.statusNote}
                    onChange={handleEditFieldChange}
                    placeholder={msgs.common.guarant.edit.statusNotePlaceholder}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                  <p className="mt-1 text-xs text-ink-400">{msgs.common.guarant.edit.statusNoteHint}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-gray-50"
                >
                  {msgs.common.close}
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-md bg-primary-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-60"
                >
                  {editSaving ? msgs.common.loading.loading : msgs.common.guarant.edit.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
