import { z } from "zod";

const envSchema = z.object({
  API_KEY: z.string().min(1, "API_KEY is required (AgroPortal API key, see .env.example)"),
  AGROPORTAL_BASE_URL: z.string().url().default("https://data.agroportal.eu"),
});

/**
 * Parsed once per process. Throws at import time (server-only) if misconfigured,
 * so a missing key fails on boot rather than on the first request.
 */
export const env = envSchema.parse({
  API_KEY: process.env.API_KEY,
  AGROPORTAL_BASE_URL: process.env.AGROPORTAL_BASE_URL,
});
