"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { getErrorMessage } from "@utils/errorActions";
import { useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRegisterCompanyMutation } from "../hooks";
import { RHFInput } from "@components/input";
import { RegisterCompanyFormState } from "@shared-types/index";
import { input } from "@constants";
import GoogleGithubActionBtns from "./GoogleGithubActionBtns";

export default function RegisterFormCompany() {
  const formRef = useRef<HTMLFormElement | null>(null);
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

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.registerCompany}
      </h2>

      <RHFInput<RegisterCompanyFormState>
        name="companyName"
        placeholder={msgs.auth.companyName}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Názov firmy je povinný.",
          validate: (v: string) => v.trim().length >= 2 || "Názov firmy musí mať aspoň 2 znaky.",
        }}
      />

      <RHFInput<RegisterCompanyFormState>
        name="companyEmail"
        type="email"
        placeholder={msgs.auth.companyLoginEmail}
        className={input}
        register={register}
        errors={errors}
        rules={{ required: "Email firmy je povinný." }}
      />

      <RHFInput<RegisterCompanyFormState>
        name="address"
        placeholder={msgs.auth.companyAddress}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Adresa je povinná.",
          validate: (v: string) => v.trim().length >= 5 || "Adresa musí mať aspoň 5 znakov.",
        }}
      />

      <RHFInput<RegisterCompanyFormState>
        name="contactName"
        placeholder={msgs.auth.contactName}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Meno kontaktnej osoby je povinné.",
          validate: (v: string) =>
            v.trim().length >= 3 || "Meno kontaktnej osoby musí mať aspoň 3 znaky.",
        }}
      />

      <RHFInput<RegisterCompanyFormState>
        name="contactEmail"
        type="email"
        placeholder={msgs.auth.contactEmail}
        className={input}
        register={register}
        errors={errors}
        rules={{ required: "Email kontaktnej osoby je povinný." }}
      />

      <RHFInput<RegisterCompanyFormState>
        name="contactPhone"
        type="tel"
        placeholder={msgs.auth.contactPhone}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Telefón je povinný.",
          validate: (v: string) =>
            v.replaceAll(/\D/g, "").length >= 7 || "Telefón musí mať aspoň 7 číslic.",
        }}
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

      <GoogleGithubActionBtns />
    </form>
  );
}
