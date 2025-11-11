import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  KeyRound,
  MailCheck,
  Upload,
  Workflow,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  Users,
  BadgeCheck,
  Shield,
  Building2,
  CalendarPlus,
  Loader2,
  ArrowLeft,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Globe,
  LockKeyhole,
  ArrowRight,
  RefreshCw,
  Pencil,
} from "lucide-react";
import IconName from "./iconName";
import { IconType } from "../types/icons/iconTypes";

const iconMap = {
  download: Download,
  "file-spreadsheet": FileSpreadsheet,
  "file-text": FileText,
  filter: Filter,
  "key-round": KeyRound,
  "mail-check": MailCheck,
  upload: Upload,
  workflow: Workflow,
  "check-circle-2": CheckCircle2,
  info: Info,
  "alert-triangle": AlertTriangle,
  x: X,
  users: Users,
  "badge-check": BadgeCheck,
  shield: Shield,
  "building-2": Building2,
  "calendar-plus": CalendarPlus,
  "loader-2": Loader2,
  "arrow-left": ArrowLeft,
  "graduation-cap": GraduationCap,
  "log-out": LogOut,
  "shield-check": ShieldCheck,
  globe: Globe,
  "refresh-cw": RefreshCw,
  "lock-keyhole": LockKeyhole,
  "arrow-right": ArrowRight,
  pencil: Pencil,
};

export const ICON_NAMES = Object.keys(iconMap) as (keyof typeof iconMap)[];

const getIconByName = (name: IconName): IconType | null => iconMap[name] ?? null;

export default getIconByName;
