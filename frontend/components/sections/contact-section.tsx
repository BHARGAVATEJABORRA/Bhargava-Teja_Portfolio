"use client";

import { FormEvent, useState } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";

type ContactStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const initialForm: ContactFormState = {
  name: "",
  email: "",
  topic: "Full-time opportunity",
  message: "",
};

export function ContactSection() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState<string>("");

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
        const message = payload.error?.message ?? "Something went wrong while submitting.";
        throw new Error(message);
      }

      setStatus("success");
      setFeedback(payload.message ?? "Thanks. I will respond within one business day.");
      setForm(initialForm);
      trackEvent("contact_submit_success", { topic: form.topic });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit right now.";
      setStatus("error");
      setFeedback(message);
      trackEvent("contact_submit_error", { topic: form.topic });
    }
  };

  return (
    <SectionShell id="contact" labelledBy="contact-title" className="bg-[var(--color-surface)]">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <SectionHeading
            id="contact-title"
            eyebrow="Contact"
            title="Let’s discuss your role and roadmap"
            description="Share role details or the product challenge. I reply quickly with relevant examples and next steps."
          />
          <p className="text-sm text-[var(--color-muted-ink)]">
            Prefer direct email? Write to {" "}
            <a
              href={`mailto:${portfolioContent.identity.contactEmail}`}
              className="font-semibold text-[var(--color-ink)] underline decoration-[var(--color-border)] underline-offset-4"
            >
              {portfolioContent.identity.contactEmail}
            </a>
            .
          </p>
        </div>

        <form onSubmit={submitForm} className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
              Name
              <input
                required
                name="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
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
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
            Topic
            <select
              name="topic"
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
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
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? "Sending..." : "Send message"}
            </button>
            <p className="text-sm text-[var(--color-muted-ink)]" aria-live="polite">
              {feedback}
            </p>
          </div>
        </form>
      </div>
    </SectionShell>
  );
}
