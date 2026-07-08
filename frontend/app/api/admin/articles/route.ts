import { collectionHandlers } from "@/lib/admin-crud";
import { toArticleDto, validateArticleInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers({
  entity: "article",
  list: () => prisma.article.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  create: (data) => prisma.article.create({ data }),
  toDto: toArticleDto,
  validate: validateArticleInput,
});
