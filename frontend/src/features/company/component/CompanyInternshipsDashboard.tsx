"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { Table } from "@components/table";
import { useLocalization } from "@i18n/client";

import PendingInternships from "./components/PendingInternships";
import CompanyDocumentsCard from "./components/CompanyDocumentsCard";

import { TABLE_NAMES } from "src/constants/Table";

import {
  useCompanyInternshipsQuery,
  extractInternships,
} from "src/hook/useCompanyInternshipsQuery";
import { TableFilters, SEMESTER_OPTIONS, STAV_OPTIONS } from "@shared-types/index";
import { getErrorMessage } from "@utils/errorActions";

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

  const getLoadInternshipsErrorMessage = useCallback(
    (err: unknown) => getErrorMessage(err, errorLoadInternships),
    [errorLoadInternships],
  );

  // warning sa zobrazí, keď je error (effect je lint-clean)
  useEffect(() => {
    if (!error) return;

    notifyWarning({
      title: errorLoadInternships,
      description: getLoadInternshipsErrorMessage(error),
    });
  }, [error, notifyWarning, errorLoadInternships, getLoadInternshipsErrorMessage]);

  const errorText = error ? getLoadInternshipsErrorMessage(error) : null;

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
