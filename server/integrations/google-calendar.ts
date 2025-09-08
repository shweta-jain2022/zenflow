import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import type { Integration, Task, FocusSession } from '@shared/schema';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
}

export class GoogleCalendarIntegration {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor(integration: Integration) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://your-app.replit.dev/api/integrations/google/callback'
    );

    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  static getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  static async exchangeCodeForTokens(code: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  async syncTasksToCalendar(userId: string): Promise<{ success: number; failed: number }> {
    try {
      const tasks = await storage.getTasks(userId);
      const dueTasks = tasks.filter(task => task.dueDate && !task.completed);
      
      let success = 0;
      let failed = 0;

      for (const task of dueTasks) {
        try {
          const event: GoogleCalendarEvent = {
            summary: `📝 ${task.title}`,
            description: `Task from ZenFlow${task.description ? `\\n\\n${task.description}` : ''}`,
            start: {
              dateTime: new Date(task.dueDate).toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
              timeZone: 'UTC',
            },
            colorId: this.getPriorityColor(task.priority),
          };

          await this.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
          });
          
          success++;
        } catch (error) {
          console.error(`Failed to sync task ${task.id}:`, error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error syncing tasks to calendar:', error);
      throw error;
    }
  }

  async syncFocusSessionsToCalendar(userId: string): Promise<{ success: number; failed: number }> {
    try {
      const focusSessions = await storage.getFocusSessions(userId);
      const recentSessions = focusSessions.slice(0, 10); // Last 10 sessions
      
      let success = 0;
      let failed = 0;

      for (const session of recentSessions) {
        try {
          const endTime = new Date(new Date(session.createdAt).getTime() + session.durationMinutes * 60 * 1000);
          
          const event: GoogleCalendarEvent = {
            summary: this.getFocusSessionTitle(session.sessionType),
            description: `Focus session from ZenFlow\\nDuration: ${session.durationMinutes} minutes`,
            start: {
              dateTime: new Date(session.createdAt).toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: 'UTC',
            },
            colorId: this.getSessionColor(session.sessionType),
          };

          await this.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
          });
          
          success++;
        } catch (error) {
          console.error(`Failed to sync focus session ${session.id}:`, error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error syncing focus sessions to calendar:', error);
      throw error;
    }
  }

  async importCalendarEvents(userId: string): Promise<{ success: number; failed: number }> {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: oneWeekFromNow.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      let success = 0;
      let failed = 0;

      for (const event of events) {
        try {
          // Only import events that look like tasks (have specific patterns or keywords)
          if (this.isTaskLikeEvent(event)) {
            const task = {
              userId,
              title: event.summary || 'Imported Task',
              description: event.description || '',
              dueDate: event.start?.dateTime ? new Date(event.start.dateTime) : null,
              completed: false,
              priority: 'medium' as const,
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
      console.error('Error importing calendar events:', error);
      throw error;
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '11'; // Red
      case 'medium': return '5'; // Yellow
      case 'low': return '2'; // Green
      default: return '1'; // Blue
    }
  }

  private getSessionColor(sessionType: string): string {
    switch (sessionType) {
      case 'focus': return '9'; // Purple
      case 'short_break': return '2'; // Green
      case 'long_break': return '3'; // Blue
      default: return '1'; // Default blue
    }
  }

  private getFocusSessionTitle(sessionType: string): string {
    switch (sessionType) {
      case 'focus': return '🎯 Focus Session';
      case 'short_break': return '☕ Short Break';
      case 'long_break': return '🌿 Long Break';
      default: return '⏱️ Focus Session';
    }
  }

  private isTaskLikeEvent(event: any): boolean {
    const summary = event.summary?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    
    // Keywords that indicate this might be a task
    const taskKeywords = ['todo', 'task', 'deadline', 'due', 'complete', 'finish', 'work on', 'meeting', 'call'];
    
    return taskKeywords.some(keyword => 
      summary.includes(keyword) || description.includes(keyword)
    );
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      // Update stored tokens if refresh was successful
      return true;
    } catch (error) {
      console.error('Failed to refresh Google Calendar token:', error);
      return false;
    }
  }
}