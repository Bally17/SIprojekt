"use client";
import { useLocalization } from "@/shared/i18n/client";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  KeyRound,
  MailCheck,
  Upload,
  Workflow,
} from "lucide-react";

export default function Features() {
  const { msgs } = useLocalization();
  const features = [
    { icon: <FileSpreadsheet className="h-5 w-5" />, title: "Evidencia praxí" },
    { icon: <Workflow className="h-5 w-5" />, title: "Workflow stavov" },
    { icon: <FileText className="h-5 w-5" />, title: "Generovanie PDF" },
    { icon: <Upload className="h-5 w-5" />, title: "Nahrávanie dokumentov" },
    { icon: <Download className="h-5 w-5" />, title: "Export CSV" },
    { icon: <MailCheck className="h-5 w-5" />, title: "Notifikácie emailom" },
    { icon: <KeyRound className="h-5 w-5" />, title: "API (OAuth 2.0)" },
    { icon: <Filter className="h-5 w-5" />, title: "Reporty / filtre" },
  ];

  return (
    <section id="features" className="section bg-paper">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-8">{msgs.common.page.features}</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card flex items-center gap-3">
              <div className="badge">{f.icon}</div>
              <div className="font-medium">{f.title}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
