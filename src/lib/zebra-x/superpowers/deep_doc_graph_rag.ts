/**
 * Superpower #3 (`v95.0`): Layout-Aware Document Extractor & LightRAG Knowledge Graph Builder.
 */

export interface ExtractedDocTable {
  headers: string[];
  rows: string[][];
}

export function parseLayoutAwareDocAndGraph(rawTextOrMarkdown: string) {
  const input = String(rawTextOrMarkdown || "");
  const lines = input.split(/\r?\n/);

  const headings: string[] = [];
  const tables: ExtractedDocTable[] = [];
  const equations: string[] = [];

  let currentTableRows: string[][] = [];
  const flushTable = () => {
    if (currentTableRows.length >= 2) {
      tables.push({ headers: currentTableRows[0], rows: currentTableRows.slice(1) });
    }
    currentTableRows = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^#{1,4}\s+/.test(line)) {
      flushTable();
      headings.push(line.replace(/^#{1,4}\s+/, "").trim());
    } else if (/^\|.*\|$/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue; // markdown separator row
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      currentTableRows.push(cells);
    } else {
      flushTable();
    }

    const eqMatches = line.match(/\$\$([^$]+)\*\*|\$\$([^$]+)\$\$|\\\[([^\]]+)\\\]/g);
    if (eqMatches) equations.push(...eqMatches.slice(0, 5));
  }
  flushTable();

  // LightRAG-style co-occurrence entity graph over capitalized/domain terms per paragraph
  const edgeWeights = new Map<string, number>();
  const nodeFreq = new Map<string, number>();
  const paragraphs = input.split(/\n{2,}/).slice(0, 40);

  for (const para of paragraphs) {
    const tokens = Array.from(
      new Set(
        (para.match(/\b[A-Z][A-Za-z0-9_-]{2,}\b|[\u0600-\u06FF]{4,}/g) || []).slice(0, 8)
      )
    );
    for (let i = 0; i < tokens.length; i++) {
      nodeFreq.set(tokens[i], (nodeFreq.get(tokens[i]) || 0) + 1);
      for (let j = i + 1; j < tokens.length; j++) {
        const pair = tokens[i] < tokens[j] ? `${tokens[i]}->${tokens[j]}` : `${tokens[j]}->${tokens[i]}`;
        edgeWeights.set(pair, (edgeWeights.get(pair) || 0) + 1);
      }
    }
  }

  const graphNodes = Array.from(nodeFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([entity, mentions]) => ({ entity, mentions }));

  const graphEdges = Array.from(edgeWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([pair, weight]) => {
      const [source, target] = pair.split("->");
      return { source, target, weight };
    });

  return {
    ok: true,
    superpower: "deep_doc_graph_rag_v95",
    headingsCount: headings.length,
    headings: headings.slice(0, 25),
    tablesCount: tables.length,
    tables: tables.slice(0, 8),
    equationsCount: equations.length,
    graphNodes,
    graphEdges,
  };
}
