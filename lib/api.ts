/**
 * Centralised API fetch wrapper.
 *
 * - Reads the base URL from NEXT_PUBLIC_API_URL (defaults to http://localhost:3000).
 * - Automatically attaches JSON headers and the auth token from localStorage.
 * - Provides typed error handling.
 */

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:3000";

/**
 * Get the current auth token from localStorage.
 * Tries multiple keys for backward-compatibility.
 */
function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

/**
 * Core fetch wrapper.  All API calls should go through this function.
 *
 * @param path  – API path starting with "/", e.g. "/event"
 * @param init  – Standard RequestInit overrides
 * @returns       The raw Response object
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getStoredToken();
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
  };

  // When sending FormData, let the browser set the Content-Type (multipart boundary)
  if (init?.body instanceof FormData) {
    delete (headers as Record<string, string>)["Content-Type"];
  }

  return fetch(url, {
    ...init,
    headers,
  });
}

/**
 * Convenience: apiFetch + parse JSON body, throw on non-ok.
 */
export async function apiFetchJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(path, init);

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      const msg = body?.message ?? body?.error;
      if (Array.isArray(msg)) message = msg.join(", ");
      else if (typeof msg === "string" && msg.trim()) message = msg;
    } catch {
      // ignore parse failures
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/** Re-export for use in other modules. */
export { API_BASE_URL, getStoredToken };
