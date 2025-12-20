import { FeatureDatasItem } from "@shared-types/core/common";

export const steps: readonly FeatureDatasItem[] = [
  {
    title: "Registrácia",
    text: "Vytvoríš účet",
    icon: "users",
  },
  {
    title: "Vytvor prax",
    text: "Vygeneruješ si PDF",
    icon: "file-text",
  },
  {
    title: "Potvrdenie firmou",
    text: "Firma schváli",
    icon: "badge-check",
  },
  {
    title: "Schválenie garantom",
    text: "Kontrola a schválenie",
    icon: "shield",
  },
  {
    title: "Výkaz a uzavretie",
    text: "Upload + export CSV",
    icon: "upload",
  },
] as const;
