"use client";

import { useState } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useRegisterStudentMutation } from "src/hook/useRegisterStudentMutation";
import { getErrorMessage } from "@utils/errorActions";

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
  const [form, setForm] = useState<RegisterStudentFormState>({
    firstName: "",
    lastName: "",
    address: "",
    studentEmail: "",
    altEmail: "",
    phone: "",
    studyField: "",
  });

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const mutation = useRegisterStudentMutation();

  const allowedStudentDomains = ["student.ukf.sk", "ukf.sk"];

  const validateForm = () => {
    if (form.firstName.trim().length < 2) return "Meno musí mať aspoň 2 znaky.";
    if (form.lastName.trim().length < 2) return "Priezvisko musí mať aspoň 2 znaky.";
    if (form.address.trim().length < 5) return "Adresa musí mať aspoň 5 znakov.";
    if (!form.studyField.trim()) return "Študijný program je povinný.";

    const emailDomain = form.studentEmail.split("@")[1]?.toLowerCase() || "";
    if (!allowedStudentDomains.includes(emailDomain)) {
      return `Email musí byť z domény ${allowedStudentDomains.join(", ")}.`;
    }

    const digits = form.phone.replaceAll(/\D/g, "");
    if (digits.length < 7) return "Telefón musí mať aspoň 7 číslic.";

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const clientError = validateForm();
    if (clientError) {
      notifyWarning({ title: msgs.auth.errorTitle, description: clientError });
      return;
    }

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

      setForm({
        firstName: "",
        lastName: "",
        address: "",
        studentEmail: "",
        altEmail: "",
        phone: "",
        studyField: "",
      });
    } catch (err: any) {
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: getErrorMessage(err, msgs.auth.error),
      });
    }
  };

  const input = "w-full border rounded px-3 py-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.registerStudent}
      </h2>

      <input
        name="firstName"
        className={input}
        required
        value={form.firstName}
        onChange={handleChange}
        placeholder={msgs.auth.name}
      />
      <input
        name="lastName"
        className={input}
        required
        value={form.lastName}
        onChange={handleChange}
        placeholder={msgs.auth.surename}
      />
      <input
        name="address"
        className={input}
        required
        value={form.address}
        onChange={handleChange}
        placeholder={msgs.auth.address}
      />

      <input
        type="email"
        name="studentEmail"
        className={input}
        required
        value={form.studentEmail}
        onChange={handleChange}
        placeholder={msgs.auth.email}
      />
      <input
        type="email"
        name="altEmail"
        className={input}
        value={form.altEmail}
        onChange={handleChange}
        placeholder={msgs.auth.altEmail}
      />
      <input
        type="tel"
        name="phone"
        className={input}
        required
        value={form.phone}
        onChange={handleChange}
        placeholder={msgs.auth.phone}
      />
      <input
        name="studyField"
        className={input}
        required
        value={form.studyField}
        onChange={handleChange}
        placeholder={msgs.auth.studyField}
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
