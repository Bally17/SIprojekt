// frontend/src/features/student/screens/StudentInternshipsDashboard.tsx
"use client";

import { useCallback } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useStudentInternshipsQuery, useCreateInternshipMutation } from "../hooks";
import InternshipCreateForm, {
  InternshipCreateFormValues,
} from "@student/_components/internships/InternshipCreateForm";
import InternshipsList from "@student/_components/internships/InternshipsList";
import { getErrorMessage } from "@utils/errorActions";

export default function StudentDashboardPage() {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const {
    data: internships = [],
    isLoading: internshipsLoading,
    refetch: refetchInternships,
  } = useStudentInternshipsQuery();

  const createInternshipMutation = useCreateInternshipMutation();
  const creating = createInternshipMutation.isPending;

  const onSubmit = useCallback(
    async (values: InternshipCreateFormValues) => {
      try {
        await createInternshipMutation.mutateAsync({
          ...values,
          firma_id: Number(values.firma_id),
        });

        notifySuccess({
          title: "Prax vytvorena",
          description: "Dohoda bola automaticky vygenerovana.",
        });

        await refetchInternships();
      } catch (err: any) {
        notifyWarning({
          title: "Nepodarilo sa vytvoriť prax",
          description: getErrorMessage(err, "Nastala neočakávaná chyba."),
        });

        // dôležité: rethrow, aby si vo forme vedel nerozbiť reset,
        // alebo aby si mohol riešiť ďalšie správanie vyššie
        throw err;
      }
    },
    [createInternshipMutation, notifySuccess, notifyWarning, refetchInternships],
  );

  return (
    <>
      <InternshipCreateForm
        onSubmit={onSubmit}
        creating={creating}
        onValidationError={(msg) =>
          notifyWarning({ title: msg.title ?? "Chyba", description: msg.description })
        }
      />

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">{msgs.common.internships.my}</h2>

        <InternshipsList
          internships={internships as any}
          loading={internshipsLoading}
          onRefresh={refetchInternships}
        />
      </section>
    </>
  );
}
