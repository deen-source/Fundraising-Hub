import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, Plus, Clock, TrendingUp, Lightbulb, Users, Rocket, DollarSign, Code, ArrowBigUp, ArrowBigDown, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const { data: topics, refetch } = useQuery({
    queryKey: ['forum-topics', filterCategory],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      let query = supabase
        .from('forum_topics')
        .select('*');
      
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      
      const { data: topicsData, error } = await query.order('upvotes', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(topicsData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Fetch user votes
      const { data: votes } = user ? await supabase
        .from('forum_votes')
        .select('topic_id, vote_type')
        .eq('user_id', user.id)
        .not('topic_id', 'is', null) : { data: [] };

      const profileMap = new Map<string, any>();
      profiles?.forEach(p => profileMap.set(p.id, p));
      
      const voteMap = new Map<string, string>();
      votes?.forEach(v => {
        if (v.topic_id) voteMap.set(v.topic_id, v.vote_type);
      });
      
      return topicsData.map(topic => ({
        ...topic,
        profile: profileMap.get(topic.user_id),
        userVote: voteMap.get(topic.id)
      }));
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ topicId, voteType }: { topicId: string; voteType: 'up' | 'down' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check existing vote
      const { data: existingVote } = await supabase
        .from('forum_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase.from('forum_votes').delete().eq('id', existingVote.id);
          
          // Update topic count
          const { data: topic } = await supabase
            .from('forum_topics')
            .select('upvotes, downvotes')
            .eq('id', topicId)
            .single();

          if (topic) {
            await supabase
              .from('forum_topics')
              .update({
                upvotes: voteType === 'up' ? Math.max(0, topic.upvotes - 1) : topic.upvotes,
                downvotes: voteType === 'down' ? Math.max(0, topic.downvotes - 1) : topic.downvotes,
              })
              .eq('id', topicId);
          }
        } else {
          // Change vote
          await supabase.from('forum_votes').update({ vote_type: voteType }).eq('id', existingVote.id);
          
          // Update both counts
          const { data: topic } = await supabase
            .from('forum_topics')
            .select('upvotes, downvotes')
            .eq('id', topicId)
            .single();

          if (topic) {
            await supabase
              .from('forum_topics')
              .update({
                upvotes: voteType === 'up' ? topic.upvotes + 1 : Math.max(0, topic.upvotes - 1),
                downvotes: voteType === 'down' ? topic.downvotes + 1 : Math.max(0, topic.downvotes - 1),
              })
              .eq('id', topicId);
          }
        }
      } else {
        // Add new vote
        await supabase.from('forum_votes').insert({
          user_id: user.id,
          topic_id: topicId,
          vote_type: voteType,
        });

        const { data: topic } = await supabase
          .from('forum_topics')
          .select('upvotes, downvotes')
          .eq('id', topicId)
          .single();

        if (topic) {
          await supabase
            .from('forum_topics')
            .update({
              upvotes: voteType === 'up' ? topic.upvotes + 1 : topic.upvotes,
              downvotes: voteType === 'down' ? topic.downvotes + 1 : topic.downvotes,
            })
            .eq('id', topicId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
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
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Founder Forum</h1>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
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
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => {
                          const CategoryIcon = cat.icon;
                          return (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Button
                  variant={filterCategory === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setFilterCategory('all')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  All Topics
                </Button>
                <Separator className="my-2" />
                {CATEGORIES.map((cat) => {
                  const CategoryIcon = cat.icon;
                  return (
                    <Button
                      key={cat.value}
                      variant={filterCategory === cat.value ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setFilterCategory(cat.value)}
                    >
                      <CategoryIcon className="h-4 w-4 mr-2" />
                      {cat.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-3">
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

            {topics?.map((topic) => {
              const categoryInfo = CATEGORIES.find(c => c.value === topic.category);
              const CategoryIcon = categoryInfo?.icon || Lightbulb;
              const score = topic.upvotes - topic.downvotes;

              return (
                <Card key={topic.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Vote buttons */}
                      <div className="flex flex-col items-center gap-1 w-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-sm",
                            topic.userVote === 'up' && "text-primary bg-primary/10"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            voteMutation.mutate({ topicId: topic.id, voteType: 'up' });
                          }}
                        >
                          <ArrowBigUp className="h-5 w-5" />
                        </Button>
                        <span className="text-sm font-semibold">{score}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-sm",
                            topic.userVote === 'down' && "text-destructive bg-destructive/10"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            voteMutation.mutate({ topicId: topic.id, voteType: 'down' });
                          }}
                        >
                          <ArrowBigDown className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/forum/${topic.id}`)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Badge variant="outline" className={cn("text-xs", categoryInfo?.color)}>
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categoryInfo?.label || topic.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Posted by {topic.profile?.full_name || topic.profile?.email || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <h3 className="font-semibold text-base mb-1 hover:text-primary transition-colors">
                          {topic.title}
                        </h3>

                        {topic.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {topic.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{topic.reply_count} {topic.reply_count === 1 ? 'reply' : 'replies'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
