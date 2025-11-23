import { Action } from "@type/props/common/globalTypes";
import { Internship } from "@type/props/internship";
import type { ReactElement } from "react";
import { TableFilters } from "./components/TableFilters";
import { TableNameValues } from "./components/TableNameValues";

export default interface TableProps {
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
  isError?: string | null;
  actionMessage?: string | null;
  showEmpty?: boolean;
  renderRow?: (item: Internship) => ReactElement;
  columnCountOverride?: number;
}
