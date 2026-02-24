import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getSupabaseClient } from "../services/supabaseClient";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Handle Supabase OAuth callback (for Google OAuth and other providers)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const accessToken = getQueryParam(req, "access_token");
    const refreshToken = getQueryParam(req, "refresh_token");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    // Handle errors from OAuth provider
    if (error) {
      console.error("[OAuth] Provider error:", error, errorDescription);
      res.redirect(302, `/?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    // Handle Supabase OAuth with access_token in fragment (handled client-side)
    // or with code exchange (PKCE flow)
    if (code) {
      try {
        const supabase = getSupabaseClient();
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError || !data.user) {
          console.error("[OAuth] Code exchange failed:", exchangeError?.message);
          res.redirect(302, "/?error=auth_failed");
          return;
        }

        const sbUser = data.user;
        const signedInAt = new Date();

        // Upsert user in our database
        await db.upsertUser({
          openId: sbUser.id,
          name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || null,
          email: sbUser.email ?? null,
          loginMethod: sbUser.app_metadata?.provider || 'email',
          lastSignedIn: signedInAt,
        });

        // Create a session token using the Supabase access token
        const sessionToken = await sdk.createSessionToken(sbUser.id, {
          name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, data.session.access_token, { 
          ...cookieOptions, 
          maxAge: ONE_YEAR_MS 
        });

        res.redirect(302, "/dashboard");
        return;
      } catch (err) {
        console.error("[OAuth] Callback failed", err);
        res.redirect(302, "/?error=auth_failed");
        return;
      }
    }

    // If no code or token, redirect to home
    res.redirect(302, "/");
  });
}
