"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { getAccessToken } from "@lib/ApiProvider";
import { Nullable, StringOrNull } from "@shared-types/index";
import { Internship, GarantInternshipUpdate } from "@shared-types/internship";
import { BASE_URL } from "@constants";
import { useGarantInternshipsQuery, useUpdateGarantInternshipMutation } from "../hooks";
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
  const [editError, setEditError] = useState<StringOrNull>(null);

  const filtersForm = useForm<Filters>({
    defaultValues: DEFAULT_FILTERS,
    mode: "onChange",
  });

  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

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

  // ---------------------------------------------
  // EDIT HANDLING
  // ---------------------------------------------
  const openEditModal = (i: Internship) => {
    setEditingInternship(i);
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingInternship(null);
    setEditError(null);
  };

  const updateMutation = useUpdateGarantInternshipMutation();

  const handleSubmitEdit = async (values: GarantInternshipUpdate) => {
    if (!editingInternship) return;
    try {
      await updateMutation.mutateAsync({
        id: editingInternship.id,
        payload: values,
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
  const filters = filtersForm.watch();

  const applyFilters = filtersForm.handleSubmit((vals) => {
    setAppliedFilters(vals);
  });

  const resetFilters = () => {
    filtersForm.reset(DEFAULT_FILTERS);
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
      <GarantFiltersForm
        filters={filters}
        register={filtersForm.register}
        msgs={msgs}
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
        msgs={msgs}
        editError={editError}
        onClose={closeEditModal}
        onSubmit={handleSubmitEdit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
