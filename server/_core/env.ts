export const ENV = {
  appId: process.env.VITE_APP_ID ?? "netguard-pro-app",
  cookieSecret: process.env.JWT_SECRET ?? "default-secret-key",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/netguardpro",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://auth.example.com",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

