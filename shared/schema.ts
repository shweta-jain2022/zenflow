import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const moods = pgTable("moods", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  mood: text("mood", { enum: ["great", "good", "okay", "stressed", "sad"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const journals = pgTable("journals", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionType: text("session_type", { enum: ["focus", "short_break", "long_break"] }).default("focus").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const meditations = pgTable("meditations", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionName: text("session_name").default("Meditation Session").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: text("provider", { enum: ["google_calendar", "outlook_calendar", "notion", "todoist", "trello", "asana"] }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scope: text("scope"),
  isActive: boolean("is_active").default(true).notNull(),
  settings: text("settings"), // JSON string for provider-specific settings
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const syncLogs = pgTable("sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  integrationId: varchar("integration_id").notNull(),
  syncType: text("sync_type", { enum: ["tasks", "calendar_events", "journals", "focus_sessions"] }).notNull(),
  direction: text("direction", { enum: ["import", "export", "bidirectional"] }).notNull(),
  status: text("status", { enum: ["success", "error", "partial"] }).notNull(),
  itemsProcessed: integer("items_processed").default(0).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey(), // Use existing structure
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  workStartTime: time("work_start_time"),
  workEndTime: time("work_end_time"),
  breakFrequency: text("break_frequency"), // Keep as text to match existing
  breakDuration: text("break_duration").default("5"), // Duration of breaks in minutes
  waterReminder: boolean("water_reminder").default(false),
  focusMode: boolean("focus_mode").default(false).notNull(),
  hideDndOverlay: boolean("hide_dnd_overlay").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

export const weeklyReports = pgTable("weekly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  weekStart: date("week_start").notNull(),
  weekEnd: date("week_end").notNull(),
  reportText: text("report_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

// Insert schemas
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertMoodSchema = createInsertSchema(moods).omit({
  id: true,
  createdAt: true,
});

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  createdAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMeditationSchema = createInsertSchema(meditations).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({
  id: true,
  createdAt: true,
});

// Types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Mood = typeof moods.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;

export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;

export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;

export type Meditation = typeof meditations.$inferSelect;
export type InsertMeditation = z.infer<typeof insertMeditationSchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
