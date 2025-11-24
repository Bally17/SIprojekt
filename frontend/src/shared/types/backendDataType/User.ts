export interface User {
  id: number;
  email: string;
  meno?: string | null;
  priezvisko?: string | null;
  is_active?: string;
  is_staff?: string;
  is_superuser?: string;
  vytvorene_at?: string;
}
