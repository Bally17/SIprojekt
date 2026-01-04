"use client";

import { Card } from "@components/sections";
import { useLocalization } from "@i18n/client";
import { StudentDashboard } from "@student";

export default function CompanyInternshipsPage() {
  const { msgs } = useLocalization();
  return (
    <Card title={msgs.common.internships.my} subtitle={msgs.common.internships.manage}>
      <StudentDashboard />
    </Card>
  );
}
