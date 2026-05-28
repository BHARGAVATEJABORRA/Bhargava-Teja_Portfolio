"use client";

import { FormEvent, useState } from "react";
import { LuArrowUpRight, LuGithub, LuLinkedin } from "react-icons/lu";

import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { trackEvent } from "@/lib/analytics";
import { getResolvedSocialLink, isExternalUrl } from "@/lib/profile-links";

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

export function ContactSection() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState<string>("");

  const linkedIn = getResolvedSocialLink("linkedin");
  const github = getResolvedSocialLink("github");

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
      <div className="space-y-8">
        <SectionHeading
          id="contact-title"
          eyebrow="Contact"
          title="Let’s discuss role scope, systems ownership, and delivery expectations"
          description="Use the form for hiring conversations. For quick outreach, email is monitored and social profiles are available below."
        />

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="surface-panel flex h-full flex-col justify-between rounded-3xl p-6 sm:p-7">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Recruiter Notes</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-ink)]">
                  Best messages include role scope, team stage, and the cloud/platform outcomes you expect in the first 90 days.
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <a
                  href={`mailto:${portfolioContent.identity.contactEmail}`}
                  className="group inline-flex items-center gap-2 text-[var(--color-ink)]"
                >
                  <span className="font-semibold">{portfolioContent.identity.contactEmail}</span>
                  <LuArrowUpRight aria-hidden className="h-4 w-4 text-[var(--color-muted-ink)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <a
                  href={github.href}
                  target={isExternalUrl(github.href) ? "_blank" : undefined}
                  rel={isExternalUrl(github.href) ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]"
                >
                  <LuGithub aria-hidden className="h-4 w-4" />
                  <span>{github.isConfigured ? "GitHub profile" : "GitHub on request"}</span>
                </a>
                <a
                  href={linkedIn.href}
                  target={isExternalUrl(linkedIn.href) ? "_blank" : undefined}
                  rel={isExternalUrl(linkedIn.href) ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]"
                >
                  <LuLinkedin aria-hidden className="h-4 w-4" />
                  <span>{linkedIn.isConfigured ? "LinkedIn profile" : "LinkedIn on request"}</span>
                </a>
              </div>
            </div>
            <div className="surface-divider mt-6 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">Response expectation</p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">Typically within one business day.</p>
            </div>
          </aside>

          <form onSubmit={submitForm} className="glass-surface relative space-y-4 rounded-3xl p-6 sm:p-7">
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
                  className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.7] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
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
                  className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.7] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-[var(--color-muted-ink)]">
              Topic
              <select
                name="topic"
                value={form.topic}
                onChange={(event) => setForm({ ...form, topic: event.target.value })}
                className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.7] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
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
                className="w-full rounded-[1.5rem] border border-[color:var(--color-border)/0.78] bg-[color:var(--color-card)/0.7] px-3 py-2 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-accent)] focus:ring-2"
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
      </div>
    </SectionShell>
  );
}
