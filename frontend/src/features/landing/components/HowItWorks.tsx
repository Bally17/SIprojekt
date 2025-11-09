"use client";
import { useLocalization } from "@/shared/i18n/client";
import Icon from "@/shared/icons";

export default function HowItWorks() {
  const { msgs } = useLocalization();
  const steps = [
    {
      n: 1,
      title: "Registrácia",
      text: "Vytvoríš účet",
      icon: <Icon name="users" className="h-6 w-6" />,
    },
    {
      n: 2,
      title: "Vytvor prax",
      text: "Vygeneruješ si PDF",
      icon: <Icon name="file-text" className="h-6 w-6" />,
    },
    {
      n: 3,
      title: "Potvrdenie firmou",
      text: "Firma schváli",
      icon: <Icon name="badge-check" className="h-6 w-6" />,
    },
    {
      n: 4,
      title: "Schválenie garantom",
      text: "Kontrola a schválenie",
      icon: <Icon name="shield" className="h-6 w-6" />,
    },
    {
      n: 5,
      title: "Výkaz a uzavretie",
      text: "Upload + export CSV",
      icon: <Icon name="upload" className="h-6 w-6" />,
    },
  ];

  return (
    <section id="how" className="bg-primary-900 text-white py-16">
      <div className="container-wide text-center">
        <h2 className="text-3xl font-bold mb-12">
          {msgs.common.page.howItWorks}
          {msgs.common.questionMark}
        </h2>

        <div className="grid md:grid-cols-5 gap-6 relative">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="relative flex flex-col items-center text-center bg-white rounded-xl text-ink-900 p-6 shadow-soft"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-3">
                {step.n}
              </div>
              <div className="text-primary-700 mb-1">{step.icon}</div>
              <div className="font-semibold">{step.title}</div>
              <div className="text-sm text-ink-500 mt-1">{step.text}</div>

              {/* šípka na desktop */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-white/60 text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
