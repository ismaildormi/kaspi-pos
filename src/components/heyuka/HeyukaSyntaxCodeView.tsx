"use client";

import React from "react";

export interface FileBadgeMeta {
  extLabel: string;
  color: string;
  bg: string;
  folderPath: string;
  fileName: string;
}

export function getFileBadgeMeta(filePath?: string, langRaw?: string): FileBadgeMeta {
  const cleanPath = (filePath || "").trim().replace(/^\/+/, "");
  const parts = cleanPath.split("/").filter(Boolean);
  const fileName = parts.length > 0 ? parts[parts.length - 1] : cleanPath || langRaw || "snippet.txt";
  const folderPath = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  const lowerName = fileName.toLowerCase();
  const ext = ((lowerName.includes(".") ? lowerName.split(".").pop() : langRaw) || "").toLowerCase();

  if (lowerName === "dockerfile" || ext === "dockerfile") {
    return { extLabel: "DOCKER", color: "#22D3EE", bg: "rgba(34,211,238,0.15)", folderPath, fileName };
  }
  if (lowerName.includes("tree") || ext === "tree") {
    return { extLabel: "TREE", color: "#FB7185", bg: "rgba(251,113,133,0.15)", folderPath, fileName };
  }
  if (ext === "py" || ext === "python") {
    return { extLabel: "PY", color: "#FACC15", bg: "rgba(250,204,21,0.15)", folderPath, fileName };
  }
  if (ext === "tsx") {
    return { extLabel: "TSX", color: "#38BDF8", bg: "rgba(56,189,248,0.15)", folderPath, fileName };
  }
  if (ext === "ts" || ext === "typescript") {
    return { extLabel: "TS", color: "#38BDF8", bg: "rgba(56,189,248,0.15)", folderPath, fileName };
  }
  if (ext === "jsx" || ext === "js" || ext === "javascript") {
    return { extLabel: "JS", color: "#FDE047", bg: "rgba(253,224,71,0.15)", folderPath, fileName };
  }
  if (ext === "html" || ext === "htm") {
    return { extLabel: "HTML", color: "#FB923C", bg: "rgba(251,146,60,0.15)", folderPath, fileName };
  }
  if (ext === "css" || ext === "scss") {
    return { extLabel: "CSS", color: "#C084FC", bg: "rgba(192,132,252,0.15)", folderPath, fileName };
  }
  if (ext === "yml" || ext === "yaml") {
    return { extLabel: "YAML", color: "#34D399", bg: "rgba(52,211,153,0.15)", folderPath, fileName };
  }
  if (ext === "json") {
    return { extLabel: "JSON", color: "#FBBF24", bg: "rgba(251,191,36,0.15)", folderPath, fileName };
  }
  if (ext === "sql" || ext === "prisma") {
    return { extLabel: "SQL", color: "#F472B6", bg: "rgba(244,114,182,0.15)", folderPath, fileName };
  }
  if (ext === "svg") {
    return { extLabel: "SVG", color: "#FB7185", bg: "rgba(251,113,133,0.15)", folderPath, fileName };
  }
  if (ext === "sh" || ext === "bash" || ext === "ps1" || ext === "powershell") {
    return { extLabel: "SH", color: "#4ADE80", bg: "rgba(74,222,128,0.15)", folderPath, fileName };
  }
  if (ext === "md" || ext === "markdown") {
    return { extLabel: "MD", color: "#A78BFA", bg: "rgba(167,139,250,0.15)", folderPath, fileName };
  }
  return {
    extLabel: (ext || "TXT").slice(0, 6).toUpperCase(),
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.15)",
    folderPath,
    fileName,
  };
}

const KEYWORD_SET = new Set([
  "import", "from", "export", "default", "class", "def", "async", "await", "return",
  "try", "except", "finally", "raise", "if", "elif", "else", "for", "while", "in",
  "with", "as", "pass", "break", "continue", "lambda", "yield", "global", "nonlocal",
  "const", "let", "var", "function", "interface", "type", "enum", "implements",
  "extends", "new", "typeof", "instanceof", "void", "delete", "switch", "case",
  "throw", "catch", "static", "public", "private", "protected", "readonly",
  "FROM", "RUN", "WORKDIR", "COPY", "ADD", "EXPOSE", "ENV", "ARG", "CMD", "ENTRYPOINT", "AS",
  "SELECT", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "PRIMARY", "KEY",
]);

const LITERAL_SET = new Set([
  "True", "False", "None", "true", "false", "null", "undefined", "NaN", "Infinity", "self", "this",
]);

function highlightLineTokens(line: string, index: number): React.ReactNode {
  if (!line) return "\u00A0";

  // Directory tree lines (├─, │, └─)
  if (/[├└│]─/.test(line)) {
    const commentIdx = line.indexOf("#");
    const mainPart = commentIdx !== -1 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx !== -1 ? line.slice(commentIdx) : "";
    const isFolder = /\/\s*$/.test(mainPart.trim());
    return (
      <>
        <span style={{ color: isFolder ? "#38BDF8" : "#E4E4E7", fontWeight: isFolder ? 700 : 400 }}>
          {mainPart}
        </span>
        {commentPart && <span style={{ color: "#6A9955", fontStyle: "italic" }}>{commentPart}</span>}
      </>
    );
  }

  const trimmed = line.trim();
  // Full-line comments
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("<!--")
  ) {
    return <span style={{ color: "#6A9955", fontStyle: "italic" }}>{line}</span>;
  }

  // YAML / Docker Compose key: value lines
  const yamlMatch = line.match(/^(\s*-?\s*)([A-Za-z0-9_.-]+)(:)(\s+.*)?$/);
  if (yamlMatch && !trimmed.startsWith("http") && !line.includes(";") && !line.includes("{")) {
    return (
      <>
        <span>{yamlMatch[1]}</span>
        <span style={{ color: "#4FC1FF", fontWeight: 600 }}>{yamlMatch[2]}</span>
        <span style={{ color: "#D4D4D8" }}>{yamlMatch[3]}</span>
        {yamlMatch[4] && <span style={{ color: "#CE9178" }}>{yamlMatch[4]}</span>}
      </>
    );
  }

  // Tokenize code line into strings, inline comments, decorators, tags, numbers, identifiers
  const tokenRegex =
    /(#.*$|\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|@[A-Za-z0-9_.]+|<\/?[A-Za-z0-9_.-]+|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let tokCounter = 0;

  while ((m = tokenRegex.exec(line)) !== null) {
    if (m.index > lastIdx) {
      parts.push(line.slice(lastIdx, m.index));
    }
    const tok = m[0];
    const nextChar = line[m.index + tok.length] || "";
    const key = `${index}-${tokCounter++}`;

    if (tok.startsWith("#") || tok.startsWith("//")) {
      parts.push(
        <span key={key} style={{ color: "#6A9955", fontStyle: "italic" }}>
          {tok}
        </span>
      );
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith("`")) {
      parts.push(
        <span key={key} style={{ color: "#CE9178" }}>
          {tok}
        </span>
      );
    } else if (tok.startsWith("@")) {
      parts.push(
        <span key={key} style={{ color: "#DCDCAA", fontWeight: 600 }}>
          {tok}
        </span>
      );
    } else if (tok.startsWith("<")) {
      parts.push(
        <span key={key} style={{ color: "#569CD6", fontWeight: 600 }}>
          {tok}
        </span>
      );
    } else if (/^\d/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: "#B5CEA8" }}>
          {tok}
        </span>
      );
    } else if (KEYWORD_SET.has(tok)) {
      parts.push(
        <span key={key} style={{ color: "#C586C0", fontWeight: 600 }}>
          {tok}
        </span>
      );
    } else if (LITERAL_SET.has(tok)) {
      parts.push(
        <span key={key} style={{ color: "#569CD6", fontWeight: 600 }}>
          {tok}
        </span>
      );
    } else if (/^[A-Z][A-Za-z0-9_]*$/.test(tok)) {
      parts.push(
        <span key={key} style={{ color: "#4EC9B0" }}>
          {tok}
        </span>
      );
    } else if (nextChar === "(") {
      parts.push(
        <span key={key} style={{ color: "#DCDCAA" }}>
          {tok}
        </span>
      );
    } else {
      parts.push(
        <span key={key} style={{ color: "#9CDCFE" }}>
          {tok}
        </span>
      );
    }

    lastIdx = m.index + tok.length;
  }

  if (lastIdx < line.length) {
    parts.push(line.slice(lastIdx));
  }

  return <>{parts}</>;
}

export function HeyukaSyntaxCodeView({
  code,
  maxHeightClass = "max-h-[460px]",
}: {
  code: string;
  language?: string;
  filePath?: string;
  maxHeightClass?: string;
}) {
  const lines = String(code || "").split(/\r?\n/);

  return (
    <div
      dir="ltr"
      style={{ backgroundColor: "#111319" }}
      className={`w-full overflow-auto font-mono text-[12.5px] leading-[1.65] select-text ${maxHeightClass}`}
    >
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx} className="hover:bg-white/[0.03]">
              <td
                style={{ color: "#52525B", width: "42px", userSelect: "none" }}
                className="px-2.5 py-0 text-right align-top text-[11px] border-r border-white/[0.06] select-none"
              >
                {idx + 1}
              </td>
              <td
                style={{ color: "#E4E4E7" }}
                className="px-3.5 py-0 whitespace-pre font-mono"
              >
                {highlightLineTokens(line, idx)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
