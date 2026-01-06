import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Icon from "@icons/index";
import { STAV_OPTIONS, STAV_LABEL, StringOrNull, Stav } from "@shared-types/index";
import { Internship, GarantInternshipUpdate } from "@shared-types/internship";
import { DatePicker } from "@components/datePicker";
import { useCompanySearchQuery, useStudentSearchQuery } from "../hooks";
import SearchSelect from "./SearchSelect";

type Props = {
  internship: Internship | null;
  editError: StringOrNull;
  msgs: any;
  onClose: () => void;
  onSubmit: (values: GarantInternshipUpdate) => Promise<void> | void;
  isSubmitting: boolean;
};

const DEFAULT_VALUES: GarantInternshipUpdate = {
  firma_id: "",
  student_id: "",
  datum_zaciatku: "",
  datum_konca: "",
  stav: "vytvorena",
  status_note: "",
};

export default function GarantEditModal({
  internship,
  editError,
  msgs,
  onClose,
  onSubmit,
  isSubmitting,
}: Readonly<Props>) {
  const [studentQuery, setStudentQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<GarantInternshipUpdate>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!internship) return;

    reset({
      datum_zaciatku: internship.datum_zaciatku || "",
      datum_konca: internship.datum_konca || "",
      stav: internship.stav as Stav,
      student_id: internship.student ? String(internship.student) : "",
      firma_id: internship.firma ? String(internship.firma) : "",
      status_note: "",
    });

    setStudentQuery(
      internship.student_full_name ||
        internship.student_email ||
        (internship.student ? `#${internship.student}` : ""),
    );
    setCompanyQuery(
      internship.company_name ||
        (typeof internship.firma === "number" ? `#${internship.firma}` : ""),
    );
    clearErrors();
  }, [internship, reset, clearErrors]);

  const studentSearch = useStudentSearchQuery(studentQuery, {
    enabled: !!internship && studentQuery.trim().length >= 2,
  });

  const companySearch = useCompanySearchQuery(companyQuery, {
    enabled: !!internship && companyQuery.trim().length >= 2,
  });

  const studentItems = useMemo(
    () =>
      (studentSearch.data ?? []).map((s) => ({
        id: s.id,
        primary: `${s.meno ?? ""} ${s.priezvisko ?? ""}`.trim() || s.email || `#${s.id}`,
        secondary: s.email,
        label: `${s.meno ?? ""} ${s.priezvisko ?? ""}`.trim() || s.email || `#${s.id}`,
      })),
    [studentSearch.data],
  );

  const companyItems = useMemo(
    () =>
      (companySearch.data ?? []).map((c) => ({
        id: c.id,
        primary: c.nazov || `#${c.id}`,
        secondary: c.kontakt_email,
        label: c.nazov || `#${c.id}`,
      })),
    [companySearch.data],
  );

  const handleSelectStudent = (item: { id: number; label: string }) => {
    setValue("student_id", String(item.id), { shouldDirty: true });
    setStudentQuery(item.label);
    clearErrors("student_id");
  };

  const handleSelectCompany = (item: { id: number; label: string }) => {
    setValue("firma_id", String(item.id), { shouldDirty: true });
    setCompanyQuery(item.label);
    clearErrors("firma_id");
  };

  const submit = handleSubmit(async (values) => {
    if (values.datum_zaciatku && values.datum_konca && values.datum_konca < values.datum_zaciatku) {
      setError("datum_konca", {
        type: "validate",
        message: "Datum ukoncenia musi byt po datume zaciatku.",
      });
      return;
    }

    if (!values.student_id) {
      setError("student_id", { type: "required", message: "Vyberte studenta." });
      return;
    }

    if (!values.firma_id) {
      setError("firma_id", { type: "required", message: "Vyberte firmu." });
      return;
    }

    await onSubmit(values);
  });

  if (!internship) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-ink-900">
              {msgs.common.guarant.edit.title} #{internship.id}
            </h3>
            <p className="text-sm text-ink-500">{msgs.common.guarant.edit.description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border p-2 hover:bg-gray-50"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {editError && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-2 text-red-700 text-sm">
            {editError}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-6">
          {/* STUDENT SEARCH */}
          <div>
            <input type="hidden" {...register("student_id")} />
            <SearchSelect
              label={msgs.common.guarant.edit.studentSearch}
              value={studentQuery}
              onChange={setStudentQuery}
              onSelect={handleSelectStudent}
              items={studentItems}
              isFetching={studentSearch.isFetching}
              loadingText={msgs.common.loading.loading}
            />
            {errors.student_id?.message ? (
              <p className="text-xs text-red-600 mt-1">{errors.student_id.message}</p>
            ) : null}
          </div>

          {/* COMPANY SEARCH */}
          <div>
            <input type="hidden" {...register("firma_id")} />
            <SearchSelect
              label={msgs.common.guarant.edit.companySearch}
              value={companyQuery}
              onChange={setCompanyQuery}
              onSelect={handleSelectCompany}
              items={companyItems}
              isFetching={companySearch.isFetching}
              loadingText={msgs.common.loading.loading}
            />
            {errors.firma_id?.message ? (
              <p className="text-xs text-red-600 mt-1">{errors.firma_id.message}</p>
            ) : null}
          </div>

          {/* DATES */}
          <DatePicker
            className="mt-1"
            startLabel={msgs.common.guarant.edit.startDate}
            endLabel={msgs.common.guarant.edit.endDate}
            register={register as any}
            setValue={setValue as any}
            watch={watch as any}
          />
          {errors.datum_konca?.message ? (
            <p className="text-xs text-red-600 mt-1">{errors.datum_konca.message}</p>
          ) : null}

          {/* STATE */}
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.state}
            </label>
            <select
              {...register("stav")}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {STAV_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {STAV_LABEL[o.value]}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS NOTE */}
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.edit.statusNote}
            </label>
            <textarea
              {...register("status_note")}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-primary-600 px-4 py-2 text-sm text-primary-600 font-semibold"
            >
              {msgs.common.close}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? msgs.common.loading.loading : msgs.common.guarant.edit.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
