import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
});

export const apps = sqliteTable('apps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  package_name: text('package_name').notNull(),
  platform: text('platform', { enum: ['android', 'ios'] }).notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
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
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
  user_apps: many(user_apps),
}));

export const appsRelations = relations(apps, ({ many }) => ({
  user_apps: many(user_apps),
  versions: many(versions),
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

export const versionsRelations = relations(versions, ({ one }) => ({
  app: one(apps, {
    fields: [versions.app_id],
    references: [apps.id],
  }),
}));

// Types based on the schema
export type User = typeof users.$inferSelect;
export type App = typeof apps.$inferSelect;
export type Version = typeof versions.$inferSelect;
export type UserApp = typeof user_apps.$inferSelect;
