import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  projects,
  savedConversations,
  uploadedDocuments,
  usageEvents,
  users,
  workspacePreferences,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

export type UsageAction = "chat" | "image" | "document" | "voice";
export type WorkspacePlan = "free" | "premium";

export const PLAN_LIMITS: Record<WorkspacePlan, Record<UsageAction, number>> = {
  free: { chat: 30, image: 3, document: 5, voice: 10 },
  premium: { chat: 300, image: 30, document: 50, voice: 100 },
};

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function monthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function ensurePreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  await db
    .insert(workspacePreferences)
    .values({ userId })
    .onDuplicateKeyUpdate({ set: { userId } });
  const result = await db.select().from(workspacePreferences).where(eq(workspacePreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPreferences(userId: number) {
  return ensurePreferences(userId);
}

export async function updatePrivacyPreferences(
  userId: number,
  input: { allowAiTraining?: boolean },
) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await ensurePreferences(userId);
  if (input.allowAiTraining !== undefined) {
    await db
      .update(workspacePreferences)
      .set({ allowAiTraining: input.allowAiTraining })
      .where(eq(workspacePreferences.userId, userId));
  }
  return getPreferences(userId);
}

export async function getUsageSummary(userId: number) {
  const db = await getDb();
  const preferences = await ensurePreferences(userId);
  const plan: WorkspacePlan = preferences?.plan ?? "free";
  const limits = PLAN_LIMITS[plan];
  const summary: Record<UsageAction, { used: number; limit: number; remaining: number }> = {
    chat: { used: 0, limit: limits.chat, remaining: limits.chat },
    image: { used: 0, limit: limits.image, remaining: limits.image },
    document: { used: 0, limit: limits.document, remaining: limits.document },
    voice: { used: 0, limit: limits.voice, remaining: limits.voice },
  };
  if (!db) return { plan, periodStart: monthStart().toISOString(), actions: summary };

  const rows = await db
    .select({ action: usageEvents.action, total: sql<number>`count(*)` })
    .from(usageEvents)
    .where(and(eq(usageEvents.userId, userId), gte(usageEvents.createdAt, monthStart())))
    .groupBy(usageEvents.action);
  for (const row of rows) {
    const action = row.action as UsageAction;
    const used = Number(row.total ?? 0);
    summary[action] = { used, limit: limits[action], remaining: Math.max(limits[action] - used, 0) };
  }
  return { plan, periodStart: monthStart().toISOString(), actions: summary };
}

export async function canUseFeature(userId: number, action: UsageAction) {
  const usage = await getUsageSummary(userId);
  const actionUsage = usage.actions[action];
  return { ...usage, action, allowed: actionUsage.remaining > 0 };
}

export async function recordUsage(userId: number, action: UsageAction) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await db.insert(usageEvents).values({ userId, action });
}

export async function listProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function createProject(userId: number, input: { name: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    userId,
    name: input.name,
    description: input.description?.trim() || null,
    color: input.color ?? "violet",
  });
  return { id, ...input, color: input.color ?? "violet" };
}

export async function deleteProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await db
    .update(savedConversations)
    .set({ projectId: null })
    .where(and(eq(savedConversations.userId, userId), eq(savedConversations.projectId, projectId)));
  await db
    .update(uploadedDocuments)
    .set({ projectId: null })
    .where(and(eq(uploadedDocuments.userId, userId), eq(uploadedDocuments.projectId, projectId)));
  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function assertProjectOwnership(userId: number, projectId: string | null | undefined) {
  if (!projectId) return;
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  const result = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!result[0]) throw new Error("Project not found or access denied");
}

export async function listConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(savedConversations)
    .where(eq(savedConversations.userId, userId))
    .orderBy(desc(savedConversations.updatedAt));
}

export async function saveConversation(
  userId: number,
  input: {
    id?: string;
    projectId?: string | null;
    title: string;
    modeId: string;
    modelId: string;
    messagesJson: string;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await assertProjectOwnership(userId, input.projectId);
  const id = input.id ?? crypto.randomUUID();
  const existing = await db.select().from(savedConversations).where(eq(savedConversations.id, id)).limit(1);
  if (existing[0] && existing[0].userId !== userId) throw new Error("Conversation access denied");

  const values = {
    userId,
    projectId: input.projectId ?? null,
    title: input.title,
    modeId: input.modeId,
    modelId: input.modelId,
    messagesJson: input.messagesJson,
    updatedAt: new Date(),
  };
  if (existing[0]) {
    await db.update(savedConversations).set(values).where(and(eq(savedConversations.id, id), eq(savedConversations.userId, userId)));
  } else {
    await db.insert(savedConversations).values({ id, ...values });
  }
  return { id, ...values };
}

export async function deleteConversation(userId: number, conversationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await db
    .delete(savedConversations)
    .where(and(eq(savedConversations.id, conversationId), eq(savedConversations.userId, userId)));
}

export async function createDocument(
  userId: number,
  input: {
    name: string;
    mimeType: string;
    byteSize: number;
    projectId?: string | null;
    storageKey: string;
    storageUrl: string;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await assertProjectOwnership(userId, input.projectId);
  const id = crypto.randomUUID();
  await db.insert(uploadedDocuments).values({ id, userId, ...input, projectId: input.projectId ?? null });
  return { id, ...input, projectId: input.projectId ?? null };
}

export async function listDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: uploadedDocuments.id,
      projectId: uploadedDocuments.projectId,
      name: uploadedDocuments.name,
      mimeType: uploadedDocuments.mimeType,
      byteSize: uploadedDocuments.byteSize,
      createdAt: uploadedDocuments.createdAt,
    })
    .from(uploadedDocuments)
    .where(eq(uploadedDocuments.userId, userId))
    .orderBy(desc(uploadedDocuments.createdAt));
}

export async function getDocumentForQuestion(userId: number, documentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  const result = await db
    .select()
    .from(uploadedDocuments)
    .where(and(eq(uploadedDocuments.id, documentId), eq(uploadedDocuments.userId, userId)))
    .limit(1);
  if (!result[0]) throw new Error("Document not found or access denied");
  return result[0];
}

export async function deleteDocument(userId: number, documentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await db
    .delete(uploadedDocuments)
    .where(and(eq(uploadedDocuments.id, documentId), eq(uploadedDocuments.userId, userId)));
}

export async function getDashboard(userId: number) {
  const [preferences, usage, recentProjects, recentConversations, documents] = await Promise.all([
    getPreferences(userId),
    getUsageSummary(userId),
    listProjects(userId),
    listConversations(userId),
    listDocuments(userId),
  ]);
  return {
    preferences,
    usage,
    recentProjects: recentProjects.slice(0, 3),
    recentConversations: recentConversations.slice(0, 3),
    documentCount: documents.length,
  };
}

export async function deleteAccountData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Workspace database is unavailable");
  await db.delete(usageEvents).where(eq(usageEvents.userId, userId));
  await db.delete(uploadedDocuments).where(eq(uploadedDocuments.userId, userId));
  await db.delete(savedConversations).where(eq(savedConversations.userId, userId));
  await db.delete(projects).where(eq(projects.userId, userId));
  await db.delete(workspacePreferences).where(eq(workspacePreferences.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
