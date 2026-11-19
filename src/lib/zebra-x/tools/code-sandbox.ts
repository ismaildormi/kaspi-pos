import vm from "node:vm";

export type SandboxLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "bash"
  | "php"
  | "go"
  | "c++";

export interface SandboxExecutionResult {
  ok: boolean;
  engine: string;
  language: SandboxLanguage;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeSec?: string;
  error?: string;
}

const JUDGE0_LANGUAGES: Record<SandboxLanguage, { id: number; name: string; godbolt?: string }> = {
  python: { id: 109, name: "Python 3.13.2", godbolt: "python312" },
  javascript: { id: 102, name: "Node.js 22.08.0", godbolt: "nodejs20" },
  typescript: { id: 101, name: "TypeScript 5.6.2" },
  bash: { id: 46, name: "Bash 5.0.0" },
  php: { id: 98, name: "PHP 8.3.11" },
  go: { id: 107, name: "Go 1.23.5", godbolt: "gl1230" },
  "c++": { id: 105, name: "C++ GCC 14.1.0", godbolt: "g141" },
};

function runIsolatedJsVm(code: string): SandboxExecutionResult {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")),
      error: (...args: any[]) => logs.push(args.map(String).join(" ")),
      warn: (...args: any[]) => logs.push(args.map(String).join(" ")),
    },
    Math,
    JSON,
    Date,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Map,
    Set,
  };
  try {
    const context = vm.createContext(sandbox);
    const evaluated = vm.runInContext(code, context, { timeout: 2500 });
    const out = logs.length > 0 ? logs.join("\n") : evaluated !== undefined ? String(evaluated) : "";
    return {
      ok: true,
      engine: "HEYUKA Isolated V8 VM",
      language: "javascript",
      stdout: out.slice(0, 4000),
      stderr: "",
      exitCode: 0,
    };
  } catch (err: any) {
    return {
      ok: false,
      engine: "HEYUKA Isolated V8 VM",
      language: "javascript",
      stdout: logs.join("\n").slice(0, 2000),
      stderr: String(err?.message || err).slice(0, 2000),
      exitCode: 1,
    };
  }
}

/**
 * Shared Zero-Key Polyglot Code Execution Engine across HEYUKA Chat & Developer APIs.
 * Priority: Custom PISTON_URL (if configured) -> Judge0 CE Public API -> Godbolt Compiler Explorer -> Node VM (JS).
 */
export async function executePolyglotCodeSandbox(params: {
  language: SandboxLanguage;
  code: string;
  stdin?: string;
}): Promise<SandboxExecutionResult> {
  const lang = params.language;
  const spec = JUDGE0_LANGUAGES[lang];
  if (!spec) {
    return {
      ok: false,
      engine: "none",
      language: lang,
      stdout: "",
      stderr: `Unsupported language: ${lang}`,
      exitCode: 1,
      error: "Unsupported language",
    };
  }

  // 1. Optional Custom Self-Hosted Piston Engine
  const customPistonUrl = process.env.PISTON_URL?.trim();
  if (customPistonUrl) {
    try {
      const pRes = await fetch(`${customPistonUrl.replace(/\/$/, "")}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          version: "*",
          files: [{ content: params.code }],
          stdin: params.stdin || "",
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (pRes.ok) {
        const pj = (await pRes.json()) as any;
        return {
          ok: Number(pj?.run?.code ?? 0) === 0 && !pj?.run?.stderr,
          engine: "HEYUKA Self-Hosted Piston",
          language: lang,
          stdout: String(pj?.run?.stdout || "").slice(0, 4000),
          stderr: String(pj?.run?.stderr || pj?.compile?.stderr || "").slice(0, 2000),
          exitCode: pj?.run?.code ?? 0,
        };
      }
    } catch {
      // Fall through cleanly
    }
  }

  // 2. Public Zero-Key Judge0 CE Execution Cluster
  try {
    const res = await fetch(
      "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: params.code,
          language_id: spec.id,
          stdin: params.stdin || "",
          cpu_time_limit: 5,
          wall_time_limit: 8,
        }),
        signal: AbortSignal.timeout(9500),
      }
    );

    if (res.ok) {
      const json = (await res.json()) as any;
      const statusId = Number(json?.status?.id || 0);
      const stderrText = String(json?.stderr || json?.compile_output || json?.message || "");
      return {
        ok: statusId === 3 && !stderrText,
        engine: `Judge0 CE (${spec.name})`,
        language: lang,
        stdout: String(json?.stdout || "").slice(0, 4000),
        stderr: stderrText.slice(0, 2000),
        exitCode: statusId === 3 ? 0 : 1,
        timeSec: json?.time ? String(json.time) : undefined,
      };
    }
  } catch {
    // Fall through cleanly to Godbolt / V8 VM
  }

  // 3. Godbolt Compiler Explorer Zero-Key Executor Fallback
  if (spec.godbolt) {
    try {
      const gbRes = await fetch(`https://godbolt.org/api/compiler/${spec.godbolt}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          source: params.code,
          options: {
            compilerOptions: { executorRequest: true },
            executeParameters: { stdin: params.stdin || "" },
          },
        }),
        signal: AbortSignal.timeout(8500),
      });
      if (gbRes.ok) {
        const gb = (await gbRes.json()) as any;
        const out = Array.isArray(gb?.stdout)
          ? gb.stdout.map((l: any) => String(l?.text || "")).join("\n")
          : "";
        const err = Array.isArray(gb?.stderr)
          ? gb.stderr.map((l: any) => String(l?.text || "")).join("\n")
          : "";
        return {
          ok: Number(gb?.code ?? 1) === 0 && !err,
          engine: `Godbolt Sandbox (${spec.name})`,
          language: lang,
          stdout: out.slice(0, 4000),
          stderr: err.slice(0, 2000),
          exitCode: typeof gb?.code === "number" ? gb.code : null,
        };
      }
    } catch {
      // Fall through cleanly
    }
  }

  // 4. Instant Isolated V8 VM fallback for JavaScript
  if (lang === "javascript") {
    return runIsolatedJsVm(params.code);
  }

  return {
    ok: false,
    engine: "unavailable",
    language: lang,
    stdout: "",
    stderr: "Code execution sandbox gateways are temporarily busy.",
    exitCode: 1,
    error: "Sandbox execution unavailable",
  };
}
