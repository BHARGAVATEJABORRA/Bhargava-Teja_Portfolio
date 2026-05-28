import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center px-5 py-20 sm:px-8">
      <section className="w-full rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(160deg,var(--color-card)_0%,var(--color-surface)_100%)] p-8 shadow-[0_20px_50px_rgba(8,15,28,0.12)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">Page not found</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted-ink)]">
          The page you requested is unavailable or may have moved. You can return to the portfolio homepage and continue from there.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)]"
          >
            Back to home
          </Link>
          <Link
            href="/#contact"
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] px-5 py-2 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
          >
            Contact Bhargava
          </Link>
        </div>
      </section>
    </main>
  );
}
