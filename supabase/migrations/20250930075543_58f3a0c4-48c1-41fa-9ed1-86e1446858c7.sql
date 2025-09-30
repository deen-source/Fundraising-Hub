-- Add data import tracking table
CREATE TABLE IF NOT EXISTS public.investor_data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_imports INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.investor_data_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports"
  ON public.investor_data_imports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imports"
  ON public.investor_data_imports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add enrichment and tracking fields to investors table
ALTER TABLE public.investors
  ADD COLUMN IF NOT EXISTS import_source TEXT,
  ADD COLUMN IF NOT EXISTS last_research_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS research_notes TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS warm_intro_path TEXT,
  ADD COLUMN IF NOT EXISTS investment_thesis TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_companies TEXT[],
  ADD COLUMN IF NOT EXISTS response_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS average_response_time INTEGER,
  ADD COLUMN IF NOT EXISTS last_outreach_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_investors_name ON public.investors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_investors_firm ON public.investors USING gin(to_tsvector('english', firm_name));
CREATE INDEX IF NOT EXISTS idx_investors_pipeline ON public.investors(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_investors_priority ON public.investors(priority);
CREATE INDEX IF NOT EXISTS idx_investors_tags ON public.investors USING gin(tags);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_investor_data_imports_updated_at ON public.investor_data_imports;

COMMENT ON TABLE public.investor_data_imports IS 'Tracks bulk imports of investor data';
COMMENT ON TABLE public.investors IS 'Complete investor CRM with pipeline management and interaction tracking';