import { collectionHandlers } from "@/lib/admin-crud";
import { toSkillDto, validateSkillInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers({
  entity: "skill",
  list: () => prisma.skill.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  create: (data) => prisma.skill.create({ data }),
  toDto: toSkillDto,
  validate: validateSkillInput,
});
