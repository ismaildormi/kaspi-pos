"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Send,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  Coins,
  Cpu,
  Zap,
} from "lucide-react";

interface PromptOption {
  id: string;
  question: string;
  answer: string;
  highlight: string;
}

const PROMPT_OPTIONS: PromptOption[] = [
  {
    id: "general",
    question: "Comment se porte mon commerce depuis que j'utilise KASPI ?",
    answer:
      "Depuis le 1er janvier, vous avez réalisé 125 000 MAD de chiffre d'affaires. Votre panier moyen s'établit à 45 MAD avec une marge brute moyenne de 24%. Vos vendredis sont vos journées records (+38% vs moyenne de la semaine). Je vous conseille de réapprovisionner l'Huile Lesieur : vous en avez vendu 120 unités ce mois-ci et il ne vous reste que 8 unités en réserve.",
    highlight: "125 000 MAD • Panier moyen 45 DH • Vendredi pic",
  },
  {
    id: "inventory",
    question: "Quels produits dois-je recommander à mes fournisseurs cette semaine ?",
    answer:
      "D'après vos cadences de scan des 14 derniers jours : 1) Eau Sidi Ali 1.5L (rupture prévue dans 48h), 2) Pack Lait Centrale (stock à 15%), 3) Biscuits Bimo Tagger (forte demande le matin). Vos autres références sont couvertes pour 22 jours.",
    highlight: "3 alertes de réassort prioritaire calculées",
  },
  {
    id: "credits",
    question: "Quel est le montant total des crédits clients (Krediat) impayés ?",
    answer:
      "Le total des crédits ouverts s'élève à 12 450 MAD répartis sur 34 clients. Les 3 plus gros soldes réguliers sont : Si Mohammed (1 420 MAD), Bouchra (950 MAD), et Youssef (780 MAD). Tous effectuent des versements partiels réguliers chaque fin de mois.",
    highlight: "12 450 MAD dans le carnet Krediat surveillé",
  },
];

export function AiAnalyticsSimulator() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptOption>(PROMPT_OPTIONS[0]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [displayedAnswer, setDisplayedAnswer] = useState<string>(PROMPT_OPTIONS[0].answer);

  const handleSelectPrompt = (option: PromptOption) => {
    setSelectedPrompt(option);
    setIsTyping(true);
    setDisplayedAnswer("");

    setTimeout(() => {
      setIsTyping(false);
      setDisplayedAnswer(option.answer);
    }, 600);
  };

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background AI Purple & Emerald Glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-stretch justify-between">
        {/* Left Column: Context & Conversion */}
        <div className="flex-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Intelligence Décisionnelle Sur Mesure
            </div>

            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Posez n&apos;importe quelle question à KASPI AI sur votre commerce.
            </h3>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Plus besoin d&apos;analyser des tableaux Excel incompréhensibles.
              Interrogez directement votre assistant d&apos;affaires en langage naturel sur vos bénéfices réels, vos alertes de stock et vos carnets de crédit.
            </p>

            {/* Clickable Quick Prompts */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
                Exemples de questions directes :
              </span>
              <div className="flex flex-col gap-2">
                {PROMPT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectPrompt(opt)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      selectedPrompt.id === opt.id
                        ? "bg-purple-950/40 border-purple-500/50 text-white shadow-sm"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <span className="font-medium pr-2">« {opt.question} »</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>Moteurs Gemini &amp; Groq LPU • Données 100% isolées par boutique (RLS strict)</span>
          </div>
        </div>

        {/* Right Column: AI Chat Simulator UI */}
        <div className="w-full lg:w-[480px] rounded-2xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between shadow-2xl">
          <div>
            {/* Widget Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">KASPI Business Intelligence</h4>
                  <p className="text-[10px] text-emerald-400 font-mono">Connecté à votre base de ventes locale</p>
                </div>
              </div>
              <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] font-mono text-zinc-400">
                Latence &lt;200ms
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-4 min-h-[260px]">
              {/* User message */}
              <div className="flex items-start gap-2.5 justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-zinc-800/80 px-4 py-2.5 text-xs text-white border border-zinc-700/60 shadow-sm">
                  <p>{selectedPrompt.question}</p>
                </div>
                <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* AI message */}
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-xs bg-purple-950/20 border border-purple-500/30 p-4 text-xs text-zinc-200 shadow-sm space-y-2.5">
                  {isTyping ? (
                    <div className="flex items-center gap-2 py-2 text-zinc-400 font-mono text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                      Analyse instantanée de 14 200 lignes de vente...
                    </div>
                  ) : (
                    <>
                      <p className="leading-relaxed text-zinc-200">{displayedAnswer}</p>
                      <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] font-mono text-purple-300">
                        <span>Synthèse : {selectedPrompt.highlight}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fake Input Area */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={selectedPrompt.question}
              className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-400 focus:outline-none cursor-default font-sans"
            />
            <button
              onClick={() => handleSelectPrompt(selectedPrompt)}
              className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-black hover:bg-zinc-200 transition shrink-0"
              title="Poser la question"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
