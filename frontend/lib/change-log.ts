/**
 * Append-only admin activity log.
 *
 * Every admin mutation (create / update / delete / upload / settings save)
 * writes one row here so the admin panel can show a "what did I change, and
 * when" history. Uses raw SQL — like SiteConfig — so it keeps working without
 * re-running `prisma generate` against the updated schema.
 *
 * Node runtime only (Prisma). Never published to the public overlay.
 */

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";

export type ChangeEntity =
  | "project"
  | "experience"
  | "skill"
  | "article"
  | "settings"
  | "resume"
  | "media";

export type ChangeAction = "create" | "update" | "delete" | "upload" | "publish";

export interface ChangeLogEntry {
  id: string;
  entity: ChangeEntity;
  entityId: string | null;
  action: ChangeAction;
  summary: string;
  field: string | null;
  snapshot: string | null;
  createdAt: number; // ms epoch
}

export interface RecordChangeInput {
  entity: ChangeEntity;
  action: ChangeAction;
  summary: string;
  entityId?: string | null;
  field?: string | null;
  snapshot?: unknown;
}

/**
 * Write one audit row. Best-effort: a logging failure must never break the
 * underlying mutation, so all errors are swallowed (and console-warned).
 */
export async function recordChange(input: RecordChangeInput): Promise<void> {
  try {
    const id = randomUUID();
    const now = Date.now();
    const snapshot =
      input.snapshot === undefined ? null : JSON.stringify(input.snapshot).slice(0, 20000);
    await prisma.$executeRaw`
      INSERT INTO "ChangeLog" ("id", "entity", "entityId", "action", "summary", "field", "snapshot", "createdAt")
      VALUES (
        ${id},
        ${input.entity},
        ${input.entityId ?? null},
        ${input.action},
        ${input.summary},
        ${input.field ?? null},
        ${snapshot},
        ${now}
      )
    `;
  } catch (err) {
    console.warn("[change-log] failed to record change:", err);
  }
}

/** Most-recent-first activity, optionally filtered by entity. */
export async function listChanges(options: {
  entity?: ChangeEntity;
  limit?: number;
  before?: number;
} = {}): Promise<ChangeLogEntry[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  try {
    let rows: RawRow[];
    if (options.entity && options.before) {
      rows = await prisma.$queryRaw<RawRow[]>`
        SELECT "id","entity","entityId","action","summary","field","snapshot", CAST("createdAt" AS INTEGER) AS "createdAt"
        FROM "ChangeLog" WHERE "entity" = ${options.entity} AND CAST("createdAt" AS INTEGER) < ${options.before}
        ORDER BY "createdAt" DESC LIMIT ${limit}`;
    } else if (options.entity) {
      rows = await prisma.$queryRaw<RawRow[]>`
        SELECT "id","entity","entityId","action","summary","field","snapshot", CAST("createdAt" AS INTEGER) AS "createdAt"
        FROM "ChangeLog" WHERE "entity" = ${options.entity}
        ORDER BY "createdAt" DESC LIMIT ${limit}`;
    } else if (options.before) {
      rows = await prisma.$queryRaw<RawRow[]>`
        SELECT "id","entity","entityId","action","summary","field","snapshot", CAST("createdAt" AS INTEGER) AS "createdAt"
        FROM "ChangeLog" WHERE CAST("createdAt" AS INTEGER) < ${options.before}
        ORDER BY "createdAt" DESC LIMIT ${limit}`;
    } else {
      rows = await prisma.$queryRaw<RawRow[]>`
        SELECT "id","entity","entityId","action","summary","field","snapshot", CAST("createdAt" AS INTEGER) AS "createdAt"
        FROM "ChangeLog" ORDER BY "createdAt" DESC LIMIT ${limit}`;
    }
    return rows.map((r) => ({
      id: r.id,
      entity: r.entity as ChangeEntity,
      entityId: r.entityId,
      action: r.action as ChangeAction,
      summary: r.summary,
      field: r.field,
      snapshot: r.snapshot,
      createdAt: Number(r.createdAt),
    }));
  } catch (err) {
    console.warn("[change-log] failed to list changes:", err);
    return [];
  }
}

/** Count of all recorded changes (0 if the table is missing). */
export async function countChanges(): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<{ n: number | bigint }[]>`SELECT COUNT(*) AS n FROM "ChangeLog"`;
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

interface RawRow {
  id: string;
  entity: string;
  entityId: string | null;
  action: string;
  summary: string;
  field: string | null;
  snapshot: string | null;
  createdAt: number | bigint;
}
