import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@shared/schema';
import { Sparkles } from 'lucide-react';

const onboardingSchema = z.object({
  workStartTime: z.string().default('09:00'),
  workEndTime: z.string().default('17:00'),
  breakFrequency: z.string().default('30'),
  breakDuration: z.string().default('5'),
  waterReminder: z.boolean().default(true),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch existing profile to pre-populate form
  const { data: profile } = useQuery<Profile>({
    queryKey: ['/api/profiles'],
    enabled: !!user && isOpen,
  });
  
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      workStartTime: '09:00',
      workEndTime: '17:00',
      breakFrequency: '30',
      breakDuration: '5',
      waterReminder: true,
    },
  });
  
  // Update form with existing profile data when available
  useEffect(() => {
    if (profile && isOpen) {
      form.reset({
        workStartTime: profile.workStartTime || '09:00',
        workEndTime: profile.workEndTime || '17:00',
        breakFrequency: profile.breakFrequency || '30',
        breakDuration: profile.breakDuration || '5',
        waterReminder: profile.waterReminder ?? true,
      });
    }
  }, [profile, isOpen, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
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
        title: 'Settings saved!',
        description: 'Your productivity preferences have been configured.',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error saving settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (data: OnboardingForm) => {
    saveSettingsMutation.mutate(data);
  };

  const handleSkip = () => {
    toast({
      title: 'Welcome to ZenFlow!',
      description: 'You can update your preferences anytime in Settings.',
    });
    onClose();
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

  const getUserName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="onboarding-modal">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">
              Hi {getUserName()}! Let's set you up for success 🎉
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your productivity preferences to get the most out of ZenFlow.
          </p>
        </DialogHeader>

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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel className="text-base font-medium">Water Reminder</FormLabel>
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSkip}
                data-testid="button-skip-onboarding"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};