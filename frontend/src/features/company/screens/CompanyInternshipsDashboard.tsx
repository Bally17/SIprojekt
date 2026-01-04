"use client";

import { useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { Table } from "@components/table";
import { useLocalization } from "@i18n/client";
import { TableFilters, SEMESTER_OPTIONS, STAV_OPTIONS } from "@shared-types/index";
import { useQueryErrorToast } from "@utils/useQueryErrorToast";
import { CompanyDocumentsCard, PendingInternships } from "../_components";
import { TABLE_NAMES } from "@constants";
import { useCompanyInternshipsQuery, extractInternships } from "../hooks";

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

  const errorText = useQueryErrorToast({
    error,
    title: errorLoadInternships,
    fallback: errorLoadInternships,
    notifyWarning,
  });

  const internships = extractInternships(data);

  const resetFilters = () =>
    setFilters({
      rok: "",
      semester: "",
      stav: "",
    });

  return (
    <div className="space-y-10">
      <section className="bg-white shadow-sm rounded-lg p-6 space-y-4 border border-primary-100">
        <PendingInternships onChange={() => refetch()} />
      </section>

      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-primary-100">
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

      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-primary-100">
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
