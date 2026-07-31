import { itemHandlers } from "@/lib/admin-crud";
import { toSkillDto, validateSkillInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { PUT, DELETE } = itemHandlers({
  entity: "skill",
  update: (id, data) => prisma.skill.update({ where: { id }, data }),
  remove: (id) => prisma.skill.delete({ where: { id } }),
  findForLog: (id) => prisma.skill.findUnique({ where: { id } }),
  toDto: toSkillDto,
  validate: validateSkillInput,
});
