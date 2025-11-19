-- Add stage, investment_grade, and flagged_for_review columns to term_sheet_analyses table
-- These are needed for the enhanced Pitch Deck Analyser functionality

-- Add stage column (Pre-Seed, Seed, Series A)
ALTER TABLE public.term_sheet_analyses
ADD COLUMN stage TEXT;

-- Add investment_grade column
ALTER TABLE public.term_sheet_analyses
ADD COLUMN investment_grade TEXT;

-- Add flagged_for_review column (for high-potential startups)
ALTER TABLE public.term_sheet_analyses
ADD COLUMN flagged_for_review BOOLEAN DEFAULT FALSE;

-- Add check constraint for valid stages
ALTER TABLE public.term_sheet_analyses
ADD CONSTRAINT term_sheet_analyses_stage_check
CHECK (stage IS NULL OR stage IN ('Pre-Seed', 'Seed', 'Series A'));

-- Add check constraint for valid investment grades
ALTER TABLE public.term_sheet_analyses
ADD CONSTRAINT term_sheet_analyses_investment_grade_check
CHECK (investment_grade IS NULL OR investment_grade IN ('Strong Investment Candidate', 'Promising Opportunity', 'Early Stage Potential', 'Not Investment Ready'));

-- Create index on flagged_for_review for faster admin queries
CREATE INDEX idx_term_sheet_analyses_flagged ON public.term_sheet_analyses(flagged_for_review) WHERE flagged_for_review = TRUE;

-- Create index on investment_grade for filtering
CREATE INDEX idx_term_sheet_analyses_investment_grade ON public.term_sheet_analyses(investment_grade);
