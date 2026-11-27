/**
 * HEYUKA v113.0 — PRIVATE SOURCE INTELLIGENCE & CONFIDENTIALITY GUARD
 * =====================================================================
 * Enforces strict separation between:
 * 1. Private internal source intelligence & engineering diagnostics
 * 2. Ordinary user-facing conversations & public generated artifacts
 * 3. Legally required open-source license/attribution notices
 */

const SECRET_OR_PRIVATE_PATTERNS: Array<{ name: string; regex: RegExp; replacement: string }> = [
  { name: "vault_uri", regex: /vault:\/\/heyuka\/[a-zA-Z0-9_./-]+/gi, replacement: "[internal-resource]" },
  { name: "bearer_token", regex: /\b(?:Bearer\s+)?(?:sk_live_|sk-or-v1-|ghp_|hf_|gsk_|AIza)[A-Za-z0-9_-]{12,}\b/g, replacement: "[REDACTED_KEY]" },
  { name: "internal_count_leak", regex: /\b(?:2,?795|2,?810|2,?280)\s+(?:sources?|entries|vault|مصادر|مصدر)\b/gi, replacement: "verified knowledge capabilities" },
  { name: "unix_repo_path", regex: /\/mnt\/[a-z]\/[^\s)"'`]+|\/home\/[a-z0-9_-]+\/[^\s)"'`]+/gi, replacement: "[workspace-path]" },
];

export function sanitizePublicOutputForConfidentiality(
  text: string,
  options: { isOwnerSuperAdmin?: boolean } = {}
): { sanitized: string; redactionsApplied: string[] } {
  if (!text) return { sanitized: "", redactionsApplied: [] };
  if (options.isOwnerSuperAdmin) {
    // Even for owner, never leak raw API keys/tokens in chat output
    let ownerSafe = text;
    const redactions: string[] = [];
    const tokenRule = SECRET_OR_PRIVATE_PATTERNS[1];
    tokenRule.regex.lastIndex = 0;
    if (tokenRule.regex.test(ownerSafe)) {
      ownerSafe = ownerSafe.replace(tokenRule.regex, tokenRule.replacement);
      redactions.push(tokenRule.name);
    }
    return { sanitized: ownerSafe, redactionsApplied: redactions };
  }

  let out = text;
  const redactionsApplied: string[] = [];
  for (const rule of SECRET_OR_PRIVATE_PATTERNS) {
    rule.regex.lastIndex = 0;
    if (rule.regex.test(out)) {
      out = out.replace(rule.regex, rule.replacement);
      redactionsApplied.push(rule.name);
    }
  }
  return { sanitized: out, redactionsApplied };
}

export function buildPublicHighLevelCapabilityReply(locale: "ar" | "fr" | "en"): string {
  if (locale === "ar") {
    return [
      "## قدرات HEYUKA المتاحة للمستخدمين",
      "",
      "يمكنني مساعدتك مباشرة في:",
      "- **البرمجة والهندسة:** كتابة الكود، المراجعة الأمنية، التحقق الرياضي والمالي، وتصدير المشاريع.",
      "- **المستندات والملفات:** إنشاء تقارير منظمة بصيغ PDF وWord وExcel وملفات مضغوطة.",
      "- **البحث والتحليل:** البحث الموثق، تحليل البيانات، والتلخيص متعدد اللغات (العربية، الدارجة، الفرنسية، الإنجليزية).",
      "- **التجارة وإدارة المحلات (KASPI POS):** دعم المبيعات، الفوترة، الضرائب المغربية، والمخزون.",
      "",
      "> ملاحظة: تفاصيل البنية الداخلية للمصادر وقوائم التشغيل الخاصة تبقى محمية ولا تُعرض في المحادثات العامة.",
    ].join("\n");
  }
  if (locale === "fr") {
    return [
      "## Capacités HEYUKA",
      "",
      "Je peux vous assister directement sur :",
      "- **Ingénierie & Code :** développement, audit de sécurité, calculs financiers et export de projets.",
      "- **Documents & Rapports :** génération structurée PDF, Word, Excel et archives ZIP.",
      "- **Recherche & Analyse :** synthèse multilingue (Arabe, Darija, Français, Anglais) et analyse de données.",
      "- **Commerce (KASPI POS) :** ventes, facturation, TVA et gestion des stocks.",
      "",
      "> Note : Les registres internes et l'architecture privée des sources restent confidentiels.",
    ].join("\n");
  }
  return [
    "## HEYUKA Capabilities",
    "",
    "I can assist you directly with:",
    "- **Software Engineering:** code generation, security review, exact financial/math verification, and project packaging.",
    "- **Documents & Exports:** structured PDF, Word, Excel, and ZIP deliverables.",
    "- **Research & Analysis:** multilingual synthesis (Arabic, Darija, French, English) and data analysis.",
    "- **Commerce (KASPI POS):** sales, invoicing, tax compliance, and inventory workflows.",
    "",
    "> Note: Internal source registries, private datasets, and system configurations remain confidential.",
  ].join("\n");
}
