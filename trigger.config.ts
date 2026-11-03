import { defineConfig } from "@trigger.dev/sdk/v3";

/**
 * Trigger.dev v3 Configuration for KASPI POS
 * Pointing to self-hosted Oracle Cloud VPS (TRIGGER_API_URL) or Trigger.dev Cloud.
 */
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "proj_kaspi_pos",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});
