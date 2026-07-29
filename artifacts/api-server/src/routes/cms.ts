import { Router, type IRouter } from "express";
import { db, cmsContentTable, newsArticlesTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";
import { getAuth } from "@clerk/express";
import { usersTable } from "@workspace/db";

const router: IRouter = Router();

// ── CMS Content ───────────────────────────────────────────────────────────────
router.get("/cms", async (_req, res): Promise<void> => {
  const rows = await db.select().from(cmsContentTable).where(eq(cmsContentTable.isPublished, true));
  res.json(rows);
});

router.get("/cms/:section", async (req, res): Promise<void> => {
  const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
  const rows = await db.select().from(cmsContentTable).where(eq(cmsContentTable.section, section));
  res.json(rows);
});

router.put("/cms/:section", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
  const { items } = req.body as { items: Array<{ key: string; value?: string; jsonValue?: unknown; label?: string; isPublished?: boolean }> };

  if (!Array.isArray(items)) { res.status(400).json({ error: "items must be an array" }); return; }

  const results = [];
  for (const item of items) {
    const existing = await db.select().from(cmsContentTable).where(and(eq(cmsContentTable.section, section), eq(cmsContentTable.key, item.key))).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(cmsContentTable).set({
        value: item.value ?? null,
        jsonValue: item.jsonValue ?? null,
        label: item.label ?? null,
        isPublished: item.isPublished ?? true,
      }).where(and(eq(cmsContentTable.section, section), eq(cmsContentTable.key, item.key))).returning();
      results.push(updated);
    } else {
      const [created] = await db.insert(cmsContentTable).values({
        section, key: item.key, value: item.value ?? null, jsonValue: item.jsonValue ?? null,
        label: item.label ?? null, isPublished: item.isPublished ?? true,
      }).returning();
      results.push(created);
    }
  }

  await writeAuditLog(req, { action: "upsert_section", entityType: "cms", description: `Updated CMS section: ${section}` });
  res.json(results);
});

router.put("/cms/:section/:key", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
  const body = req.body;

  const existing = await db.select().from(cmsContentTable).where(and(eq(cmsContentTable.section, section), eq(cmsContentTable.key, key))).limit(1);

  let result;
  if (existing.length > 0) {
    const [updated] = await db.update(cmsContentTable).set({
      value: body.value ?? null, jsonValue: body.jsonValue ?? null,
      label: body.label ?? null, isPublished: body.isPublished ?? true,
    }).where(and(eq(cmsContentTable.section, section), eq(cmsContentTable.key, key))).returning();
    result = updated;
  } else {
    const [created] = await db.insert(cmsContentTable).values({
      section, key, value: body.value ?? null, jsonValue: body.jsonValue ?? null,
      label: body.label ?? null, isPublished: body.isPublished ?? true,
    }).returning();
    result = created;
  }

  await writeAuditLog(req, { action: "upsert_item", entityType: "cms", description: `Updated CMS item: ${section}/${key}` });
  res.json(result);
});

// ── News Articles ─────────────────────────────────────────────────────────────
router.get("/news", async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  // `all=true` (include unpublished) is restricted to authenticated staff with a staff role
  let showAll = false;
  if (req.query.all === "true") {
    const auth = getAuth(req);
    if (auth?.userId) {
      const [staffUser] = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.clerkId, auth.userId)).limit(1);
      const STAFF_ROLES = ["super_admin","operations_manager","warehouse_staff","tracking_staff","customs_officer","customer_support","finance","read_only_auditor"];
      showAll = !!staffUser && STAFF_ROLES.includes(staffUser.role);
    }
  }

  const conditions = showAll ? [] : [eq(newsArticlesTable.isPublished, true)];
  if (req.query.category) conditions.push(eq(newsArticlesTable.category, String(req.query.category)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [data, totalResult] = await Promise.all([
    db.select().from(newsArticlesTable).where(where).orderBy(desc(newsArticlesTable.publishedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(newsArticlesTable).where(where),
  ]);
  res.json({ data, total: Number(totalResult[0]?.count ?? 0), page, limit });
});

router.post("/news", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.title || !body.content) { res.status(400).json({ error: "title and content are required" }); return; }

  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

  const [article] = await db.insert(newsArticlesTable).values({
    title: body.title, slug, excerpt: body.excerpt || null, content: body.content,
    coverImage: body.coverImage || null, category: body.category || "news",
    tags: body.tags || [], isPublished: body.isPublished ?? false,
    publishedAt: body.isPublished ? new Date() : null,
    authorId: req.currentUser?.id ?? null,
  }).returning();

  await writeAuditLog(req, { action: "create", entityType: "news_article", entityId: article.id, description: `Created article: ${article.title}` });
  res.status(201).json(article);
});

router.get("/news/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [article] = await db.select().from(newsArticlesTable).where(eq(newsArticlesTable.slug, slug)).limit(1);
  if (!article) { res.status(404).json({ error: "Article not found" }); return; }

  // Unpublished articles are only visible to staff
  if (!article.isPublished) {
    const auth = getAuth(req);
    let isStaff = false;
    if (auth?.userId) {
      const STAFF_ROLES = ["super_admin","operations_manager","warehouse_staff","tracking_staff","customs_officer","customer_support","finance","read_only_auditor"];
      const [staffUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.clerkId, auth.userId)).limit(1);
      isStaff = !!staffUser && STAFF_ROLES.includes(staffUser.role);
    }
    if (!isStaff) { res.status(404).json({ error: "Article not found" }); return; }
  }

  res.json(article);
});

router.patch("/news/:slug/edit", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [existing] = await db.select().from(newsArticlesTable).where(eq(newsArticlesTable.slug, slug)).limit(1);
  if (!existing) { res.status(404).json({ error: "Article not found" }); return; }

  const body = req.body;
  const [updated] = await db.update(newsArticlesTable).set({
    ...(body.title !== undefined && { title: body.title }),
    ...(body.slug !== undefined && { slug: body.slug }),
    ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
    ...(body.content !== undefined && { content: body.content }),
    ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
    ...(body.category !== undefined && { category: body.category }),
    ...(body.tags !== undefined && { tags: body.tags }),
    ...(body.isPublished !== undefined && {
      isPublished: body.isPublished,
      publishedAt: body.isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
    }),
  }).where(eq(newsArticlesTable.slug, slug)).returning();

  await writeAuditLog(req, { action: "update", entityType: "news_article", entityId: existing.id, description: `Updated article: ${existing.title}` });
  res.json(updated);
});

router.delete("/news/:slug/edit", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [existing] = await db.select().from(newsArticlesTable).where(eq(newsArticlesTable.slug, slug)).limit(1);
  if (!existing) { res.status(404).json({ error: "Article not found" }); return; }
  await db.delete(newsArticlesTable).where(eq(newsArticlesTable.slug, slug));
  await writeAuditLog(req, { action: "delete", entityType: "news_article", entityId: existing.id, description: `Deleted article: ${existing.title}` });
  res.sendStatus(204);
});

export default router;
