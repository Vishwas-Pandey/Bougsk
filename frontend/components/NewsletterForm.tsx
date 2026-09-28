"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/validation";
import { addSubscriber } from "@/lib/subscriberStore";
import { useToast } from "@/lib/toast-context";

export function NewsletterForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const { showToast } = useToast();

  if (done) {
    return <p className="text-xs text-charcoal-ink/70">Got it — watch your inbox.</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
          setError("Enter a valid email address.");
          return;
        }
        addSubscriber(email, source);
        setDone(true);
        showToast("success", "You're on the list.");
      }}
      noValidate
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className={`w-full rounded-full border bg-charcoal px-4 py-2 text-sm text-charcoal-ink placeholder:text-charcoal-ink/40 outline-none focus:ring-2 ${
            error ? "border-error focus:ring-error/20" : "border-charcoal-ink/20 focus:border-gold focus:ring-gold/20"
          }`}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
      <button
        type="submit"
        className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors duration-300 hover:bg-gold-deep"
      >
        Get first access
      </button>
    </form>
  );
}
