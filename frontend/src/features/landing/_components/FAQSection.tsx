"use client";

import { AcordeonComponent } from "@components/acordeon";
import { faqDatas } from "@data/faqDatas";
import { useLocalization } from "@i18n/client";

export default function FAQSection() {
  const { msgs } = useLocalization();

  return (
    <section id="faq" className="section bg-paper">
      <div className="container-wide">
        <div className="text-center mb-10">
          <div className="text-primary-700 font-semibold">{msgs.common.page.faq}</div>
          <h2 className="text-3xl font-bold text-ink-900 mt-2">{msgs.common.page.faqTitle}</h2>
        </div>
        <AcordeonComponent variant="dark" data={faqDatas} />
      </div>
    </section>
  );
}
