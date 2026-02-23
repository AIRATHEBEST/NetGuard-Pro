import { describe, expect, it } from "vitest";

describe("Supabase Configuration", () => {
  it("should have Supabase credentials configured", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();
    expect(supabaseUrl).toMatch(/^https:\/\//);
    expect(supabaseAnonKey).toMatch(/^sb_/);
  });

  it("should validate Supabase URL format", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    expect(supabaseUrl).toBe("https://iarufylvvybhtqosohgb.supabase.co");
  });

  it("should validate Supabase anon key format", () => {
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    expect(supabaseAnonKey).toBe("sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS");
  });

  it("should have valid Supabase project structure", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // Validate URL structure
    const url = new URL(supabaseUrl || "");
    expect(url.hostname).toContain("supabase.co");

    // Validate key structure
    expect(supabaseAnonKey?.length).toBeGreaterThan(20);
    expect(supabaseAnonKey).toMatch(/^sb_publishable_/);
  });
});
