import { getAccessToken } from "@lib/ApiProvider";
import { ENDPOINTS } from "src/constants/Endpoints";

export async function exportGarantInternships(params: Record<string, string>) {
  const url = new URL(ENDPOINTS.INTERNSHIPS_GARAN_EXPORT);

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
