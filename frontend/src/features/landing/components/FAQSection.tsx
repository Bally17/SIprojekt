"use client";
import { faqDatas } from "@/shared/data/faqDatas";
import { useLocalization } from "@/shared/i18n/client";
import { AcordeonComponent } from "@/shared/components/acordeon";

export default function FAQSection() {
  const { msgs } = useLocalization();

  return (
    <section id="faq" className="section">
      <div className="container-wide">
        <div className="text-center mb-10">
          <div className="text-primary-700 font-semibold">{msgs.common.page.faq}</div>
          <h2 className="text-3xl font-bold text-ink-900 mt-2">{msgs.common.page.faqTitle}</h2>
        </div>
        <AcordeonComponent data={faqDatas} />
      </div>
    </section>
  );
}
