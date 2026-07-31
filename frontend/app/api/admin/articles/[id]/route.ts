import { itemHandlers } from "@/lib/admin-crud";
import { toArticleDto, validateArticleInput } from "@/lib/content-store";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { PUT, DELETE } = itemHandlers({
  entity: "article",
  update: (id, data) => prisma.article.update({ where: { id }, data }),
  remove: (id) => prisma.article.delete({ where: { id } }),
  findForLog: (id) => prisma.article.findUnique({ where: { id } }),
  toDto: toArticleDto,
  validate: validateArticleInput,
});
