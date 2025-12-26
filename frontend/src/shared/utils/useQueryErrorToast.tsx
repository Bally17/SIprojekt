import { useEffect, useMemo } from "react";
import { getErrorMessage } from "./errorActions";

type NotifyFn = (args: { title: string; description: string }) => void;

export function useQueryErrorToast(params: {
  error: unknown;
  title: string;
  fallback: string;
  notifyWarning: NotifyFn;
}) {
  const { error, title, fallback, notifyWarning } = params;

  const errorText = useMemo(
    () => (error ? getErrorMessage(error, fallback) : null),
    [error, fallback],
  );

  useEffect(() => {
    if (!errorText) return;

    notifyWarning({
      title,
      description: errorText,
    });
  }, [errorText, notifyWarning, title]);

  return errorText;
}
