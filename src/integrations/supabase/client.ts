// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nmgxgtuuzkwpguwqggzy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ3hndHV1emt3cGd1d3FnZ3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2Mjc5MTgsImV4cCI6MjA0OTIwMzkxOH0.eCwy-b780WgFTBXd4ykqreGkDBl2dKNUGkfayYPQ63Q";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);