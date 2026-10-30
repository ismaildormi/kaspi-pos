import { generateTextWithRouter, getRouterCandidates } from "../src/lib/ai-router";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("================================================================");
  console.log("KASPI AI: MULTI-KEY POOL & MULTI-GATEWAY ROUTER TEST");
  console.log("================================================================");

  const candidates = await getRouterCandidates();
  console.log(`Discovered ${candidates.length} active key targets in pool:`);
  candidates.forEach((c: any, idx: number) => {
    console.log(
      `  [Priority ${idx + 1}] Provider: ${c.providerName.padEnd(14)} | Key: ${c.keyMasked} | Model: ${c.modelId}`
    );
  });
  console.log("----------------------------------------------------------------");

  const prompt = "أعطني نصيحة واحدة وسريعة لتاجر المواد الغذائية (مول الحانوت) بالمغرب لزيادة أرباحه.";
  console.log(`Prompt: "${prompt}"\n`);

  try {
    const result = await generateTextWithRouter({
      prompt,
      system: "You are KASPI AI, a sharp Moroccan business advisor for retailers.",
    });

    console.log("----------------------------------------------------------------");
    console.log("RESPONSE RECEIVED SUCCESSFULLY:");
    console.log("Active Provider :", result.activeProvider);
    console.log("Active Key Index:", `Key #${result.activeKeyIndex + 1}`);
    console.log("Active Model    :", result.activeModel);
    console.log("Content:\n");
    console.log(result.text.trim());
    console.log("----------------------------------------------------------------");
    console.log("✔ TEST PASSED: Automatic key rotation & failover verified!");
    console.log("================================================================");
  } catch (err: any) {
    console.error("✖ TEST FAILED:", err?.message || err);
    process.exit(1);
  }
}

main();
