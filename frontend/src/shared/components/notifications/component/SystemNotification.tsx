import { Button } from "@components/button";
import Icon from "@icons/index";
import React from "react";

export type SystemNotificationVariant = "success" | "info" | "warning";

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

type VariantStyles = {
  wrapper: string;
  accent: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  progressTrack: string;
  progressFill: string;
};

const variantStyles: Record<SystemNotificationVariant, VariantStyles> = {
  success: {
    wrapper: "bg-green-200 border border-green-300 text-green-900 shadow-soft",
    accent: "bg-green-600",
    icon: <Icon name="check-circle-2" className="h-5 w-5 text-green-700" aria-hidden />,
    title: "text-green-900",
    description: "text-green-800",
    action: "text-green-700 hover:text-green-900 focus-visible:ring-green-500",
    progressTrack: "bg-green-100/80",
    progressFill: "bg-green-600",
  },
  info: {
    wrapper: "bg-blue-200 border border-blue-300 text-blue-900 shadow-soft",
    accent: "bg-blue-600",
    icon: <Icon name="info" className="h-5 w-5 text-blue-700" aria-hidden />,
    title: "text-blue-900",
    description: "text-blue-800",
    action: "text-blue-700 hover:text-blue-900 focus-visible:ring-blue-500",
    progressTrack: "bg-blue-100/80",
    progressFill: "bg-blue-600",
  },
  warning: {
    wrapper: "bg-red-200 border border-red-300 text-red-900 shadow-soft",
    accent: "bg-red-600",
    icon: <Icon name="alert-triangle" className="h-5 w-5 text-red-700" aria-hidden />,
    title: "text-red-900",
    description: "text-red-800",
    action: "text-red-700 hover:text-red-900 focus-visible:ring-red-500",
    progressTrack: "bg-red-100/80",
    progressFill: "bg-red-600",
  },
};

export const SystemNotification = ({
  variant = "info",
  title,
  description,
  dismissible = true,
  actionLabel,
  onAction,
  onClose,
  className = "",
  progressDuration,
  progressPaused = false,
  closeLabel,
}: SystemNotificationProps) => {
  const styles = variantStyles[variant];
  const role = variant === "warning" ? "alert" : "status";
  const showProgress = typeof progressDuration === "number" && progressDuration > 0;

  return (
    <div
      role={role}
      aria-live={variant === "warning" ? "assertive" : "polite"}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl px-4 py-3 transition ${styles.wrapper} ${className}`}
    >
      {showProgress ? (
        <div className={`absolute inset-x-0 top-0 h-1 ${styles.progressTrack}`} aria-hidden>
          <div
            className={`h-full ${styles.progressFill} toast-progress-bar`}
            style={{
              animationDuration: `${progressDuration}ms`,
              animationPlayState: progressPaused ? "paused" : "running",
            }}
          />
        </div>
      ) : null}
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-8 w-1 rounded-full ${styles.accent}`} aria-hidden />
        <div className="flex flex-1 gap-3">
          <div className="pt-0.5">{styles.icon}</div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
            {description ? (
              <p className={`mt-1 text-sm ${styles.description}`}>{description}</p>
            ) : null}
            {actionLabel ? (
              <Button
                type="button"
                onClick={onAction}
                variant="ghost"
                className={`mt-2 text-sm font-medium transition focus-visible:ring-offset-2 ${styles.action}`}
              >
                {actionLabel}
              </Button>
            ) : null}
          </div>
        </div>
        {dismissible ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            aria-label={closeLabel ?? title}
            className="rounded-full p-1 text-sm text-ink-500 transition hover:bg-white/60 focus-visible:ring-offset-2"
          >
            <Icon name="x" className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SystemNotification;
