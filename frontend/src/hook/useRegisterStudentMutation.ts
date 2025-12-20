// src/hook/useRegisterStudentMutation.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { registerStudent, type RegisterStudentPayload } from "src/api/student-api";

export function useRegisterStudentMutation() {
  return useMutation({
    mutationFn: (payload: RegisterStudentPayload) => registerStudent(payload),
  });
}
