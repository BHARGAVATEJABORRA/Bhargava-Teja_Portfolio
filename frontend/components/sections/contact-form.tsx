"use client";

import { FormEvent, useState } from "react";

import GlassSurface from "@/components/ui/glass-surface";
import { trackEvent } from "@/lib/analytics";

type ContactStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string;
}

const initialForm: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

interface ContactFormProps {
  className?: string;
  compact?: boolean;
}

export function ContactForm({ className = "", compact = false }: ContactFormProps) {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const fieldClassName = `liquid-field w-full px-4 ${
    compact ? "py-2" : "py-3"
  } text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]`;

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
      trackEvent("contact_submit_success", { source: "contact_footer" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit right now.";
      setStatus("error");
      setFeedback(message);
      trackEvent("contact_submit_error", { source: "contact_footer" });
    }
  };

  return (
    <GlassSurface
      className={`flush-glass ${className}`.trim()}
      borderRadius={compact ? 30 : 36}
      distortionScale={-90}
      redOffset={0}
      greenOffset={0}
      blueOffset={0}
      brightness={60}
      opacity={0.93}
      blur={14}
      displace={2}
      backgroundOpacity={0.08}
      saturation={1.1}
      mixBlendMode="screen"
    >
      <form
        onSubmit={submitForm}
        className={`${compact ? "p-3.5 sm:p-4 space-y-2" : "p-6 sm:p-7 space-y-4"} contact-form-inner`}
      >
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

        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className={`${compact ? "space-y-1.5" : "space-y-2"} text-sm text-[var(--color-muted-ink)]`}>
            Name
            <input
              required
              name="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={fieldClassName}
            />
          </label>
          <label className={`${compact ? "space-y-1.5" : "space-y-2"} text-sm text-[var(--color-muted-ink)]`}>
            Email
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className={fieldClassName}
            />
          </label>
        </div>

        <label className={`${compact ? "space-y-1.5" : "space-y-2"} text-sm text-[var(--color-muted-ink)]`}>
          Phone
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className={fieldClassName}
          />
        </label>

        <label className={`${compact ? "space-y-1.5" : "space-y-2"} text-sm text-[var(--color-muted-ink)]`}>
          Message
          <textarea
            required
            name="message"
            rows={compact ? 2 : 5}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            className={`${fieldClassName} liquid-field--textarea`}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`inline-flex items-center rounded-full bg-[rgba(245,249,255,0.94)] ${
              compact ? "min-h-10 px-6 py-2" : "min-h-11 px-7 py-2.5"
            } text-sm font-semibold text-[#1a2636] shadow-[0_18px_34px_rgba(4,10,17,0.18)] disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {status === "submitting" ? "Sending..." : "Send message"}
          </button>
          <p className="text-sm text-[var(--color-muted-ink)]" aria-live="polite">
            {feedback}
          </p>
        </div>
      </form>
    </GlassSurface>
  );
}
