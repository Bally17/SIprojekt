"use client";

import { useState, useCallback } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { Select } from "@components/select";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";

import DocumentUploadCard from "../components/DocumentUploadCard";

import { useStudentInternshipsQuery } from "@hook/useStudentInternshipsQuery";
import { useCompanySearchMutation } from "@hook/useCompanySearchMutation";
import { useCreateInternshipMutation } from "@hook/useCreateInternshipMutation";
import { Company } from "@shared-types/company";
import { Semester, STAV_BADGE_CLASS, SEMESTER_OPTIONS } from "@shared-types/core/internshipState";

export default function StudentDashboardPage() {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);

  const [form, setForm] = useState({
    firma_id: "",
    rok: new Date().getFullYear(),
    semester: "zimny" as Semester,
    datum_zaciatku: "",
    datum_konca: "",
  });

  /* -------------------------------
   * QUERY: LOAD INTERNSHIPS
   * ------------------------------ */
  const {
    data: internships = [],
    isLoading: internshipsLoading,
    refetch: refetchInternships,
  } = useStudentInternshipsQuery();

  /* -------------------------------
   * MUTATION: SEARCH COMPANIES
   * ------------------------------ */
  const companySearch = useCompanySearchMutation();

  const handleCompanySearchChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (!value.trim()) {
        setCompanies([]);
        return;
      }

      const result = await companySearch.mutateAsync(value.trim());
      setCompanies(result);
    },
    [companySearch],
  );

  /* -------------------------------
   * MUTATION: CREATE INTERNSHIP
   * ------------------------------ */
  const createInternshipMutation = useCreateInternshipMutation();

  const handleCreateInternship = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!form.firma_id) {
        notifyWarning({ title: "Chyba firma", description: "Vyberte firmu zo zoznamu." });
        return;
      }

      if (form.datum_zaciatku && form.datum_konca && form.datum_konca < form.datum_zaciatku) {
        notifyWarning({
          title: "Chybny datum",
          description: "Datum ukoncenia musi byt po datume zaciatku.",
        });
        return;
      }

      const year = new Date().getFullYear();
      if (form.rok < year - 1 || form.rok > year + 2) {
        notifyWarning({
          title: "Chybny rok",
          description: "Rok praxe je mimo povoleneho intervalu.",
        });
        return;
      }

      await createInternshipMutation.mutateAsync({
        ...form,
        firma_id: Number(form.firma_id),
      });

      notifySuccess({
        title: "Prax vytvorena",
        description: "Dohoda bola automaticky vygenerovana.",
      });

      setForm((prev) => ({ ...prev, firma_id: "", datum_zaciatku: "", datum_konca: "" }));
      setCompanies([]);
      setSearchQuery("");

      await refetchInternships();
    },
    [form, createInternshipMutation, refetchInternships, notifySuccess, notifyWarning],
  );

  const creating = createInternshipMutation.isPending;

  /* -------------------------------
   * INTERNSHIPS LIST
   * ------------------------------ */
  let listContent;

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
            className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary-600">
                {internship.firma?.nazov || "Neznama firma"}
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
              {internship.semester} {internship.rok} - {internship.datum_zaciatku} -{" "}
              {internship.datum_konca}
            </p>

            <DocumentUploadCard internship={internship} onSuccess={refetchInternships} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* FORM */}
      <form
        onSubmit={handleCreateInternship}
        className="space-y-5 rounded-xl border border-primary-100 bg-white p-6 shadow-sm transition hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <Icon name="calendar-plus" className="text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">{msgs.common.internships.new}</h2>
        </div>

        {/* Company selection */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {msgs.common.entities.company}
          </label>

          <input
            type="text"
            value={searchQuery}
            onChange={handleCompanySearchChange}
            placeholder={msgs.common.action.company}
            className="w-full rounded-lg border border-primary-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          {companySearch.isPending && (
            <p className="mt-1 text-sm text-gray-500">{msgs.common.loading.companies}</p>
          )}

          {companies.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
              {companies.map((company) => (
                <li
                  key={company.id}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, firma_id: String(company.id) }));
                    setSearchQuery(company.nazov);
                    setCompanies([]);
                  }}
                  className="p-2 cursor-pointer hover:bg-cyan-50"
                >
                  <div className="font-medium">{company.nazov}</div>
                  {company.adresa && <div className="text-sm text-gray-500">{company.adresa}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Year + semester */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {msgs.common.date.year}
            </label>
            <input
              type="number"
              value={form.rok}
              onChange={(e) => setForm((prev) => ({ ...prev, rok: Number(e.target.value) }))}
              className="w-full rounded-lg border border-primary-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {msgs.common.date.semester}
            </label>
            <Select<Semester>
              name="semester"
              value={form.semester}
              options={SEMESTER_OPTIONS}
              onChangeValue={(value) => value && setForm((prev) => ({ ...prev, semester: value }))}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {msgs.common.date.startDate}
            </label>
            <input
              type="date"
              value={form.datum_zaciatku}
              onChange={(e) => setForm((prev) => ({ ...prev, datum_zaciatku: e.target.value }))}
              className="w-full rounded-lg border border-primary-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {msgs.common.date.endDate}
            </label>
            <input
              type="date"
              value={form.datum_konca}
              onChange={(e) => setForm((prev) => ({ ...prev, datum_konca: e.target.value }))}
              className="w-full rounded-lg border border-primary-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

      {/* LIST */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">{msgs.common.internships.my}</h2>
        {listContent}
      </section>
    </>
  );
}
