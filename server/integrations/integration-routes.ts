import type { Express } from "express";
import { storage } from "../storage";
import { GoogleCalendarIntegration } from "./google-calendar";
import { 
  insertIntegrationSchema,
  insertSyncLogSchema
} from "@shared/schema";
import { z } from "zod";

export function registerIntegrationRoutes(app: Express) {
  const getUserId = (req: any): string => {
    return req.headers['user-id'] || '00000000-0000-0000-0000-000000000000';
  };

  // Get all integrations for user
  app.get("/api/integrations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrations = await storage.getIntegrations(userId);
      
      // Don't send sensitive tokens to frontend
      const safeIntegrations = integrations.map(integration => ({
        ...integration,
        accessToken: '[REDACTED]',
        refreshToken: '[REDACTED]',
      }));
      
      res.json(safeIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Get Google Calendar auth URL
  app.get("/api/integrations/google-calendar/auth-url", (req, res) => {
    try {
      const authUrl = GoogleCalendarIntegration.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google Calendar auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  // Handle Google Calendar OAuth callback
  app.post("/api/integrations/google-calendar/callback", async (req, res) => {
    try {
      const { code } = req.body;
      const userId = getUserId(req);
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }

      // Exchange code for tokens
      const tokens = await GoogleCalendarIntegration.exchangeCodeForTokens(code);
      
      if (!tokens.access_token) {
        return res.status(400).json({ message: "Failed to obtain access token" });
      }

      // Save integration
      const integration = await storage.createIntegration({
        userId,
        provider: 'google_calendar',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || 'calendar',
        settings: JSON.stringify({
          calendarId: 'primary',
          syncTasks: true,
          syncFocusSessions: true,
        }),
      });

      res.status(201).json({
        message: "Google Calendar integration created successfully",
        integration: {
          ...integration,
          accessToken: '[REDACTED]',
          refreshToken: '[REDACTED]',
        }
      });
    } catch (error) {
      console.error("Error handling Google Calendar callback:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  // Sync tasks to Google Calendar
  app.post("/api/integrations/:id/sync-tasks", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      const integration = await storage.getIntegration(id, userId);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      if (integration.provider !== 'google_calendar') {
        return res.status(400).json({ message: "This endpoint is for Google Calendar only" });
      }

      const googleCalendar = new GoogleCalendarIntegration(integration);
      const result = await googleCalendar.syncTasksToCalendar(userId);
      
      // Log the sync
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: 'tasks',
        direction: 'export',
        status: result.failed > 0 ? 'partial' : 'success',
        itemsProcessed: result.success,
        errorMessage: result.failed > 0 ? `${result.failed} items failed to sync` : null,
      });

      res.json({
        message: "Tasks synced to Google Calendar",
        result
      });
    } catch (error) {
      console.error("Error syncing tasks:", error);
      
      // Log the error
      const userId = getUserId(req);
      const { id } = req.params;
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: 'tasks',
        direction: 'export',
        status: 'error',
        itemsProcessed: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({ message: "Failed to sync tasks" });
    }
  });

  // Sync focus sessions to Google Calendar
  app.post("/api/integrations/:id/sync-focus-sessions", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      const integration = await storage.getIntegration(id, userId);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      if (integration.provider !== 'google_calendar') {
        return res.status(400).json({ message: "This endpoint is for Google Calendar only" });
      }

      const googleCalendar = new GoogleCalendarIntegration(integration);
      const result = await googleCalendar.syncFocusSessionsToCalendar(userId);
      
      // Log the sync
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: 'focus_sessions',
        direction: 'export',
        status: result.failed > 0 ? 'partial' : 'success',
        itemsProcessed: result.success,
        errorMessage: result.failed > 0 ? `${result.failed} items failed to sync` : null,
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

  // Import calendar events as tasks
  app.post("/api/integrations/:id/import-events", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      const integration = await storage.getIntegration(id, userId);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      if (integration.provider !== 'google_calendar') {
        return res.status(400).json({ message: "This endpoint is for Google Calendar only" });
      }

      const googleCalendar = new GoogleCalendarIntegration(integration);
      const result = await googleCalendar.importCalendarEvents(userId);
      
      // Log the sync
      await storage.createSyncLog({
        userId,
        integrationId: id,
        syncType: 'calendar_events',
        direction: 'import',
        status: result.failed > 0 ? 'partial' : 'success',
        itemsProcessed: result.success,
        errorMessage: result.failed > 0 ? `${result.failed} items failed to import` : null,
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

  // Delete integration
  app.delete("/api/integrations/:id", async (req, res) => {
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

  // Get sync logs
  app.get("/api/integrations/:id/sync-logs", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      const syncLogs = await storage.getSyncLogs(userId, id);
      res.json(syncLogs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });
}