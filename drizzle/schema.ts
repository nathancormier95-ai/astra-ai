import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workspacePreferences = mysqlTable("workspacePreferences", {
  userId: int("userId").primaryKey(),
  plan: mysqlEnum("plan", ["free", "premium"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 40 }),
  premiumCurrentPeriodEnd: timestamp("premiumCurrentPeriodEnd"),
  retention: mysqlEnum("retention", ["until_deleted"]).default("until_deleted").notNull(),
  allowAiTraining: boolean("allowAiTraining").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projects = mysqlTable(
  "projects",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 16 }).default("violet").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("projects_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const savedConversations = mysqlTable(
  "savedConversations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    projectId: varchar("projectId", { length: 64 }),
    title: varchar("title", { length: 160 }).notNull(),
    modeId: varchar("modeId", { length: 48 }).default("general").notNull(),
    modelId: varchar("modelId", { length: 120 }).default("gpt-5-mini").notNull(),
    messagesJson: text("messagesJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("conversations_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const uploadedDocuments = mysqlTable(
  "uploadedDocuments",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    projectId: varchar("projectId", { length: 64 }),
    name: varchar("name", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    byteSize: int("byteSize").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("documents_user_created_idx").on(table.userId, table.createdAt)],
);

export const flashcardSets = mysqlTable(
  "flashcardSets",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    projectId: varchar("projectId", { length: 64 }).notNull(),
    sourceConversationId: varchar("sourceConversationId", { length: 64 }),
    title: varchar("title", { length: 160 }).notNull(),
    cardsJson: text("cardsJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("flashcards_user_project_updated_idx").on(table.userId, table.projectId, table.updatedAt)],
);

export const usageEvents = mysqlTable(
  "usageEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: mysqlEnum("action", ["chat", "image", "document", "voice"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("usage_user_action_created_idx").on(table.userId, table.action, table.createdAt)],
);

export type WorkspacePreference = typeof workspacePreferences.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type SavedConversation = typeof savedConversations.$inferSelect;
export type UploadedDocument = typeof uploadedDocuments.$inferSelect;
export type FlashcardSet = typeof flashcardSets.$inferSelect;
