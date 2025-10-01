-- Enable realtime for investors table
ALTER TABLE public.investors REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.investors;