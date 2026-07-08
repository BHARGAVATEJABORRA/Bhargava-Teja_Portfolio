import { collectionHandlers } from "@/lib/admin-crud";
import { toProjectDto, validateProjectInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers({
  entity: "project",
  list: () => prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  create: (data) => prisma.project.create({ data }),
  toDto: toProjectDto,
  validate: validateProjectInput,
});
