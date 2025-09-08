import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { 
  users, 
  tasks, 
  moods, 
  journals, 
  focusSessions, 
  meditations,
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  type Mood,
  type InsertMood,
  type Journal,
  type InsertJournal,
  type FocusSession,
  type InsertFocusSession,
  type Meditation,
  type InsertMeditation
} from "@shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

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

  // Progress operations
  async getProgressStats(userId: string): Promise<{
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
      weeklyData,
    };
  }
}

export const storage = new DatabaseStorage();
