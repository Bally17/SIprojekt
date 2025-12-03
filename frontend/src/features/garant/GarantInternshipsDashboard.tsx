"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { getAccessToken } from "@lib/api-client";
import { Company } from "@type/backend/Company";
import { GarantInternshipUpdate } from "@type/backend/GarantInternshipUpdate";
import { Internship } from "@type/backend/Internship";
import { StudentProfile } from "@type/backend/StudentProfile";
import {
  Stav,
  STAV_OPTIONS,
  STAV_LABEL,
  SEMESTER_LABEL,
  STAV_BADGE_CLASS,
} from "@type/props/common/StateInternship";
import { METHOD, useApi } from "src/hook/useApi";

// Default prázdne filtre – slúžia aj na resetovanie formulára.
const DEFAULT_FILTERS = {
  rok: "",
  firma: "",
  student: "",
  odbor: "",
  stav: "",
};

const buildQueryString = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== "") {
      searchParams.append(key, value);
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

type Filters = typeof DEFAULT_FILTERS;
type GarantInternship = Internship;

type StudentSearchResponse = { results?: StudentProfile[] } | StudentProfile[];
type CompanySearchResponse = { results?: Company[] } | Company[];

type GarantInternshipsApiResponse =
  | { results?: GarantInternship[]; internships?: GarantInternship[] }
  | GarantInternship[];

const normalizeInternships = (response: GarantInternshipsApiResponse | null | undefined) => {
  if (!response) return [] as GarantInternship[];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.internships)) return response.internships;
  return [] as GarantInternship[];
};

const normalizeStudentSearchResponse = (res: StudentSearchResponse): StudentProfile[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.results)) return res.results;
  return [];
};

const normalizeCompanySearchResponse = (res: CompanySearchResponse): Company[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.results)) return res.results;
  return [];
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
  if (fallback !== undefined && fallback !== null) {
    return `#${fallback}`;
  }
  return "";
};

const parseNumberOrFallback = (value: string, fallback: number) => {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildEditPayload = (
  form: GarantInternshipUpdate,
  current: GarantInternship,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  const studentValue = parseNumberOrFallback(form.student_id, current.student);
  if (studentValue > 0) {
    payload.student_id = studentValue;
  }

  const companyValue = form.firma_id.trim().length
    ? parseNumberOrFallback(form.firma_id, current.firma ?? 0)
    : (current.firma ?? 0);

  if (companyValue > 0) {
    payload.firma_id = companyValue;
  }

  if (form.datum_zaciatku) {
    payload.datum_zaciatku = form.datum_zaciatku;
  }
  if (form.datum_konca) {
    payload.datum_konca = form.datum_konca;
  }
  if (form.stav) {
    payload.stav = form.stav;
  }

  const note = form.status_note.trim();
  if (note.length) {
    payload.status_note = note;
  }

  // Garant môže obísť bloky na chýbajúce dokumenty
  payload.force = true;

  return payload;
};

const getErrorMessage = (err: any, fallback: string) => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (data.message) return data.message;
  return fallback;
};

// Typ pre msgs, aby sme ho mohli posielať do child komponentu
type Messages = ReturnType<typeof useLocalization>["msgs"];

type TableSectionProps = {
  internships: GarantInternship[];
  loading: boolean;
  tableErrorMessage: string | null;
  msgs: Messages;
  onEdit: (internship: GarantInternship) => void;
};

const GarantInternshipsTableSection = ({
  internships,
  loading,
  tableErrorMessage,
  msgs,
  onEdit,
}: TableSectionProps) => {
  let body: JSX.Element;

  if (loading) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-500">
          {msgs.common.loading.internships}
        </td>
      </tr>
    );
  } else if (tableErrorMessage) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-red-600">
          {tableErrorMessage}
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
        {internships.map((internship) => (
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
            <td className="px-4 py-4 text-sm text-ink-900">{internship.study_program || "—"}</td>
            <td className="px-4 py-4 text-sm text-ink-900">
              <div>{`${internship.rok} · ${
                SEMESTER_LABEL[internship.semester] ?? internship.semester
              }`}</div>
              <div className="text-xs text-ink-400">
                {internship.datum_zaciatku} – {internship.datum_konca}
              </div>
            </td>
            <td className="px-4 py-4 text-sm">
              <span
                className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                  internship.stav ? STAV_BADGE_CLASS[internship.stav] : "bg-gray-100 text-gray-600"
                }`}
              >
                {internship.stav ? STAV_LABEL[internship.stav] : internship.stav}
              </span>
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center justify-start">
                <button
                  type="button"
                  onClick={() => onEdit(internship)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary-200 bg-white text-primary-900 transition hover:bg-primary-50"
                  aria-label={`${msgs.common.guarant.edit.title} #${internship.id}`}
                >
                  <Icon name="pencil" className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
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
          <tbody className="divide-y divide-gray-100">{body}</tbody>
        </table>
      </div>
    </section>
  );
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

  const [editingInternship, setEditingInternship] = useState<GarantInternship | null>(null);
  const [editForm, setEditForm] = useState<GarantInternshipUpdate | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<StudentProfile[]>([]);
  const [companyOptions, setCompanyOptions] = useState<Company[]>([]);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [selectedCompanyLabel, setSelectedCompanyLabel] = useState("");
  const [exporting, setExporting] = useState(false);

  const apiFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(queryFilters)
          .filter(([, value]) => value !== "")
          .map(([key, value]) => [key, value]),
      ) as Record<string, string>,
    [queryFilters],
  );

  // useApi – načítanie praxí garanta
  const {
    loading: internshipsLoading,
    error: internshipsError,
    execute: executeInternships,
  } = useApi<GarantInternshipsApiResponse, void, Record<string, string>>({
    url: "/internships/garant/internships/",
    method: METHOD.GET,
  });

  // useApi – PATCH update praxe
  const { loading: editSaving, execute: executeEditInternship } = useApi<
    unknown,
    Record<string, unknown>,
    {}
  >({
    url: "/internships/garant/internships/",
    method: METHOD.PATCH,
  });

  // useApi – vyhľadávanie študentov
  const { loading: studentSearchLoading, execute: executeStudentSearch } = useApi<
    StudentSearchResponse,
    void,
    { q: string }
  >({
    url: "/users/students/search/",
    method: METHOD.GET,
    onSuccess: (res) => {
      setStudentOptions(normalizeStudentSearchResponse(res));
    },
    onError: () => {
      setStudentOptions([]);
    },
  });

  // useApi – vyhľadávanie firiem
  const { loading: companySearchLoading, execute: executeCompanySearch } = useApi<
    CompanySearchResponse,
    void,
    { q: string }
  >({
    url: "/companies/search/",
    method: METHOD.GET,
    onSuccess: (res) => {
      setCompanyOptions(normalizeCompanySearchResponse(res));
    },
    onError: () => {
      setCompanyOptions([]);
    },
  });

  // prvé načítanie + reload pri zmene filtrov
  useEffect(() => {
    const load = async () => {
      try {
        const response = await executeInternships({ params: apiFilters });
        const normalized = normalizeInternships(response);
        setInternships(normalized);
      } catch (error: any) {
        const description = getErrorMessage(error, msgs.common.error.errorLoadInternships);
        notifyWarning({
          title: msgs.common.error.errorLoadInternships,
          description,
        });
      }
    };
    void load();
  }, [apiFilters, executeInternships, msgs.common.error.errorLoadInternships, notifyWarning]);

  const tableErrorMessage = internshipsError
    ? getErrorMessage(internshipsError, msgs.common.error.errorLoadInternships)
    : null;

  // Vyhľadávanie študentov (debounce + abort) cez useApi
  useEffect(() => {
    if (!editingInternship) return;
    const query = studentSearch.trim();
    if (query.length < 2) {
      setStudentOptions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void executeStudentSearch({
        params: { q: query },
        signal: controller.signal,
      });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [editingInternship, studentSearch, executeStudentSearch]);

  // Vyhľadávanie firiem (debounce + abort) cez useApi
  useEffect(() => {
    if (!editingInternship) return;
    const query = companySearch.trim();
    if (query.length < 2) {
      setCompanyOptions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void executeCompanySearch({
        params: { q: query },
        signal: controller.signal,
      });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [editingInternship, companySearch, executeCompanySearch]);

  // Lokálne ovládanie filtrov vo formulári (hodnoty sa aplikujú až po potvrdení)
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Po kliknutí na „Filtrovať“ uloží aktuálne hodnoty a tým pádom sa zmenia apiFilters → nový fetch
  const handleApplyFilters = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setQueryFilters(filters);
  };

  // Reset filtrov do pôvodného stavu
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setQueryFilters(DEFAULT_FILTERS);
  };

  // Dodatočné klientské filtrovanie
  const filteredInternships = useMemo(() => {
    if (!Array.isArray(internships)) return [];
    const { firma, student, odbor, rok, stav } = queryFilters;
    return internships.filter((internship) => {
      const matchFirma = firma
        ? (internship.company_name || "").toLowerCase().includes(firma.toLowerCase())
        : true;
      const matchStudent = student
        ? (internship.student_full_name || "").toLowerCase().includes(student.toLowerCase())
        : true;
      const matchOdbor = odbor
        ? (internship.study_program || "").toLowerCase().includes(odbor.toLowerCase())
        : true;
      const matchYear = rok ? String(internship.rok) === rok.trim() : true;
      const matchState = stav ? internship.stav === stav : true;
      return matchFirma && matchStudent && matchOdbor && matchYear && matchState;
    });
  }, [internships, queryFilters]);

  const handleExport = async () => {
    setExporting(true);
    notifyInfo({
      title: msgs.common.guarant.exportTitle,
      description: msgs.common.guarant.exportPending,
    });

    try {
      const qs = buildQueryString(apiFilters);
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

      const res = await fetch(`${baseURL}/internships/garant/internships/export/${qs}`, {
        headers: {
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
      });

      if (!res.ok) {
        let errorBody: any = {};
        try {
          errorBody = await res.json();
        } catch {
          // noop
        }
        const description =
          errorBody?.error || errorBody?.detail || msgs.common.guarant.exportError;

        const error = new Error(description);
        (error as any).status = res.status;
        (error as any).body = errorBody;

        throw error;
      }

      const disposition = res.headers.get("content-disposition") || "";
      const filenameRegex = /filename\*?=(?:UTF-8''|")?([^\";]+)/i;
      const filenameMatch = filenameRegex.exec(disposition);

      const filename = filenameMatch?.[1]
        ? decodeURIComponent(filenameMatch[1])
        : "internships_export.csv";

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifySuccess({
        title: msgs.common.guarant.exportTitle,
        description: msgs.common.guarant.exportSuccess,
      });
    } catch (err: any) {
      const description =
        err?.description || err?.error || err?.detail || msgs.common.guarant.exportError;
      notifyWarning({ title: msgs.common.guarant.exportError, description });
    } finally {
      setExporting(false);
    }
  };

  const openEditModal = (internship: GarantInternship) => {
    setEditingInternship(internship);
    setEditForm({
      datum_zaciatku: internship.datum_zaciatku,
      datum_konca: internship.datum_konca,
      stav: (internship.stav as Stav) ?? STAV_OPTIONS[0].value,
      student_id: internship.student ? String(internship.student) : "",
      firma_id: internship.firma ? String(internship.firma) : "",
      status_note: "",
    });

    const studentLabel =
      internship.student_full_name ||
      internship.student_email ||
      (internship.student ? `#${internship.student}` : "");
    const companyLabel =
      internship.company_name ||
      (typeof internship.firma === "number" ? `#${internship.firma}` : "");

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
      return { ...prev, [name]: value } as GarantInternshipUpdate;
    });
  };

  const handleStudentSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearch(event.target.value);
  };

  const handleCompanySearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCompanySearch(event.target.value);
  };

  const handleSelectStudent = (option: StudentProfile) => {
    setEditForm((prev) => (prev ? { ...prev, student_id: String(option.id) } : prev));
    const label = getStudentLabel(option, option.id);
    setSelectedStudentLabel(label);
    setStudentSearch(label);
    setStudentOptions([]);
  };

  const handleSelectCompany = (option: Company) => {
    setEditForm((prev) => (prev ? { ...prev, firma_id: String(option.id) } : prev));
    const label = getCompanyLabel(option, option.id);
    setSelectedCompanyLabel(label);
    setCompanySearch(label);
    setCompanyOptions([]);
  };

  // PATCH na backend – použitie useApi + urlOverride
  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingInternship || !editForm) return;

    setEditError(null);

    const payload = buildEditPayload(editForm, editingInternship);

    if (Object.keys(payload).length === 1 && payload.force === true) {
      setEditError(msgs.common.guarant.edit.nothingToUpdate);
      return;
    }

    try {
      await executeEditInternship({
        body: payload,
        urlOverride: `/internships/garant/internships/${editingInternship.id}/`,
      });

      notifySuccess({
        title: msgs.common.guarant.edit.title,
        description: msgs.common.guarant.edit.success,
      });

      // reload dát cez useApi
      const response = await executeInternships({ params: apiFilters });
      const normalized = normalizeInternships(response);
      setInternships(normalized);

      closeEditModal();
    } catch (error: any) {
      const description = getErrorMessage(error, msgs.common.guarant.edit.error);
      setEditError(description);
      notifyWarning({ title: msgs.common.guarant.edit.error, description });
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

        {/* Hlavná tabuľka s praxami – extrahovaná sekcia */}
        <GarantInternshipsTableSection
          internships={filteredInternships}
          loading={internshipsLoading}
          tableErrorMessage={tableErrorMessage}
          msgs={msgs}
          onEdit={openEditModal}
        />

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
            disabled={exporting}
            aria-busy={exporting}
            className={`inline-flex items-center justify-center rounded-md border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-900 transition ${
              exporting ? "cursor-not-allowed opacity-60" : "hover:bg-white"
            }`}
          >
            {exporting ? msgs.common.guarant.exporting : msgs.common.guarant.exportButton}
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
                              {[option.kontakt_meno, option.kontakt_email]
                                .filter(Boolean)
                                .join(" • ")}
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
                    name="status_note"
                    value={editForm.status_note}
                    onChange={handleEditFieldChange}
                    placeholder={msgs.common.guarant.edit.statusNotePlaceholder}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  />
                  <p className="mt-1 text-xs text-ink-400">
                    {msgs.common.guarant.edit.statusNoteHint}
                  </p>
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
