import { RoleType, Locale } from "@shared-types/core/common";

export const rolePreviewImagesByLocale: Record<Locale, Record<RoleType, string>> = {
  sk: {
    student: "/images/roleSection/sk/student_dashboard.png",
    company: "/images/roleSection/sk/firma_dashboard.png",
    garant: "/images/roleSection/sk/garant_dashboard.png",
  },
  en: {
    student: "/images/roleSection/en/student_dashboard.png",
    company: "/images/roleSection/en/company_dashboard.png",
    garant: "/images/roleSection/en/supervisor_dashboard.png",
  },
};
