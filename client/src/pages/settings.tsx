import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@shared/schema';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const settingsSchema = z.object({
  workStartTime: z.string().default('09:00'),
  workEndTime: z.string().default('17:00'),
  breakFrequency: z.string().default('30'),
  breakDuration: z.string().default('5'),
  waterReminder: z.boolean().default(true),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch existing profile
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles'],
    enabled: !!user,
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      workStartTime: '09:00',
      workEndTime: '17:00',
      breakFrequency: '30',
      breakDuration: '5',
      waterReminder: true,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile && !isLoading) {
      form.reset({
        workStartTime: profile.workStartTime || '09:00',
        workEndTime: profile.workEndTime || '17:00',
        breakFrequency: profile.breakFrequency || '30',
        breakDuration: profile.breakDuration || '5',
        waterReminder: profile.waterReminder ?? true,
      });
    }
  }, [profile, isLoading, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return await apiRequest('POST', '/api/profiles', {
        userId: user?.id,
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        breakFrequency: data.breakFrequency,
        breakDuration: data.breakDuration,
        waterReminder: data.waterReminder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: 'Settings updated!',
        description: 'Your productivity preferences have been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  const breakFrequencyOptions = [
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
  ];

  const breakDurationOptions = [
    { value: '2', label: '2 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Productivity Preferences</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure your work schedule and reminder preferences.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                {/* Working Hours */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Working Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-work-start-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="workEndTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-work-end-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Break Reminder Frequency */}
                <FormField
                  control={form.control}
                  name="breakFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Break Reminder Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-break-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {breakFrequencyOptions.map((option) => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              data-testid={`break-frequency-${option.value}`}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Break Duration */}
                <FormField
                  control={form.control}
                  name="breakDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Duration of Break</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-break-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {breakDurationOptions.map((option) => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              data-testid={`break-duration-${option.value}`}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Water Reminder */}
                <FormField
                  control={form.control}
                  name="waterReminder"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Water Reminder (pops up every hour)</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Get gentle reminders to stay hydrated throughout the day
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-water-reminder"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}