import { describe, expect, it } from "vitest";

describe("Supabase Configuration", () => {
  it("should have SUPABASE_URL configured", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    expect(supabaseUrl, "SUPABASE_URL must be set in environment").toBeDefined();
    expect(supabaseUrl).not.toBe("");
  });

  it("should have SUPABASE_ANON_KEY configured", () => {
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    expect(supabaseAnonKey, "SUPABASE_ANON_KEY must be set in environment").toBeDefined();
    expect(supabaseAnonKey).not.toBe("");
  });

  it("should have a valid Supabase URL format", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) return; // Skip if not configured

    const url = new URL(supabaseUrl);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toContain("supabase.co");
  });

  it("should have a non-trivially short anon key", () => {
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) return; // Skip if not configured

    expect(supabaseAnonKey.length).toBeGreaterThan(20);
  });
});
