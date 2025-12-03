// frontend/src/lib/hooks/use-profile-query.ts
"use client";

import { useApiQuery } from "@lib/api";
import { getProfile, type ProfileUser } from "@lib/api";

export function useProfileQuery() {
  return useApiQuery<ProfileUser | null>(["profile"], () => getProfile(), {
    // profil sa nemení každú sekundu, môžeme ho nechať chvíľu „čerstvý“
    staleTime: 5 * 60 * 1000,
  });
}
