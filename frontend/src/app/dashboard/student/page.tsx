"use client";
import StudentInternshipsDashboard from "@/features/student/StudentInternshipsDashboard";
import { useLocalization } from "@/shared/i18n/client";
import { Card } from "@/shared/components/sections";

export default function CompanyInternshipsPage() {
  const { msgs } = useLocalization();
  return (
    <Card title={msgs.common.internships.my} subtitle={msgs.common.internships.manage}>
      <StudentInternshipsDashboard />
    </Card>
  );
}
