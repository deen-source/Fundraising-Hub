-- Create practice_sessions table to store pitch practice history
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS practice_sessions_user_id_idx ON practice_sessions(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS practice_sessions_created_at_idx ON practice_sessions(created_at DESC);

-- Create composite index for user's scenario history
CREATE INDEX IF NOT EXISTS practice_sessions_user_scenario_idx ON practice_sessions(user_id, scenario_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own sessions
CREATE POLICY "Users can view their own practice sessions"
  ON practice_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own sessions
CREATE POLICY "Users can create their own practice sessions"
  ON practice_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own practice sessions"
  ON practice_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE practice_sessions IS 'Stores pitch practice session history including transcripts and AI feedback';
COMMENT ON COLUMN practice_sessions.transcript IS 'Array of conversation messages with role, content, and timestamp';
COMMENT ON COLUMN practice_sessions.feedback IS 'AI-generated feedback including landed points, gaps, decision, overall summary, and scored items';
COMMENT ON COLUMN practice_sessions.duration IS 'Session duration in seconds';
