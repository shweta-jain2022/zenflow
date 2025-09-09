import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Heart, Smile, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface ProgressStats {
  tasksCompleted: number;
  focusTimeHours: number;
  meditationTimeHours: number;
  averageMood: number;
  streaks: {
    tasks: number;
    meditation: number;
    journaling: number;
  };
  weeklyData: Array<{
    day: string;
    tasks: number;
    focus: number;
    meditation: number;
    mood: number;
  }>;
}

export const ProgressCharts = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<ProgressStats>({
    queryKey: ['/api/progress/stats'],
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="text-center p-8">Loading progress data...</div>;
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No progress data available yet. Start using the app to see your stats!</p>
      </div>
    );
  }

  const formatPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Progress</h2>
        <p className="text-muted-foreground">Track your productivity and mindfulness journey</p>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-tasks-completed">
              {stats.tasksCompleted}
            </div>
            <div className="text-sm text-muted-foreground">Tasks Completed</div>
            <div className="text-xs text-accent mt-1">+15% from last week</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-focus-time">
              {stats.focusTimeHours.toFixed(1)}h
            </div>
            <div className="text-sm text-muted-foreground">Focus Time</div>
            <div className="text-xs text-accent mt-1">+8% from last week</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-meditation-time">
              {stats.meditationTimeHours.toFixed(1)}h
            </div>
            <div className="text-sm text-muted-foreground">Meditation</div>
            <div className="text-xs text-accent mt-1">+22% from last week</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Smile className="w-6 h-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1" data-testid="stat-avg-mood">
              {stats.averageMood.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Mood</div>
            <div className="text-xs text-accent mt-1">+0.3 from last week</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" name="Tasks" />
                  <Bar dataKey="focus" fill="hsl(var(--secondary))" name="Focus (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mood Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[1, 5]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    name="Mood"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streaks & Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Streaks & Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="text-3xl mb-2">🔥</div>
              <div className="font-semibold text-foreground mb-1">Task Streak</div>
              <div className="text-2xl font-bold text-primary mb-1" data-testid="streak-tasks">
                {stats.streaks?.tasks || 0} {(stats.streaks?.tasks || 0) === 1 ? 'day' : 'days'}
              </div>
              <div className="text-xs text-muted-foreground">
                {(stats.streaks?.tasks || 0) === 0 ? 'Start today!' : (stats.streaks?.tasks || 0) >= 7 ? 'Amazing!' : 'Keep it up!'}
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20">
              <div className="text-3xl mb-2">🧘</div>
              <div className="font-semibold text-foreground mb-1">Meditation</div>
              <div className="text-2xl font-bold text-secondary mb-1" data-testid="streak-meditation">
                {stats.streaks?.meditation || 0} {(stats.streaks?.meditation || 0) === 1 ? 'day' : 'days'}
              </div>
              <div className="text-xs text-muted-foreground">
                {(stats.streaks?.meditation || 0) === 0 ? 'Begin your journey!' : (stats.streaks?.meditation || 0) >= 10 ? 'Incredible!' : 'Great progress!'}
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold text-foreground mb-1">Journaling</div>
              <div className="text-2xl font-bold text-accent mb-1" data-testid="streak-journal">
                {stats.streaks?.journaling || 0} {(stats.streaks?.journaling || 0) === 1 ? 'day' : 'days'}
              </div>
              <div className="text-xs text-muted-foreground">
                {(stats.streaks?.journaling || 0) === 0 ? 'Start writing!' : (stats.streaks?.journaling || 0) >= 5 ? 'Wonderful!' : 'Great start!'}
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4 p-3 bg-background rounded-lg" data-testid="achievement-focus-master">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Focus Master</div>
                <div className="text-sm text-muted-foreground">Completed 10 focus sessions this week</div>
              </div>
              <div className="text-xs text-muted-foreground">2 days ago</div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-background rounded-lg" data-testid="achievement-task-crusher">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Task Crusher</div>
                <div className="text-sm text-muted-foreground">Completed 5 high-priority tasks</div>
              </div>
              <div className="text-xs text-muted-foreground">1 week ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
