import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ForumTopic() {
  return (
    <AuthGuard>
      <ForumTopicContent />
    </AuthGuard>
  );
}

function ForumTopicContent() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: topic } = useQuery({
    queryKey: ['forum-topic', topicId],
    queryFn: async () => {
      const { data: topicData, error } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', topicData.user_id)
        .single();

      return {
        ...topicData,
        profile
      };
    },
  });

  const { data: posts, refetch } = useQuery({
    queryKey: ['forum-posts', topicId],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return postsData.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id)
      }));
    },
  });

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a reply',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_posts')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          content: replyContent.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reply posted successfully',
      });

      setReplyContent('');
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

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/forum')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{topic.title}</CardTitle>
            {topic.description && (
              <CardDescription className="text-base mt-2">
                {topic.description}
              </CardDescription>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
              <span>
                Started by {topic.profile?.full_name || topic.profile?.email || 'Anonymous'}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4 mb-8">
          {posts?.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {(post.profile?.full_name || post.profile?.email || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {post.profile?.full_name || post.profile?.email || 'Anonymous'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {posts?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No replies yet. Be the first to respond!
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitReply} disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
