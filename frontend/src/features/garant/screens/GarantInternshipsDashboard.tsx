"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { getAccessToken } from "@lib/ApiProvider";
import { Nullable, StringOrNull, Stav } from "@shared-types/index";
import { Internship, GarantInternshipUpdate } from "@shared-types/internship";
import { BASE_URL } from "@constants";
import {
  useGarantInternshipsQuery,
  useStudentSearchQuery,
  useCompanySearchQuery,
  useUpdateGarantInternshipMutation,
} from "../hooks";
import {
  GarantFiltersForm,
  GarantInternshipsTableSection,
  GarantExportSection,
  GarantEditModal,
} from "../_components";

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

  const handleEditInput = (name: keyof GarantInternshipUpdate, value: string | Stav) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateMutation = useUpdateGarantInternshipMutation();

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleFilterChange = (name: keyof Filters, value: string) => {
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const applyFilters = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const handleSelectStudent = (id: number, label: string) => {
    setEditForm((f) => ({ ...f, student_id: String(id) }));
    setStudentQuery(label);
  };

  const handleSelectCompany = (id: number, label: string) => {
    setEditForm((f) => ({ ...f, firma_id: String(id) }));
    setCompanyQuery(label);
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
      <GarantFiltersForm
        filters={filters}
        msgs={msgs}
        onChange={handleFilterChange}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {/* TABLE */}
      <GarantInternshipsTableSection
        internships={filteredInternships}
        loading={internshipsQuery.isLoading}
        errorMessage={internshipsQuery.error ? msgs.common.error.errorLoadInternships : null}
        msgs={msgs}
        onEdit={openEditModal}
      />

      {/* EXPORT */}
      <GarantExportSection exporting={exporting} msgs={msgs} onExport={handleExport} />

      <GarantEditModal
        internship={editingInternship}
        editForm={editForm}
        editError={editError}
        msgs={msgs}
        studentQuery={studentQuery}
        companyQuery={companyQuery}
        onClose={closeEditModal}
        onSubmit={handleSubmitEdit}
        onEditInput={handleEditInput}
        onStudentQueryChange={setStudentQuery}
        onCompanyQueryChange={setCompanyQuery}
        onSelectStudent={handleSelectStudent}
        onSelectCompany={handleSelectCompany}
        studentSearch={{ isFetching: studentSearch.isFetching, data: studentSearch.data }}
        companySearch={{ isFetching: companySearch.isFetching, data: companySearch.data }}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
