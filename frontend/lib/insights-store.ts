/**
 * First-party insights: page views / events, AI conversations, and contact
 * submissions. Raw SQL (like SiteConfig / ChangeLog) so it works without
 * regenerating the Prisma client. Node runtime only. Never published to the
 * public overlay.
 *
 * Privacy: pageviews store an anonymous rotating sessionId (not an identifier),
 * no cookies, no third-party scripts.
 */

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";

const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function recordAnalytics(input: {
  type: "pageview" | "event";
  name: string;
  path?: string | null;
  referrer?: string | null;
  sessionId?: string | null;
  meta?: unknown;
}): Promise<void> {
  try {
    const meta = input.meta === undefined ? null : JSON.stringify(input.meta).slice(0, 4000);
    await prisma.$executeRaw`
      INSERT INTO "AnalyticsEvent" ("id","type","name","path","referrer","sessionId","meta","createdAt")
      VALUES (${randomUUID()}, ${input.type}, ${input.name.slice(0, 300)}, ${input.path ?? null},
              ${(input.referrer ?? null)?.toString().slice(0, 300) ?? null}, ${input.sessionId ?? null}, ${meta}, ${Date.now()})
    `;
  } catch (err) {
    console.warn("[insights] recordAnalytics failed:", err);
  }
}

export async function recordAiConversation(input: {
  question: string;
  answer: string;
  mode?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "AiConversation" ("id","sessionId","question","answer","mode","createdAt")
      VALUES (${randomUUID()}, ${input.sessionId ?? null}, ${input.question.slice(0, 2000)},
              ${input.answer.slice(0, 8000)}, ${input.mode ?? null}, ${Date.now()})
    `;
  } catch (err) {
    console.warn("[insights] recordAiConversation failed:", err);
  }
}

export async function createContactSubmission(input: {
  name: string;
  email: string;
  phone?: string | null;
  topic?: string | null;
  message: string;
  tag?: string | null;
}): Promise<string | null> {
  try {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "ContactSubmission" ("id","name","email","phone","topic","message","status","tag","createdAt")
      VALUES (${id}, ${input.name.slice(0, 200)}, ${input.email.slice(0, 200)}, ${input.phone ?? null},
              ${input.topic ?? null}, ${input.message.slice(0, 5000)}, 'new', ${input.tag ?? null}, ${Date.now()})
    `;
    return id;
  } catch (err) {
    console.warn("[insights] createContactSubmission failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------

export interface DashboardInsights {
  views: { total: number; last7: number; last30: number };
  reach: { uniqueSessions: number; uniqueLast7: number };
  events: { total: number; resumeDownloads: number };
  ai: { conversations: number; last7: number };
  contacts: { total: number; unread: number };
  likes: { total: number; projects: number; articles: number };
  viewsByDay: { day: string; count: number }[]; // last 14 days, oldest→newest
  topEvents: { name: string; count: number }[];
}

/** Like tallies come from the lazily-created Like table (lib/likes-store.ts). */
async function likeTotals(): Promise<{ total: number; projects: number; articles: number }> {
  try {
    const rows = await prisma.$queryRaw<{ entityType: string; c: number | bigint }[]>`
      SELECT "entityType", COUNT(*) c FROM "Like" GROUP BY "entityType"`;
    const byType = Object.fromEntries(rows.map((r) => [r.entityType, Number(r.c)]));
    const projects = byType.project ?? 0;
    const articles = byType.article ?? 0;
    return { total: projects + articles, projects, articles };
  } catch {
    // Table doesn't exist until the first like is recorded — that's fine.
    return { total: 0, projects: 0, articles: 0 };
  }
}

function n(v: unknown): number {
  return Number((v as { c?: number | bigint })?.c ?? 0);
}

export async function getDashboardInsights(): Promise<DashboardInsights> {
  const now = Date.now();
  const d7 = now - 7 * DAY;
  const d30 = now - 30 * DAY;
  const empty: DashboardInsights = {
    views: { total: 0, last7: 0, last30: 0 },
    reach: { uniqueSessions: 0, uniqueLast7: 0 },
    events: { total: 0, resumeDownloads: 0 },
    ai: { conversations: 0, last7: 0 },
    contacts: { total: 0, unread: 0 },
    likes: { total: 0, projects: 0, articles: 0 },
    viewsByDay: [],
    topEvents: [],
  };

  try {
    const likes = await likeTotals();
    const [viewsTotal, views7, views30, uniq, uniq7, evTotal, resumeDl, aiTotal, ai7, cTotal, cUnread, byDayRows, topRows] =
      await Promise.all([
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AnalyticsEvent" WHERE "type"='pageview'`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AnalyticsEvent" WHERE "type"='pageview' AND CAST("createdAt" AS INTEGER) >= ${d7}`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AnalyticsEvent" WHERE "type"='pageview' AND CAST("createdAt" AS INTEGER) >= ${d30}`,
        prisma.$queryRaw`SELECT COUNT(DISTINCT "sessionId") c FROM "AnalyticsEvent" WHERE "sessionId" IS NOT NULL`,
        prisma.$queryRaw`SELECT COUNT(DISTINCT "sessionId") c FROM "AnalyticsEvent" WHERE "sessionId" IS NOT NULL AND CAST("createdAt" AS INTEGER) >= ${d7}`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AnalyticsEvent" WHERE "type"='event'`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AnalyticsEvent" WHERE "type"='event' AND "name"='resume_download'`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AiConversation"`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "AiConversation" WHERE CAST("createdAt" AS INTEGER) >= ${d7}`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "ContactSubmission"`,
        prisma.$queryRaw`SELECT COUNT(*) c FROM "ContactSubmission" WHERE "status"='new'`,
        prisma.$queryRaw<{ day: string; c: number | bigint }[]>`
          SELECT strftime('%Y-%m-%d', CAST("createdAt" AS INTEGER)/1000, 'unixepoch') day, COUNT(*) c
          FROM "AnalyticsEvent" WHERE "type"='pageview' AND CAST("createdAt" AS INTEGER) >= ${now - 14 * DAY}
          GROUP BY day ORDER BY day ASC`,
        prisma.$queryRaw<{ name: string; c: number | bigint }[]>`
          SELECT "name", COUNT(*) c FROM "AnalyticsEvent" WHERE "type"='event'
          GROUP BY "name" ORDER BY c DESC LIMIT 6`,
      ]);

    return {
      views: { total: n((viewsTotal as unknown[])[0]), last7: n((views7 as unknown[])[0]), last30: n((views30 as unknown[])[0]) },
      reach: { uniqueSessions: n((uniq as unknown[])[0]), uniqueLast7: n((uniq7 as unknown[])[0]) },
      events: { total: n((evTotal as unknown[])[0]), resumeDownloads: n((resumeDl as unknown[])[0]) },
      ai: { conversations: n((aiTotal as unknown[])[0]), last7: n((ai7 as unknown[])[0]) },
      contacts: { total: n((cTotal as unknown[])[0]), unread: n((cUnread as unknown[])[0]) },
      likes,
      viewsByDay: (byDayRows as { day: string; c: number | bigint }[]).map((r) => ({ day: r.day, count: Number(r.c) })),
      topEvents: (topRows as { name: string; c: number | bigint }[]).map((r) => ({ name: r.name, count: Number(r.c) })),
    };
  } catch (err) {
    console.warn("[insights] getDashboardInsights failed:", err);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// AI conversations (admin viewer)
// ---------------------------------------------------------------------------

export interface AiConversationRow {
  id: string;
  question: string;
  answer: string;
  mode: string | null;
  createdAt: number;
}

export async function listAiConversations(limit = 50): Promise<AiConversationRow[]> {
  try {
    const rows = await prisma.$queryRaw<{ id: string; question: string; answer: string; mode: string | null; createdAt: number | bigint }[]>`
      SELECT "id","question","answer","mode", CAST("createdAt" AS INTEGER) "createdAt"
      FROM "AiConversation" ORDER BY "createdAt" DESC LIMIT ${Math.min(Math.max(limit, 1), 200)}`;
    return rows.map((r) => ({ id: r.id, question: r.question, answer: r.answer, mode: r.mode, createdAt: Number(r.createdAt) }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Contact submissions (admin manager)
// ---------------------------------------------------------------------------

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  status: string;
  tag: string | null;
  createdAt: number;
}

export async function listContactSubmissions(options: { status?: string; limit?: number } = {}): Promise<ContactRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  try {
    const rows =
      options.status && options.status !== "all"
        ? await prisma.$queryRaw<RawContact[]>`
            SELECT "id","name","email","phone","topic","message","status","tag", CAST("createdAt" AS INTEGER) "createdAt"
            FROM "ContactSubmission" WHERE "status" = ${options.status} ORDER BY "createdAt" DESC LIMIT ${limit}`
        : await prisma.$queryRaw<RawContact[]>`
            SELECT "id","name","email","phone","topic","message","status","tag", CAST("createdAt" AS INTEGER) "createdAt"
            FROM "ContactSubmission" ORDER BY "createdAt" DESC LIMIT ${limit}`;
    return rows.map((r) => ({ ...r, createdAt: Number(r.createdAt) }));
  } catch {
    return [];
  }
}

export async function updateContactSubmission(id: string, patch: { status?: string; tag?: string | null }): Promise<boolean> {
  try {
    if (patch.status !== undefined) {
      await prisma.$executeRaw`UPDATE "ContactSubmission" SET "status" = ${patch.status} WHERE "id" = ${id}`;
    }
    if (patch.tag !== undefined) {
      await prisma.$executeRaw`UPDATE "ContactSubmission" SET "tag" = ${patch.tag} WHERE "id" = ${id}`;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`DELETE FROM "ContactSubmission" WHERE "id" = ${id}`;
    return true;
  } catch {
    return false;
  }
}

interface RawContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  status: string;
  tag: string | null;
  createdAt: number | bigint;
}
