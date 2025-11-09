"use client";
import Icon from "@/shared/icons";
import { ICON_NAMES } from "@/shared/icons/getIconByName";
import { useSystemNotifications } from "@/shared/components/notifications";
import { useState } from "react";
import { AcordeonComponent } from "@/shared/components/acordeon";
import { FaqData } from "@/shared/types/faqTypes";

export default function Helpers() {
  const { success, warning } = useSystemNotifications();
  const [pending, setPending] = useState<string | null>(null);

  const howToUse: FaqData[] = [
    {
      q: "Ako pridať novú ikonku?",
      a: "Otvor alebo vyhladaj subor: 'getIconByName.ts' a pridaj do importov novú ikonku z lucide-react -> následne pridaj do súboru iconName.ts na koniec '| \"názov ikonky ktorý sa bude používať\";",
    },
  ];

  const makeSnippet = (name: string) => `<Icon name="${name}" className="h-5 w-5" aria-hidden />`;

  const copySnippet = async (name: string) => {
    const snippet = makeSnippet(name);
    setPending(name);
    try {
      await navigator.clipboard.writeText(snippet);
      success({
        title: "Skopírované do schránky",
        description: `<Icon name="${name}" … />`,
        autoClose: true,
        durationMs: 3000,
      });
    } catch {
      warning({
        title: "Nepodarilo sa skopírovať",
        description: "Skús prosím znova alebo skopíruj ručne (prehliadač odmietol prístup).",
        autoClose: true,
        durationMs: 4000,
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="bg-primary-500 text-white py-12">
      <div className="container-wide text-center">
        <h2 className="text-3xl font-bold">Používané ikonky</h2>
        <p className="mb-8">Stačí kliknúť na ikonku a skopiruje sa ti</p>
        <AcordeonComponent variant="light" data={howToUse} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => copySnippet(name)}
              title="Klikni pre skopírovanie snippet-u"
              className="flex flex-col items-center w-full bg-white rounded-lg text-ink-900 p-3 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={pending === name}
            >
              <Icon name={name} className="h-5 w-5 text-primary-700" aria-hidden />
              <span className="mt-2 text-xs font-medium break-all">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
