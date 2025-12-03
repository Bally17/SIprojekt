"use client";

import { useState, useCallback } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { Select } from "@components/select";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { Internship } from "@type/backend/Internship";
import InternshipDocument from "@type/backend/InternshipDocument";
import { STAV_BADGE_CLASS, Semester, SEMESTER_OPTIONS } from "@type/props/common/StateInternship";
import { Company } from "@type/backend/Company";
import DocumentUploadCard from "../components/DocumentUploadCard";
import { METHOD, useApi } from "src/hook/useApi";

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

type StudentInternshipsResponse =
  | InternshipWithRelations[]
  | {
      internships?: InternshipWithRelations[];
      results?: {
        internships?: InternshipWithRelations[];
      };
    };

type CompanySearchResponse = Company[] | { results?: Company[] };

export default function StudentDashboardPage() {
  const [internships, setInternships] = useState<InternshipWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);

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

  const getErrorMessage = (err: any, fallback: string) => {
    const data = err?.response?.data;
    if (!data) return err?.message || fallback;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.message) return data.message;
    return fallback;
  };

  const normalizeInternships = useCallback(
    (res: StudentInternshipsResponse): InternshipWithRelations[] => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.results?.internships)) {
        return res.results!.internships as InternshipWithRelations[];
      }
      if (Array.isArray(res.internships)) {
        return res.internships as InternshipWithRelations[];
      }
      return [];
    },
    [],
  );

  // Automatické načítanie praxí cez `immediate: true`
  const { loading: internshipsLoading, execute: reloadInternships } = useApi<
    StudentInternshipsResponse,
    void,
    {}
  >({
    url: "/internships/me/internships/",
    method: METHOD.GET,
    immediate: true,
    initialData: [] as StudentInternshipsResponse,
    onSuccess: (response) => {
      const data = normalizeInternships(response);
      setInternships(data);
    },
    onError: (error) => {
      const description = getErrorMessage(error, "Nepodarilo sa načítať praxe.");
      console.error(error);
      notifyWarning({
        title: errorLoadMsg,
        description,
      });
    },
  });

  const { loading: companiesLoading, execute: executeCompanySearch } = useApi<
    CompanySearchResponse,
    void,
    { q: string }
  >({
    url: "/companies/search/",
    method: METHOD.GET,
    onSuccess: (response) => {
      const list = Array.isArray(response) ? response : (response.results ?? []);
      setCompanies(list);
    },
    onError: (error) => {
      const description = getErrorMessage(error, msgs.common.loading.companies);
      console.error(error);
      notifyWarning({
        title: msgs.common.error.errorAction,
        description,
      });
    },
  });

  const { loading: creating, execute: executeCreateInternship } = useApi<
    unknown,
    CreateInternshipPayload,
    {}
  >({
    url: "/internships/create/",
    method: METHOD.POST,
    onSuccess: () => {
      notifySuccess({
        title: "Prax vytvorená",
        description: "Dohoda bola automaticky vygenerovaná.",
      });

      setForm((prev) => ({
        ...prev,
        firma_id: "",
        datum_zaciatku: "",
        datum_konca: "",
      }));
      setSearchQuery("");
      setCompanies([]);

      reloadInternships();
    },
    onError: (error) => {
      const description = getErrorMessage(error, "Nepodarilo sa vytvoriť prax.");
      console.error(error);
      notifyWarning({
        title: "Chyba",
        description,
      });
    },
  });

  const handleCompanySearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setCompanies([]);
      return;
    }
    await executeCompanySearch({ params: { q: trimmed } });
  };

  const handleCreateInternship = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.firma_id.trim()) {
      notifyWarning({
        title: "Chýba firma",
        description: "Vyberte firmu zo zoznamu.",
      });
      return;
    }

    if (form.datum_zaciatku && form.datum_konca && form.datum_konca < form.datum_zaciatku) {
      notifyWarning({
        title: "Chybný dátum",
        description: "Dátum ukončenia musí byť po dátume začiatku.",
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    if (form.rok < currentYear - 1 || form.rok > currentYear + 2) {
      notifyWarning({
        title: "Chybný rok",
        description: "Rok praxe je mimo povoleného intervalu.",
      });
      return;
    }

    const payload: CreateInternshipPayload = {
      rok: form.rok,
      semester: form.semester,
      datum_zaciatku: form.datum_zaciatku,
      datum_konca: form.datum_konca,
      firma_id: Number(form.firma_id),
    };

    await executeCreateInternship({ body: payload });
  };

  let listContent: React.ReactNode;
  if (internshipsLoading) {
    listContent = <p className="text-gray-600">{msgs.common.loading.loading}</p>;
  } else if (internships.length === 0) {
    listContent = <p className="text-gray-500 italic">{msgs.common.internships.emptyYour}</p>;
  } else {
    listContent = (
      <div className="grid gap-5 md:grid-cols-2">
        {internships.map((internship) => (
          <div
            key={internship.id}
            className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-700">
                {internship.firma?.nazov || "Neznáma firma"}
              </h3>
              <span
                className={`rounded px-2 py-1 text-sm font-medium ${
                  internship.stav ? STAV_BADGE_CLASS[internship.stav] : "bg-gray-100 text-gray-600"
                }`}
              >
                {internship.stav}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {internship.semester} {internship.rok} • {internship.datum_zaciatku} →{" "}
              {internship.datum_konca}
            </p>

            <DocumentUploadCard internship={internship} onSuccess={reloadInternships} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleCreateInternship}
        className="space-y-5 rounded-xl border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <Icon name="calendar-plus" className="text-cyan-600" />
          <h2 className="text-xl font-semibold text-gray-800">{msgs.common.internships.new}</h2>
        </div>

        {/* Výber firmy */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {msgs.common.entities.company}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={handleCompanySearchChange}
            placeholder={msgs.common.action.company}
            className="w-full rounded-lg border p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {companiesLoading && (
            <p className="mt-1 text-sm text-gray-500">{msgs.common.loading.companies}</p>
          )}
          {companies.length > 0 && (
            <ul className="mt-2 max-h-40 divide-y overflow-y-auto rounded-lg border">
              {companies.map((company) => (
                <li
                  key={company.id}
                  onClick={() => {
                    setForm((previous) => ({ ...previous, firma_id: String(company.id) }));
                    setSearchQuery(company.nazov);
                    setCompanies([]);
                  }}
                  className="cursor-pointer p-2 hover:bg-cyan-50"
                >
                  <div className="font-medium">{company.nazov}</div>
                  {company.adresa ? (
                    <div className="text-sm text-gray-500">{company.adresa}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rok + semester */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {msgs.common.date.year}
            </label>
            <input
              type="number"
              value={form.rok}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, rok: Number(event.target.value) }))
              }
              className="w-full rounded-lg border p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {msgs.common.date.semester}
            </label>
            <Select<Semester>
              name="semester"
              value={form.semester}
              options={SEMESTER_OPTIONS}
              onChangeValue={(value) => {
                if (value) {
                  setForm((previous) => ({ ...previous, semester: value }));
                }
              }}
            />
          </div>
        </div>

        {/* Dátumy */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {msgs.common.date.startDate}
            </label>
            <input
              type="date"
              value={form.datum_zaciatku}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, datum_zaciatku: event.target.value }))
              }
              className="w-full rounded-lg border p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {msgs.common.date.endDate}
            </label>
            <input
              type="date"
              value={form.datum_konca}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, datum_konca: event.target.value }))
              }
              className="w-full rounded-lg border p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 transition"
          disabled={creating}
          loading={creating}
        >
          {!creating && <Icon name="building-2" size={18} />}
          {creating ? "Ukladám..." : "Vytvoriť prax"}
        </Button>
      </form>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          📋 {msgs.common.internships.my}
        </h2>
        {listContent}
      </section>
    </>
  );
}
