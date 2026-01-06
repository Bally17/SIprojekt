"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { getErrorMessage } from "@utils/errorActions";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRegisterStudentMutation } from "../hooks";
import { RHFInput } from "@components/input";
import { RegisterStudentFormState } from "@shared-types/index";
import { input } from "@constants";

export default function RegisterFormStudent() {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const mutation = useRegisterStudentMutation();

  const allowedStudentDomains = ["student.ukf.sk", "ukf.sk"] as const;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterStudentFormState>({
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      studentEmail: "",
      altEmail: "",
      phone: "",
      studyField: "",
    },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const onSubmit = async (form: RegisterStudentFormState) => {
    try {
      await mutation.mutateAsync({
        meno: form.firstName,
        priezvisko: form.lastName,
        adresa: form.address,
        email: form.studentEmail,
        alternativny_email: form.altEmail || "",
        telefon: form.phone,
        studijny_program: form.studyField,
      });

      notifySuccess({
        title: msgs.auth.successRegister,
        description: msgs.auth.registerStudent,
      });

      reset();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: getErrorMessage(err, msgs.auth.error),
      });
    }
  };

  const onInvalid = (errs: FieldErrors<RegisterStudentFormState>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.error;

    notifyWarning({ title: msgs.auth.errorTitle, description: firstMessage });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.registerStudent}
      </h2>

      <RHFInput<RegisterStudentFormState>
        name="firstName"
        placeholder={msgs.auth.name}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Meno je povinné.",
          validate: (v: string) => v.trim().length >= 2 || "Meno musí mať aspoň 2 znaky.",
        }}
      />

      <RHFInput<RegisterStudentFormState>
        name="lastName"
        placeholder={msgs.auth.surename}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Priezvisko je povinné.",
          validate: (v: string) => v.trim().length >= 2 || "Priezvisko musí mať aspoň 2 znaky.",
        }}
      />

      <RHFInput<RegisterStudentFormState>
        name="address"
        placeholder={msgs.auth.address}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Adresa je povinná.",
          validate: (v: string) => v.trim().length >= 5 || "Adresa musí mať aspoň 5 znakov.",
        }}
      />

      <RHFInput<RegisterStudentFormState>
        name="studentEmail"
        type="email"
        placeholder={msgs.auth.email}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Email je povinný.",
          validate: (v: string) => {
            const domain = (v.split("@")[1] ?? "").toLowerCase();
            const ok = allowedStudentDomains.includes(
              domain as (typeof allowedStudentDomains)[number],
            );
            return ok || `Email musí byť z domény ${allowedStudentDomains.join(", ")}.`;
          },
        }}
      />

      <RHFInput<RegisterStudentFormState>
        name="altEmail"
        type="email"
        placeholder={msgs.auth.altEmail}
        className={input}
        register={register}
        errors={errors}
      />

      <RHFInput<RegisterStudentFormState>
        name="phone"
        type="tel"
        placeholder={msgs.auth.phone}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Telefón je povinný.",
          validate: (v: string) =>
            v.replaceAll(/\D/g, "").length >= 7 || "Telefón musí mať aspoň 7 číslic.",
        }}
      />

      <RHFInput<RegisterStudentFormState>
        name="studyField"
        placeholder={msgs.auth.studyField}
        className={input}
        register={register}
        errors={errors}
        rules={{
          required: "Študijný program je povinný.",
          validate: (v: string) => v.trim().length > 0 || "Študijný program je povinný.",
        }}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={mutation.isPending}
        loading={mutation.isPending}
      >
        {mutation.isPending ? msgs.auth.submitting : msgs.auth.registerStudent}
      </Button>
    </form>
  );
}
