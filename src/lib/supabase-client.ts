import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://jgwcogjdubognzkqrjbd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2NvZ2pkdWJvZ256a3FyamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTMyNTcsImV4cCI6MjEwMTIyOTI1N30.tVxMFDXwcyU1UZwcNhgOnRTl6vlirS_mQpXwkFdj-cg";

const envUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  undefined;

const envKey =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env?.VITE_SUPABASE_ANON_KEY)) ||
  undefined;

const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
const supabaseKey = envKey || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
