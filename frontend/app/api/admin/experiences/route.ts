import { collectionHandlers } from "@/lib/admin-crud";
import { toExperienceDto, validateExperienceInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers({
  entity: "experience",
  list: () => prisma.experience.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  create: (data) => prisma.experience.create({ data }),
  toDto: toExperienceDto,
  validate: validateExperienceInput,
});
