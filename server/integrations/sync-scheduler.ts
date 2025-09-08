import cron from 'node-cron';
import { storage } from '../storage';
import { GoogleCalendarIntegration } from './google-calendar';
import type { Integration } from '@shared/schema';

export class SyncScheduler {
  private static instance: SyncScheduler;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  public static getInstance(): SyncScheduler {
    if (!SyncScheduler.instance) {
      SyncScheduler.instance = new SyncScheduler();
    }
    return SyncScheduler.instance;
  }

  public startBackgroundSync() {
    // Run every hour to sync data for all active integrations
    cron.schedule('0 * * * *', async () => {
      console.log('Running background sync...');
      await this.syncAllIntegrations();
    });

    console.log('Background sync scheduler started');
  }

  private async syncAllIntegrations() {
    try {
      // Get all active integrations for all users (simplified approach)
      // In a real app, you'd want to paginate this and handle user-specific syncing
      
      // For now, we'll implement a placeholder that could be extended
      console.log('Background sync would run here for all active integrations');
      
      // The actual implementation would:
      // 1. Query all active integrations from the database
      // 2. Group by user and integration type
      // 3. Run sync operations for each
      // 4. Log results
      
    } catch (error) {
      console.error('Error in background sync:', error);
    }
  }

  public async syncUserIntegrations(userId: string) {
    try {
      const integrations = await storage.getIntegrations(userId);
      const activeIntegrations = integrations.filter(i => i.isActive);

      for (const integration of activeIntegrations) {
        await this.syncIntegration(integration, userId);
      }
    } catch (error) {
      console.error(`Error syncing integrations for user ${userId}:`, error);
    }
  }

  private async syncIntegration(integration: Integration, userId: string) {
    try {
      if (integration.provider === 'google_calendar') {
        const googleCalendar = new GoogleCalendarIntegration(integration);
        
        // Refresh token if needed
        const refreshed = await googleCalendar.refreshTokenIfNeeded();
        if (!refreshed) {
          console.log(`Failed to refresh token for integration ${integration.id}`);
          return;
        }

        // Sync tasks and focus sessions
        const settings = integration.settings ? JSON.parse(integration.settings) : {};
        
        if (settings.syncTasks !== false) {
          const taskResult = await googleCalendar.syncTasksToCalendar(userId);
          await storage.createSyncLog({
            userId,
            integrationId: integration.id,
            syncType: 'tasks',
            direction: 'export',
            status: taskResult.failed > 0 ? 'partial' : 'success',
            itemsProcessed: taskResult.success,
            errorMessage: taskResult.failed > 0 ? `${taskResult.failed} items failed` : null,
          });
        }

        if (settings.syncFocusSessions !== false) {
          const focusResult = await googleCalendar.syncFocusSessionsToCalendar(userId);
          await storage.createSyncLog({
            userId,
            integrationId: integration.id,
            syncType: 'focus_sessions',
            direction: 'export',
            status: focusResult.failed > 0 ? 'partial' : 'success',
            itemsProcessed: focusResult.success,
            errorMessage: focusResult.failed > 0 ? `${focusResult.failed} items failed` : null,
          });
        }
      }
    } catch (error) {
      console.error(`Error syncing integration ${integration.id}:`, error);
      
      // Log the error
      await storage.createSyncLog({
        userId,
        integrationId: integration.id,
        syncType: 'tasks',
        direction: 'export',
        status: 'error',
        itemsProcessed: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public scheduleUserSync(userId: string, interval: string = '0 */6 * * *') {
    // Schedule sync every 6 hours for a specific user
    const jobId = `user-${userId}`;
    
    // Cancel existing job if it exists
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId)?.stop();
    }

    // Create new scheduled job
    const job = cron.schedule(interval, async () => {
      await this.syncUserIntegrations(userId);
    }, {
      scheduled: false // Start manually
    });

    this.scheduledJobs.set(jobId, job);
    job.start();

    console.log(`Scheduled sync for user ${userId} with interval ${interval}`);
  }

  public stopUserSync(userId: string) {
    const jobId = `user-${userId}`;
    const job = this.scheduledJobs.get(jobId);
    
    if (job) {
      job.stop();
      this.scheduledJobs.delete(jobId);
      console.log(`Stopped sync for user ${userId}`);
    }
  }
}