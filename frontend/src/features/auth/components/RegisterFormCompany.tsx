"use client";

import { useState } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useRegisterCompanyMutation } from "src/hook/useRegisterCompanyMutation";
import { getErrorMessage } from "@utils/errorActions";
import { useForm, type FieldErrors } from "react-hook-form";

type RegisterCompanyFormState = {
  companyName: string;
  companyEmail: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export default function RegisterFormCompany() {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const mutation = useRegisterCompanyMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterCompanyFormState>({
    defaultValues: {
      companyName: "",
      companyEmail: "",
      address: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (form: RegisterCompanyFormState) => {
    try {
      await mutation.mutateAsync({
        email: form.companyEmail,
        nazov: form.companyName,
        adresa: form.address,
        kontaktna_osoba_meno: form.contactName,
        kontaktna_osoba_email: form.contactEmail,
        kontaktna_osoba_telefon: form.contactPhone,
      });

      notifySuccess({
        title: msgs.auth.successRegister,
        description: msgs.auth.registerCompany,
      });

      reset();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: getErrorMessage(err, msgs.auth.error),
      });
    }
  };

  const onInvalid = (errs: FieldErrors<RegisterCompanyFormState>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.error;

    notifyWarning({ title: msgs.auth.errorTitle, description: firstMessage });
  };

  const input =
    "w-full rounded border px-3 py-2 transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.registerCompany}
      </h2>

      <input
        placeholder={msgs.auth.companyName}
        className={input}
        {...register("companyName", {
          required: "Názov firmy je povinný.",
          validate: (v) => v.trim().length >= 2 || "Názov firmy musí mať aspoň 2 znaky.",
        })}
      />

      <input
        type="email"
        placeholder={msgs.auth.companyLoginEmail}
        className={input}
        {...register("companyEmail", {
          required: "Email firmy je povinný.",
        })}
      />

      <input
        placeholder={msgs.auth.companyAddress}
        className={input}
        {...register("address", {
          required: "Adresa je povinná.",
          validate: (v) => v.trim().length >= 5 || "Adresa musí mať aspoň 5 znakov.",
        })}
      />

      <input
        placeholder={msgs.auth.contactName}
        className={input}
        {...register("contactName", {
          required: "Meno kontaktnej osoby je povinné.",
          validate: (v) => v.trim().length >= 3 || "Meno kontaktnej osoby musí mať aspoň 3 znaky.",
        })}
      />

      <input
        type="email"
        placeholder={msgs.auth.contactEmail}
        className={input}
        {...register("contactEmail", {
          required: "Email kontaktnej osoby je povinný.",
        })}
      />

      <input
        type="tel"
        placeholder={msgs.auth.contactPhone}
        className={input}
        {...register("contactPhone", {
          required: "Telefón je povinný.",
          validate: (v) =>
            v.replaceAll(/\D/g, "").length >= 7 || "Telefón musí mať aspoň 7 číslic.",
        })}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={mutation.isPending}
        loading={mutation.isPending}
      >
        {mutation.isPending ? msgs.auth.submitting : msgs.auth.registerCompany}
      </Button>
    </form>
  );
}
