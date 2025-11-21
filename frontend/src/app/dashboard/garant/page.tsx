"use client";

import { Card } from "@components/sections";
import { GarantInternshipsDashboard } from "@features/garant";
import { useLocalization } from "@i18n/client";

export default function GarantDashboardPage() {
  const { msgs } = useLocalization();
  return (
    <Card
      title={msgs.common.guarant.title}
      subtitle={msgs.common.guarant.subtitle}
      titleClassName="text-4xl font-bold text-primary-900 tracking-tight"
    >
      <GarantInternshipsDashboard />
    </Card>
  );
}
