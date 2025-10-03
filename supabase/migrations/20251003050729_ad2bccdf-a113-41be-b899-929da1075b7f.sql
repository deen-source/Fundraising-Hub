-- Add category column to forum_topics
ALTER TABLE public.forum_topics
ADD COLUMN category TEXT NOT NULL DEFAULT 'general';

-- Create index for category filtering
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category);