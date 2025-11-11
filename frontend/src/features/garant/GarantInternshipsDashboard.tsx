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
  type Semester,
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
  rok: string;
  semester: Semester;
  datum_zaciatku: string;
  datum_konca: string;
  stav: Stav;
  student: string;
  firma: string;
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

      const response = await axiosClient.get("/internships/internships/", { params });
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
      rok: String(internship.rok),
      semester: internship.semester,
      datum_zaciatku: internship.datum_zaciatku,
      datum_konca: internship.datum_konca,
      stav: internship.stav,
      student: String(internship.student),
      firma: internship.firma ? String(internship.firma) : "",
    });
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingInternship(null);
    setEditForm(null);
    setEditSaving(false);
    setEditError(null);
  };

  const handleEditFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => {
      if (!prev) return prev;
      if (name === "semester") {
        return { ...prev, semester: value as Semester };
      }
      if (name === "stav") {
        return { ...prev, stav: value as Stav };
      }
      return { ...prev, [name]: value } as EditFormState;
    });
  };

  // PATCH na backend – prepíše všetky editované atribúty (vrátane študenta/firmy) a obnoví tabuľku.
  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingInternship || !editForm) return;

    setEditSaving(true);
    setEditError(null);

    const parseNumber = (value: string, fallback: number) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const payload: Record<string, unknown> = {
      rok: parseNumber(editForm.rok, editingInternship.rok),
      semester: editForm.semester,
      datum_zaciatku: editForm.datum_zaciatku,
      datum_konca: editForm.datum_konca,
      stav: editForm.stav,
      student: parseNumber(editForm.student, editingInternship.student),
    };

    const firmaValue = editForm.firma.trim().length
      ? parseNumber(editForm.firma, editingInternship.firma ?? 0)
      : editingInternship.firma;

    if (typeof firmaValue === "number" && !Number.isNaN(firmaValue) && firmaValue > 0) {
      payload.firma = firmaValue;
    }

    try {
      await axiosClient.patch(`/internships/internships/${editingInternship.id}/`, payload);
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
                          {internship.company_name || msgs.entities.company}
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
            {editError ? (
              <div className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            ) : null}
            <form className="mt-4 space-y-4" onSubmit={handleSubmitEdit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.filters.year}
                  </label>
                  <input
                    type="number"
                    name="rok"
                    value={editForm.rok}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.studentId}
                  </label>
                  <input
                    type="number"
                    name="student"
                    value={editForm.student}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.guarant.edit.companyId}
                  </label>
                  <input
                    type="number"
                    name="firma"
                    value={editForm.firma}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                </div>
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
                <div>
                  <label className="text-xs font-semibold uppercase text-ink-500">
                    {msgs.common.date.semester}
                  </label>
                  <select
                    name="semester"
                    value={editForm.semester}
                    onChange={handleEditFieldChange}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  >
                    {(Object.entries(SEMESTER_LABEL) as [Semester, string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
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
