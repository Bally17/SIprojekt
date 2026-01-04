"use client";

import { STAV_BADGE_CLASS } from "@shared-types/core/internshipState";
import type { Internship } from "@shared-types/internship";
import DocumentUploadCard from "../DocumentUploadCard";

type Props = {
  internship: Internship;
  onRefresh: () => void;
};

export default function InternshipCard({ internship, onRefresh }: Props) {
  return (
    <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary-600">
          {internship.firma?.nazov || "Neznama firma"}
        </h3>

        <span
          className={`rounded px-2 py-1 text-sm font-medium ${
            internship.stav ? STAV_BADGE_CLASS[internship.stav] : "bg-gray-100 text-gray-600"
          }`}
        >
          {internship.stav}
        </span>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        {internship.semester} {internship.rok} - {internship.datum_zaciatku} -{" "}
        {internship.datum_konca}
      </p>

      <DocumentUploadCard internship={internship} onSuccess={onRefresh} />
    </div>
  );
}
