import type { Express } from "express";
// import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTaskSchema,
  insertMoodSchema,
  insertJournalSchema,
  insertFocusSessionSchema,
  insertMeditationSchema,
  insertProfileSchema,
} from "@shared/schema";
import { generateWeeklyReport } from "./gemini";
import { z } from "zod";
import { registerIntegrationRoutes } from "./integrations/integration-routes";

//export async function registerRoutes(app: Express): Promise<Server> {
export async function registerRoutes(app: Express): Promise<void> {
  // Middleware to get user ID from session/auth
  //const getUserId = (req: any): string => {
  const getUserId = (req: any): string => {
    // Extract user ID from request body (sent by frontend) or headers
    //return req.body?.userId || req.headers['user-id'] || '208b86fe-e110-4a7c-9996-b04cceadd9ec';
    return (
      req.body?.userId ||
      req.headers["user-id"] ||
      "208b86fe-e110-4a7c-9996-b04cceadd9ec"
    );
  };

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = getUserId(req);
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId,
      });
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
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

  app.delete("/api/tasks/:id", async (req, res) => {
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

  // Mood routes
  app.get("/api/moods", async (req, res) => {
    try {
      const userId = getUserId(req);
      const moods = await storage.getMoods(userId);
      res.json(moods);
    } catch (error) {
      console.error("Error fetching moods:", error);
      res.status(500).json({ message: "Failed to fetch moods" });
    }
  });

  app.post("/api/moods", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMoodSchema.parse({
        ...req.body,
        userId,
      });
      const mood = await storage.createMood(validatedData);
      res.status(201).json(mood);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid mood data", errors: error.errors });
      } else {
        console.error("Error creating mood:", error);
        res.status(500).json({ message: "Failed to create mood" });
      }
    }
  });

  // Journal routes
  app.get("/api/journals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const journals = await storage.getJournals(userId);
      res.json(journals);
    } catch (error) {
      console.error("Error fetching journals:", error);
      res.status(500).json({ message: "Failed to fetch journals" });
    }
  });

  app.post("/api/journals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertJournalSchema.parse({
        ...req.body,
        userId,
      });
      const journal = await storage.createJournal(validatedData);
      res.status(201).json(journal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid journal data", errors: error.errors });
      } else {
        console.error("Error creating journal:", error);
        res.status(500).json({ message: "Failed to create journal" });
      }
    }
  });

  app.patch("/api/journals/:id", async (req, res) => {
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

  // Focus session routes
  app.get("/api/focus-sessions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getFocusSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching focus sessions:", error);
      res.status(500).json({ message: "Failed to fetch focus sessions" });
    }
  });

  app.post("/api/focus-sessions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertFocusSessionSchema.parse({
        ...req.body,
        userId,
      });
      const session = await storage.createFocusSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid focus session data",
          errors: error.errors,
        });
      } else {
        console.error("Error creating focus session:", error);
        res.status(500).json({ message: "Failed to create focus session" });
      }
    }
  });

  // Meditation routes
  app.get("/api/meditations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const meditations = await storage.getMeditations(userId);
      res.json(meditations);
    } catch (error) {
      console.error("Error fetching meditations:", error);
      res.status(500).json({ message: "Failed to fetch meditations" });
    }
  });

  app.post("/api/meditations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMeditationSchema.parse({
        ...req.body,
        userId,
      });
      const meditation = await storage.createMeditation(validatedData);
      res.status(201).json(meditation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid meditation data", errors: error.errors });
      } else {
        console.error("Error creating meditation:", error);
        res.status(500).json({ message: "Failed to create meditation" });
      }
    }
  });

  // Profile routes
  app.get("/api/profiles", async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertProfileSchema.parse({
        ...req.body,
        userId,
      });
      const profile = await storage.createOrUpdateProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid profile data", errors: error.errors });
      } else {
        console.error("Error creating/updating profile:", error);
        res.status(500).json({ message: "Failed to create/update profile" });
      }
    }
  });

  // Progress routes
  app.get("/api/progress/stats", async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getProgressStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching progress stats:", error);
      res.status(500).json({ message: "Failed to fetch progress stats" });
    }
  });

  // Weekly report routes
  app.get("/api/weekly-reports", async (req, res) => {
    try {
      const userId = getUserId(req);
      const reports = await storage.getWeeklyReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching weekly reports:", error);
      res.status(500).json({ message: "Failed to fetch weekly reports" });
    }
  });

  app.get("/api/weekly-reports/latest", async (req, res) => {
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

  app.post("/api/weekly-reports/generate", async (req, res) => {
    try {
      const userId = getUserId(req);

      // Get current week's start and end dates (Monday to Sunday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Fetch journals and moods from current week
      const journals = await storage.getJournals(userId);
      const moods = await storage.getMoods(userId);

      const weekJournals = journals.filter((j) => {
        const createdAt = new Date(j.createdAt);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });

      const weekMoods = moods.filter((m) => {
        const createdAt = new Date(m.createdAt);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });

      // Generate report using Gemini
      const journalContents = weekJournals.map((j) => j.content);
      const moodLabels = weekMoods.map((m) => m.mood);

      const reportText = await generateWeeklyReport(
        journalContents,
        moodLabels,
      );

      // Save or update the report
      const report = await storage.createOrUpdateWeeklyReport({
        userId,
        weekStart: weekStart.toISOString().split("T")[0], // Format as YYYY-MM-DD
        weekEnd: weekEnd.toISOString().split("T")[0],
        reportText,
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ message: "Failed to generate weekly report" });
    }
  });

  // Register integration routes
  registerIntegrationRoutes(app);

  // const httpServer = createServer(app);
  // return httpServer;
}
