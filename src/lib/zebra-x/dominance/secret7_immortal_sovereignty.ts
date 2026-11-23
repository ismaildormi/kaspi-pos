/**
 * Dominance v90.7: Universal Hardware Independence, Quantization Auto-Scaler & Air-Gapped/P2P Mesh Planner.
 */

export interface DeviceHardwareInput {
  ramGb: number;
  vramGb?: number;
  hasWebGpu?: boolean;
  offline?: boolean;
  peerDevicesCount?: number;
}

export function planHardwareSovereignProfile(device: DeviceHardwareInput) {
  const ramGb = Math.max(1, Number(device.ramGb || 4));
  const vramGb = Math.max(0, Number(device.vramGb || 0));
  const offline = Boolean(device.offline);
  const peers = Math.max(1, Number(device.peerDevicesCount || 1));

  let runtimeEngine = "WebLLM (In-Browser WebGPU)";
  let recommendedQuant = "IQ4_XS (4-bit)";
  let recommendedMaxModelParamsB = 3;
  let storageStack = "OPFS + IndexedDB + PGlite WASM";

  if (vramGb >= 16) {
    runtimeEngine = "Llama.cpp CUDA/Vulkan + Ollama";
    recommendedQuant = "Q5_K_M / Q6_K";
    recommendedMaxModelParamsB = 32;
    storageStack = "SQLite WAL + DuckDB + Zstd-19 Nano-Crystal";
  } else if (ramGb >= 16 && vramGb >= 6) {
    runtimeEngine = "Llama.cpp Hybrid Offload";
    recommendedQuant = "Q4_K_M";
    recommendedMaxModelParamsB = 14;
    storageStack = "SQLite WAL + PGlite";
  } else if (ramGb <= 4 && vramGb === 0) {
    runtimeEngine = device.hasWebGpu ? "WebLLM Tiny + BitNet 1.58-bit CPU" : "BitNet.cpp 1.58-bit CPU";
    recommendedQuant = "1.58-bit / IQ2_XXS";
    recommendedMaxModelParamsB = 1.5;
    storageStack = "IndexedDB + Zlib Gzip-9 Crystal";
  }

  const p2pMeshMode = peers >= 2 ? "Exo / Libp2p Distributed Layer Sharding" : "Single-Node Sovereign";

  return {
    ok: true,
    engine: "secret7_immortal_sovereignty_v90_7",
    ramGb,
    vramGb,
    offlineMode: offline,
    runtimeEngine,
    recommendedQuant,
    recommendedMaxModelParamsB: peers >= 2 ? recommendedMaxModelParamsB * peers : recommendedMaxModelParamsB,
    storageStack,
    p2pMeshMode,
    offlineKnowledgeBundles: offline ? ["Kiwix OpenZIM Core", "Sovereign Vault Lock", "DGI Tax Offline Table"] : ["Live Public Feeds + Vault Fallback"],
  };
}
