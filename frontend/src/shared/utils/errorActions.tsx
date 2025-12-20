// src/utils/errors.ts
const serializeErrorValue = (value: unknown): string => {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return String(value);
    case "object":
      try {
        return JSON.stringify(value);
      } catch {
        return "[unserializable]";
      }
    default:
      return "";
  }
};

export const getErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;

  if (!data) return typeof err?.message === "string" && err.message ? err.message : fallback;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;

  const obj: Record<string, unknown> = data ?? {};
  const parts: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const s = serializeErrorValue(value);
    if (s) parts.push(`${key}: ${s}`);
  }

  return parts.join(" | ") || fallback;
};
