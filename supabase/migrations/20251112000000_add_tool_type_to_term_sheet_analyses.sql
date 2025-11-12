-- Add tool_type column to term_sheet_analyses table to distinguish between pitch deck and term sheet analyses
ALTER TABLE public.term_sheet_analyses
ADD COLUMN tool_type TEXT;

-- Set default value for existing records (assume they are term sheets)
UPDATE public.term_sheet_analyses
SET tool_type = 'term_sheet'
WHERE tool_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.term_sheet_analyses
ALTER COLUMN tool_type SET NOT NULL;

-- Add a check constraint to ensure valid tool types
ALTER TABLE public.term_sheet_analyses
ADD CONSTRAINT term_sheet_analyses_tool_type_check
CHECK (tool_type IN ('pitch_deck', 'term_sheet'));
