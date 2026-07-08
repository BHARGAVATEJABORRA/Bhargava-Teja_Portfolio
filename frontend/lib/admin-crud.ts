/**
 * Shared factory for the /api/admin/* CRUD route handlers.
 *
 * Every mutation republishes content/portfolio-overrides.json so the public
 * site picks up the change (HMR in dev, baked in on export builds).
 */

import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange, type ChangeEntity } from "@/lib/change-log";
import { publishContentOverrides } from "@/lib/content-store";

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = (await req.json()) as unknown;
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function mapPrismaError(err: unknown): NextResponse {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    if (err.code === "P2002") return NextResponse.json({ error: "An entry with that unique value (e.g. slug) already exists." }, { status: 409 });
  }
  console.error("[admin-crud]", err);
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}

/** Extract a human label + row id from a DTO for the activity log. */
function describe<TDto>(dto: TDto): { id: string | null; label: string } {
  const d = dto as Record<string, unknown>;
  const id = typeof d.id === "string" ? d.id : null;
  const label =
    (typeof d.title === "string" && d.title) ||
    (typeof d.name === "string" && d.name) ||
    (typeof d.organization === "string" && d.organization) ||
    (typeof d.slug === "string" && d.slug) ||
    "entry";
  return { id, label: String(label) };
}

export function collectionHandlers<TRow, TDto, TCreate>(cfg: {
  entity: ChangeEntity;
  list: () => Promise<TRow[]>;
  create: (data: TCreate) => Promise<TRow>;
  toDto: (row: TRow) => TDto;
  validate: (body: Record<string, unknown>) => ValidationResult<TCreate>;
}) {
  return {
    GET: async (): Promise<NextResponse> => {
      const denied = await requireAdmin();
      if (denied) return denied;
      try {
        const rows = await cfg.list();
        return NextResponse.json({ items: rows.map(cfg.toDto) });
      } catch (err) {
        return mapPrismaError(err);
      }
    },
    POST: async (req: NextRequest): Promise<NextResponse> => {
      const denied = await requireAdmin();
      if (denied) return denied;
      const body = await readBody(req);
      if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      const parsed = cfg.validate(body);
      if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
      try {
        const created = await cfg.create(parsed.data);
        const dto = cfg.toDto(created);
        const { id, label } = describe(dto);
        await recordChange({
          entity: cfg.entity,
          action: "create",
          entityId: id,
          summary: `Added ${cfg.entity} "${label}"`,
          snapshot: dto,
        });
        await publishContentOverrides();
        return NextResponse.json({ item: dto }, { status: 201 });
      } catch (err) {
        return mapPrismaError(err);
      }
    },
  };
}

export function itemHandlers<TRow, TDto, TCreate>(cfg: {
  entity: ChangeEntity;
  update: (id: string, data: TCreate) => Promise<TRow>;
  remove: (id: string) => Promise<unknown>;
  findForLog?: (id: string) => Promise<TRow | null>;
  toDto: (row: TRow) => TDto;
  validate: (body: Record<string, unknown>) => ValidationResult<TCreate>;
}) {
  type Ctx = { params: Promise<{ id: string }> };
  return {
    PUT: async (req: NextRequest, ctx: Ctx): Promise<NextResponse> => {
      const denied = await requireAdmin();
      if (denied) return denied;
      const { id } = await ctx.params;
      const body = await readBody(req);
      if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      const parsed = cfg.validate(body);
      if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
      try {
        const updated = await cfg.update(id, parsed.data);
        const dto = cfg.toDto(updated);
        const { label } = describe(dto);
        await recordChange({
          entity: cfg.entity,
          action: "update",
          entityId: id,
          summary: `Updated ${cfg.entity} "${label}"`,
          snapshot: dto,
        });
        await publishContentOverrides();
        return NextResponse.json({ item: dto });
      } catch (err) {
        return mapPrismaError(err);
      }
    },
    DELETE: async (_req: NextRequest, ctx: Ctx): Promise<NextResponse> => {
      const denied = await requireAdmin();
      if (denied) return denied;
      const { id } = await ctx.params;
      try {
        // Capture a label/snapshot before the row disappears.
        let label = "entry";
        let snapshot: unknown;
        if (cfg.findForLog) {
          const existing = await cfg.findForLog(id).catch(() => null);
          if (existing) {
            const dto = cfg.toDto(existing);
            snapshot = dto;
            label = describe(dto).label;
          }
        }
        await cfg.remove(id);
        await recordChange({
          entity: cfg.entity,
          action: "delete",
          entityId: id,
          summary: `Deleted ${cfg.entity} "${label}"`,
          snapshot,
        });
        await publishContentOverrides();
        return NextResponse.json({ ok: true });
      } catch (err) {
        return mapPrismaError(err);
      }
    },
  };
}
