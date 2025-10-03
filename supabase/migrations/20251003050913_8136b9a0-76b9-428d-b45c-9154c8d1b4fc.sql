-- Add vote tracking to forum topics
ALTER TABLE public.forum_topics
ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN downvotes INTEGER NOT NULL DEFAULT 0;

-- Add vote tracking to forum posts
ALTER TABLE public.forum_posts
ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN downvotes INTEGER NOT NULL DEFAULT 0;

-- Create forum_votes table to track user votes
CREATE TABLE public.forum_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id),
  UNIQUE(user_id, post_id),
  CHECK ((topic_id IS NOT NULL AND post_id IS NULL) OR (topic_id IS NULL AND post_id IS NOT NULL))
);

-- Enable RLS
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_votes
CREATE POLICY "Anyone can view votes"
  ON public.forum_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own votes"
  ON public.forum_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.forum_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.forum_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_forum_votes_topic ON public.forum_votes(topic_id);
CREATE INDEX idx_forum_votes_post ON public.forum_votes(post_id);
CREATE INDEX idx_forum_votes_user ON public.forum_votes(user_id);