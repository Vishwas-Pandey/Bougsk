import { fetchNotifications } from "@/lib/localNotifications";
import { formatDateTime } from "@/lib/formatDate";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = (await fetchNotifications()).slice().reverse();

  return (
    <div>
      <h1 className="font-display text-h1 text-ink mb-2">Notifications</h1>
      <p className="text-body text-ink/60 mb-8">
        Every customer email this store would have sent, newest first. No Resend account is
        connected yet, so nothing actually leaves this app — see{" "}
        <code className="text-[13px] bg-sand px-1 rounded-sm">backend/functions/_shared/email.ts</code>{" "}
        for the real send logic this stands in for.
      </p>

      {notifications.length === 0 ? (
        <div className="rounded-card border border-sand bg-white px-6 py-12 text-center text-body text-ink/60">
          Nothing sent yet — place an order or advance one to Packed/Shipped/Delivered to see one
          appear here.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-card border border-sand bg-white p-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-display text-h3-italic italic text-ink">{n.subject}</p>
                <p className="text-label-upper uppercase tracking-[0.08em] text-ink/40 whitespace-nowrap">
                  {formatDateTime(n.sent_at)}
                </p>
              </div>
              <p className="text-body text-ink/60 mt-1">To: {n.to}</p>
              <p className="text-body text-ink/80 mt-3 whitespace-pre-line">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
