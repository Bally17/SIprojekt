// frontend/src/features/student/_components/internships/InternshipCreateForm.tsx
"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { useForm, Controller, type FieldErrors } from "react-hook-form";
import { Button } from "@components/button";
import { Select } from "@components/select";
import Icon from "@icons/index";
import { useLocalization } from "@i18n/client";
import { Company } from "@shared-types/company";
import { Semester, SEMESTER_OPTIONS } from "@shared-types/core/internshipState";
import { useCompanySearchMutation } from "../../hooks";
import { getFirstErrorMessage } from "@student/utils/getFirstErrorMessage";
import type { CreateInternshipPayload } from "@shared-types/index";
import { DatePicker } from "@components/datePicker";

const DEFAULT_VALUES: CreateInternshipPayload = {
  firma_id: "",
  rok: new Date().getFullYear(),
  semester: "zimny" as Semester,
  datum_zaciatku: "",
  datum_konca: "",
};

type Props = {
  onSubmit: (values: CreateInternshipPayload) => Promise<void>;
  creating: boolean;
  onValidationError?: (msg: { title?: string; description: string }) => void;
};

export default function InternshipCreateForm({ onSubmit, creating, onValidationError }: Props) {
  const { msgs } = useLocalization();

  const { control, register, handleSubmit, setValue, watch, setError, reset, clearErrors } =
    useForm<CreateInternshipPayload>({
      defaultValues: DEFAULT_VALUES,
      mode: "onSubmit",
      reValidateMode: "onSubmit",
      criteriaMode: "firstError",
    });

  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const companySearch = useCompanySearchMutation();

  const handleCompanySearchChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      // ak user vymaže input, vymaž aj vybranú firmu
      if (!value.trim()) {
        setCompanies([]);
        setValue("firma_id", "");
        return;
      }

      const result = await companySearch.mutateAsync(value.trim());
      setCompanies(result);
    },
    [companySearch, setValue],
  );

  const pickCompany = useCallback(
    (company: Company) => {
      setValue("firma_id", String(company.id), { shouldValidate: false });
      clearErrors("firma_id");
      setSearchQuery(company.nazov);
      setCompanies([]);
    },
    [setValue, clearErrors],
  );

  const onValid = useCallback(
    async (values: CreateInternshipPayload) => {
      const year = new Date().getFullYear();

      if (values.rok < year - 1 || values.rok > year + 2) {
        const description = "Rok praxe je mimo povoleneho intervalu.";
        setError("rok", { type: "validate", message: description });
        onValidationError?.({ title: "Chybny rok", description });
        return;
      }

      if (
        values.datum_zaciatku &&
        values.datum_konca &&
        values.datum_konca < values.datum_zaciatku
      ) {
        const description = "Datum ukoncenia musi byt po datume zaciatku.";
        setError("datum_konca", { type: "validate", message: description });
        onValidationError?.({ title: "Chybny datum", description });
        return;
      }

      await onSubmit(values);

      reset(DEFAULT_VALUES);
      setSearchQuery("");
      setCompanies([]);
    },
    [onSubmit, onValidationError, reset, setError],
  );

  const onInvalid = useCallback(
    (errs: FieldErrors<CreateInternshipPayload>) => {
      const description = getFirstErrorMessage(errs, {
        order: ["firma_id", "rok", "semester", "datum_zaciatku", "datum_konca"],
      });
      onValidationError?.({ title: "Neplatne udaje", description });
    },
    [onValidationError],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(onValid, onInvalid)();
      }}
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

        {/* RHF field (hidden), validuje sa až pri submit */}
        <input
          type="hidden"
          {...register("firma_id", {
            required: "Vyberte firmu zo zoznamu.",
          })}
        />

        {companySearch.isPending && (
          <p className="mt-1 text-sm text-gray-500">{msgs.common.loading.companies}</p>
        )}

        {companies.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
            {companies.map((company) => (
              <li
                key={company.id}
                onClick={() => pickCompany(company)}
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
            className="w-full rounded-lg border border-primary-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            {...register("rok", {
              valueAsNumber: true,
              required: "Zadajte rok.",
            })}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {msgs.common.date.semester}
          </label>

          <Controller
            control={control}
            name="semester"
            rules={{ required: "Vyberte semester." }}
            render={({ field }) => (
              <Select<Semester>
                name="semester"
                value={field.value}
                options={SEMESTER_OPTIONS}
                onChangeValue={(value) => value && field.onChange(value)}
              />
            )}
          />
        </div>
      </div>

      <DatePicker
        register={register}
        setValue={setValue}
        watch={watch}
        startLabel={msgs.common.date.startDate}
        endLabel={msgs.common.date.endDate}
      />

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
  );
}
