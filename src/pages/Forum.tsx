import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, Plus, Clock, TrendingUp, Lightbulb, Users, Rocket, DollarSign, Code } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = [
  { value: 'fundraising', label: 'Fundraising & Investment', icon: DollarSign, color: 'bg-green-500/10 text-green-500' },
  { value: 'product', label: 'Product Development', icon: Rocket, color: 'bg-blue-500/10 text-blue-500' },
  { value: 'team', label: 'Team & Hiring', icon: Users, color: 'bg-purple-500/10 text-purple-500' },
  { value: 'marketing', label: 'Marketing & Growth', icon: TrendingUp, color: 'bg-orange-500/10 text-orange-500' },
  { value: 'technical', label: 'Technical & Engineering', icon: Code, color: 'bg-cyan-500/10 text-cyan-500' },
  { value: 'general', label: 'General Discussion', icon: Lightbulb, color: 'bg-gray-500/10 text-gray-500' },
];

export default function Forum() {
  return (
    <AuthGuard>
      <ForumContent />
    </AuthGuard>
  );
}

function ForumContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: topics, refetch } = useQuery({
    queryKey: ['forum-topics', filterCategory],
    queryFn: async () => {
      let query = supabase
        .from('forum_topics')
        .select('*');
      
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      
      const { data: topicsData, error } = await query.order('last_activity_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(topicsData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return topicsData.map(topic => ({
        ...topic,
        profile: profileMap.get(topic.user_id)
      }));
    },
  });

  const handleCreateTopic = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_topics')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category: category,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Topic created successfully',
      });

      setTitle('');
      setDescription('');
      setCategory('general');
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Founder Forum</h1>
              <p className="text-muted-foreground mt-2">
                Connect, discuss, and learn from fellow founders
              </p>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Start a new discussion with the founder community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you want to discuss?"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide more context..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTopic} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Topic'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            All Topics
          </Button>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat.value)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        <div className="space-y-4">
          {topics?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No topics yet. Be the first to start a discussion!
                </p>
              </CardContent>
            </Card>
          )}

          {topics?.map((topic) => (
            <Card
              key={topic.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/forum/${topic.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{topic.title}</CardTitle>
                      <Badge className={CATEGORIES.find(c => c.value === topic.category)?.color}>
                        {CATEGORIES.find(c => c.value === topic.category)?.label || topic.category}
                      </Badge>
                    </div>
                    {topic.description && (
                      <CardDescription className="line-clamp-2">
                        {topic.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                    <MessageSquare className="h-4 w-4" />
                    <span>{topic.reply_count}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Started by {topic.profile?.full_name || topic.profile?.email || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(topic.last_activity_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
