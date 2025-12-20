// src/hook/useRegisterGuarantMutation.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { registerGuarant, RegisterGuarantPayload } from "src/api/guarant-api";

export function useRegisterGuarantMutation() {
  return useMutation({
    mutationFn: (payload: RegisterGuarantPayload) => registerGuarant(payload),
  });
}
