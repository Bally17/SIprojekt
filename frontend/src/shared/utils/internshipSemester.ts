import type { Messages } from "@i18n/getMessages";
import { SEMESTERS, type Semester, isSemester } from "@shared-types/core/internshipState";

type SemesterLabels = Record<Semester, string>;

const getSemesterLabels = (msgs: Messages): SemesterLabels => ({
  zimny: msgs.common.internships.semesterLabels.zimny,
  letny: msgs.common.internships.semesterLabels.letny,
});

export const getInternshipSemesterLabel = (
  value: string | null | undefined,
  msgs: Messages,
): string => {
  if (!value) return "";
  if (!isSemester(value)) return value;
  const labels = getSemesterLabels(msgs);
  return labels[value] || value;
};

export const getInternshipSemesterOptions = (
  msgs: Messages,
  values: readonly Semester[] = SEMESTERS,
) =>
  values.map((value) => ({
    value,
    label: getInternshipSemesterLabel(value, msgs),
  }));
