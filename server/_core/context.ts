import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  companyId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Extract active company ID from x-company-id header
  const companyIdHeader = opts.req.headers["x-company-id"];
  let companyId: number | null = null;
  if (companyIdHeader) {
    const parsed = parseInt(String(companyIdHeader), 10);
    if (!isNaN(parsed) && parsed > 0) {
      companyId = parsed;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    companyId,
  };
}
