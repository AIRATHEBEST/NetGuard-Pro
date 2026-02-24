import { createClient } from "@supabase/supabase-js";

// Supabase project credentials — loaded from .env (VITE_ prefix for Vite)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://iarufylvvybhtqosohgb.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcnVmeWx2dnliaHRxb3NvaGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDgwOTAsImV4cCI6MjA4NzQyNDA5MH0.c0RU1l5Rg6fWq7lSDoFjpY9tYrTvw6JDhcmku_BHUK0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
