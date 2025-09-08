import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Database, Loader2, Plus, Settings, Trash2, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Integration, SyncLog } from '@shared/schema';

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
}

const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync tasks and focus sessions with your Google Calendar',
    icon: Calendar,
    color: 'bg-blue-500',
    features: ['Export tasks as calendar events', 'Sync focus sessions', 'Import calendar events as tasks'],
  },
  {
    id: 'outlook_calendar',
    name: 'Microsoft Outlook',
    description: 'Integrate with Microsoft Outlook Calendar',
    icon: Calendar,
    color: 'bg-purple-500',
    features: ['Calendar sync', 'Task management', 'Meeting integration'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync tasks and journals with your Notion workspace',
    icon: Database,
    color: 'bg-gray-800',
    features: ['Task database sync', 'Journal entries', 'Progress tracking'],
  },
];

export default function IntegrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Fetch user's integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations'],
    staleTime: 30000,
  });

  // Fetch sync logs for active integrations
  const { data: syncLogs = [] } = useQuery({
    queryKey: ['/api/integrations/sync-logs'],
    enabled: integrations.length > 0,
    staleTime: 10000,
  });

  const connectIntegration = useMutation({
    mutationFn: async (provider: string) => {
      if (provider === 'google_calendar') {
        // Get auth URL and redirect
        const response = await apiRequest('GET', '/api/integrations/google-calendar/auth-url');
        const data = await response.json();
        window.location.href = data.authUrl;
        return data;
      }
      throw new Error(`${provider} integration not yet implemented`);
    },
    onMutate: (provider) => {
      setConnectingProvider(provider);
    },
    onError: (error) => {
      setConnectingProvider(null);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect integration',
        variant: 'destructive',
      });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      await apiRequest('DELETE', `/api/integrations/${integrationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: 'Integration Removed',
        description: 'Integration has been successfully disconnected',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove integration',
        variant: 'destructive',
      });
    },
  });

  const syncData = useMutation({
    mutationFn: async ({ integrationId, syncType }: { integrationId: string; syncType: string }) => {
      const endpoint = syncType === 'tasks' 
        ? `/api/integrations/${integrationId}/sync-tasks`
        : `/api/integrations/${integrationId}/sync-focus-sessions`;
      
      const response = await apiRequest('POST', endpoint);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/sync-logs'] });
      toast({
        title: 'Sync Complete',
        description: `Successfully synced ${data.result.success} items`,
      });
    },
    onError: (error, variables) => {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync data',
        variant: 'destructive',
      });
    },
  });

  const getProviderInfo = (providerId: string) => {
    return INTEGRATION_PROVIDERS.find(p => p.id === providerId);
  };

  const getIntegrationStatus = (integration: Integration): 'active' | 'error' | 'inactive' => {
    if (!integration.isActive) return 'inactive';
    // Check if token has expired
    if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
      return 'error';
    }
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect ZenFlow with your favorite productivity tools and calendar apps
        </p>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Connected Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration: Integration) => {
              const provider = getProviderInfo(integration.provider);
              const status = getIntegrationStatus(integration);
              const IconComponent = provider?.icon || Settings;

              return (
                <Card key={integration.id}>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                    <div className={`w-10 h-10 rounded-lg ${provider?.color || 'bg-gray-500'} flex items-center justify-center mr-3`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{provider?.name || integration.provider}</CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(status)} text-white`}
                        >
                          {status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Connected on {new Date(integration.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {integration.provider === 'google_calendar' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => syncData.mutate({ integrationId: integration.id, syncType: 'tasks' })}
                            disabled={syncData.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Sync Tasks
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => syncData.mutate({ integrationId: integration.id, syncType: 'focus-sessions' })}
                            disabled={syncData.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Sync Focus Sessions
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteIntegration.mutate(integration.id)}
                        disabled={deleteIntegration.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Separator />

      {/* Available Integrations */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATION_PROVIDERS.map((provider) => {
            const isConnected = integrations.some((i: Integration) => i.provider === provider.id);
            const IconComponent = provider.icon;

            return (
              <Card key={provider.id} className={isConnected ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg ${provider.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      {isConnected && (
                        <Badge variant="secondary" className="mt-1">Connected</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {provider.description}
                  </CardDescription>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    {provider.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full"
                    disabled={isConnected || connectingProvider === provider.id || provider.id !== 'google_calendar'}
                    onClick={() => connectIntegration.mutate(provider.id)}
                  >
                    {connectingProvider === provider.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : isConnected ? (
                      'Connected'
                    ) : provider.id === 'google_calendar' ? (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    ) : (
                      'Coming Soon'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Sync Activity */}
      {syncLogs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Sync Activity</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {syncLogs.slice(0, 5).map((log: SyncLog) => {
                  const integration = integrations.find((i: Integration) => i.id === log.integrationId);
                  const provider = integration ? getProviderInfo(integration.provider) : null;
                  
                  return (
                    <div key={log.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {provider && (
                          <div className={`w-8 h-8 rounded-full ${provider.color} flex items-center justify-center`}>
                            <provider.icon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {log.syncType.replace('_', ' ')} {log.direction}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {provider?.name || 'Unknown'} • {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                        {log.itemsProcessed > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {log.itemsProcessed} items
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}