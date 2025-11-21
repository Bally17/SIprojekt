"use client";

import { Card } from "@components/sections";
import { CompanyDashboard } from "@features/company";
import { useLocalization } from "@i18n/client";

export default function CompanyInternshipsPage() {
  const { msgs } = useLocalization();
  return (
    <Card title={msgs.common.internships.management} subtitle={msgs.common.internships.show}>
      <CompanyDashboard />
    </Card>
  );
}
