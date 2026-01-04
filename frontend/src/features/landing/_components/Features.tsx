"use client";

import { featureDatas } from "@data/featureDatas";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";

export default function Features() {
  const { msgs } = useLocalization();

  return (
    <section id="features" className="section bg-paper">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-8">{msgs.common.page.features}</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featureDatas.map((f) => (
            <div key={f.title} className="bg-white card flex items-center gap-3">
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
