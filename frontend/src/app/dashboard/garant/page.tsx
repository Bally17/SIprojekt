"use client";
import GarantInternshipsDashboard from "@/features/garant/GarantInternshipsDashboard";
import { Card } from "@/shared/components/sections";
import { useLocalization } from "@/shared/i18n/client";

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
