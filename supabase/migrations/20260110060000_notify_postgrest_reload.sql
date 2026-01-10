-- Notify PostgREST to reload its schema cache
-- This ensures the API recognizes the new column

NOTIFY pgrst, 'reload schema';

-- Also notify the config reload channel
NOTIFY pgrst, 'reload config';
