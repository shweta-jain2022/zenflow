import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTaskSchema, 
  insertMoodSchema, 
  insertJournalSchema, 
  insertFocusSessionSchema, 
  insertMeditationSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to get user ID from session/auth
  // For now, we'll use a mock user ID - in production this would come from Supabase auth
  const getUserId = (req: any): string => {
    // In production, extract user ID from Supabase JWT token
    // For demo purposes, using a valid UUID format
    return req.headers['user-id'] || '00000000-0000-0000-0000-000000000000';
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
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
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
        res.status(400).json({ message: "Invalid mood data", errors: error.errors });
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
        res.status(400).json({ message: "Invalid journal data", errors: error.errors });
      } else {
        console.error("Error creating journal:", error);
        res.status(500).json({ message: "Failed to create journal" });
      }
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
        res.status(400).json({ message: "Invalid focus session data", errors: error.errors });
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
        res.status(400).json({ message: "Invalid meditation data", errors: error.errors });
      } else {
        console.error("Error creating meditation:", error);
        res.status(500).json({ message: "Failed to create meditation" });
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

  const httpServer = createServer(app);
  return httpServer;
}
