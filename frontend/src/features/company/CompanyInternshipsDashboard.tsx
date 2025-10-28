"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import PendingInternships from "@features/company/PendingInternships";

type Document = {
  id: number;
  typ_dokumentu: string;
  subor_url: string;
};

type Internship = {
  id: number;
  rok: number;
  semester: string;
  datum_zaciatku: string;
  datum_konca: string;
  stav: string;
  student: number;
  documents?: Document[];
};

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

const buildMediaUrl = (path: string) => {
  const backend = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
  return `${backend}/media/${path.replace(/^\/?/, "")}`;
};

export default function CompanyInternshipsDashboard() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState({ rok: "", semester: "", stav: "" });

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
      setError(err.response?.data?.error || err.message || "Nepodarilo sa načítať praxe.");
    } finally {
      setLoading(false);
    }
  }, [filters, getAuthHeaders]);

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
        <div>
          <h2 className="text-xl font-semibold text-cyan-700">Čakajúce praxe</h2>
          <p className="text-sm text-gray-600">
            Zoznam praxí, ktoré čakajú na potvrdenie alebo zamietnutie.
          </p>
        </div>
        <PendingInternships onChange={fetchInternships} />
      </section>

      <section className="bg-white shadow-sm rounded-lg p-6 space-y-6 border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-cyan-700">Všetky praxe</h2>
            <p className="text-sm text-gray-600">Filtrovanie podľa roka, semestra a stavu.</p>
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
              placeholder="Rok"
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Semester</option>
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
              <option value="">Stav praxe</option>
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
                Filtrovať
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                }}
                className="flex-1 border border-gray-300 text-sm rounded px-4 py-2 hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Načítavam praxe...</p>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchInternships}
              className="mt-3 bg-cyan-700 text-white px-4 py-2 rounded"
            >
              Skúsiť znova
            </button>
          </div>
        ) : displayedInternships.length === 0 ? (
          <p className="text-gray-500">Žiadne praxe nezodpovedajú zadaným filtrom.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-100">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-gray-600">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Študent (ID)</th>
                  <th className="px-4 py-3">Rok</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Od</th>
                  <th className="px-4 py-3">Do</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3">Dokumenty</th>
                </tr>
              </thead>
              <tbody>
                {displayedInternships.map((internship) => (
                  <tr key={internship.id} className="border-t text-sm">
                    <td className="px-4 py-3 font-medium">#{internship.id}</td>
                    <td className="px-4 py-3">{internship.student}</td>
                    <td className="px-4 py-3">{internship.rok}</td>
                    <td className="px-4 py-3 capitalize">{internship.semester}</td>
                    <td className="px-4 py-3">{internship.datum_zaciatku}</td>
                    <td className="px-4 py-3">{internship.datum_konca}</td>
                    <td className="px-4 py-3 capitalize">{internship.stav}</td>
                    <td className="px-4 py-3">
                      {internship.documents?.length ? (
                        <div className="space-y-1">
                          {internship.documents
                            .filter((doc) => doc.subor_url)
                            .map((doc) => (
                              <a
                                key={doc.id}
                                href={buildMediaUrl(doc.subor_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-cyan-700 hover:underline"
                              >
                                {doc.typ_dokumentu.toUpperCase()}
                              </a>
                            ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
