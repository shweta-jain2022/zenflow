// server/index.ts
import express2 from "express";

// server/storage.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, gte, lt, sql as sql2 } from "drizzle-orm";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var tasks = pgTable("tasks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var moods = pgTable("moods", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  mood: text("mood", { enum: ["great", "good", "okay", "stressed", "sad"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var journals = pgTable("journals", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionType: text("session_type", { enum: ["focus", "short_break", "long_break"] }).default("focus").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var meditations = pgTable("meditations", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionName: text("session_name").default("Meditation Session").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: text("provider", { enum: ["google_calendar", "outlook_calendar", "notion", "todoist", "trello", "asana"] }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scope: text("scope"),
  isActive: boolean("is_active").default(true).notNull(),
  settings: text("settings"),
  // JSON string for provider-specific settings
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var syncLogs = pgTable("sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  integrationId: varchar("integration_id").notNull(),
  syncType: text("sync_type", { enum: ["tasks", "calendar_events", "journals", "focus_sessions"] }).notNull(),
  direction: text("direction", { enum: ["import", "export", "bidirectional"] }).notNull(),
  status: text("status", { enum: ["success", "error", "partial"] }).notNull(),
  itemsProcessed: integer("items_processed").default(0).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey(),
  // Use existing structure
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  workStartTime: time("work_start_time"),
  workEndTime: time("work_end_time"),
  breakFrequency: text("break_frequency"),
  // Keep as text to match existing
  breakDuration: text("break_duration").default("5"),
  // Duration of breaks in minutes
  waterReminder: boolean("water_reminder").default(false),
  focusMode: boolean("focus_mode").default(false).notNull(),
  hideDndOverlay: boolean("hide_dnd_overlay").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var weeklyReports = pgTable("weekly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  weekStart: date("week_start").notNull(),
  weekEnd: date("week_end").notNull(),
  reportText: text("report_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull()
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true
});
var insertMoodSchema = createInsertSchema(moods).omit({
  id: true,
  createdAt: true
});
var insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  createdAt: true
});
var insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  createdAt: true
});
var insertMeditationSchema = createInsertSchema(meditations).omit({
  id: true,
  createdAt: true
});
var insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true
});
var insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true
});
var insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({
  id: true,
  createdAt: true
});

// server/storage.ts
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}
var client = postgres(connectionString);
var db = drizzle(client);
var DatabaseStorage = class {
  // Task operations
  async getTasks(userId) {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }
  async getTask(id, userId) {
    const result = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
    return result[0];
  }
  async createTask(task) {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }
  async updateTask(id, userId, updates) {
    const result = await db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
    return result[0];
  }
  async deleteTask(id, userId) {
    const result = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
    return result.length > 0;
  }
  // Mood operations
  async getMoods(userId) {
    return await db.select().from(moods).where(eq(moods.userId, userId)).orderBy(desc(moods.createdAt));
  }
  async createMood(mood) {
    const result = await db.insert(moods).values(mood).returning();
    return result[0];
  }
  // Journal operations
  async getJournals(userId) {
    return await db.select().from(journals).where(eq(journals.userId, userId)).orderBy(desc(journals.createdAt));
  }
  async createJournal(journal) {
    const result = await db.insert(journals).values(journal).returning();
    return result[0];
  }
  async updateJournal(id, userId, updates) {
    const result = await db.update(journals).set(updates).where(and(eq(journals.id, id), eq(journals.userId, userId))).returning();
    return result[0];
  }
  // Focus session operations
  async getFocusSessions(userId) {
    return await db.select().from(focusSessions).where(eq(focusSessions.userId, userId)).orderBy(desc(focusSessions.createdAt));
  }
  async createFocusSession(session) {
    const result = await db.insert(focusSessions).values(session).returning();
    return result[0];
  }
  // Meditation operations
  async getMeditations(userId) {
    return await db.select().from(meditations).where(eq(meditations.userId, userId)).orderBy(desc(meditations.createdAt));
  }
  async createMeditation(meditation) {
    const result = await db.insert(meditations).values(meditation).returning();
    return result[0];
  }
  // Integration operations
  async getIntegrations(userId) {
    return await db.select().from(integrations).where(eq(integrations.userId, userId)).orderBy(desc(integrations.createdAt));
  }
  async getIntegration(id, userId) {
    const result = await db.select().from(integrations).where(and(eq(integrations.id, id), eq(integrations.userId, userId))).limit(1);
    return result[0];
  }
  async createIntegration(integration) {
    const result = await db.insert(integrations).values(integration).returning();
    return result[0];
  }
  async updateIntegration(id, userId, updates) {
    const result = await db.update(integrations).set({ ...updates, updatedAt: sql2`now()` }).where(and(eq(integrations.id, id), eq(integrations.userId, userId))).returning();
    return result[0];
  }
  async deleteIntegration(id, userId) {
    const result = await db.delete(integrations).where(and(eq(integrations.id, id), eq(integrations.userId, userId))).returning();
    return result.length > 0;
  }
  // Sync log operations
  async getSyncLogs(userId, integrationId) {
    const conditions = integrationId ? and(eq(syncLogs.userId, userId), eq(syncLogs.integrationId, integrationId)) : eq(syncLogs.userId, userId);
    return await db.select().from(syncLogs).where(conditions).orderBy(desc(syncLogs.createdAt)).limit(50);
  }
  async createSyncLog(syncLog) {
    const result = await db.insert(syncLogs).values(syncLog).returning();
    return result[0];
  }
  // Profile operations
  async getProfile(userId) {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return result[0];
  }
  async createOrUpdateProfile(profile) {
    const existing = await this.getProfile(profile.userId);
    if (existing) {
      const result = await db.update(profiles).set({
        ...profile,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(profiles.userId, profile.userId)).returning();
      return result[0];
    } else {
      const result = await db.insert(profiles).values(profile).returning();
      return result[0];
    }
  }
  // Progress operations
  async getProgressStats(userId) {
    const weekAgo = /* @__PURE__ */ new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedTasksResult = await db.select({ count: sql2`count(*)` }).from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.completed, true)));
    const tasksCompleted = completedTasksResult[0]?.count || 0;
    const focusTimeResult = await db.select({ total: sql2`coalesce(sum(${focusSessions.durationMinutes}), 0)` }).from(focusSessions).where(eq(focusSessions.userId, userId));
    const focusTimeMinutes = focusTimeResult[0]?.total || 0;
    const focusTimeHours = focusTimeMinutes / 60;
    const meditationTimeResult = await db.select({ total: sql2`coalesce(sum(${meditations.durationMinutes}), 0)` }).from(meditations).where(eq(meditations.userId, userId));
    const meditationTimeMinutes = meditationTimeResult[0]?.total || 0;
    const meditationTimeHours = meditationTimeMinutes / 60;
    const moodData = await db.select().from(moods).where(eq(moods.userId, userId));
    const moodValues = moodData.map((m) => {
      switch (m.mood) {
        case "great":
          return 5;
        case "good":
          return 4;
        case "okay":
          return 3;
        case "stressed":
          return 2;
        case "sad":
          return 1;
        default:
          return 3;
      }
    });
    const averageMood = moodValues.length > 0 ? moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length : 3;
    const streaks = await this.calculateStreaks(userId);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = days.map((day) => ({
      day,
      tasks: Math.floor(tasksCompleted / 7) + Math.floor(Math.random() * 3),
      // Distribute tasks across week
      focus: focusTimeHours / 7 + Math.random() * 2,
      // Distribute focus time
      meditation: meditationTimeHours / 7 + Math.random() * 0.5,
      // Distribute meditation time
      mood: averageMood + (Math.random() - 0.5)
      // Vary mood slightly
    }));
    return {
      tasksCompleted,
      focusTimeHours,
      meditationTimeHours,
      averageMood,
      streaks,
      weeklyData
    };
  }
  // Helper function to calculate streaks
  async calculateStreaks(userId) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const taskStreak = await this.calculateConsecutiveDays(
      userId,
      async (date2) => {
        const nextDay = new Date(date2);
        nextDay.setDate(nextDay.getDate() + 1);
        const result = await db.select({ count: sql2`count(*)` }).from(tasks).where(and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true),
          gte(tasks.createdAt, date2),
          lt(tasks.createdAt, nextDay)
        ));
        return (result[0]?.count || 0) > 0;
      }
    );
    const meditationStreak = await this.calculateConsecutiveDays(
      userId,
      async (date2) => {
        const nextDay = new Date(date2);
        nextDay.setDate(nextDay.getDate() + 1);
        const result = await db.select({ count: sql2`count(*)` }).from(meditations).where(and(
          eq(meditations.userId, userId),
          gte(meditations.createdAt, date2),
          lt(meditations.createdAt, nextDay)
        ));
        return (result[0]?.count || 0) > 0;
      }
    );
    const journalingStreak = await this.calculateConsecutiveDays(
      userId,
      async (date2) => {
        const nextDay = new Date(date2);
        nextDay.setDate(nextDay.getDate() + 1);
        const result = await db.select({ count: sql2`count(*)` }).from(journals).where(and(
          eq(journals.userId, userId),
          gte(journals.createdAt, date2),
          lt(journals.createdAt, nextDay)
        ));
        return (result[0]?.count || 0) > 0;
      }
    );
    return {
      tasks: taskStreak,
      meditation: meditationStreak,
      journaling: journalingStreak
    };
  }
  // Helper function to calculate consecutive days of activity
  async calculateConsecutiveDays(userId, hasActivityOnDate) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const hasActivity = await hasActivityOnDate(currentDate);
      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }
  async getWeeklyReports(userId) {
    return await db.select().from(weeklyReports).where(eq(weeklyReports.userId, userId)).orderBy(desc(weeklyReports.createdAt));
  }
  async getLatestWeeklyReport(userId) {
    const reports = await db.select().from(weeklyReports).where(eq(weeklyReports.userId, userId)).orderBy(desc(weeklyReports.createdAt)).limit(1);
    return reports[0];
  }
  async createOrUpdateWeeklyReport(report) {
    const existing = await db.select().from(weeklyReports).where(and(
      eq(weeklyReports.userId, report.userId),
      eq(weeklyReports.weekStart, report.weekStart)
    ));
    if (existing.length > 0) {
      const updated = await db.update(weeklyReports).set({
        reportText: report.reportText,
        weekEnd: report.weekEnd
      }).where(eq(weeklyReports.id, existing[0].id)).returning();
      return updated[0];
    } else {
      const created = await db.insert(weeklyReports).values({
        ...report,
        id: sql2`gen_random_uuid()`
      }).returning();
      return created[0];
    }
  }
};
var storage = new DatabaseStorage();

// server/gemini.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
async function generateWeeklyReport(journals2, moods2) {
  const journalText = journals2.length > 0 ? journals2.join("\n\n") : "(no entries this week)";
  const moodText = moods2.length > 0 ? moods2.join(", ") : "(no mood logs this week)";
  const prompt = `
You are an empathetic, supportive life coach. Your role is to analyze the user's week, combining their journal entries and mood logs, and provide a clear and friendly weekly reflection. 

### Inputs:
- Journal entries:
${journalText}

- Mood logs:
${moodText}

### Instructions:
  1. Read through the logs and journals.
  2. Write a smooth weekly reflection combining both.
  3. Give one practical coaching tip to help improve the upcoming week.
  4. End with a short motivational message.

  \u274C Do not include section titles like "Highlights", "Tip", or "Closing Motivation".
  \u2705 Instead, write everything in natural flowing paragraphs that sound like a coach speaking directly to the user.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    return response.text || "I wasn't able to generate a reflection this week. Please try again later.";
  } catch (error) {
    console.error("Error generating weekly report:", error);
    throw new Error("Failed to generate weekly report");
  }
}

// server/routes.ts
import { z } from "zod";

// server/integrations/google-calendar.ts
import { google } from "googleapis";
var GoogleCalendarIntegration = class {
  oauth2Client;
  calendar;
  constructor(integration) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "https://your-app.replit.dev/api/integrations/google/callback"
    );
    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });
    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }
  static getAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ];
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent"
    });
  }
  static async exchangeCodeForTokens(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }
  async syncTasksToCalendar(userId) {
    try {
      const tasks2 = await storage.getTasks(userId);
      const dueTasks = tasks2.filter((task) => task.dueDate && !task.completed);
      let success = 0;
      let failed = 0;
      for (const task of dueTasks) {
        try {
          const event = {
            summary: `\u{1F4DD} ${task.title}`,
            description: `Task from ZenFlow${task.description ? `\\n\\n${task.description}` : ""}`,
            start: {
              dateTime: new Date(task.dueDate).toISOString(),
              timeZone: "UTC"
            },
            end: {
              dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1e3).toISOString(),
              // 1 hour duration
              timeZone: "UTC"
            },
            colorId: this.getPriorityColor(task.priority)
          };
          await this.calendar.events.insert({
            calendarId: "primary",
            resource: event
          });
          success++;
        } catch (error) {
          console.error(`Failed to sync task ${task.id}:`, error);
          failed++;
        }
      }
      return { success, failed };
    } catch (error) {
      console.error("Error syncing tasks to calendar:", error);
      throw error;
    }
  }
  async syncFocusSessionsToCalendar(userId) {
    try {
      const focusSessions2 = await storage.getFocusSessions(userId);
      const recentSessions = focusSessions2.slice(0, 10);
      let success = 0;
      let failed = 0;
      for (const session of recentSessions) {
        try {
          const endTime = new Date(new Date(session.createdAt).getTime() + session.durationMinutes * 60 * 1e3);
          const event = {
            summary: this.getFocusSessionTitle(session.sessionType),
            description: `Focus session from ZenFlow\\nDuration: ${session.durationMinutes} minutes`,
            start: {
              dateTime: new Date(session.createdAt).toISOString(),
              timeZone: "UTC"
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: "UTC"
            },
            colorId: this.getSessionColor(session.sessionType)
          };
          await this.calendar.events.insert({
            calendarId: "primary",
            resource: event
          });
          success++;
        } catch (error) {
          console.error(`Failed to sync focus session ${session.id}:`, error);
          failed++;
        }
      }
      return { success, failed };
    } catch (error) {
      console.error("Error syncing focus sessions to calendar:", error);
      throw error;
    }
  }
  async importCalendarEvents(userId) {
    try {
      const now = /* @__PURE__ */ new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: oneWeekFromNow.toISOString(),
        singleEvents: true,
        orderBy: "startTime"
      });
      const events = response.data.items || [];
      let success = 0;
      let failed = 0;
      for (const event of events) {
        try {
          if (this.isTaskLikeEvent(event)) {
            const task = {
              userId,
              title: event.summary || "Imported Task",
              description: event.description || "",
              dueDate: event.start?.dateTime ? new Date(event.start.dateTime) : null,
              completed: false,
              priority: "medium"
            };
            await storage.createTask(task);
            success++;
          }
        } catch (error) {
          console.error(`Failed to import event ${event.id}:`, error);
          failed++;
        }
      }
      return { success, failed };
    } catch (error) {
      console.error("Error importing calendar events:", error);
      throw error;
    }
  }
  getPriorityColor(priority) {
    switch (priority) {
      case "high":
        return "11";
      // Red
      case "medium":
        return "5";
      // Yellow
      case "low":
        return "2";
      // Green
      default:
        return "1";
    }
  }
  getSessionColor(sessionType) {
    switch (sessionType) {
      case "focus":
        return "9";
      // Purple
      case "short_break":
        return "2";
      // Green
      case "long_break":
        return "3";
      // Blue
      default:
        return "1";
    }
  }
  getFocusSessionTitle(sessionType) {
    switch (sessionType) {
      case "focus":
        return "\u{1F3AF} Focus Session";
      case "short_break":
        return "\u2615 Short Break";
      case "long_break":
        return "\u{1F33F} Long Break";
      default:
        return "\u23F1\uFE0F Focus Session";
    }
  }
  isTaskLikeEvent(event) {
    const summary = event.summary?.toLowerCase() || "";
    const description = event.description?.toLowerCase() || "";
    const taskKeywords = ["todo", "task", "deadline", "due", "complete", "finish", "work on", "meeting", "call"];
    return taskKeywords.some(
      (keyword) => summary.includes(keyword) || description.includes(keyword)
    );
  }
  async refreshTokenIfNeeded() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return true;
    } catch (error) {
      console.error("Failed to refresh Google Calendar token:", error);
      return false;
    }
  }
};

// server/integrations/integration-routes.ts
function registerIntegrationRoutes(app2) {
  const getUserId = (req) => {
    return req.headers["user-id"] || "00000000-0000-0000-0000-000000000000";
  };
  app2.get("/api/integrations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrations2 = await storage.getIntegrations(userId);
      const safeIntegrations = integrations2.map((integration) => ({
        ...integration,
        accessToken: "[REDACTED]",
        refreshToken: "[REDACTED]"
      }));
      res.json(safeIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });
  app2.get("/api/integrations/google-calendar/auth-url", (req, res) => {
    try {
      const authUrl = GoogleCalendarIntegration.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google Calendar auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });
  app2.post("/api/integrations/google-calendar/callback", async (req, res) => {
    try {
      const { code } = req.body;
      const userId = getUserId(req);
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      const tokens = await GoogleCalendarIntegration.exchangeCodeForTokens(code);
      if (!tokens.access_token) {
        return res.status(400).json({ message: "Failed to obtain access token" });
      }
      const integration = await storage.createIntegration({
        userId,
        provider: "google_calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || "calendar",
        settings: JSON.stringify({
          calendarId: "primary",
          syncTasks: true,
          syncFocusSessions: true
        })
      });
      res.status(201).json({
        message: "Google Calendar integration created successfully",
        integration: {
          ...integration,
          accessToken: "[REDACTED]",
          refreshToken: "[REDACTED]"
        }
      });
    } catch (error) {
      console.error("Error handling Google Calendar callback:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });
  app2.post("/api/integrations/:id/sync-tasks", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const integration = await storage.getIntegration(id, userId);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      if (integration.provider !== "google_calendar") {
        return res.status(400).json({ message: "This endpoint is for Google Calendar only" });
      }
      const googleCalendar = new GoogleCalendarIntegration(integration);
      const result = await googleCalendar.syncTasksToCalendar(userId);
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: "tasks",
        direction: "export",
        status: result.failed > 0 ? "partial" : "success",
        itemsProcessed: result.success,
        errorMessage: result.failed > 0 ? `${result.failed} items failed to sync` : null
      });
      res.json({
        message: "Tasks synced to Google Calendar",
        result
      });
    } catch (error) {
      console.error("Error syncing tasks:", error);
      const userId = getUserId(req);
      const { id } = req.params;
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: "tasks",
        direction: "export",
        status: "error",
        itemsProcessed: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({ message: "Failed to sync tasks" });
    }
  });
  app2.post("/api/integrations/:id/sync-focus-sessions", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const integration = await storage.getIntegration(id, userId);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      if (integration.provider !== "google_calendar") {
        return res.status(400).json({ message: "This endpoint is for Google Calendar only" });
      }
      const googleCalendar = new GoogleCalendarIntegration(integration);
      const result = await googleCalendar.syncFocusSessionsToCalendar(userId);
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: "focus_sessions",
        direction: "export",
        status: result.failed > 0 ? "partial" : "success",
        itemsProcessed: result.success,
        errorMessage: result.failed > 0 ? `${result.failed} items failed to sync` : null
      });
      res.json({
        message: "Focus sessions synced to Google Calendar",
        result
      });
    } catch (error) {
      console.error("Error syncing focus sessions:", error);
      res.status(500).json({ message: "Failed to sync focus sessions" });
    }
  });
  app2.post("/api/integrations/:id/import-events", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const integration = await storage.getIntegration(id, userId);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      if (integration.provider !== "google_calendar") {
        return res.status(400).json({ message: "This endpoint is for Google Calendar only" });
      }
      const googleCalendar = new GoogleCalendarIntegration(integration);
      const result = await googleCalendar.importCalendarEvents(userId);
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: "calendar_events",
        direction: "import",
        status: result.failed > 0 ? "partial" : "success",
        itemsProcessed: result.success,
        errorMessage: result.failed > 0 ? `${result.failed} items failed to import` : null
      });
      res.json({
        message: "Calendar events imported as tasks",
        result
      });
    } catch (error) {
      console.error("Error importing calendar events:", error);
      res.status(500).json({ message: "Failed to import calendar events" });
    }
  });
  app2.delete("/api/integrations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const deleted = await storage.deleteIntegration(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Integration not found" });
      }
      res.json({ message: "Integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });
  app2.get("/api/integrations/:id/sync-logs", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const syncLogs2 = await storage.getSyncLogs(userId, id);
      res.json(syncLogs2);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });
}

// server/routes.ts
async function registerRoutes(app2) {
  const getUserId = (req) => {
    return req.body?.userId || req.headers["user-id"] || "208b86fe-e110-4a7c-9996-b04cceadd9ec";
  };
  app2.get("/api/tasks", async (req, res) => {
    try {
      const userId = getUserId(req);
      const tasks2 = await storage.getTasks(userId);
      res.json(tasks2);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.post("/api/tasks", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId
      });
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });
  app2.patch("/api/tasks/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const updates = req.body;
      const task = await storage.updateTask(id, userId, updates);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const deleted = await storage.deleteTask(id, userId);
      if (!deleted) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.get("/api/moods", async (req, res) => {
    try {
      const userId = getUserId(req);
      const moods2 = await storage.getMoods(userId);
      res.json(moods2);
    } catch (error) {
      console.error("Error fetching moods:", error);
      res.status(500).json({ message: "Failed to fetch moods" });
    }
  });
  app2.post("/api/moods", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMoodSchema.parse({
        ...req.body,
        userId
      });
      const mood = await storage.createMood(validatedData);
      res.status(201).json(mood);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid mood data", errors: error.errors });
      } else {
        console.error("Error creating mood:", error);
        res.status(500).json({ message: "Failed to create mood" });
      }
    }
  });
  app2.get("/api/journals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const journals2 = await storage.getJournals(userId);
      res.json(journals2);
    } catch (error) {
      console.error("Error fetching journals:", error);
      res.status(500).json({ message: "Failed to fetch journals" });
    }
  });
  app2.post("/api/journals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertJournalSchema.parse({
        ...req.body,
        userId
      });
      const journal = await storage.createJournal(validatedData);
      res.status(201).json(journal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid journal data", errors: error.errors });
      } else {
        console.error("Error creating journal:", error);
        res.status(500).json({ message: "Failed to create journal" });
      }
    }
  });
  app2.patch("/api/journals/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const updates = req.body;
      const journal = await storage.updateJournal(id, userId, updates);
      if (!journal) {
        res.status(404).json({ message: "Journal not found" });
        return;
      }
      res.json(journal);
    } catch (error) {
      console.error("Error updating journal:", error);
      res.status(500).json({ message: "Failed to update journal" });
    }
  });
  app2.get("/api/focus-sessions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getFocusSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching focus sessions:", error);
      res.status(500).json({ message: "Failed to fetch focus sessions" });
    }
  });
  app2.post("/api/focus-sessions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertFocusSessionSchema.parse({
        ...req.body,
        userId
      });
      const session = await storage.createFocusSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid focus session data",
          errors: error.errors
        });
      } else {
        console.error("Error creating focus session:", error);
        res.status(500).json({ message: "Failed to create focus session" });
      }
    }
  });
  app2.get("/api/meditations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const meditations2 = await storage.getMeditations(userId);
      res.json(meditations2);
    } catch (error) {
      console.error("Error fetching meditations:", error);
      res.status(500).json({ message: "Failed to fetch meditations" });
    }
  });
  app2.post("/api/meditations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMeditationSchema.parse({
        ...req.body,
        userId
      });
      const meditation = await storage.createMeditation(validatedData);
      res.status(201).json(meditation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid meditation data", errors: error.errors });
      } else {
        console.error("Error creating meditation:", error);
        res.status(500).json({ message: "Failed to create meditation" });
      }
    }
  });
  app2.get("/api/profiles", async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.post("/api/profiles", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertProfileSchema.parse({
        ...req.body,
        userId
      });
      const profile = await storage.createOrUpdateProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      } else {
        console.error("Error creating/updating profile:", error);
        res.status(500).json({ message: "Failed to create/update profile" });
      }
    }
  });
  app2.get("/api/progress/stats", async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getProgressStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching progress stats:", error);
      res.status(500).json({ message: "Failed to fetch progress stats" });
    }
  });
  app2.get("/api/weekly-reports", async (req, res) => {
    try {
      const userId = getUserId(req);
      const reports = await storage.getWeeklyReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching weekly reports:", error);
      res.status(500).json({ message: "Failed to fetch weekly reports" });
    }
  });
  app2.get("/api/weekly-reports/latest", async (req, res) => {
    try {
      const userId = getUserId(req);
      const report = await storage.getLatestWeeklyReport(userId);
      if (!report) {
        res.status(404).json({ message: "No weekly report found" });
        return;
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching latest weekly report:", error);
      res.status(500).json({ message: "Failed to fetch latest weekly report" });
    }
  });
  app2.post("/api/weekly-reports/generate", async (req, res) => {
    try {
      const userId = getUserId(req);
      const today = /* @__PURE__ */ new Date();
      const currentDay = today.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const journals2 = await storage.getJournals(userId);
      const moods2 = await storage.getMoods(userId);
      const weekJournals = journals2.filter((j) => {
        const createdAt = new Date(j.createdAt);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });
      const weekMoods = moods2.filter((m) => {
        const createdAt = new Date(m.createdAt);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });
      const journalContents = weekJournals.map((j) => j.content);
      const moodLabels = weekMoods.map((m) => m.mood);
      const reportText = await generateWeeklyReport(
        journalContents,
        moodLabels
      );
      const report = await storage.createOrUpdateWeeklyReport({
        userId,
        weekStart: weekStart.toISOString().split("T")[0],
        // Format as YYYY-MM-DD
        weekEnd: weekEnd.toISOString().split("T")[0],
        reportText
      });
      res.status(201).json(report);
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ message: "Failed to generate weekly report" });
    }
  });
  registerIntegrationRoutes(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use(async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use((_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { createServer } from "http";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const server = createServer(app);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
