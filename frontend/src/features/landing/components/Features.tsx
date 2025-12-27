"use client";

import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";

export default function Features() {
  const { msgs } = useLocalization();
  const features =
    msgs?.common?.featuresList && !Array.isArray(msgs.common.featuresList)
      ? [
          {
            icon: "file-spreadsheet",
            title: msgs.common.featuresList.item1Title,
          },
          {
            icon: "workflow",
            title: msgs.common.featuresList.item2Title,
          },
          {
            icon: "file-text",
            title: msgs.common.featuresList.item3Title,
          },
          {
            icon: "upload",
            title: msgs.common.featuresList.item4Title,
          },
          {
            icon: "download",
            title: msgs.common.featuresList.item5Title,
          },
          {
            icon: "mail-check",
            title: msgs.common.featuresList.item6Title,
          },
          {
            icon: "key-round",
            title: msgs.common.featuresList.item7Title,
          },
          { icon: "filter", title: msgs.common.featuresList.item8Title },
        ]
      : [];

  return (
    <section id="features" className="section bg-paper">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-8">{msgs.common.page.features}</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {features.map((f: any, idx: number) => (
            <div
              key={`${f.title ?? "feat"}-${idx}`}
              className="bg-white card flex items-center gap-3"
            >
              <div className="badge">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <div className="font-medium">{f.title}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
