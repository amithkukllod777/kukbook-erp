import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Parse the OAuth state parameter.
 * Supports two formats:
 * 1. Legacy: base64-encoded redirect URI string
 * 2. New: base64-encoded JSON with { redirectUri, returnPath }
 */
function parseState(state: string): { redirectUri: string; returnPath: string } {
  try {
    const decoded = atob(state);
    // Try parsing as JSON first (new format)
    try {
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object" && parsed.redirectUri) {
        return {
          redirectUri: parsed.redirectUri,
          returnPath: parsed.returnPath || "/",
        };
      }
    } catch {
      // Not JSON — legacy format (plain redirect URI)
    }
    // Legacy: the decoded string is the redirect URI itself
    return { redirectUri: decoded, returnPath: "/" };
  } catch {
    return { redirectUri: "", returnPath: "/" };
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the preserved return path (e.g. /app/my-company/invoices)
      const { returnPath } = parseState(state);
      // Sanitize: only allow paths starting with / to prevent open redirect
      const safePath = returnPath.startsWith("/") ? returnPath : "/";
      res.redirect(302, safePath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
