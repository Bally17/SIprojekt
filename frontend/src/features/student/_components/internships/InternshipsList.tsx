"use client";

import { useLocalization } from "@i18n/client";
import type { Internship } from "@shared-types/internship";
import InternshipCard from "./InternshipCard";

type Props = {
  internships: Internship[];
  loading: boolean;
  onRefresh: () => void;
};

export default function InternshipsList({ internships, loading, onRefresh }: Props) {
  const { msgs } = useLocalization();

  if (loading) {
    return <p className="text-gray-600">{msgs.common.loading.loading}</p>;
  }

  if (internships.length === 0) {
    return <p className="text-gray-500 italic">{msgs.common.internships.emptyYour}</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {internships.map((internship) => (
        <InternshipCard key={internship.id} internship={internship} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
