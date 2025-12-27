"use client";

import { AcordeonComponent } from "@components/acordeon";
import { useLocalization } from "@i18n/client";

export default function FAQSection() {
  const { msgs } = useLocalization();

  // FAQ položky berieme z i18n, každá otázka/odpoveď samostatný kľúč
  const faqItems = [
    { a: msgs.common?.faqList?.item1Q, b: msgs.common?.faqList?.item1A },
    { a: msgs.common?.faqList?.item2Q, b: msgs.common?.faqList?.item2A },
    { a: msgs.common?.faqList?.item3Q, b: msgs.common?.faqList?.item3A },
    { a: msgs.common?.faqList?.item4Q, b: msgs.common?.faqList?.item4A },
  ].filter((item) => item.a && item.b);

  return (
    <section id="faq" className="section bg-paper">
      <div className="container-wide">
        <div className="text-center mb-10">
          <div className="text-primary-700 font-semibold">{msgs.common.page.faq}</div>
          <h2 className="text-3xl font-bold text-ink-900 mt-2">{msgs.common.page.faqTitle}</h2>
        </div>
        <AcordeonComponent variant="dark" data={faqItems} />
      </div>
    </section>
  );
}
