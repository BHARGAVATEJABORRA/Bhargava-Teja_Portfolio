import { itemHandlers } from "@/lib/admin-crud";
import { toProjectDto, validateProjectInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { PUT, DELETE } = itemHandlers({
  entity: "project",
  update: (id, data) => prisma.project.update({ where: { id }, data }),
  remove: (id) => prisma.project.delete({ where: { id } }),
  findForLog: (id) => prisma.project.findUnique({ where: { id } }),
  toDto: toProjectDto,
  validate: validateProjectInput,
});
