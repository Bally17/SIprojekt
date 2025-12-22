"use client";

import { useState } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useRegisterCompanyMutation } from "src/hook/useRegisterCompanyMutation";
import { getErrorMessage } from "@utils/errorActions";

type RegisterCompanyFormState = {
  companyName: string;
  companyEmail: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export default function RegisterFormCompany() {
  const [form, setForm] = useState<RegisterCompanyFormState>({
    companyName: "",
    companyEmail: "",
    address: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const mutation = useRegisterCompanyMutation();

  const validateForm = () => {
    if (form.companyName.trim().length < 2) return "Názov firmy musí mať aspoň 2 znaky.";
    if (form.address.trim().length < 5) return "Adresa musí mať aspoň 5 znakov.";
    if (form.contactName.trim().length < 3) return "Meno kontaktnej osoby musí mať aspoň 3 znaky.";

    const phoneDigits = form.contactPhone.replaceAll(/\D/g, "");
    if (phoneDigits.length < 7) return "Telefón musí mať aspoň 7 číslic.";

    return null;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
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

      setForm({
        companyName: "",
        companyEmail: "",
        address: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    } catch (err: unknown) {
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
        {msgs.auth.registerCompany}
      </h2>

      <input
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        placeholder={msgs.auth.companyName}
        className={input}
        required
      />

      <input
        type="email"
        name="companyEmail"
        value={form.companyEmail}
        onChange={handleChange}
        placeholder={msgs.auth.companyLoginEmail}
        className={input}
        required
      />

      <input
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder={msgs.auth.companyAddress}
        className={input}
        required
      />

      <input
        name="contactName"
        value={form.contactName}
        onChange={handleChange}
        placeholder={msgs.auth.contactName}
        className={input}
        required
      />

      <input
        type="email"
        name="contactEmail"
        value={form.contactEmail}
        onChange={handleChange}
        placeholder={msgs.auth.contactEmail}
        className={input}
        required
      />

      <input
        type="tel"
        name="contactPhone"
        value={form.contactPhone}
        onChange={handleChange}
        placeholder={msgs.auth.contactPhone}
        className={input}
        required
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
