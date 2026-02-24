import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    env: {
      SUPABASE_URL: "https://iarufylvvybhtqosohgb.supabase.co",
      SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcnVmeWx2dnliaHRxb3NvaGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDgwOTAsImV4cCI6MjA4NzQyNDA5MH0.c0RU1l5Rg6fWq7lSDoFjpY9tYrTvw6JDhcmku_BHUK0",
    },
  },
});
