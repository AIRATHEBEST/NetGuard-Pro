import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "netguard-pro-app",
  cookieSecret: process.env.JWT_SECRET ?? "netguard-pro-secret-key-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:password@db.iarufylvvybhtqosohgb.supabase.co:5432/postgres",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://auth.example.com",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "https://iarufylvvybhtqosohgb.supabase.co",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  port: parseInt(process.env.PORT ?? "3000"),
  agentWsPort: parseInt(process.env.AGENT_WS_PORT ?? "8080"),
};
