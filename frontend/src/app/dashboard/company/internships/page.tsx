"use client";
import CompanyInternshipsDashboard from "@/features/company/CompanyInternshipsDashboard";
import { useLocalization } from "@/shared/i18n/client";

export default function CompanyInternshipsPage() {
  const { msgs } = useLocalization();
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-white border border-gray-100 shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-semibold text-cyan-700">
            {msgs.common.internships.management}
          </h1>
          <p className="text-gray-600 text-sm mt-2">{msgs.common.internships.show}</p>
        </header>
        <CompanyInternshipsDashboard />
      </div>
    </main>
  );
}
