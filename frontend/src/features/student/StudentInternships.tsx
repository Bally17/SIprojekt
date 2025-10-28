"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";

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
  firma?: {
    nazov?: string;
  } | null;
  documents?: Document[];
};

// Pomocná funkcia pre získanie backend base URL
const getBackendBaseUrl = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  return apiBase.replace(/\/api\/?$/, "");
};

// Vytvára plnú URL k dokumentu podľa relatívnej cesty
const buildDocumentUrl = (path: string) => {
  const backend = getBackendBaseUrl();
  const cleaned = path.replace(/^\/?/, "");
  return `${backend}/media/${cleaned}`;
};

export default function StudentInternships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Po načítaní komponentu sa stiahnu praxe prihláseného študenta
  useEffect(() => {
    fetchInternships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Načíta prístupový token z localStorage a pripraví hlavičky pre autorizované požiadavky
  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      throw new Error("Chýba access token – prihláste sa ako študent.");
    }
    return { Authorization: `Bearer ${token}` };
  };

  // Načíta praxe aktuálne prihláseného používateľa
  const fetchInternships = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axiosClient.get("/internships/me/internships/", {
        headers: getAuthHeaders(),
      });
      setInternships(res.data?.internships || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.response?.data?.message || "Nepodarilo sa načítať praxe.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Otvorí PDF dokument dohody v novom okne
  const handleDownload = (doc: Document) => {
    const url = buildDocumentUrl(doc.subor_url);
    window.open(url, "_blank");
  };

  // Stavy komponentu podľa priebehu načítania
  if (loading) {
    return <p className="text-center text-gray-500">Načítavam tvoje praxe...</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchInternships}
          className="mt-4 bg-cyan-700 text-white px-4 py-2 rounded"
        >
          Skúsiť znova
        </button>
      </div>
    );
  }

  if (!internships.length) {
    return <p className="text-center text-gray-500">Zatiaľ nemáš žiadne praxe.</p>;
  }

  // Hlavný výpis zoznamu praxí
  return (
    <div className="space-y-4">
      {internships.map((internship) => {
        // Vyhľadanie dohody medzi dokumentmi
        const dohoda = internship.documents?.find(
          (doc) => doc.typ_dokumentu === "dohoda" && doc.subor_url,
        );
        const canDownload = internship.stav === "vytvorena" && dohoda;

        return (
          <div key={internship.id} className="bg-white shadow rounded p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-cyan-700">
                  Prax #{internship.id} – {internship.firma?.nazov || "Neznáma firma"}
                </h3>
                <p className="text-sm text-gray-600">
                  {internship.semester} {internship.rok} | {internship.datum_zaciatku} –{" "}
                  {internship.datum_konca}
                </p>
                <p className="text-sm mt-1">
                  Stav: <span className="font-medium capitalize">{internship.stav}</span>
                </p>
              </div>

              {/* Ak je prax vo vytvorenom stave a má dohodu, zobrazí sa tlačidlo na stiahnutie */}
              <div>
                {canDownload ? (
                  <button
                    onClick={() => dohoda && handleDownload(dohoda)}
                    className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800"
                  >
                    Stiahnuť dohodu
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">
                    Dohoda dostupná len pre stav &quot;vytvorená&quot;.
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
