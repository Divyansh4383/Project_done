const API_ROOT = "/api/v1";

export async function api(path, options = {}) {
  const token = localStorage.getItem("sprintforge.token");
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message = typeof payload === "string"
      ? payload
      : payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export function pageItems(page) {
  return Array.isArray(page) ? page : page?.content || [];
}
