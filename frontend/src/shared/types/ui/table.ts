import { TABLE_NAMES } from "src/constants/Table";
import type { ReactElement } from "react";
import type { Action } from "../core/common";
import type { Semester, Stav } from "../core/internshipState";
import type { Nullable, StringOrNull } from "../core/primitives";
import type { Internship, InternshipDocument } from "../internship";

type TableNamesKeys = keyof typeof TABLE_NAMES;
export type TableNameValues = (typeof TABLE_NAMES)[TableNamesKeys];

export type TableFilters = {
  rok?: number | string;
  semester: Semester | "";
  stav: Stav | "";
};

export interface TableProps {
  name: TableNameValues;
  data: Internship[];
  document?: boolean;
  rowActions?: boolean;
  onAction?: (id: number, action: Action) => Promise<void> | void;
  showFilters?: boolean;
  filters?: TableFilters;
  onFiltersChange?: (next: TableFilters) => void;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  semesterOptions?: { value: string; label: string }[];
  stavOptions?: { value: string; label: string }[];
  isLoading?: boolean;
  isError?: StringOrNull;
  actionMessage?: StringOrNull;
  showEmpty?: boolean;
  renderRow?: (item: Internship) => ReactElement;
  columnCountOverride?: number;
  docPreview?: Nullable<InternshipDocument>;
  onDocPreview?: (doc: Nullable<InternshipDocument>) => void;
}
