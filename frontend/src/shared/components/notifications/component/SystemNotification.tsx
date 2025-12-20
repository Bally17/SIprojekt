import { Button } from "@components/button";
import { NotificationVariantStyles } from "@data/notificationVariantStyles";
import Icon from "@icons/index";
import { SystemNotificationProps } from "@shared-types/ui/notifications";
import React from "react";

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
  const styles = NotificationVariantStyles[variant];
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
