"use client";

import { FormEvent, useState } from "react";

import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import { trackEvent } from "@/lib/analytics";

type ContactStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormState {
  name: string;
  email: string;
  topic: string;
  message: string;
  website: string;
}

const initialForm: ContactFormState = {
  name: "",
  email: "",
  topic: "Full-time opportunity",
  message: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState("");

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Something went wrong while submitting.");
      }

      setStatus("success");
      setFeedback(payload.message ?? "Thanks. I will respond within one business day.");
      setForm(initialForm);
      trackEvent("contact_submit_success", { topic: form.topic, source: "contact_footer" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit right now.";
      setStatus("error");
      setFeedback(message);
      trackEvent("contact_submit_error", { topic: form.topic, source: "contact_footer" });
    }
  };

  return (
    <LiquidGlassPanel radius={36} className="p-6 sm:p-7">
      <form onSubmit={submitForm} className="space-y-4">
        <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
            Name
            <input
              required
              name="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="liquid-field w-full px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </label>
          <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
            Work email
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="liquid-field w-full px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
          Topic
          <select
            name="topic"
            value={form.topic}
            onChange={(event) => setForm({ ...form, topic: event.target.value })}
            className="liquid-field w-full px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <option>Full-time opportunity</option>
            <option>Contract project</option>
            <option>Architecture advisory</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
          Message
          <textarea
            required
            name="message"
            rows={5}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            className="liquid-field liquid-field--textarea w-full px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex min-h-11 items-center rounded-full bg-[rgba(245,249,255,0.94)] px-7 py-2.5 text-sm font-semibold text-[#1a2636] shadow-[0_18px_34px_rgba(4,10,17,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? "Sending..." : "Send message"}
          </button>
          <p className="text-sm text-[var(--color-muted-ink)]" aria-live="polite">
            {feedback}
          </p>
        </div>
      </form>
    </LiquidGlassPanel>
  );
}
