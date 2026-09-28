// Lightweight funnel event tracking (Build Spec §Analytics & funnel events).
// The point is having these seven events at all, not which tool renders them —
// swap the console.info below for a real analytics call when one is wired up.
export type AnalyticsEvent =
  | "homepage_viewed"
  | "product_viewed"
  | "add_to_cart"
  | "checkout_started"
  | "payment_initiated"
  | "payment_successful"
  | "whatsapp_button_clicked";

export function track(event: AnalyticsEvent, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  console.info(`[analytics] ${event}`, data ?? {});
}
