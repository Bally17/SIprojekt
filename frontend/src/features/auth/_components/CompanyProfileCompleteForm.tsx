"use client";

import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { getErrorMessage } from "@utils/errorActions";
import { useForm, type FieldErrors } from "react-hook-form";
import { completeCompanyProfile } from "../api";
import type { CompanyProfileCompletePayload } from "@shared-types/auth";

export default function CompanyProfileCompleteForm() {
  const { msgs } = useLocalization();
  const router = useRouter();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyProfileCompletePayload>({
    defaultValues: {
      nazov: "",
      kontaktna_osoba_meno: "",
      kontaktna_osoba_email: "",
      kontaktna_osoba_telefon: "",
      adresa: "",
    },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const onSubmit = async (form: CompanyProfileCompletePayload) => {
    try {
      await completeCompanyProfile(form);

      notifySuccess({
        title: msgs.auth.companyCompleteSuccessTitle,
        description: msgs.auth.companyCompleteSuccessDescription,
      });

      router.push("/dashboard/company");
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.error,
        description: getErrorMessage(err, msgs.auth.error),
      });
    }
  };

  const onInvalid = (errs: FieldErrors<CompanyProfileCompletePayload>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.error;

    notifyWarning({ title: msgs.auth.error, description: firstMessage });
  };

  const inputClasses =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400";
  const errorText = "text-sm text-red-600";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.companyCompleteFormTitle}
      </h2>
      <p className="text-sm text-gray-600 text-center">
        {msgs.auth.companyCompleteFormDescription}
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.companyName}</label>
        <input
          type="text"
          className={inputClasses}
          {...register("nazov", { required: msgs.auth.error })}
        />
        {errors.nazov?.message && <p className={errorText}>{errors.nazov.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.companyAddress}</label>
        <input
          type="text"
          className={inputClasses}
          {...register("adresa", { required: msgs.auth.error })}
        />
        {errors.adresa?.message && <p className={errorText}>{errors.adresa.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.contactName}</label>
        <input
          type="text"
          className={inputClasses}
          {...register("kontaktna_osoba_meno", { required: msgs.auth.error })}
        />
        {errors.kontaktna_osoba_meno?.message && (
          <p className={errorText}>{errors.kontaktna_osoba_meno.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.contactEmail}</label>
        <input
          type="email"
          className={inputClasses}
          {...register("kontaktna_osoba_email", { required: msgs.auth.error })}
        />
        {errors.kontaktna_osoba_email?.message && (
          <p className={errorText}>{errors.kontaktna_osoba_email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.contactPhone}</label>
        <input
          type="tel"
          className={inputClasses}
          {...register("kontaktna_osoba_telefon", { required: msgs.auth.error })}
        />
        {errors.kontaktna_osoba_telefon?.message && (
          <p className={errorText}>{errors.kontaktna_osoba_telefon.message}</p>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full">
        {msgs.auth.companyCompleteSubmit}
      </Button>
    </form>
  );
}
