import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, date } from "drizzle-orm/pg-core";
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
