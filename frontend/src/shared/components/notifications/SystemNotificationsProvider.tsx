"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import SystemNotificationStack, {
  type NotificationStackItem,
} from "./component/SystemNotificationStack";
import type { SystemNotificationVariant } from "./component/SystemNotification";

type ToastInput = Omit<NotificationStackItem, "id"> & {
  id?: NotificationStackItem["id"];
};

type SystemNotificationsContextValue = {
  push: (notification: ToastInput) => NotificationStackItem["id"];
  success: (notification: Omit<ToastInput, "variant">) => NotificationStackItem["id"];
  info: (notification: Omit<ToastInput, "variant">) => NotificationStackItem["id"];
  warning: (notification: Omit<ToastInput, "variant">) => NotificationStackItem["id"];
  dismiss: (id: NotificationStackItem["id"]) => void;
};

const SystemNotificationsContext = createContext<SystemNotificationsContextValue | null>(null);

const randomId = () => crypto.randomUUID?.() ?? `notif-${Date.now()}-${Math.random().toString(16)}`;

const withVariant = (
  variant: SystemNotificationVariant,
  notification: Omit<ToastInput, "variant">,
): ToastInput => ({ ...notification, variant });

export function SystemNotificationsProvider({ children }: Readonly<PropsWithChildren>) {
  const [items, setItems] = useState<NotificationStackItem[]>([]);

  const dismiss = useCallback((id: NotificationStackItem["id"]) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (notification: ToastInput) => {
      const id = notification.id ?? randomId();
      setItems((prev) => [...prev, { ...notification, id }]);
      return id;
    },
    [setItems],
  );

  const pushWithVariant = useCallback(
    (variant: SystemNotificationVariant, notification: Omit<ToastInput, "variant">) =>
      push(withVariant(variant, notification)),
    [push],
  );

  const value = useMemo<SystemNotificationsContextValue>(
    () => ({
      push,
      success: (notification) => pushWithVariant("success", notification),
      info: (notification) => pushWithVariant("info", notification),
      warning: (notification) => pushWithVariant("warning", notification),
      dismiss,
    }),
    [push, pushWithVariant, dismiss],
  );

  return (
    <SystemNotificationsContext.Provider value={value}>
      {children}
      <SystemNotificationStack items={items} onDismiss={dismiss} />
    </SystemNotificationsContext.Provider>
  );
}

export const useSystemNotifications = () => {
  const ctx = useContext(SystemNotificationsContext);
  if (!ctx) {
    throw new Error("useSystemNotifications must be used within SystemNotificationsProvider");
  }
  return ctx;
};
