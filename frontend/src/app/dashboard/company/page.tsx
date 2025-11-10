"use client";
import CompanyInternshipsDashboard from "@/features/company/CompanyInternshipsDashboard";
import { useLocalization } from "@/shared/i18n/client";
import { Card } from "@/shared/components/sections";

export default function CompanyInternshipsPage() {
  const { msgs } = useLocalization();
  return (
    <Card title={msgs.common.internships.management} subtitle={msgs.common.internships.show}>
      <CompanyInternshipsDashboard />
    </Card>
  );
}
