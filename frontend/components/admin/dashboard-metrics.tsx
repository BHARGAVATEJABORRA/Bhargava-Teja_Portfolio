import type { CSSProperties } from "react";
import { LuEye, LuUsers, LuMessagesSquare, LuDownload, LuMail, LuActivity, LuThumbsUp } from "react-icons/lu";

import type { DashboardInsights } from "@/lib/insights-store";

const GRID_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(251,191,36,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.05) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

/** Fill the last 14 calendar days so the sparkline has a continuous axis. */
function last14(viewsByDay: { day: string; count: number }[]): number[] {
  const map = new Map(viewsByDay.map((d) => [d.day, d.count]));
  const out: number[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push(map.get(d) ?? 0);
  }
  return out;
}

function Sparkline({ values }: { values: number[] }) {
  const w = 280;
  const h = 56;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 6) - 3] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={area} fill="rgba(251,191,36,0.12)" />
      <path d={line} fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardMetrics({ insights }: { insights: DashboardInsights }) {
  const cards = [
    { icon: LuEye, label: "Page views", value: insights.views.total, sub: `${insights.views.last7} in 7d · ${insights.views.last30} in 30d`, accent: "text-amber-400" },
    { icon: LuUsers, label: "Reach (unique visits)", value: insights.reach.uniqueSessions, sub: `${insights.reach.uniqueLast7} in 7d`, accent: "text-teal-400" },
    { icon: LuMessagesSquare, label: "AI conversations", value: insights.ai.conversations, sub: `${insights.ai.last7} in 7d`, accent: "text-purple-400" },
    { icon: LuDownload, label: "Resume downloads", value: insights.events.resumeDownloads, sub: `${insights.events.total} events total`, accent: "text-blue-400" },
    { icon: LuMail, label: "Contact messages", value: insights.contacts.total, sub: `${insights.contacts.unread} unread`, accent: "text-emerald-400" },
    { icon: LuThumbsUp, label: "Likes", value: insights.likes.total, sub: `${insights.likes.projects} projects · ${insights.likes.articles} articles`, accent: "text-rose-400" },
  ];

  return (
    <section aria-label="Live metrics" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ icon: Icon, label, value, sub, accent }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur" style={GRID_BG}>
            <div className="flex items-center justify-between">
              <Icon size={18} className={accent} aria-hidden />
              <span className="font-mono text-2xl font-bold text-white">{value.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur" style={GRID_BG}>
          <div className="mb-2 flex items-center gap-2">
            <LuActivity size={15} className="text-amber-400" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Page views · last 14 days</p>
          </div>
          <Sparkline values={last14(insights.viewsByDay)} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur" style={GRID_BG}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Top events</p>
          {insights.topEvents.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-500">No events tracked yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {insights.topEvents.map((e) => (
                <li key={e.name} className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="truncate text-slate-300">{e.name}</span>
                  <span className="font-bold text-white">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
