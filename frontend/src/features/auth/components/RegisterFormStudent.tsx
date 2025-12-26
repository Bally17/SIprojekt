"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useRegisterStudentMutation } from "src/hook/useRegisterStudentMutation";
import { getErrorMessage } from "@utils/errorActions";
import { useForm, type FieldErrors } from "react-hook-form";

type RegisterStudentFormState = {
  firstName: string;
  lastName: string;
  address: string;
  studentEmail: string;
  altEmail: string;
  phone: string;
  studyField: string;
};

export default function RegisterFormStudent() {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const mutation = useRegisterStudentMutation();

  const allowedStudentDomains: string[] = ["student.ukf.sk", "ukf.sk"];

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

  const errorText = "text-sm text-red-600";
  const input =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.registerStudent}
      </h2>

      <div>
        <input
          placeholder={msgs.auth.name}
          className={input}
          {...register("firstName", {
            required: "Meno je povinné.",
            validate: (v) => v.trim().length >= 2 || "Meno musí mať aspoň 2 znaky.",
          })}
        />
        {errors.firstName?.message && <p className={errorText}>{errors.firstName.message}</p>}
      </div>

      <div>
        <input
          placeholder={msgs.auth.surename}
          className={input}
          {...register("lastName", {
            required: "Priezvisko je povinné.",
            validate: (v) => v.trim().length >= 2 || "Priezvisko musí mať aspoň 2 znaky.",
          })}
        />
        {errors.lastName?.message && <p className={errorText}>{errors.lastName.message}</p>}
      </div>

      <div>
        <input
          placeholder={msgs.auth.address}
          className={input}
          {...register("address", {
            required: "Adresa je povinná.",
            validate: (v) => v.trim().length >= 5 || "Adresa musí mať aspoň 5 znakov.",
          })}
        />
        {errors.address?.message && <p className={errorText}>{errors.address.message}</p>}
      </div>

      <div>
        <input
          type="email"
          placeholder={msgs.auth.email}
          className={input}
          {...register("studentEmail", {
            required: "Email je povinný.",
            validate: (v) => {
              const domain = v.split("@")[1]?.toLowerCase() ?? "";
              return (
                allowedStudentDomains.includes(domain as any) ||
                `Email musí byť z domény ${allowedStudentDomains.join(", ")}.`
              );
            },
          })}
        />
        {errors.studentEmail?.message && <p className={errorText}>{errors.studentEmail.message}</p>}
      </div>

      <div>
        <input
          type="email"
          placeholder={msgs.auth.altEmail}
          className={input}
          {...register("altEmail")}
        />
        {errors.altEmail?.message && <p className={errorText}>{errors.altEmail.message}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder={msgs.auth.phone}
          className={input}
          {...register("phone", {
            required: "Telefón je povinný.",
            validate: (v) =>
              v.replaceAll(/\D/g, "").length >= 7 || "Telefón musí mať aspoň 7 číslic.",
          })}
        />
        {errors.phone?.message && <p className={errorText}>{errors.phone.message}</p>}
      </div>

      <div>
        <input
          placeholder={msgs.auth.studyField}
          className={input}
          {...register("studyField", {
            required: "Študijný program je povinný.",
            validate: (v) => v.trim().length > 0 || "Študijný program je povinný.",
          })}
        />
        {errors.studyField?.message && <p className={errorText}>{errors.studyField.message}</p>}
      </div>

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
