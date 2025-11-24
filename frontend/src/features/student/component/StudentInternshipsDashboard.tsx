"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { Select } from "@components/select";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import axiosClient from "@lib/axiosClient";
import { useState, useCallback, useEffect } from "react";
import DocumentUploadCard from "../components/DocumentUploadCard";
import { Internship } from "@type/backend/Internship";
import InternshipDocument from "@type/backend/InternshipDocument";
import { STAV_BADGE_CLASS, Semester, SEMESTER_OPTIONS } from "@type/props/common/StateInternship";
import { Company } from "@type/backend/Company";

type InternshipWithRelations = Internship & {
  firma?: Company | null;
  documents?: InternshipDocument[];
};

type CreateInternshipPayload = Pick<
  Internship,
  "rok" | "semester" | "datum_zaciatku" | "datum_konca"
> & { firma_id: number };

type CreateInternshipForm = Omit<CreateInternshipPayload, "firma_id"> & {
  firma_id: string;
};

export default function StudentDashboardPage() {
  const [internships, setInternships] = useState<InternshipWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const errorLoadMsg = msgs.common.error.errorLoadInternships;

  const [form, setForm] = useState<CreateInternshipForm>({
    firma_id: "",
    rok: new Date().getFullYear(),
    semester: "zimny",
    datum_zaciatku: "",
    datum_konca: "",
  });

  // Načítanie praxí
  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/internships/me/internships/");
      let data: InternshipWithRelations[] = [];
      if (Array.isArray(res.data)) data = res.data as InternshipWithRelations[];
      else if (res.data?.results?.internships)
        data = res.data.results.internships as InternshipWithRelations[];
      else if (res.data?.internships) data = res.data.internships as InternshipWithRelations[];
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

  // Hľadanie firiem
  const searchCompanies = async (q: string) => {
    if (!q.trim()) return setCompanies([]);
    setSearchLoading(true);
    try {
      const res = await axiosClient.get(`/companies/search/?q=${encodeURIComponent(q)}`);
      const list: Company[] = res.data.results ?? res.data ?? [];
      setCompanies(list);
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

  // Vytvorenie praxe
  const handleCreateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!form.firma_id.trim()) {
        notifyWarning({ title: "Chýba firma", description: "Vyberte firmu zo zoznamu." });
        setCreating(false);
        return;
      }

      if (form.datum_zaciatku && form.datum_konca && form.datum_konca < form.datum_zaciatku) {
        notifyWarning({
          title: "Chybný dátum",
          description: "Dátum ukončenia musí byť po dátume začiatku.",
        });
        setCreating(false);
        return;
      }

      const currentYear = new Date().getFullYear();
      if (form.rok < currentYear - 1 || form.rok > currentYear + 2) {
        notifyWarning({
          title: "Chybný rok",
          description: "Rok praxe je mimo povoleného intervalu.",
        });
        setCreating(false);
        return;
      }

      const payload: CreateInternshipPayload = {
        ...form,
        firma_id: Number(form.firma_id),
      };

      await axiosClient.post("/internships/create/", payload);
      notifySuccess({
        title: "Prax vytvorená",
        description: "Dohoda bola automaticky vygenerovaná.",
      });
      setForm((prev) => ({
        ...prev,
        firma_id: "",
        datum_zaciatku: "",
        datum_konca: "",
        searchQuery: "",
      }));
      setSearchQuery("");
      setCompanies([]);
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

  // Helper: link na dokument bez IIFE a bez ternárnikov
  // Príprava obsahu zoznamu bez vnorených ternárnikov (Sonar-friendly)
  let listContent: React.ReactNode;
  if (loading) {
    listContent = <p className="text-gray-600">{msgs.common.loading.loading}</p>;
  } else if (internships.length === 0) {
    listContent = <p className="text-gray-500 italic">{msgs.common.internships.emptyYour}</p>;
  } else {
    listContent = (
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
                  p.stav ? STAV_BADGE_CLASS[p.stav] : "bg-gray-100 text-gray-600"
                }`}
              >
                {p.stav}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              {p.semester} {p.rok} • {p.datum_zaciatku} → {p.datum_konca}
            </p>

            <DocumentUploadCard internship={p} onSuccess={fetchInternships} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleCreateInternship}
        className="border border-cyan-100 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition space-y-5"
      >
        <div className="flex items-center gap-2">
          <Icon name="calendar-plus" className="text-cyan-600" />
          <h2 className="text-xl font-semibold text-gray-800">{msgs.common.internships.new}</h2>
        </div>

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
            <Select<Semester>
              name="semester"
              value={form.semester}
              options={SEMESTER_OPTIONS}
              onChangeValue={(val) => {
                if (val) setForm((f) => ({ ...f, semester: val }));
              }}
            />
          </div>
        </div>

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

        <Button
          type="submit"
          variant="primary"
          className="px-5 py-2.5 rounded-lg transition flex items-center gap-2"
          disabled={creating}
          loading={creating}
        >
          {!creating && <Icon name="building-2" size={18} />}
          {creating ? "Ukladám..." : "Vytvoriť prax"}
        </Button>
      </form>

      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          📋 {msgs.common.internships.my}
        </h2>
        {listContent}
      </section>
    </>
  );
}
