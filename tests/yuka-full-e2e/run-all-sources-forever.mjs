#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const tsxCli = path.join(rootDir, "node_modules", "tsx", "dist", "cli.mjs");
const suiteCore = path.join(__dirname, "suite-core.ts");

const args = process.argv.slice(2);
const forever = args.includes("--forever");
const intervalMs = Number(process.env.YUKA_E2E_INTERVAL_MS || 30000);

function runOnce(iteration) {
  console.log(`\n[YUKA-E2E] === Iteration #${iteration} (${new Date().toISOString()}) ===`);
  const res = spawnSync("/usr/bin/node", [tsxCli, suiteCore, ...args], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });
  return res.status ?? 1;
}

if (!forever) {
  const code = runOnce(1);
  process.exit(code);
} else {
  let iter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = runOnce(iter++);
    console.log(`[YUKA-E2E] Cycle exited with status ${code}. Sleeping ${intervalMs}ms...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, intervalMs);
  }
}
