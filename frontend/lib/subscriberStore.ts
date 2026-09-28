// Mock stand-in for the `subscribers` table (Build Spec §Email capture & social proof).
// Real writes go through RLS as an insert-only public policy; this just keeps a local
// record so the footer/checkout capture points have somewhere to write to.
const STORAGE_KEY = "bougsk_subscribers_v1";

export function addSubscriber(email: string, source: string): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: { email: string; source: string; created_at: string }[] = raw
      ? JSON.parse(raw)
      : [];
    if (list.some((s) => s.email.toLowerCase() === email.toLowerCase())) return;
    list.push({ email, source, created_at: new Date().toISOString() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable — capture silently skipped, not worth blocking the user over.
  }
}
