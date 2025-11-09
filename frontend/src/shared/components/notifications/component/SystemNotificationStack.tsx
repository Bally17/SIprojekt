import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SystemNotification, { SystemNotificationProps } from "./SystemNotification";

export type NotificationStackItem = {
  id: string | number;
  /**
   * Automatické zatváranie (default true)
   */
  autoClose?: boolean;
  /**
   * Trvanie v milisekundách (default 4000)
   */
  durationMs?: number;
  /**
   * Pozastaví timer pri hover (default true)
   */
  pauseOnHover?: boolean;
} & Omit<SystemNotificationProps, "onClose">;

export type SystemNotificationStackProps = {
  items: NotificationStackItem[];
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  spacing?: "default" | "comfortable" | "compact";
  /**
   * Šírka jedného toastu (px alebo vlastná CSS hodnota). Default 360px.
   */
  toastWidth?: number | string;
  onDismiss?: (id: NotificationStackItem["id"]) => void;
};

const positionClasses: Record<NonNullable<SystemNotificationStackProps["position"]>, string> = {
  "top-right": "top-6 right-6 items-end",
  "top-left": "top-6 left-6 items-start",
  "bottom-right": "bottom-6 right-6 items-end",
  "bottom-left": "bottom-6 left-6 items-start",
};

const spacingClasses: Record<NonNullable<SystemNotificationStackProps["spacing"]>, string> = {
  default: "gap-3",
  comfortable: "gap-4",
  compact: "gap-2",
};

const SystemNotificationStack: React.FC<SystemNotificationStackProps> = ({
  items,
  position = "top-right",
  spacing = "default",
  toastWidth = DEFAULT_TOAST_WIDTH,
  onDismiss,
}) => {
  if (!items.length) return null;

  return (
    <div
      className={`pointer-events-none fixed z-50 flex flex-col ${positionClasses[position]} ${spacingClasses[spacing]}`}
    >
      {items.map((item) => (
        <ToastItem key={item.id} item={item} toastWidth={toastWidth} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

type ToastItemProps = {
  item: NotificationStackItem;
  toastWidth: number | string;
  onDismiss?: (id: NotificationStackItem["id"]) => void;
};

const COMPLETION_DELAY_MS = 220;
const EXIT_ANIMATION_MS = 320;
const DEFAULT_TOAST_WIDTH = 360;

const useProgressTimer = ({
  durationMs,
  paused,
  enabled,
  onComplete,
}: {
  durationMs: number;
  paused: boolean;
  enabled: boolean;
  onComplete: () => void;
}) => {
  const progressRef = useRef(0);
  const [, setTick] = useState(0);
  const finishTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (paused) return;

    let rafId: number;
    const start = performance.now() - progressRef.current * durationMs;

    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - start) / durationMs);
      progressRef.current = nextProgress;
      setTick(nextProgress);

      if (nextProgress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    const remaining = durationMs * (1 - progressRef.current);
    finishTimeout.current = setTimeout(() => {
      progressRef.current = 1;
      setTick(1);
      completionTimeout.current = setTimeout(onComplete, COMPLETION_DELAY_MS);
    }, remaining);

    return () => {
      cancelAnimationFrame(rafId);
      if (finishTimeout.current) {
        clearTimeout(finishTimeout.current);
        finishTimeout.current = null;
      }
      if (completionTimeout.current) {
        clearTimeout(completionTimeout.current);
        completionTimeout.current = null;
      }
    };
  }, [durationMs, enabled, paused, onComplete]);

  return progressRef.current;
};

const ToastItem: React.FC<ToastItemProps> = ({ item, toastWidth, onDismiss }) => {
  const [hovered, setHovered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const autoClose = item.autoClose !== false;
  const durationMs = item.durationMs ?? 5000;
  const pauseOnHover = item.pauseOnHover ?? true;
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScheduledClose = useRef(false);

  const startClosing = useCallback(() => {
    if (hasScheduledClose.current) return;
    hasScheduledClose.current = true;
    setIsClosing(true);
    closeTimeout.current = setTimeout(() => {
      onDismiss?.(item.id);
    }, EXIT_ANIMATION_MS);
  }, [item.id, onDismiss]);

  useEffect(
    () => () => {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
      }
    },
    [],
  );

  const elapsed = useProgressTimer({
    durationMs,
    paused: pauseOnHover && hovered,
    enabled: autoClose && !isClosing,
    onComplete: startClosing,
  });

  const remaining = useMemo(() => Math.max(0, 1 - Math.min(1, elapsed)), [elapsed]);

  const { className, ...rest } = item;
  const animationClass = isClosing ? "toast-exit" : "toast-enter";
  const widthStyle = typeof toastWidth === "number" ? `${toastWidth}px` : toastWidth;

  return (
    <div
      className={`pointer-events-auto ${animationClass}`}
      style={{ width: widthStyle ?? `${DEFAULT_TOAST_WIDTH}px` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SystemNotification
        {...rest}
        onClose={startClosing}
        className={`${className ?? ""} pointer-events-auto`}
        progress={autoClose ? remaining : undefined}
      />
    </div>
  );
};

export default SystemNotificationStack;
