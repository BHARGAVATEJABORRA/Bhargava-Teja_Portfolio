/**
 * Replaces the Skill table with the canonical list from
 * content/portfolio-content.ts (i.e. whatever the site currently renders).
 *
 * `npm run db:seed` is deliberately idempotent — seedSkills() skips the table
 * once it has any rows — so a database seeded before the skills were reworked
 * keeps serving the old list to the admin dashboard forever. This script is the
 * explicit "adopt the new list" escape hatch.
 *
 * Destructive: every existing Skill row is deleted, so any skill added through
 * the admin UI and not mirrored back into portfolio-content.ts is lost.
 *
 * Local (SQLite):  npm run db:resync-skills
 * Production:      TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:resync-skills
 */

import { portfolioContent } from "../content/portfolio-content";
import { prisma } from "../lib/db";
import { resolveSkillIcon, skillIconMap } from "../lib/skill-icons";

async function main() {
  const target = process.env.TURSO_DATABASE_URL ? "Turso (remote)" : "local SQLite";
  const categories = portfolioContent.skills;
  const rows = categories.flatMap((category) =>
    category.skills.map((skill) => ({
      category: category.category,
      name: skill.name,
      iconKey: skill.iconKey,
      brandColor: skill.brandColor,
      keywords: JSON.stringify(skill.keywords ?? []),
    })),
  );

  // An iconKey missing from the registry silently renders the generic fallback
  // icon, so fail loudly here rather than ship a wrong logo.
  const unknown = rows.filter((r) => !(r.iconKey in skillIconMap)).map((r) => `${r.name} -> ${r.iconKey}`);
  if (unknown.length) {
    throw new Error(`Unknown iconKey(s), add them to lib/skill-icons.tsx first:\n  ${unknown.join("\n  ")}`);
  }
  void resolveSkillIcon;

  const before = await prisma.skill.count();
  await prisma.$transaction([
    prisma.skill.deleteMany({}),
    ...rows.map((data, sortOrder) => prisma.skill.create({ data: { ...data, sortOrder } })),
  ]);
  const after = await prisma.skill.count();

  console.log(`target:     ${target}`);
  console.log(`replaced:   ${before} row(s) -> ${after} row(s)`);
  console.log(`categories: ${categories.length}`);
  for (const c of categories) console.log(`  ${c.category} (${c.skills.length})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
