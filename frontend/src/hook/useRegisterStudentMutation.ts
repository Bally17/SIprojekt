// src/hook/useRegisterStudentMutation.ts
"use client";

import { RegisterStudentPayload } from "@shared-types/student";
import { useMutation } from "@tanstack/react-query";
import { registerStudent } from "src/api/student-api";

export function useRegisterStudentMutation() {
  return useMutation({
    mutationFn: (payload: RegisterStudentPayload) => registerStudent(payload),
  });
}
