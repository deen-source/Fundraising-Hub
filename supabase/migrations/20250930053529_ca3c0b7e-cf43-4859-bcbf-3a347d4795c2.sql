-- Create investors table for CRM and database
CREATE TABLE public.investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  firm_name TEXT,
  email TEXT,
  linkedin_url TEXT,
  website TEXT,
  
  -- Investment Criteria
  stage TEXT[], -- pre-seed, seed, series-a, series-b, etc.
  check_size_min NUMERIC,
  check_size_max NUMERIC,
  industries TEXT[], -- saas, fintech, healthcare, etc.
  geographies TEXT[], -- North America, Europe, Asia, etc.
  
  -- Pipeline Status
  pipeline_stage TEXT NOT NULL DEFAULT 'research', -- research, outreach, meeting, due_diligence, term_sheet, closed, passed
  priority TEXT DEFAULT 'medium', -- low, medium, high
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create investor_interactions table to track all touchpoints
CREATE TABLE public.investor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  interaction_type TEXT NOT NULL, -- email, call, meeting, note
  subject TEXT,
  content TEXT,
  outcome TEXT, -- positive, neutral, negative, no_response
  
  interaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT, -- cold_outreach, follow_up, update, thank_you
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_campaigns table for bulk sends
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Targeting
  target_investor_ids UUID[],
  filters JSONB, -- store search criteria used
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent
  scheduled_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investors
CREATE POLICY "Users can view own investors"
  ON public.investors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investors"
  ON public.investors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investors"
  ON public.investors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investors"
  ON public.investors FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for investor_interactions
CREATE POLICY "Users can view own interactions"
  ON public.investor_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON public.investor_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
  ON public.investor_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON public.investor_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_templates
CREATE POLICY "Users can view own templates"
  ON public.email_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.email_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_campaigns
CREATE POLICY "Users can view own campaigns"
  ON public.email_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON public.email_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.email_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON public.email_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_investors_user_id ON public.investors(user_id);
CREATE INDEX idx_investors_pipeline_stage ON public.investors(pipeline_stage);
CREATE INDEX idx_investors_stage ON public.investors USING GIN(stage);
CREATE INDEX idx_investors_industries ON public.investors USING GIN(industries);
CREATE INDEX idx_investor_interactions_investor_id ON public.investor_interactions(investor_id);
CREATE INDEX idx_investor_interactions_user_id ON public.investor_interactions(user_id);
CREATE INDEX idx_email_templates_user_id ON public.email_templates(user_id);
CREATE INDEX idx_email_campaigns_user_id ON public.email_campaigns(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();