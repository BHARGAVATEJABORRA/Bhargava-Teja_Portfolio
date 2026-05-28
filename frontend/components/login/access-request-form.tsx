"use client";

import { useState, type FormEvent } from "react";

import { trackEvent } from "@/lib/analytics";

type AccessRequestStatus = "idle" | "submitting" | "success" | "error";

interface AccessRequestState {
  name: string;
  email: string;
  message: string;
  website: string;
}

const initialForm: AccessRequestState = {
  name: "",
  email: "",
  message: "",
  website: "",
};

export function AccessRequestForm() {
  const [form, setForm] = useState<AccessRequestState>(initialForm);
  const [status, setStatus] = useState<AccessRequestStatus>("idle");
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
        body: JSON.stringify({
          ...form,
          topic: "Private portfolio access",
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to submit your access request right now.");
      }

      setStatus("success");
      setFeedback(payload.message ?? "Request received. Access details will be shared by email.");
      setForm(initialForm);
      trackEvent("contact_submit_success", { topic: "private_portfolio_access", source: "login_page" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit right now.";
      setStatus("error");
      setFeedback(message);
      trackEvent("contact_submit_error", { topic: "private_portfolio_access", source: "login_page" });
    }
  };

  return (
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
            className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.74] px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
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
            className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.74] px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
        What access do you need?
        <textarea
          required
          name="message"
          rows={5}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder="Share whether you need recruiter review access, project walkthrough details, or a private demo."
          className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.74] px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Requesting access..." : "Request access"}
        </button>
        <p className="text-sm text-[var(--color-muted-ink)]" aria-live="polite">
          {feedback}
        </p>
      </div>
    </form>
  );
}
