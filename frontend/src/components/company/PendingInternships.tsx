"use client";

import { useEffect, useState, useCallback } from "react";
import axiosClient from "@/lib/axiosClient";

type Internship = {
  id: number;
  rok: number;
  semester: string;
  datum_zaciatku: string;
  datum_konca: string;
  stav: string;
  student: number;
};

type PendingResponse = {
  results?: {
    firma?: {
      meno?: string | null;
      priezvisko?: string | null;
      email: string;
    };
    internships?: Internship[];
  };
};

type PendingInternshipsProps = {
  onChange?: () => void;
};

export default function PendingInternships({ onChange }: PendingInternshipsProps) {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");

  // Získa access_token z localStorage a vráti ho v hlavičke Authorization, ak chýba, vyhodí chybu
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      throw new Error("Chýba access token – prihláste sa ako firma.");
    }
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Volá API endpoint, ukladá načítané praxe do state
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get<PendingResponse>(
        "/internships/company/me/internships/pending/",
        { headers: getAuthHeaders() },
      );
      const list = res.data.results?.internships ?? [];
      setInternships(list);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Nepodarilo sa načítať praxe.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Načíta čakajúce praxe po načítaní komponentu
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Potvrdí alebo zamietne prax a odstráni ju zo zoznamu
  const handleAction = async (id: number, action: "confirm" | "reject") => {
    setError("");
    setActionMessage("");
    try {
      const endpoint = `/internships/company/${action}/${id}/`;
      await axiosClient.patch(endpoint, {}, { headers: getAuthHeaders() });
      setInternships((prev) => prev.filter((item) => item.id !== id));
      setActionMessage(action === "confirm" ? "Prax bola potvrdená." : "Prax bola zamietnutá.");
      onChange?.();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Akcia zlyhala.");
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Načítavam čakajúce praxe...</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchPending}
          className="mt-4 bg-cyan-700 text-white px-4 py-2 rounded"
        >
          Skúsiť znova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-cyan-700">Čakajúce praxe</h1>
        <p className="text-gray-600">
          Tu vidíte všetky praxe, ktoré čakajú na potvrdenie alebo zamietnutie.
        </p>
      </div>

      {actionMessage && <p className="text-green-600">{actionMessage}</p>}

      {internships.length === 0 ? (
        <p className="text-gray-500">Momentálne nemáte žiadne nové žiadosti.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-600">
                <th className="px-4 py-3">ID praxe</th>
                <th className="px-4 py-3">Študent (ID)</th>
                <th className="px-4 py-3">Rok</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Od</th>
                <th className="px-4 py-3">Do</th>
                <th className="px-4 py-3">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {internships.map((internship) => (
                <tr key={internship.id} className="border-t text-sm">
                  <td className="px-4 py-3 font-medium">#{internship.id}</td>
                  <td className="px-4 py-3">{internship.student}</td>
                  <td className="px-4 py-3">{internship.rok}</td>
                  <td className="px-4 py-3 capitalize">{internship.semester}</td>
                  <td className="px-4 py-3">{internship.datum_zaciatku}</td>
                  <td className="px-4 py-3">{internship.datum_konca}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAction(internship.id, "confirm")}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Potvrdiť
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(internship.id, "reject")}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Zamietnuť
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
