"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/FormField";
import { siteSettings } from "@/lib/mockData";
import { isValidEmail } from "@/lib/validation";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const whatsappHref = `https://wa.me/${siteSettings.whatsapp_number}?text=${encodeURIComponent(
    "Hi Bougsk, I have a question."
  )}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display mb-2 text-4xl text-ink">Contact</h1>
      <p className="mb-8 text-sm text-ink/70">
        For the fastest reply, message us on WhatsApp. For anything else, this form
        reaches us too.
      </p>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-wine px-6 py-3 text-sm font-medium text-wine transition-colors duration-300 hover:bg-wine hover:text-paper"
      >
        Message us on WhatsApp
      </a>

      {sent ? (
        <p className="rounded-md bg-sand p-5 text-sm text-ink">
          Got it — we&apos;ll write back within a day.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const next: Record<string, string> = {};
            if (!name.trim()) next.name = "Enter your name.";
            if (!isValidEmail(email)) next.email = "Enter a valid email address.";
            if (!message.trim()) next.message = "Enter a message.";
            setErrors(next);
            if (Object.keys(next).length > 0) return;
            // No email service connected yet (see Build Spec §Free-tier stack — Resend,
            // optional). This just confirms receipt in the UI for now.
            setSent(true);
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Name" htmlFor="contact-name" error={errors.name}>
            <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          </Field>
          <Field label="Email" htmlFor="contact-email" error={errors.email}>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          </Field>
          <Field label="Message" htmlFor="contact-message" error={errors.message}>
            <Textarea id="contact-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} />
          </Field>
          <Button type="submit">Send message</Button>
        </form>
      )}
    </div>
  );
}
