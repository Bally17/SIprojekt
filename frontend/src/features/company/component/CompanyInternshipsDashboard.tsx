"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { Table } from "@components/table";
import { useLocalization } from "@i18n/client";

import PendingInternships from "./components/PendingInternships";
import CompanyDocumentsCard from "./components/CompanyDocumentsCard";

import { TABLE_NAMES } from "src/constants/Table";
import { TableFilters } from "@type/props/table";
import { SEMESTER_OPTIONS, STAV_OPTIONS } from "@type/props/common/StateInternship";

import {
  useCompanyInternshipsQuery,
  extractInternships,
} from "src/hook/useCompanyInternshipsQuery";

export default function CompanyInternshipsDashboard() {
  const { warning: notifyWarning } = useSystemNotifications();
  const { msgs } = useLocalization();

  const errorLoadInternships = msgs.common.error.errorLoadInternships;

  const [filters, setFilters] = useState<TableFilters>({
    rok: "",
    semester: "",
    stav: "",
  });

  const apiFilters = useMemo(
    () =>
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")) as Record<
        string,
        string
      >,
    [filters],
  );

  const { data, isLoading, error, refetch } = useCompanyInternshipsQuery(apiFilters);

  const serialize = useCallback((value: unknown): string => {
    if (value == null) return "";

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map((v) => serialize(v)).join(", ");
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "[unserializable]";
      }
    }

    return "";
  }, []);

  const getErrorMessage = useCallback(
    (err: any): string => {
      const data = err?.response?.data;
      if (!data) return errorLoadInternships;
      if (typeof data === "string") return data;
      if (data.detail) return data.detail;

      const parts: string[] = [];
      for (const [k, v] of Object.entries(data)) {
        const s = serialize(v);
        if (s) parts.push(`${k}: ${s}`);
      }
      return parts.join(" | ") || errorLoadInternships;
    },
    [errorLoadInternships, serialize],
  );

  // warning sa zobrazí, keď je error (effect je lint-clean)
  useEffect(() => {
    if (!error) return;

    notifyWarning({
      title: errorLoadInternships,
      description: getErrorMessage(error),
    });
  }, [error, notifyWarning, errorLoadInternships, getErrorMessage]);

  const errorText = error ? getErrorMessage(error) : null;

  const internships = extractInternships(data);

  const resetFilters = () =>
    setFilters({
      rok: "",
      semester: "",
      stav: "",
    });

  return (
    <div className="space-y-10">
      <section className="bg-white shadow-sm rounded-lg p-6 space-y-4 border border-gray-100">
        <PendingInternships onChange={() => refetch()} />
      </section>

      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-gray-100">
        <Table
          data={internships}
          name={TABLE_NAMES.ALL_INTERNSHIPS}
          document
          showFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={() => refetch()}
          onResetFilters={resetFilters}
          semesterOptions={SEMESTER_OPTIONS}
          stavOptions={STAV_OPTIONS}
          isLoading={isLoading}
          isError={errorText}
        />
      </section>

      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-gray-100">
        <Table
          data={internships}
          name={TABLE_NAMES.COMPANY_DOCUMENTS}
          isLoading={isLoading}
          isError={errorText}
          showEmpty
          actionMessage={msgs.common.companyDocs.empty}
          columnCountOverride={5}
          renderRow={(internship) => (
            <CompanyDocumentsCard internship={internship} onChange={() => refetch()} />
          )}
        />
      </section>
    </div>
  );
}
