"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import PendingInternships from "@features/company/PendingInternships";
import { useLocalization } from "@/shared/i18n/client";
import { Table } from "@/shared/components/table";
import { TABLE_NAMES } from "@/constants/Table";
import { Internship } from "@/shared/types/internship/internship";

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

const SEMESTERS = [
  { label: "Letný", value: "letny" },
  { label: "Zimný", value: "zimny" },
];

const STATUSES = [
  { label: "Vytvorená", value: "vytvorena" },
  { label: "Potvrdená", value: "potvrdena" },
  { label: "Zamietnutá", value: "zamietnuta" },
  { label: "Schválená", value: "schvalena" },
  { label: "Obhájená", value: "obhajena" },
  { label: "Neobhájená", value: "neobhajena" },
];

export default function CompanyInternshipsDashboard() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState({ rok: "", semester: "", stav: "" });

  const { msgs } = useLocalization();

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
      setError(err.response?.data?.error || err.message || msgs.common.error.errorLoadInternships);
    } finally {
      setLoading(false);
    }
  }, [filters, getAuthHeaders, msgs.common.error.errorLoadInternships]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => setFilters({ rok: "", semester: "", stav: "" });

  const displayedInternships = useMemo(() => internships, [internships]);

  return (
    <div className="space-y-10">
      <section className="bg-white shadow-sm rounded-lg p-6 space-y-4 border border-gray-100">
        <PendingInternships onChange={fetchInternships} />
      </section>

      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-cyan-700">{msgs.common.internships.all}</h2>
            <p className="text-sm text-gray-600">{msgs.common.filterBy}</p>
          </div>
          <form
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full md:w-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="number"
              name="rok"
              value={filters.rok}
              onChange={handleFilterChange}
              placeholder={msgs.common.date.year}
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">{msgs.common.date.semester}</option>
              {SEMESTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="stav"
              value={filters.stav}
              onChange={handleFilterChange}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">{msgs.common.internships.state}</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchInternships}
                className="flex-1 bg-cyan-700 text-white px-4 py-2 rounded text-sm hover:bg-cyan-800"
              >
                {msgs.common.filter}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                }}
                className="flex-1 border border-gray-300 text-sm rounded px-4 py-2 hover:bg-gray-100"
              >
                {msgs.common.reset}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">{msgs.common.loading.internships}</p>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchInternships}
              className="mt-3 bg-cyan-700 text-white px-4 py-2 rounded"
            >
              {msgs.common.tryAgain}
            </button>
          </div>
        ) : displayedInternships.length === 0 ? (
          <p className="text-gray-500">{msgs.common.error.errorFilterLoad}</p>
        ) : (
          <Table data={displayedInternships} name={TABLE_NAMES.ALL_INTERNSHIPS} />
        )}
      </section>
    </div>
  );
}
