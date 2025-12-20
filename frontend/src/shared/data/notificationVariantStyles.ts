import React from "react";
import Icon from "@icons/index";
import { SystemNotificationStackProps, VariantStyles } from "@shared-types/ui/notifications";
import { SystemNotificationVariant } from "@shared-types/core/common";

export const NotificationVariantStyles: Record<SystemNotificationVariant, VariantStyles> = {
  success: {
    wrapper: "bg-green-200 border border-green-300 text-green-900 shadow-soft",
    accent: "bg-green-600",
    icon: React.createElement(Icon, {
      name: "check-circle-2",
      className: "h-5 w-5 text-green-700",
      "aria-hidden": true,
    }),
    title: "text-green-900",
    description: "text-green-800",
    action: "text-green-700 hover:text-green-900 focus-visible:ring-green-500",
    progressTrack: "bg-green-100/80",
    progressFill: "bg-green-600",
  },
  info: {
    wrapper: "bg-blue-200 border border-blue-300 text-blue-900 shadow-soft",
    accent: "bg-blue-600",
    icon: React.createElement(Icon, {
      name: "info",
      className: "h-5 w-5 text-blue-700",
      "aria-hidden": true,
    }),
    title: "text-blue-900",
    description: "text-blue-800",
    action: "text-blue-700 hover:text-blue-900 focus-visible:ring-blue-500",
    progressTrack: "bg-blue-100/80",
    progressFill: "bg-blue-600",
  },
  warning: {
    wrapper: "bg-red-200 border border-red-300 text-red-900 shadow-soft",
    accent: "bg-red-600",
    icon: React.createElement(Icon, {
      name: "alert-triangle",
      className: "h-5 w-5 text-red-700",
      "aria-hidden": true,
    }),
    title: "text-red-900",
    description: "text-red-800",
    action: "text-red-700 hover:text-red-900 focus-visible:ring-red-500",
    progressTrack: "bg-red-100/80",
    progressFill: "bg-red-600",
  },
};

export const positionClasses: Record<
  NonNullable<SystemNotificationStackProps["position"]>,
  string
> = {
  "top-right": "top-6 right-6 items-end",
  "top-left": "top-6 left-6 items-start",
  "bottom-right": "bottom-6 right-6 items-end",
  "bottom-left": "bottom-6 left-6 items-start",
};

export const spacingClasses: Record<
  NonNullable<SystemNotificationStackProps["spacing"]>,
  string
> = {
  default: "gap-3",
  comfortable: "gap-4",
  compact: "gap-2",
};
