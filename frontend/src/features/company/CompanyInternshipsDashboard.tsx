"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import PendingInternships from "@/features/company/components/PendingInternships";
import CompanyDocumentsCard from "@/features/company/components/CompanyDocumentsCard";
import { useLocalization } from "@/shared/i18n/client";
import { Table } from "@/shared/components/table";
import { TABLE_NAMES } from "@/constants/Table";
import { Internship } from "@/shared/types/internship/internship";
import { useSystemNotifications } from "@/shared/components/notifications";
import {
  SEMESTER_OPTIONS,
  STAV_OPTIONS,
} from "@/shared/types/internship/components/StateInternship";
import { TableFilters } from "@/shared/types/components/table/components/TableFilters";

type CompanyInternshipsResponse = {
  firma: {
    id: number;
    email: string;
    meno?: string | null;
    priezvisko?: string | null;
  };
  internships: Internship[];
};

type PaginatedCompanyInternshipsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CompanyInternshipsResponse;
};

export default function CompanyInternshipsDashboard() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState<TableFilters>({ rok: "", semester: "", stav: "" });

  const { msgs } = useLocalization();
  const { warning: notifyWarning } = useSystemNotifications();

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      throw new Error("Chýba access token – prihláste sa ako firma.");
    }
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
      );
      const res = await axiosClient.get<
        CompanyInternshipsResponse | PaginatedCompanyInternshipsResponse
      >("/internships/company/me/internships/", {
        headers: getAuthHeaders(),
        params,
      });

      const payload =
        "results" in res.data
          ? (res.data.results as CompanyInternshipsResponse)
          : (res.data as CompanyInternshipsResponse);

      setInternships(payload?.internships || []);
    } catch (err: any) {
      const message =
        err.response?.data?.error || err.message || msgs.common.error.errorLoadInternships;
      setError(message);
      notifyWarning({
        title: msgs.common.error.errorLoadInternships,
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, getAuthHeaders, msgs.common.error.errorLoadInternships, notifyWarning]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const resetFilters = () => setFilters({ rok: "", semester: "", stav: "" });

  const displayedInternships = useMemo(() => internships, [internships]);

  return (
    <div className="space-y-10">
      <section className="bg-white shadow-sm rounded-lg p-6 space-y-4 border border-gray-100">
        <PendingInternships onChange={fetchInternships} />
      </section>
      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-gray-100">
        <Table
          data={displayedInternships}
          name={TABLE_NAMES.ALL_INTERNSHIPS}
          document
          showFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={fetchInternships}
          onResetFilters={resetFilters}
          semesterOptions={SEMESTER_OPTIONS}
          stavOptions={STAV_OPTIONS}
          isLoading={loading}
          isError={error || null}
        />
      </section>
      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-gray-100">
        <Table
          data={displayedInternships}
          name={TABLE_NAMES.COMPANY_DOCUMENTS}
          isLoading={loading}
          isError={error || null}
          showEmpty
          actionMessage={msgs.common.companyDocs.empty}
          columnCountOverride={5}
          renderRow={(internship) => (
            <CompanyDocumentsCard internship={internship} onChange={fetchInternships} />
          )}
        />
      </section>
    </div>
  );
}
