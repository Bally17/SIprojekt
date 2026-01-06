"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
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

  const { watch, setValue, reset, handleSubmit } = useForm<TableFilters>({
    defaultValues: { rok: "", semester: "", stav: "" },
    mode: "onChange",
  });

  // RHF -> aktuálne hodnoty filtrov
  const filters = watch();

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

  const onApply = handleSubmit(() => {
    // apiFilters sa prepočíta z watch() a query hook ho použije;
    // refetch len znovu odpáli request
    refetch();
  });

  const onReset = () => {
    reset({ rok: "", semester: "", stav: "" });
    refetch();
  };

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
          onFiltersChange={(next) => {
            // Table ti vráti celý objekt filtrov – RHF nastavíme polia
            (Object.keys(next) as (keyof TableFilters)[]).forEach((k) => {
              setValue(k, next[k] ?? "");
            });
          }}
          onApplyFilters={onApply}
          onResetFilters={onReset}
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
