"use client";

import React, { useCallback, useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { Download, Building2, CalendarPlus, Loader2, FileText } from "lucide-react";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";

export default function StudentDashboardPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const errorLoadMsg = msgs.common.error.errorLoadInternships;

  const [form, setForm] = useState({
    firma_id: "",
    rok: new Date().getFullYear(),
    semester: "zimny",
    datum_zaciatku: "",
    datum_konca: "",
  });

  // 🔹 Načítanie praxí
  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/internships/me/internships/");
      console.log("✅ API response:", res.data);

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data.results?.internships) data = res.data.results.internships;
      else if (res.data.internships) data = res.data.internships;
      else console.warn("⚠️ Neočakávaný formát odpovede:", res.data);

      setInternships(data);
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

  // 🔹 Hľadanie firiem
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

  // 🔹 Vytvorenie praxe
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

      await axiosClient.post("/internships/create/", payload);
      notifySuccess({
        title: "Prax vytvorená",
        description: "Dohoda bola automaticky vygenerovaná.",
      });
      await fetchInternships();
    } catch (err) {
      console.error(err);
      notifyWarning({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť prax.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 to-white p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* 🔹 Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-cyan-700 tracking-tight">
            {msgs.common.internships.my}
          </h1>
          <p className="text-gray-600">{msgs.common.internships.manage}</p>
        </header>

        {/* 🔹 Formulár */}
        <form
          onSubmit={handleCreateInternship}
          className="border border-cyan-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition space-y-5"
        >
          <div className="flex items-center gap-2">
            <CalendarPlus className="text-cyan-600" />
            <h2 className="text-xl font-semibold text-gray-800">{msgs.common.internships.new}</h2>
          </div>

          {/* Firma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {msgs.common.entities.company}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchCompanies(e.target.value);
              }}
              placeholder={msgs.common.action.company}
              className="border w-full rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {searchLoading && (
              <p className="text-sm text-gray-500 mt-1">{msgs.common.loading.companies}</p>
            )}
            {companies.length > 0 && (
              <ul className="border mt-2 rounded-lg max-h-40 overflow-y-auto divide-y">
                {companies.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => {
                      setForm((f) => ({ ...f, firma_id: String(c.id) }));
                      setSearchQuery(c.nazov);
                      setCompanies([]);
                    }}
                    className="p-2 cursor-pointer hover:bg-cyan-50"
                  >
                    <div className="font-medium">{c.nazov}</div>
                    {c.adresa && <div className="text-gray-500 text-sm">{c.adresa}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Grid inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {msgs.common.date.year}
              </label>
              <input
                type="number"
                value={form.rok}
                onChange={(e) => setForm((f) => ({ ...f, rok: Number(e.target.value) }))}
                className="border w-full rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {msgs.common.date.semester}
              </label>
              <select
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                className="border w-full rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="zimny">{msgs.common.date.winter}</option>
                <option value="letny">{msgs.common.date.summer}</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {msgs.common.date.startDate}
              </label>
              <input
                type="date"
                value={form.datum_zaciatku}
                onChange={(e) => setForm((f) => ({ ...f, datum_zaciatku: e.target.value }))}
                className="border w-full rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {msgs.common.date.endDate}
              </label>
              <input
                type="date"
                value={form.datum_konca}
                onChange={(e) => setForm((f) => ({ ...f, datum_konca: e.target.value }))}
                className="border w-full rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-cyan-600 text-white px-5 py-2.5 rounded-lg hover:bg-cyan-700 transition flex items-center gap-2"
          >
            {creating ? <Loader2 className="animate-spin" /> : <Building2 size={18} />}
            {creating ? "Ukladám..." : "Vytvoriť prax"}
          </button>
        </form>

        {/* 🔹 Zoznam praxí */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📋 {msgs.common.internships.my}
          </h2>

          {loading ? (
            <p className="text-gray-600">{msgs.common.loading.loading}</p>
          ) : internships.length === 0 ? (
            <p className="text-gray-500 italic">{msgs.common.internships.emptyYour}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {internships.map((p) => (
                <div
                  key={p.id}
                  className="border border-cyan-100 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-cyan-700">
                      {p.firma?.nazov || "Neznáma firma"}
                    </h3>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        p.stav === "vytvorena"
                          ? "bg-blue-50 text-blue-700"
                          : p.stav === "potvrdena"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {p.stav}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {p.semester} {p.rok} • {p.datum_zaciatku} → {p.datum_konca}
                  </p>

                  {p.documents?.length > 0 && (
                    <a
                      href={`${
                        process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
                        "http://localhost:8000"
                      }/media/${p.documents[0].subor_url}`}
                      download={`Dohoda_prax_${p.id}.pdf`}
                      className="mt-3 inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                    >
                      <Download size={16} />
                      {msgs.common.action.downloadAgreement}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
