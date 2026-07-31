import { itemHandlers } from "@/lib/admin-crud";
import { toExperienceDto, validateExperienceInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { PUT, DELETE } = itemHandlers({
  entity: "experience",
  update: (id, data) => prisma.experience.update({ where: { id }, data }),
  remove: (id) => prisma.experience.delete({ where: { id } }),
  findForLog: (id) => prisma.experience.findUnique({ where: { id } }),
  toDto: toExperienceDto,
  validate: validateExperienceInput,
});
