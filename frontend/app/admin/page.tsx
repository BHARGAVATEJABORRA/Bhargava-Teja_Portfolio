import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  LuBriefcase,
  LuEye,
  LuFolderKanban,
  LuNewspaper,
  LuSettings,
  LuWrench,
} from "react-icons/lu";

import { AdminShell } from "@/components/admin/admin-shell";
import { ChangeHistory } from "@/components/admin/change-history";
import { DashboardMetrics } from "@/components/admin/dashboard-metrics";
import { getSiteConfigLastUpdated, isSiteConfigConfigured } from "@/lib/content-store";
import { prisma } from "@/lib/db";
import { getDashboardInsights } from "@/lib/insights-store";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

// Server routes / auth don't exist on the static GitHub Pages export.
export const dynamic = "force-dynamic";

interface DashboardData {
  ok: boolean;
  projects: { total: number; cloud: number; aiMl: number; other: number };
  experience: { total: number; work: number; education: number; certifications: number };
  skills: { total: number; categories: number };
  articles: { total: number; published: number; sample: number };
  lastEdit: Date | null;
  totalItems: number;
  configured: boolean;
}

async function getDashboardData(): Promise<DashboardData> {
  const empty: DashboardData = {
    ok: false,
    projects: { total: 0, cloud: 0, aiMl: 0, other: 0 },
    experience: { total: 0, work: 0, education: 0, certifications: 0 },
    skills: { total: 0, categories: 0 },
    articles: { total: 0, published: 0, sample: 0 },
    lastEdit: null,
    totalItems: 0,
    configured: false,
  };

  try {
    const [projectRows, experienceRows, skillRows, articleRows, latestRows, configured, configUpdated] =
      await Promise.all([
        prisma.project.findMany({ select: { category: true } }),
        prisma.experience.findMany({ select: { kind: true } }),
        prisma.skill.findMany({ select: { category: true } }),
        prisma.article.findMany({ select: { isReal: true } }),
        Promise.all([
          prisma.project.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
          prisma.experience.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
          prisma.skill.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
          prisma.article.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
        ]),
        isSiteConfigConfigured(),
        getSiteConfigLastUpdated(),
      ]);

    const isCloud = (c: string) => /cloud|infra|devops|platform/i.test(c);
    const isAiMl = (c: string) => /ai|ml|machine|intelligence/i.test(c);
    const cloud = projectRows.filter((p) => isCloud(p.category)).length;
    const aiMl = projectRows.filter((p) => !isCloud(p.category) && isAiMl(p.category)).length;

    const kindCount = (kind: string) => experienceRows.filter((e) => e.kind === kind).length;
    const published = articleRows.filter((a) => a.isReal).length;

    const timestamps = latestRows
      .map((row) => row?.updatedAt?.getTime() ?? 0)
      .concat(configUpdated ?? 0)
      .filter((t) => t > 0);
    const lastEdit = timestamps.length ? new Date(Math.max(...timestamps)) : null;

    return {
      ok: true,
      projects: { total: projectRows.length, cloud, aiMl, other: projectRows.length - cloud - aiMl },
      experience: {
        total: experienceRows.length,
        work: kindCount("work"),
        education: kindCount("education"),
        certifications: kindCount("certifications"),
      },
      skills: { total: skillRows.length, categories: new Set(skillRows.map((s) => s.category)).size },
      articles: { total: articleRows.length, published, sample: articleRows.length - published },
      lastEdit,
      totalItems: projectRows.length + experienceRows.length + skillRows.length + articleRows.length,
      configured,
    };
  } catch {
    return empty;
  }
}

const GRID_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(251,191,36,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.05) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function AdminDashboardPage() {
  const [data, insights] = await Promise.all([getDashboardData(), getDashboardInsights()]);

  const panels = [
    {
      href: "/admin/projects",
      icon: LuFolderKanban,
      title: "PROJECTS",
      count: data.projects.total,
      stat: `${data.projects.cloud} cloud · ${data.projects.aiMl} AI/ML · ${data.projects.other} other`,
      iconClass: "text-amber-400",
      glow: "hover:shadow-[0_0_24px_rgba(251,191,36,0.18)]",
    },
    {
      href: "/admin/experience",
      icon: LuBriefcase,
      title: "EXPERIENCE",
      count: data.experience.total,
      stat: `${data.experience.work} work · ${data.experience.education} education · ${data.experience.certifications} certifications`,
      iconClass: "text-teal-400",
      glow: "hover:shadow-[0_0_24px_rgba(45,212,191,0.16)]",
    },
    {
      href: "/admin/skills",
      icon: LuWrench,
      title: "SKILLS",
      count: data.skills.total,
      stat: `${data.skills.categories} categories`,
      iconClass: "text-purple-400",
      glow: "hover:shadow-[0_0_24px_rgba(192,132,252,0.16)]",
    },
    {
      href: "/admin/articles",
      icon: LuNewspaper,
      title: "ARTICLES",
      count: data.articles.total,
      stat: `${data.articles.published} published · ${data.articles.sample} sample`,
      iconClass: "text-blue-400",
      glow: "hover:shadow-[0_0_24px_rgba(96,165,250,0.16)]",
    },
    {
      href: "/admin/settings",
      icon: LuSettings,
      title: "SETTINGS",
      count: null,
      stat: "Identity, links, API keys",
      iconClass: "text-amber-400",
      glow: "hover:shadow-[0_0_24px_rgba(251,191,36,0.18)]",
    },
    {
      href: "/admin/preview",
      icon: LuEye,
      title: "PREVIEW",
      count: null,
      stat: "Live public site",
      iconClass: "text-teal-400",
      glow: "hover:shadow-[0_0_24px_rgba(45,212,191,0.16)]",
    },
  ];

  const quickStats = [
    {
      label: "LAST EDIT",
      value: data.lastEdit ? formatTimestamp(data.lastEdit) : "—",
    },
    {
      label: "TOTAL CONTENT ITEMS",
      value: String(data.totalItems),
    },
    {
      label: "SITE CONFIG",
      value: data.configured ? "Configured" : "Needs setup",
    },
  ];

  return (
    <AdminShell
      title="Admin dashboard"
      description="Edits save to the content database and publish to the live site automatically."
    >
      {!data.ok && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-300">
          Content database not ready. Run <code className="font-mono">npx prisma migrate dev</code> and{" "}
          <code className="font-mono">npx prisma db seed</code> in <code className="font-mono">frontend/</code>, then reload.
        </div>
      )}

      {/* System status bar */}
      <div
        className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-400/20 bg-white/5 px-4 py-2.5 font-mono text-xs tracking-[0.14em] text-amber-400 backdrop-blur"
        style={GRID_BG}
      >
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-60" />
        </span>
        <span>ADMIN SYSTEM ONLINE</span>
        <span className="text-amber-400/50">·</span>
        <span>PASSKEY VERIFIED</span>
        <span className="text-amber-400/50">·</span>
        <span suppressHydrationWarning>{formatTimestamp(new Date()).toUpperCase()}</span>
      </div>

      {/* Live first-party metrics */}
      <DashboardMetrics insights={insights} />

      {/* Module panels */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {panels.map(({ href, icon: Icon, title, count, stat, iconClass, glow }) => (
          <Link
            key={href}
            href={href}
            style={GRID_BG}
            className={`group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition duration-300 hover:border-amber-400/30 ${glow}`}
          >
            <div className="flex items-start justify-between">
              <Icon size={22} className={`${iconClass} transition group-hover:scale-110`} aria-hidden />
              {count !== null && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-white group-hover:text-amber-400">
              {title}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-400">{stat}</p>
          </Link>
        ))}
      </div>

      {/* Quick stats strip */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {quickStats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
            style={GRID_BG}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">{label}</p>
            <p className="mt-1.5 truncate font-mono text-sm font-semibold text-white" suppressHydrationWarning>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity feed */}
      <div className="mt-6">
        <ChangeHistory limit={12} title="Recent activity" compact />
      </div>
    </AdminShell>
  );
}
