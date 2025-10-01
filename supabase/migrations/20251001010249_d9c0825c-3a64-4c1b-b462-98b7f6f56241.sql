-- Fix search_path for generate_share_token function
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random token (12 characters, URL-safe)
    token := encode(gen_random_bytes(9), 'base64');
    token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.data_room_shares WHERE share_token = token) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$;