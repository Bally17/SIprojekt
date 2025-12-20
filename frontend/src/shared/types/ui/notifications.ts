import type React from "react";
import type { StringOrNull } from "../core/primitives";
import { SystemNotificationVariant } from "@shared-types/core/common";

export type SystemNotificationProps = {
  title: string;
  description?: string;
  variant?: SystemNotificationVariant;
  dismissible?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  className?: string;
  progressDuration?: number;
  progressPaused?: boolean;
  closeLabel?: string;
};

export type VariantStyles = {
  wrapper: string;
  accent: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  progressTrack: string;
  progressFill: string;
};

export type NotificationStackItem = {
  id: StringOrNull;
  autoClose?: boolean;
  durationMs?: number;
  pauseOnHover?: boolean;
} & Omit<SystemNotificationProps, "onClose">;

export type SystemNotificationStackProps = {
  items: NotificationStackItem[];
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  spacing?: "default" | "comfortable" | "compact";
  toastWidth?: number | string;
  onDismiss?: (id: NotificationStackItem["id"]) => void;
};
