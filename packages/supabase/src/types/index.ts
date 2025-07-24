import type { Database } from "./db"
import type { SupabaseClient } from "@supabase/supabase-js"

export type Client = SupabaseClient<Database>

export * from "./db"
