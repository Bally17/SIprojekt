import { getAccessToken } from "@lib/ApiProvider";

export async function exportGarantInternships(params: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const url = new URL(`${base}/internships/garant/internships/export/`);

  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== "") qs.append(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
  });

  if (!res.ok) throw new Error("Export failed");

  return res.blob();
}
