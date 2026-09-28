// Explicit timeZone so the server render (which runs in whatever timezone
// the host happens to be in) and the client render (the browser's local
// timezone) always compute the same calendar date — without this, a
// timestamp close to midnight can render a different day on each side and
// trigger a React hydration mismatch. IST since this is an India-only store.
const TIME_ZONE = "Asia/Kolkata";

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", { timeZone: TIME_ZONE });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", { timeZone: TIME_ZONE });
}
