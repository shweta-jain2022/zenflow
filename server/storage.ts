import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";
import { 
  tasks, 
  moods, 
  journals, 
  focusSessions, 
  meditations,
  integrations,
  syncLogs,
  profiles,
  weeklyReports,
  type Task,
  type InsertTask,
  type Mood,
  type InsertMood,
  type Journal,
  type InsertJournal,
  type FocusSession,
  type InsertFocusSession,
  type Meditation,
  type InsertMeditation,
  type Integration,
  type InsertIntegration,
  type SyncLog,
  type InsertSyncLog,
  type Profile,
  type InsertProfile,
  type WeeklyReport,
  type InsertWeeklyReport
} from "@shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Task operations
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, userId: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;

  // Mood operations
  getMoods(userId: string): Promise<Mood[]>;
  createMood(mood: InsertMood): Promise<Mood>;

  // Journal operations
  getJournals(userId: string): Promise<Journal[]>;
  createJournal(journal: InsertJournal): Promise<Journal>;

  // Focus session operations
  getFocusSessions(userId: string): Promise<FocusSession[]>;
  createFocusSession(session: InsertFocusSession): Promise<FocusSession>;

  // Meditation operations
  getMeditations(userId: string): Promise<Meditation[]>;
  createMeditation(meditation: InsertMeditation): Promise<Meditation>;

  // Integration operations
  getIntegrations(userId: string): Promise<Integration[]>;
  getIntegration(id: string, userId: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, userId: string, updates: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: string, userId: string): Promise<boolean>;

  // Sync log operations
  getSyncLogs(userId: string, integrationId?: string): Promise<SyncLog[]>;
  createSyncLog(syncLog: InsertSyncLog): Promise<SyncLog>;

  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createOrUpdateProfile(profile: InsertProfile): Promise<Profile>;

  // Weekly report operations
  getWeeklyReports(userId: string): Promise<WeeklyReport[]>;
  getLatestWeeklyReport(userId: string): Promise<WeeklyReport | undefined>;
  createOrUpdateWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport>;

  // Progress operations
  getProgressStats(userId: string): Promise<{
    tasksCompleted: number;
    focusTimeHours: number;
    meditationTimeHours: number;
    averageMood: number;
    weeklyData: Array<{
      day: string;
      tasks: number;
      focus: number;
      meditation: number;
      mood: number;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, userId: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Mood operations
  async getMoods(userId: string): Promise<Mood[]> {
    return await db.select().from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.createdAt));
  }

  async createMood(mood: InsertMood): Promise<Mood> {
    const result = await db.insert(moods).values(mood).returning();
    return result[0];
  }

  // Journal operations
  async getJournals(userId: string): Promise<Journal[]> {
    return await db.select().from(journals)
      .where(eq(journals.userId, userId))
      .orderBy(desc(journals.createdAt));
  }

  async createJournal(journal: InsertJournal): Promise<Journal> {
    const result = await db.insert(journals).values(journal).returning();
    return result[0];
  }

  // Focus session operations
  async getFocusSessions(userId: string): Promise<FocusSession[]> {
    return await db.select().from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.createdAt));
  }

  async createFocusSession(session: InsertFocusSession): Promise<FocusSession> {
    const result = await db.insert(focusSessions).values(session).returning();
    return result[0];
  }

  // Meditation operations
  async getMeditations(userId: string): Promise<Meditation[]> {
    return await db.select().from(meditations)
      .where(eq(meditations.userId, userId))
      .orderBy(desc(meditations.createdAt));
  }

  async createMeditation(meditation: InsertMeditation): Promise<Meditation> {
    const result = await db.insert(meditations).values(meditation).returning();
    return result[0];
  }

  // Integration operations
  async getIntegrations(userId: string): Promise<Integration[]> {
    return await db.select().from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(desc(integrations.createdAt));
  }

  async getIntegration(id: string, userId: string): Promise<Integration | undefined> {
    const result = await db.select().from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const result = await db.insert(integrations).values(integration).returning();
    return result[0];
  }

  async updateIntegration(id: string, userId: string, updates: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const result = await db.update(integrations)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteIntegration(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Sync log operations
  async getSyncLogs(userId: string, integrationId?: string): Promise<SyncLog[]> {
    const conditions = integrationId 
      ? and(eq(syncLogs.userId, userId), eq(syncLogs.integrationId, integrationId))
      : eq(syncLogs.userId, userId);
    
    return await db.select().from(syncLogs)
      .where(conditions)
      .orderBy(desc(syncLogs.createdAt))
      .limit(50);
  }

  async createSyncLog(syncLog: InsertSyncLog): Promise<SyncLog> {
    const result = await db.insert(syncLogs).values(syncLog).returning();
    return result[0];
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return result[0];
  }

  async createOrUpdateProfile(profile: InsertProfile): Promise<Profile> {
    const existing = await this.getProfile(profile.userId);
    
    if (existing) {
      // Update existing profile
      const result = await db.update(profiles)
        .set({
          ...profile,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, profile.userId))
        .returning();
      return result[0];
    } else {
      // Create new profile
      const result = await db.insert(profiles).values(profile).returning();
      return result[0];
    }
  }

  // Progress operations
  async getProgressStats(userId: string): Promise<{
    tasksCompleted: number;
    focusTimeHours: number;
    meditationTimeHours: number;
    averageMood: number;
    streaks: {
      tasks: number;
      meditation: number;
      journaling: number;
    };
    weeklyData: Array<{
      day: string;
      tasks: number;
      focus: number;
      meditation: number;
      mood: number;
    }>;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get completed tasks count
    const completedTasksResult = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.completed, true)));
    
    const tasksCompleted = completedTasksResult[0]?.count || 0;

    // Get total focus time
    const focusTimeResult = await db.select({ total: sql<number>`coalesce(sum(${focusSessions.durationMinutes}), 0)` })
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId));
    
    const focusTimeMinutes = focusTimeResult[0]?.total || 0;
    const focusTimeHours = focusTimeMinutes / 60;

    // Get total meditation time
    const meditationTimeResult = await db.select({ total: sql<number>`coalesce(sum(${meditations.durationMinutes}), 0)` })
      .from(meditations)
      .where(eq(meditations.userId, userId));
    
    const meditationTimeMinutes = meditationTimeResult[0]?.total || 0;
    const meditationTimeHours = meditationTimeMinutes / 60;

    // Get average mood (convert mood strings to numbers for calculation)
    const moodData = await db.select().from(moods)
      .where(eq(moods.userId, userId));
    
    const moodValues = moodData.map(m => {
      switch (m.mood) {
        case 'great': return 5;
        case 'good': return 4;
        case 'okay': return 3;
        case 'stressed': return 2;
        case 'sad': return 1;
        default: return 3;
      }
    });
    
    const averageMood = moodValues.length > 0 
      ? moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length 
      : 3;

    // Calculate streaks
    const streaks = await this.calculateStreaks(userId);

    // Generate weekly data (simplified version)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = days.map(day => ({
      day,
      tasks: Math.floor(tasksCompleted / 7) + Math.floor(Math.random() * 3), // Distribute tasks across week
      focus: focusTimeHours / 7 + Math.random() * 2, // Distribute focus time
      meditation: meditationTimeHours / 7 + Math.random() * 0.5, // Distribute meditation time
      mood: averageMood + (Math.random() - 0.5), // Vary mood slightly
    }));

    return {
      tasksCompleted,
      focusTimeHours,
      meditationTimeHours,
      averageMood,
      streaks,
      weeklyData,
    };
  }

  // Helper function to calculate streaks
  private async calculateStreaks(userId: string): Promise<{
    tasks: number;
    meditation: number;
    journaling: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Calculate task streak
    const taskStreak = await this.calculateConsecutiveDays(
      userId,
      async (date: Date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(
            eq(tasks.userId, userId),
            eq(tasks.completed, true),
            gte(tasks.createdAt, date),
            lt(tasks.createdAt, nextDay)
          ));
        return (result[0]?.count || 0) > 0;
      }
    );

    // Calculate meditation streak
    const meditationStreak = await this.calculateConsecutiveDays(
      userId,
      async (date: Date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(meditations)
          .where(and(
            eq(meditations.userId, userId),
            gte(meditations.createdAt, date),
            lt(meditations.createdAt, nextDay)
          ));
        return (result[0]?.count || 0) > 0;
      }
    );

    // Calculate journaling streak
    const journalingStreak = await this.calculateConsecutiveDays(
      userId,
      async (date: Date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(journals)
          .where(and(
            eq(journals.userId, userId),
            gte(journals.createdAt, date),
            lt(journals.createdAt, nextDay)
          ));
        return (result[0]?.count || 0) > 0;
      }
    );

    return {
      tasks: taskStreak,
      meditation: meditationStreak,
      journaling: journalingStreak,
    };
  }

  // Helper function to calculate consecutive days of activity
  private async calculateConsecutiveDays(
    userId: string,
    hasActivityOnDate: (date: Date) => Promise<boolean>
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check up to 365 days back (reasonable limit)
    for (let i = 0; i < 365; i++) {
      const hasActivity = await hasActivityOnDate(currentDate);
      
      if (hasActivity) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }
    
    return streak;
  }

  async getWeeklyReports(userId: string): Promise<WeeklyReport[]> {
    return await db.select()
      .from(weeklyReports)
      .where(eq(weeklyReports.userId, userId))
      .orderBy(desc(weeklyReports.createdAt));
  }

  async getLatestWeeklyReport(userId: string): Promise<WeeklyReport | undefined> {
    const reports = await db.select()
      .from(weeklyReports)
      .where(eq(weeklyReports.userId, userId))
      .orderBy(desc(weeklyReports.createdAt))
      .limit(1);
    
    return reports[0];
  }

  async createOrUpdateWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport> {
    // Check if report already exists for this week
    const existing = await db.select()
      .from(weeklyReports)
      .where(and(
        eq(weeklyReports.userId, report.userId),
        eq(weeklyReports.weekStart, report.weekStart)
      ));

    if (existing.length > 0) {
      // Update existing report
      const updated = await db.update(weeklyReports)
        .set({
          reportText: report.reportText,
          weekEnd: report.weekEnd
        })
        .where(eq(weeklyReports.id, existing[0].id))
        .returning();
      
      return updated[0];
    } else {
      // Create new report
      const created = await db.insert(weeklyReports)
        .values({
          ...report,
          id: sql`gen_random_uuid()`
        })
        .returning();
      
      return created[0];
    }
  }
}

export const storage = new DatabaseStorage();
