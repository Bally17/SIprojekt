"use client";

import { Card } from "@components/sections";
import { StudentDashboard } from "@features/student";
import { useLocalization } from "@i18n/client";

export default function CompanyInternshipsPage() {
  const { msgs } = useLocalization();
  return (
    <Card title={msgs.common.internships.my} subtitle={msgs.common.internships.manage}>
      <StudentDashboard />
    </Card>
  );
}
