"use client";

import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useLocalization } from "@i18n/client";

export default function CompanyProfileCompleteNotice() {
  const router = useRouter();
  const { msgs } = useLocalization();

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.companyCompleteTitle}
      </h2>
      <p className="text-sm text-gray-600 text-center">{msgs.auth.companyCompleteDescription}</p>

      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={() => router.push("/auth/register/company/complete")}
      >
        {msgs.auth.companyCompleteButton}
      </Button>
    </div>
  );
}
