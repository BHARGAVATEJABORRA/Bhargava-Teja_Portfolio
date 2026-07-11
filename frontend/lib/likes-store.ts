/**
 * Real, persisted likes for projects and articles.
 *
 * One like per anonymous visitor per item, toggleable. Stored in the content
 * database via raw SQL (same convention as SiteConfig / ChangeLog / insights)
 * with a lazy CREATE TABLE so it works on both a fresh local SQLite file and
 * the already-bootstrapped Turso database without a migration dance.
 *
 * Privacy: visitorId is a random client-generated token (localStorage), not
 * an identifier — no cookies, no PII.
 */

import { prisma } from "@/lib/db";

export type LikeEntityType = "project" | "article";

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Like" (
        "entityType" TEXT NOT NULL,
        "entityKey"  TEXT NOT NULL,
        "visitorId"  TEXT NOT NULL,
        "createdAt"  INTEGER NOT NULL,
        PRIMARY KEY ("entityType", "entityKey", "visitorId")
      )
    `);
  })().catch((err) => {
    tableReady = null; // allow a retry on the next request
    throw err;
  });
  return tableReady;
}

/** Like counts for every item of a type: { entityKey: count }. */
export async function getLikeCounts(entityType: LikeEntityType): Promise<Record<string, number>> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<{ entityKey: string; c: number | bigint }[]>`
      SELECT "entityKey", COUNT(*) c FROM "Like"
      WHERE "entityType" = ${entityType}
      GROUP BY "entityKey"`;
    return Object.fromEntries(rows.map((r) => [r.entityKey, Number(r.c)]));
  } catch (err) {
    console.warn("[likes] getLikeCounts failed:", err);
    return {};
  }
}

/** Which items of a type this visitor has liked. */
export async function getVisitorLikes(entityType: LikeEntityType, visitorId: string): Promise<string[]> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<{ entityKey: string }[]>`
      SELECT "entityKey" FROM "Like"
      WHERE "entityType" = ${entityType} AND "visitorId" = ${visitorId}`;
    return rows.map((r) => r.entityKey);
  } catch (err) {
    console.warn("[likes] getVisitorLikes failed:", err);
    return [];
  }
}

/** Set (or clear) a visitor's like; returns the item's new count. */
export async function setLike(
  entityType: LikeEntityType,
  entityKey: string,
  visitorId: string,
  liked: boolean,
): Promise<number | null> {
  try {
    await ensureTable();
    if (liked) {
      await prisma.$executeRaw`
        INSERT OR IGNORE INTO "Like" ("entityType","entityKey","visitorId","createdAt")
        VALUES (${entityType}, ${entityKey}, ${visitorId}, ${Date.now()})`;
    } else {
      await prisma.$executeRaw`
        DELETE FROM "Like"
        WHERE "entityType" = ${entityType} AND "entityKey" = ${entityKey} AND "visitorId" = ${visitorId}`;
    }
    const rows = await prisma.$queryRaw<{ c: number | bigint }[]>`
      SELECT COUNT(*) c FROM "Like"
      WHERE "entityType" = ${entityType} AND "entityKey" = ${entityKey}`;
    return Number(rows[0]?.c ?? 0);
  } catch (err) {
    console.warn("[likes] setLike failed:", err);
    return null;
  }
}

/** Total likes across everything (admin dashboard stat). */
export async function getTotalLikes(): Promise<number> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<{ c: number | bigint }[]>`SELECT COUNT(*) c FROM "Like"`;
    return Number(rows[0]?.c ?? 0);
  } catch {
    return 0;
  }
}
