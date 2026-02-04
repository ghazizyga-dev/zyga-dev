import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const contact = createTable(
  "contact",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    firstName: d.varchar({ length: 100 }).notNull(),
    lastName: d.varchar({ length: 100 }).notNull(),
    email: d.varchar({ length: 255 }),
    company: d.varchar({ length: 200 }),
    jobTitle: d.varchar({ length: 150 }),
    phone: d.varchar({ length: 50 }),
    notes: d.text(),
    ownerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("contact_owner_idx").on(t.ownerId)],
);

export const conversation = createTable(
  "conversation",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    contactId: d
      .integer()
      .notNull()
      .references(() => contact.id),
    ownerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    sellingContext: d.text().notNull(),
    stoppedAt: d.timestamp({ withTimezone: true }),
    stoppedReason: d.varchar({ length: 50 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("conversation_owner_idx").on(t.ownerId)],
);

export const message = createTable(
  "message",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    conversationId: d
      .integer()
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: d.varchar({ length: 20 }).notNull(),
    content: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("message_conversation_idx").on(t.conversationId)],
);

export const creditBalance = createTable(
  "credit_balance",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    remainingCredits: integer("remaining_credits").notNull(),
    monthlyAllowance: integer("monthly_allowance").notNull(),
    periodStart: d
      .timestamp({ withTimezone: true })
      .notNull(),
    periodEnd: d
      .timestamp({ withTimezone: true })
      .notNull(),
  }),
  (t) => [
    index("credit_balance_user_idx").on(t.userId),
    uniqueIndex("pg-drizzle_credit_balance_user_period_uniq").on(t.userId, t.periodStart, t.periodEnd),
  ],
);

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  contact: one(contact, { fields: [conversation.contactId], references: [contact.id] }),
  owner: one(user, { fields: [conversation.ownerId], references: [user.id] }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
}));

export const aiPreferences = createTable(
  "ai_preferences",
  (col) => ({
    id: col.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: col
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyKnowledge: col.text(),
    toneOfVoice: col.text(),
    exampleMessages: col.text(),
    onboardingCompleted: col.integer().default(0).notNull(),
    createdAt: col
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: col.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (table) => [
    uniqueIndex("ai_preferences_user_idx").on(table.userId),
  ],
);

export const aiPreferencesRelations = relations(aiPreferences, ({ one }) => ({
  user: one(user, { fields: [aiPreferences.userId], references: [user.id] }),
}));
