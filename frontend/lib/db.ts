import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { seedAll } from "@/lib/seed-content";

/**
 * On Vercel the filesystem is ephemeral and read-only except /tmp, so the
 * SQLite database lives at /tmp/dev.db and is rebuilt on every cold start:
 * the committed migration SQL creates the schema, then the static defaults
 * from content/portfolio-content.ts are seeded in. Admin edits persist only
 * for the lifetime of the lambda instance — the source of truth remains the
 * static content files.
 */
const dbPath = process.env.VERCEL
  ? "/tmp/dev.db"
  : process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";

const datasourceUrl = process.env.VERCEL
  ? "file:/tmp/dev.db"
  : process.env.DATABASE_URL ?? `file:${dbPath}`;

function createBaseClient(): PrismaClient {
  return new PrismaClient({ datasourceUrl });
}

/** Apply committed Prisma migration SQL to a fresh SQLite file. */
async function applyMigrations(client: PrismaClient): Promise<void> {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!existsSync(migrationsDir)) return;

  const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const dir of migrationDirs) {
    const sqlFile = path.join(migrationsDir, dir, "migration.sql");
    if (!existsSync(sqlFile)) continue;
    const sql = readFileSync(sqlFile, "utf8");
    // Prisma-generated SQLite DDL: statements are ";"-terminated, no bodies
    // with embedded semicolons, so a simple split is safe here.
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.split("\n").every((line) => line.trim().startsWith("--")));
    for (const statement of statements) {
      await client.$executeRawUnsafe(statement);
    }
  }
}

async function tableExists(client: PrismaClient, table: string): Promise<boolean> {
  try {
    const rows = await client.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`,
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Ensure schema + seed data exist (cold-start recovery on Vercel). */
async function initDatabase(client: PrismaClient): Promise<void> {
  try {
    if (!(await tableExists(client, "Project"))) {
      await applyMigrations(client);
    }
    const projectCount = await client.project.count().catch(() => 0);
    if (projectCount === 0) {
      await seedAll(client);
      console.log("[db] auto-seeded database from static defaults");
    }
  } catch (err) {
    console.error("[db] auto-init failed:", err);
  }
}

function createClient() {
  const base = createBaseClient();

  // Locally the DB is managed with `prisma migrate dev` / `db:seed`; only the
  // ephemeral Vercel runtime needs the lazy auto-init.
  if (!process.env.VERCEL) return base;

  let initPromise: Promise<void> | null = null;
  const ensureInit = () => {
    initPromise ??= initDatabase(base);
    return initPromise;
  };

  // Gate every query behind the one-time init so any route hitting a cold
  // lambda transparently rebuilds the schema + seed data first.
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        await ensureInit();
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

// Reuse one client across HMR reloads in dev to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
