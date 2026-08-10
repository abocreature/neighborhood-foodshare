import { createClient } from '@supabase/supabase-js';

const supabaseURL = "https://voyktpqzwtbvfxamnjqr.supabase.co/";
const supabaseAnonKey = "sb_publishable_E_6Hl-ykDuKcXxFcje3Y7g_bDJJpNuS";

export const supabase = createClient(supabaseURL, supabaseAnonKey);