"use client";

import { Card } from "@components/sections";
import { GarantInternshipsDashboard } from "@garant";
import { OAuthClientsSection } from "@garant/_components";
import { useLocalization } from "@i18n/client";

export default function GarantDashboardPage() {
  const { msgs } = useLocalization();
  return (
    <Card
      title={msgs.common.guarant.title}
      subtitle={msgs.common.guarant.subtitle}
      titleClassName="text-4xl font-bold text-ink-900 tracking-tight"
    >
      <div className="space-y-10">
        <GarantInternshipsDashboard />
        <OAuthClientsSection />
      </div>
    </Card>
  );
}
