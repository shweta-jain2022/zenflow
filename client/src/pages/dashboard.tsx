import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, Clock, Heart, Smile, Plus, BarChart3, Play, Pause, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, FocusSession, Meditation, Mood, WeeklyReport } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';
import { useGlobalTimer } from '@/contexts/timer-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const timer = useGlobalTimer();
  const { toast } = useToast();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!user,
  });

  const { data: focusSessions = [], isLoading: focusLoading } = useQuery<FocusSession[]>({
    queryKey: ['/api/focus-sessions'],
    enabled: !!user,
  });

  const { data: meditations = [], isLoading: meditationsLoading } = useQuery<Meditation[]>({
    queryKey: ['/api/meditations'],
    enabled: !!user,
  });

  const { data: moods = [], isLoading: moodsLoading } = useQuery<Mood[]>({
    queryKey: ['/api/moods'],
    enabled: !!user,
  });

  // Task completion mutation - must be before any early returns
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      return await apiRequest('PATCH', `/api/tasks/${taskId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/stats'] });
    },
  });

  // Generate weekly report mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/weekly-reports/generate', {});
    },
    onSuccess: (report) => {
      toast({
        title: "Weekly Report Generated! ✨",
        description: "Your AI-powered reflection has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reports/latest'] });
    },
    onError: (error) => {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate weekly report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch latest weekly report to show AI reflection
  const { data: latestReport } = useQuery<WeeklyReport>({
    queryKey: ['/api/weekly-reports/latest'],
    enabled: !!user,
  });

  // Show loading state while data is being fetched
  if (tasksLoading || focusLoading || meditationsLoading || moodsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const todaysTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    return taskDate.toDateString() === today.toDateString();
  });

  const completedTodaysTasks = todaysTasks.filter(task => task.completed);

  const totalFocusTime = focusSessions.reduce((total, session) => total + session.durationMinutes, 0);
  const totalMeditationTime = meditations.reduce((total, meditation) => total + meditation.durationMinutes, 0);
  
  const todaysMood = moods.find(mood => {
    const today = new Date();
    const moodDate = new Date(mood.createdAt);
    return moodDate.toDateString() === today.toDateString();
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      great: '😄',
      good: '😊',
      okay: '😐',
      stressed: '😰',
      sad: '😢',
    };
    return moodMap[mood] || '😐';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
    
    if (hour < 12) {
      return `Good morning, ${name}! 🌅`;
    } else if (hour < 17) {
      return `Good afternoon, ${name}! ☀️`;
    } else {
      return `Good evening, ${name}! 🌙`;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="fade-in">
        <h2 className="text-2xl font-bold text-foreground mb-2">{getGreeting()}</h2>
        <p className="text-muted-foreground">Ready to make today productive and mindful?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Today</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-tasks-today">
                  {completedTodaysTasks.length}/{todaysTasks.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Focus Time</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-focus-time">
                  {formatTime(totalFocusTime)}
                </p>
              </div>
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mood</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-current-mood">
                  {todaysMood ? getMoodEmoji(todaysMood.mood) : '😐'}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Smile className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meditation</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-meditation-time">
                  {formatTime(totalMeditationTime)}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Tasks</CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" data-testid="link-view-all-tasks">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todaysTasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                    data-testid={`dashboard-task-${task.id}`}
                  >
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={(checked) => {
                        toggleTaskMutation.mutate({ 
                          taskId: task.id, 
                          completed: checked as boolean 
                        });
                      }}
                      disabled={toggleTaskMutation.isPending}
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                      task.priority === 'medium' ? 'bg-secondary/10 text-secondary' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link href="/tasks">
              <Button variant="outline" className="w-full mt-4" data-testid="button-add-new-task">
                <Plus className="w-4 h-4 mr-2" />
                Add new task
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Focus & Mindfulness */}
        <Card>
          <CardHeader>
            <CardTitle>Focus & Mindfulness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">Pomodoro Timer</h4>
                <span className="text-2xl font-mono text-primary" data-testid="dashboard-timer-display">
                  {timer.formatTime}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {timer.isRunning ? (timer.mode === 'focus' ? 'Focus session' : 'Break time') : 'Ready to start'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {timer.mode.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={timer.isRunning ? timer.pauseTimer : timer.startTimer}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  data-testid={timer.isRunning ? "button-pause-timer" : "button-start-timer"}
                >
                  {timer.isRunning ? (
                    <><Pause className="w-4 h-4 mr-2" />Pause</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" />Start</>
                  )}
                </Button>
                <Link href="/focus" className="flex-1">
                  <Button className="w-full" size="sm" data-testid="button-focus-page">
                    Focus Page
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">Guided Breathing</h4>
                <div className="w-8 h-8 bg-secondary/20 rounded-full breathing-animation"></div>
              </div>
              <Link href="/mindfulness">
                <Button className="w-full bg-secondary text-secondary-foreground hover:opacity-90" data-testid="button-begin-breathing">
                  Begin Breathing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {/* AI Weekly Reflection */}
          {latestReport && (
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI Weekly Reflection</span>
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {latestReport.reportText}
              </div>
            </div>
          )}
          
          {/* Generate Report and View Progress Buttons */}
          <div className="text-center space-y-3">
            <div className="flex flex-col items-center gap-1">
              <Button 
                onClick={() => generateReportMutation.mutate()}
                disabled={generateReportMutation.isPending}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="button-generate-report"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
              </Button>
              <span className="text-xs text-muted-foreground">✨AI Generated</span>
            </div>
            
            <Link href="/progress">
              <Button variant="outline" data-testid="button-view-detailed-progress">
                View Detailed Progress
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
