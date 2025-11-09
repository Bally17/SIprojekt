import { X, CheckCircle2, Info, AlertTriangle } from "lucide-react";
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
  /**
   * Zobrazuje integrovaný progres bar (1 = plný čas, 0 = ukončené).
   */
  progress?: number;
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
    wrapper: "bg-green-50 border border-green-100 text-green-900 shadow-soft",
    accent: "bg-green-500",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />,
    title: "text-green-900",
    description: "text-green-800",
    action: "text-green-700 hover:text-green-900 focus-visible:ring-green-500",
    progressTrack: "bg-green-100/80",
    progressFill: "bg-green-500",
  },
  info: {
    wrapper: "bg-blue-50 border border-blue-100 text-blue-900 shadow-soft",
    accent: "bg-blue-500",
    icon: <Info className="h-5 w-5 text-blue-600" aria-hidden />,
    title: "text-blue-900",
    description: "text-blue-800",
    action: "text-blue-700 hover:text-blue-900 focus-visible:ring-blue-500",
    progressTrack: "bg-blue-100/80",
    progressFill: "bg-blue-500",
  },
  warning: {
    wrapper: "bg-red-50 border border-red-100 text-red-900 shadow-soft",
    accent: "bg-red-500",
    icon: <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />,
    title: "text-red-900",
    description: "text-red-800",
    action: "text-red-700 hover:text-red-900 focus-visible:ring-red-500",
    progressTrack: "bg-red-100/80",
    progressFill: "bg-red-500",
  },
};

const SystemNotification: React.FC<SystemNotificationProps> = ({
  variant = "info",
  title,
  description,
  dismissible = true,
  actionLabel,
  onAction,
  onClose,
  className = "",
  progress,
}) => {
  const styles = variantStyles[variant];
  const role = variant === "warning" ? "alert" : "status";
  const hasProgress = typeof progress === "number";
  const sanitizedProgress = Math.max(0, Math.min(1, progress ?? 0));
  const showProgress = hasProgress && sanitizedProgress >= 0;
  const progressWidth = `${sanitizedProgress * 100}%`;

  return (
    <div
      role={role}
      aria-live={variant === "warning" ? "assertive" : "polite"}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl px-4 py-3 transition ${styles.wrapper} ${className}`}
    >
      {showProgress ? (
        <div className={`absolute inset-x-0 top-0 h-1 ${styles.progressTrack}`} aria-hidden>
          <div
            className={`ml-auto h-full ${styles.progressFill} transition-[width] duration-150 ease-linear`}
            style={{ width: progressWidth }}
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
              <button
                type="button"
                onClick={onAction}
                className={`mt-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles.action}`}
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-sm text-ink-500 transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-primary-500"
            aria-label="Zavrieť notifikáciu"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SystemNotification;
