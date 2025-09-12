import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, BookOpen } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Journal } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useGuestRestriction } from '@/hooks/use-guest-restriction';

export const JournalEntry = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkGuestRestriction } = useGuestRestriction();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  const { data: journals = [] } = useQuery<Journal[]>({
    queryKey: ['/api/journals'],
    enabled: !!user,
  });

  const saveJournalMutation = useMutation({
    mutationFn: async (journalContent: string) => {
      return await apiRequest('POST', '/api/journals', {
        content: journalContent,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reports/latest'] });
      toast({
        title: 'Journal entry saved',
        description: 'Your reflection has been saved successfully.',
      });
      setContent('');
      setIsEditing(false);
    },
  });

  const updateJournalMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return await apiRequest('PATCH', `/api/journals/${id}`, {
        content: content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reports/latest'] });
      toast({
        title: 'Journal entry updated',
        description: 'Your reflection has been updated successfully.',
      });
      setContent('');
      setIsEditing(false);
      setEditingJournalId(null);
    },
  });

  const handleSave = () => {
    if (checkGuestRestriction('save journal entries')) {
      return;
    }
    
    if (content.trim()) {
      if (editingJournalId) {
        updateJournalMutation.mutate({ id: editingJournalId, content });
      } else {
        saveJournalMutation.mutate(content);
      }
    }
  };

  const handleEdit = (journal: Journal) => {
    if (checkGuestRestriction('edit journal entries')) {
      return;
    }
    
    setContent(journal.content);
    setEditingJournalId(journal.id);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setContent('');
    setIsEditing(false);
    setEditingJournalId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadTime = (wordCount: number) => {
    return Math.ceil(wordCount / 200); // Assume 200 words per minute reading speed
  };

  return (
    <div className="space-y-6">
      {/* Journal Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingJournalId ? 'Edit Reflection' : 'Daily Reflection'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today? Reflect on your experiences, thoughts, and feelings..."
            className="min-h-32 resize-none"
            data-testid="textarea-journal-content"
          />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {content.length > 0 ? `${getWordCount(content)} words` : 'Auto-saved'}
            </span>
            <div className="flex gap-2">
              {editingJournalId && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel-journal"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!content.trim() || saveJournalMutation.isPending || updateJournalMutation.isPending}
                data-testid="button-save-journal"
              >
                {(saveJournalMutation.isPending || updateJournalMutation.isPending) ? 
                  'Saving...' : 
                  editingJournalId ? 'Update Entry' : 'Save Entry'
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Journal Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {journals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No journal entries yet. Start reflecting on your day!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {journals.slice(0, 5).map((journal) => {
                const wordCount = getWordCount(journal.content);
                const readTime = getReadTime(wordCount);
                
                return (
                  <div
                    key={journal.id}
                    className="p-4 bg-background rounded-lg border border-border"
                    data-testid={`journal-entry-${journal.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium text-foreground">
                        Today's Reflection
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(journal.createdAt.toString())}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {journal.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{wordCount} words</span>
                        <span>•</span>
                        <span>{readTime} min read</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(journal)}
                        data-testid={`button-edit-journal-${journal.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
