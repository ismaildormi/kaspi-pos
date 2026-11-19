"use client";

import React, { useEffect, useRef } from "react";
import type {
  HeyukaAccessoryType,
  HeyukaCharacterProfile,
  HeyukaLightingPreset,
} from "@/lib/heyuka/heyuka-universe";

interface HEYUKACreatureCanvasProps {
  character: HeyukaCharacterProfile;
  lighting: HeyukaLightingPreset;
  soundEnabled?: boolean;
  onBoop?: () => void;
}

interface FurStrand {
  baseAngle: number;
  ringRatio: number;
  length: number;
  phase: number;
  speed: number;
}

interface VfxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

function playCuteBoopTone(vfx: HeyukaCharacterProfile["vfxType"]) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = vfx === "rock" ? "triangle" : "sine";
    const baseFreq = vfx === "ice" ? 640 : vfx === "fire" ? 520 : 480;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.48, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 0.22);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 350);
  } catch {}
}

function hasAnyAccessory(list: HeyukaAccessoryType[], targets: HeyukaAccessoryType[]): boolean {
  return targets.some((t) => list.includes(t));
}

/**
 * Interactive 60 FPS Multi-Shell Volumetric Fur & Marschner Rim-Glow Viewport
 * Isolated strictly inside `/[locale]/heyuka` (zero Three.js bundle bloat on KASPI POS routes).
 */
export const HEYUKACreatureCanvas: React.FC<HEYUKACreatureCanvasProps> = ({
  character,
  lighting,
  soundEnabled = false,
  onBoop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ nx: 0, ny: 0, active: false });
  const boopWaveRef = useRef(0);
  const charRef = useRef(character);
  const lightRef = useRef(lighting);

  useEffect(() => {
    charRef.current = character;
  }, [character]);

  useEffect(() => {
    lightRef.current = lighting;
  }, [lighting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pre-generate 240 volumetric instanced fur strands distributed by area
    const strands: FurStrand[] = [];
    for (let i = 0; i < 240; i++) {
      strands.push({
        baseAngle: (i / 240) * Math.PI * 2 + (i % 7) * 0.03,
        ringRatio: 0.72 + ((i * 37) % 100) / 360,
        length: 14 + ((i * 19) % 18),
        phase: i * 0.41,
        speed: 1.4 + ((i * 13) % 10) * 0.12,
      });
    }

    const particles: VfxParticle[] = [];
    let rafId = 0;
    let time = 0;
    let smoothNx = 0;
    let smoothNy = 0;
    let blinkTimer = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(280, Math.floor(rect.width * dpr));
      canvas.height = Math.max(260, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const drawAccessoriesBehind = (
      cx: number,
      cy: number,
      r: number,
      acc: HeyukaAccessoryType[],
      furColor: string
    ) => {
      if (hasAnyAccessory(acc, ["royal_cape", "wizard_cloak", "celestial_cloak", "hero_cape", "pirate_coat", "chef_coat", "biker_jacket", "street_hoodie", "console_hoodie", "pink_hoodie", "cyber_hoodie"])) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.72, cy + r * 0.25);
        ctx.quadraticCurveTo(cx - r * 1.15, cy + r * 1.05, cx - r * 0.75, cy + r * 1.28);
        ctx.lineTo(cx + r * 0.75, cy + r * 1.28);
        ctx.quadraticCurveTo(cx + r * 1.15, cy + r * 1.05, cx + r * 0.72, cy + r * 0.25);
        ctx.closePath();
        ctx.fillStyle = acc.includes("royal_cape")
          ? "rgba(185, 28, 28, 0.78)"
          : acc.includes("wizard_cloak") || acc.includes("celestial_cloak")
          ? "rgba(67, 56, 202, 0.8)"
          : acc.includes("cyber_hoodie")
          ? "rgba(15, 23, 42, 0.85)"
          : "rgba(30, 41, 59, 0.75)";
        ctx.fill();
        ctx.restore();
      }

      // Cozy neko ears when cat hoodie is active
      if (acc.includes("cat_hoodie")) {
        ctx.save();
        ctx.fillStyle = furColor;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx + side * r * 0.28, cy - r * 0.72);
          ctx.lineTo(cx + side * r * 0.68, cy - r * 1.22);
          ctx.lineTo(cx + side * r * 0.78, cy - r * 0.45);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const drawAccessoriesFront = (
      cx: number,
      cy: number,
      r: number,
      acc: HeyukaAccessoryType[],
      rimColor: string
    ) => {
      // Crowns / Hats
      if (hasAnyAccessory(acc, ["royal_crown", "mini_crown", "flame_crown", "ice_crystal_crown"])) {
        ctx.save();
        const scale = acc.includes("mini_crown") ? 0.65 : 1;
        const cw = r * 0.62 * scale;
        const topY = cy - r * 0.94;
        ctx.beginPath();
        ctx.moveTo(cx - cw, topY);
        ctx.lineTo(cx - cw * 1.08, topY - r * 0.34 * scale);
        ctx.lineTo(cx - cw * 0.45, topY - r * 0.14 * scale);
        ctx.lineTo(cx, topY - r * 0.46 * scale);
        ctx.lineTo(cx + cw * 0.45, topY - r * 0.14 * scale);
        ctx.lineTo(cx + cw * 1.08, topY - r * 0.34 * scale);
        ctx.lineTo(cx + cw, topY);
        ctx.closePath();
        ctx.fillStyle = acc.includes("ice_crystal_crown")
          ? "#7dd3fc"
          : acc.includes("flame_crown")
          ? "#fb923c"
          : "#facc15";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.restore();
      }

      if (hasAnyAccessory(acc, ["wizard_hat", "celestial_wizard_hat"])) {
        ctx.save();
        ctx.fillStyle = acc.includes("celestial_wizard_hat") ? "#312e81" : "#4c1d95";
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.85, r * 0.95, r * 0.18, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.56, cy - r * 0.85);
        ctx.quadraticCurveTo(cx - r * 0.1, cy - r * 1.75, cx + r * 0.25, cy - r * 1.65);
        ctx.lineTo(cx + r * 0.54, cy - r * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (acc.includes("grad_cap")) {
        ctx.save();
        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 1.25);
        ctx.lineTo(cx + r * 0.95, cy - r * 0.98);
        ctx.lineTo(cx, cy - r * 0.72);
        ctx.lineTo(cx - r * 0.95, cy - r * 0.98);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.7, cy - r * 0.92);
        ctx.lineTo(cx + r * 0.82, cy - r * 0.56);
        ctx.stroke();
        ctx.restore();
      }

      if (acc.includes("chef_toque")) {
        ctx.save();
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.roundRect(cx - r * 0.45, cy - r * 1.18, r * 0.9, r * 0.38, 12);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - r * 0.22, cy - r * 1.24, r * 0.28, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.22, cy - r * 1.24, r * 0.28, 0, Math.PI * 2);
        ctx.arc(cx, cy - r * 1.32, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (acc.includes("devil_horns")) {
        ctx.save();
        ctx.fillStyle = "#dc2626";
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx + side * r * 0.28, cy - r * 0.82);
          ctx.quadraticCurveTo(cx + side * r * 0.56, cy - r * 1.35, cx + side * r * 0.22, cy - r * 1.32);
          ctx.quadraticCurveTo(cx + side * r * 0.4, cy - r * 1.0, cx + side * r * 0.46, cy - r * 0.74);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (hasAnyAccessory(acc, ["winter_beanie", "hipster_beanie", "console_cap", "rebel_cap", "backwards_cap", "crown_snapback"])) {
        ctx.save();
        ctx.fillStyle = acc.includes("rebel_cap")
          ? "#dc2626"
          : acc.includes("hipster_beanie")
          ? "#65a30d"
          : acc.includes("winter_beanie")
          ? "#0ea5e9"
          : "#1e293b";
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.55, r * 0.72, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (acc.includes("pink_bow")) {
        ctx.save();
        ctx.fillStyle = "#f472b6";
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.35, cy - r * 0.86, r * 0.22, r * 0.14, -0.4, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.65, cy - r * 0.72, r * 0.22, r * 0.14, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (acc.includes("flower_crown")) {
        ctx.save();
        const colors = ["#f472b6", "#facc15", "#a78bfa", "#34d399", "#fb7185"];
        for (let i = -2; i <= 2; i++) {
          ctx.fillStyle = colors[(i + 2) % colors.length];
          ctx.beginPath();
          ctx.arc(cx + i * r * 0.24, cy - r * 0.88 + Math.abs(i) * 4, r * 0.11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Eyewear & Masks
      if (hasAnyAccessory(acc, ["round_glasses", "sunglasses", "safari_goggles", "hero_mask"])) {
        ctx.save();
        const ey = cy - r * 0.08 + smoothNy * r * 0.12;
        const exOff = r * 0.27;
        if (acc.includes("hero_mask")) {
          ctx.fillStyle = "rgba(29, 78, 216, 0.85)";
          ctx.beginPath();
          ctx.roundRect(cx - exOff * 1.65, ey - r * 0.17, exOff * 3.3, r * 0.34, 16);
          ctx.fill();
        } else if (acc.includes("sunglasses")) {
          ctx.fillStyle = "#09090b";
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cx - exOff * 1.45, ey - r * 0.14, r * 0.36, r * 0.24, 6);
          ctx.roundRect(cx + exOff * 0.12, ey - r * 0.14, r * 0.36, r * 0.24, 6);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.strokeStyle = acc.includes("safari_goggles") ? "#d97706" : "#e2e8f0";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(cx - exOff, ey, r * 0.18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + exOff, ey, r * 0.18, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Headsets
      if (hasAnyAccessory(acc, ["rgb_headset", "pink_headset", "studio_headset"])) {
        ctx.save();
        ctx.strokeStyle = acc.includes("pink_headset")
          ? "#ec4899"
          : acc.includes("rgb_headset")
          ? "#38bdf8"
          : "#e2e8f0";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.1, r * 1.04, Math.PI * 1.06, Math.PI * 1.94);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.roundRect(cx - r * 1.12, cy - r * 0.25, r * 0.22, r * 0.44, 10);
        ctx.roundRect(cx + r * 0.9, cy - r * 0.25, r * 0.22, r * 0.44, 10);
        ctx.fill();
        ctx.restore();
      }

      // Astronaut Visor Halo
      if (acc.includes("astro_helmet")) {
        ctx.save();
        ctx.strokeStyle = rimColor;
        ctx.lineWidth = 3;
        ctx.fillStyle = "rgba(186, 230, 253, 0.12)";
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    };

    const renderFrame = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 400;
      const h = rect.height || 360;
      const ch = charRef.current;
      const lt = lightRef.current;

      time += 0.016;
      blinkTimer += 0.016;
      smoothNx += (pointerRef.current.nx - smoothNx) * 0.12;
      smoothNy += (pointerRef.current.ny - smoothNy) * 0.12;
      boopWaveRef.current *= 0.91;

      // Background atmospheric cyclorama gradient
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bgGrad.addColorStop(0, lt.bgGradient[1]);
      bgGrad.addColorStop(1, lt.bgGradient[0]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Ambient Marschner aura halo
      const cx = w * 0.5 + smoothNx * 10;
      const breathY = Math.sin(time * 2.1) * 6;
      const cy = h * 0.52 + breathY + smoothNy * 8 - boopWaveRef.current * 14;
      const baseRadius = Math.min(w, h) * 0.255 * (1 + boopWaveRef.current * 0.08);

      const halo = ctx.createRadialGradient(cx, cy, baseRadius * 0.4, cx, cy, baseRadius * 1.9);
      halo.addColorStop(0, lt.glowColor);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      drawAccessoriesBehind(cx, cy, baseRadius, ch.accessories, ch.furColor);

      // Multi-shell fur sphere body
      const shellCount = 12;
      for (let s = 0; s < shellCount; s++) {
        const ratio = s / (shellCount - 1);
        const rad = baseRadius * (0.86 + ratio * 0.18);
        const bodyGrad = ctx.createRadialGradient(
          cx - rad * 0.28 + smoothNx * 12,
          cy - rad * 0.34 + smoothNy * 12,
          rad * 0.15,
          cx,
          cy,
          rad
        );
        bodyGrad.addColorStop(0, ch.tipColor);
        bodyGrad.addColorStop(0.55, ch.furColor);
        bodyGrad.addColorStop(1, s === shellCount - 1 ? lt.rimColor : ch.furColor);
        ctx.save();
        ctx.globalAlpha = 0.2 + ratio * 0.68;
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 240 Interactive GPU-style parting strands reacting to pointer curl & boop wave
      ctx.save();
      ctx.lineCap = "round";
      for (const st of strands) {
        const sx = cx + Math.cos(st.baseAngle) * baseRadius * st.ringRatio;
        const sy = cy + Math.sin(st.baseAngle) * baseRadius * st.ringRatio;

        const ptrDx = pointerRef.current.nx * (w * 0.42) + w * 0.5 - sx;
        const ptrDy = pointerRef.current.ny * (h * 0.42) + h * 0.5 - sy;
        const dist = Math.hypot(ptrDx, ptrDy) || 1;
        const repel = pointerRef.current.active && dist < 130 ? ((130 - dist) / 130) * 18 : 0;

        const curl = Math.sin(time * st.speed + st.phase) * 5;
        const boopBoost = boopWaveRef.current * 18;
        const outAngle =
          st.baseAngle +
          curl * 0.03 +
          (repel > 0 ? Math.sin(st.baseAngle) * 0.25 : 0);

        const len = st.length + boopBoost;
        const ex = sx + Math.cos(outAngle) * len - (ptrDx / dist) * repel * 0.4;
        const ey = sy + Math.sin(outAngle) * len - (ptrDy / dist) * repel * 0.4;

        ctx.strokeStyle = st.ringRatio > 0.88 ? ch.tipColor : ch.furColor;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      ctx.restore();

      // Cute Mochi-Puff Expressive Eyes with Pointer Tracking & Natural Blink
      const isBlinking = blinkTimer % 4.2 > 4.02;
      const eyeY = cy - baseRadius * 0.08 + smoothNy * baseRadius * 0.12;
      const eyeSep = baseRadius * 0.27;
      for (const side of [-1, 1]) {
        const ex = cx + side * eyeSep + smoothNx * baseRadius * 0.14;
        ctx.save();
        if (isBlinking) {
          ctx.strokeStyle = ch.eyeColor;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.arc(ex, eyeY, baseRadius * 0.11, 0.15, Math.PI - 0.15);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#090d16";
          ctx.beginPath();
          ctx.ellipse(ex, eyeY, baseRadius * 0.115, baseRadius * 0.145, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = ch.eyeColor;
          ctx.beginPath();
          ctx.arc(ex + smoothNx * 2.5, eyeY + smoothNy * 2.5, baseRadius * 0.085, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ex - baseRadius * 0.03, eyeY - baseRadius * 0.045, baseRadius * 0.036, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Rosy blush & tiny smile
      ctx.save();
      ctx.fillStyle = "rgba(244, 114, 182, 0.28)";
      ctx.beginPath();
      ctx.ellipse(cx - eyeSep * 1.4, eyeY + baseRadius * 0.18, baseRadius * 0.11, baseRadius * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + eyeSep * 1.4, eyeY + baseRadius * 0.18, baseRadius * 0.11, baseRadius * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = ch.eyeColor;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, eyeY + baseRadius * 0.2, baseRadius * 0.075, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.restore();

      drawAccessoriesFront(cx, cy, baseRadius, ch.accessories, lt.rimColor);

      // Elemental VFX particles (Fire, Ice, Rock, Sparkles)
      if (ch.vfxType !== "none" && particles.length < 36) {
        const ang = Math.random() * Math.PI * 2;
        const dist = baseRadius * (0.95 + Math.random() * 0.45);
        particles.push({
          x: cx + Math.cos(ang) * dist,
          y: cy + Math.sin(ang) * dist,
          vx: (Math.random() - 0.5) * 0.7,
          vy: ch.vfxType === "fire" ? -1.4 - Math.random() : (Math.random() - 0.5) * 0.9,
          size: 2 + Math.random() * 3.5,
          alpha: 0.9,
          life: 0,
          maxLife: 45 + Math.random() * 45,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const a = (1 - p.life / p.maxLife) * p.alpha;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle =
          ch.vfxType === "fire"
            ? "#fb923c"
            : ch.vfxType === "ice"
            ? "#7dd3fc"
            : ch.vfxType === "rock"
            ? "#a3e635"
            : lt.rimColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Boop shockwave ripple ring
      if (boopWaveRef.current > 0.04) {
        ctx.save();
        ctx.strokeStyle = lt.rimColor;
        ctx.globalAlpha = boopWaveRef.current * 0.7;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * (1.25 + (1 - boopWaveRef.current) * 0.65), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const updatePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = {
      nx: Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1)),
      ny: Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1)),
      active: true,
    };
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={(e) => updatePointer(e.clientX, e.clientY)}
      onMouseLeave={() => {
        pointerRef.current.active = false;
      }}
      onTouchStart={(e) => {
        if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onClick={() => {
        boopWaveRef.current = 1.0;
        if (soundEnabled) playCuteBoopTone(charRef.current.vfxType);
        onBoop?.();
      }}
      className="w-full h-full block touch-pan-y cursor-pointer select-none"
      aria-label={`Interactive 3D Fur Companion: ${character.name}`}
    />
  );
};

export default HEYUKACreatureCanvas;
