import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Type alias for SupabaseClient with Database type
 * Use this type in function parameters instead of importing from @supabase/supabase-js
 */
export type SupabaseClient = typeof supabaseClient;
