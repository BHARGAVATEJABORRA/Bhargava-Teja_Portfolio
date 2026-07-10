/**
 * Seeds the content database from the static defaults in
 * content/portfolio-content.ts. Idempotent: skips any collection that already
 * has rows, so re-running never clobbers admin edits.
 *
 * Run with: npm run db:seed  (or npx prisma db seed)
 *
 * The actual seed logic lives in lib/seed-content.ts so the Vercel cold-start
 * auto-seed (lib/db.ts) can reuse it.
 */

import { PrismaClient } from "@prisma/client";

import { seedAll } from "../lib/seed-content";

const prisma = new PrismaClient();

seedAll(prisma)
  .then((results) => {
    for (const [name, outcome] of Object.entries(results)) {
      console.log(`${name}:`, outcome);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
