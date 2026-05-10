import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const apps = sqliteTable('apps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  package_name: text('package_name').notNull(),
  platform: text('platform', { enum: ['android', 'ios'] }).notNull(),
  icon_path: text('icon_path'),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const user_apps = sqliteTable('user_apps', {
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  app_id: integer('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.app_id] })
}));

export const versions = sqliteTable('versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  app_id: integer('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  version_number: text('version_number').notNull(),
  build_number: text('build_number'),
  file_path: text('file_path').notNull(),
  manifest_path: text('manifest_path'),
  changelog: text('changelog'),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const user_groups = sqliteTable('user_groups', {
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  group_id: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.group_id] })
}));

export const group_apps = sqliteTable('group_apps', {
  group_id: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  app_id: integer('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.group_id, table.app_id] })
}));

export const api_keys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const public_links = sqliteTable('public_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  version_id: integer('version_id').notNull().references(() => versions.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expires_at: text('expires_at'),
  password_hash: text('password_hash'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const download_logs = sqliteTable('download_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  version_id: integer('version_id').notNull().references(() => versions.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const webhooks = sqliteTable('webhooks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  event: text('event').notNull().default('new_version'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
  user_apps: many(user_apps),
  user_groups: many(user_groups),
  api_keys: many(api_keys),
}));

export const appsRelations = relations(apps, ({ many }) => ({
  user_apps: many(user_apps),
  versions: many(versions),
  group_apps: many(group_apps),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  user_groups: many(user_groups),
  group_apps: many(group_apps),
}));

export const userAppsRelations = relations(user_apps, ({ one }) => ({
  user: one(users, {
    fields: [user_apps.user_id],
    references: [users.id],
  }),
  app: one(apps, {
    fields: [user_apps.app_id],
    references: [apps.id],
  }),
}));

export const versionsRelations = relations(versions, ({ one, many }) => ({
  app: one(apps, {
    fields: [versions.app_id],
    references: [apps.id],
  }),
  public_links: many(public_links),
  download_logs: many(download_logs),
}));

// Types based on the schema
export type User = typeof users.$inferSelect;
export type App = typeof apps.$inferSelect;
export type Version = typeof versions.$inferSelect;
export type UserApp = typeof user_apps.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type DownloadLog = typeof download_logs.$inferSelect;
export type ApiKey = typeof api_keys.$inferSelect;
export type PublicLink = typeof public_links.$inferSelect;
