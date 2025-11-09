"use client";

import React, { useCallback, useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";

type Internship = {
  id: number;
  firma_nazov: string;
  rok: number;
  semester: string;
  datum_zaciatku: string;
  datum_konca: string;
  stav: string;
};

type Company = {
  id: number;
  nazov: string;
  adresa?: string;
};

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firma_id: "",
    rok: new Date().getFullYear(),
    semester: "zimny",
    datum_zaciatku: "",
    datum_konca: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const errorLoadMsg = msgs.common.error.errorLoadInternships;

  // 🔹 Načítanie praxí študenta
  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/internships/me/internships/");
      setInternships(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      notifyWarning({
        title: errorLoadMsg,
        description: "Nepodarilo sa načítať praxe.",
      });
    } finally {
      setLoading(false);
    }
  }, [errorLoadMsg, notifyWarning]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  // 🔹 Fulltext hľadanie firiem
  const searchCompanies = async (q: string) => {
    if (!q.trim()) return setCompanies([]);
    setSearchLoading(true);
    try {
      const res = await axiosClient.get(`/companies/search/?q=${encodeURIComponent(q)}`);
      setCompanies(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      notifyWarning({
        title: msgs.common.error.errorAction,
        description: msgs.common.loading.companies,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // 🔹 Vytvorenie novej praxe
  const handleCreateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        firma_id: Number(form.firma_id),
        rok: Number(form.rok),
        semester: form.semester,
        datum_zaciatku: form.datum_zaciatku,
        datum_konca: form.datum_konca,
      };

      const res = await axiosClient.post("/internships/create/", payload);
      const prax = res.data;

      // 🔹 Po úspešnom vytvorení vygeneruj dohodu
      await axiosClient.get(`/documents/${prax.id}/generate_dohoda/`);

      // 🔹 Znovu načítaj praxe
      await fetchInternships();
      notifySuccess({
        title: "Prax vytvorená",
        description: "Dohoda bola vygenerovaná.",
      });
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.detail || "Nepodarilo sa vytvoriť prax.";
      notifyWarning({
        title: "Chyba",
        description: message,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">📘 {msgs.common.internships.evidence}</h1>

      {/* 🔹 Formulár pre novú prax */}
      <form
        onSubmit={handleCreateInternship}
        className="border rounded-lg p-4 mb-8 bg-white shadow-sm space-y-4"
      >
        <h2 className="text-lg font-medium">➕ {msgs.common.internships.new}</h2>

        <div>
          <label className="block text-sm font-medium mb-1">{msgs.common.entities.company}</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchCompanies(e.target.value);
            }}
            placeholder={msgs.common.action.company}
            className="border w-full rounded p-2"
          />
          {searchLoading && (
            <p className="text-sm text-gray-500">{msgs.common.loading.companies}</p>
          )}
          {companies.length > 0 && (
            <ul className="border mt-2 rounded max-h-40 overflow-y-auto">
              {companies.map((c) => (
                <li
                  key={c.id}
                  onClick={() => {
                    setForm((f) => ({ ...f, firma_id: String(c.id) }));
                    setSearchQuery(c.nazov);
                    setCompanies([]);
                  }}
                  className="p-2 cursor-pointer hover:bg-blue-50"
                >
                  {c.nazov} {c.adresa && <span className="text-gray-500">({c.adresa})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{msgs.common.date.year}</label>
            <input
              type="number"
              value={form.rok}
              onChange={(e) => setForm((f) => ({ ...f, rok: Number(e.target.value) }))}
              className="border w-full rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{msgs.common.date.semester}</label>
            <select
              value={form.semester}
              onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
              className="border w-full rounded p-2"
            >
              <option value="zimny">{msgs.common.date.winter}</option>
              <option value="letny">{msgs.common.date.summer}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{msgs.common.date.startDate}</label>
            <input
              type="date"
              value={form.datum_zaciatku}
              onChange={(e) => setForm((f) => ({ ...f, datum_zaciatku: e.target.value }))}
              className="border w-full rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{msgs.common.date.endDate}</label>
            <input
              type="date"
              value={form.datum_konca}
              onChange={(e) => setForm((f) => ({ ...f, datum_konca: e.target.value }))}
              className="border w-full rounded p-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {creating ? "Ukladám..." : "Vytvoriť prax"}
        </button>
      </form>

      {/* 🔹 Zoznam praxí */}
      <h2 className="text-lg font-medium mb-2">📋 {msgs.common.internships.my}</h2>
      {loading ? (
        <p>{msgs.common.loading.loading}</p>
      ) : internships.length === 0 ? (
        <p>{msgs.common.internships.nonExist}</p>
      ) : (
        <div className="space-y-3">
          {internships.map((prax) => (
            <div key={prax.id} className="border rounded p-3 bg-white shadow-sm">
              <div className="font-medium">{prax.firma_nazov}</div>
              <div className="text-sm text-gray-600">
                {prax.semester} {prax.rok} • {prax.datum_zaciatku} → {prax.datum_konca}
              </div>
              <div className="text-sm mt-1">
                {msgs.common.stateOpt}
                <span
                  className={`font-medium ${
                    prax.stav === "vytvorena"
                      ? "text-blue-600"
                      : prax.stav === "schvalena"
                        ? "text-green-600"
                        : "text-gray-600"
                  }`}
                >
                  {prax.stav}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
