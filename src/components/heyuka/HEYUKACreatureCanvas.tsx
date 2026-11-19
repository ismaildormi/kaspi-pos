"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RotateCcw, Sparkles } from "lucide-react";
import type {
  HeyukaCharacterProfile,
  HeyukaLightingPreset,
} from "@/lib/heyuka/heyuka-universe";
import { createBlobCreature } from "@/lib/heyuka/engine/blobCreature.js";
import { createGPUFurPhysics } from "@/lib/heyuka/engine/gpuPhysics.js";
import { createGPUFurSystem } from "@/lib/heyuka/engine/furSystem.js";
import { createEnvironmentManager } from "@/lib/heyuka/engine/environments.js";
import { FluffCreature } from "@/lib/heyuka/engine/three/FluffCreature";
import { createProceduralWings } from "@/lib/heyuka/engine/three/Wings";
import { createParticleTrail } from "@/lib/heyuka/engine/three/ParticleTrail";
import { createProceduralDuck } from "@/lib/heyuka/engine/three/Duck";
import {
  createLightingRig,
  LIGHTING_PRESETS,
} from "@/lib/heyuka/engine/three/lightingEnvironments";
import {
  getCharacterProfileById,
  type CharacterProfile,
} from "@/lib/heyuka/engine/data/characterPresets";

interface HEYUKACreatureCanvasProps {
  character: HeyukaCharacterProfile;
  lighting: HeyukaLightingPreset;
  soundEnabled?: boolean;
  onBoop?: () => void;
  compact?: boolean;
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

/**
 * Authentic 60 FPS Three.js WebGL2/GPGPU Volumetric Fur & 32-Character 3D Engine
 * Directly mounts the original FluffCreature, CharacterAccessories (54 3D items),
 * Elemental Titans (Fire / Ice / Rock), Marschner Hair Shaders, Wings & Post-Processing.
 */
export const HEYUKACreatureCanvas: React.FC<HEYUKACreatureCanvasProps> = ({
  character,
  lighting,
  soundEnabled = false,
  onBoop,
  compact = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const charRef = useRef(character);
  const soundRef = useRef(soundEnabled);
  const onBoopRef = useRef(onBoop);

  const applyProfileRef = useRef<((profile: CharacterProfile) => void) | null>(null);
  const applyEnvRef = useRef<((presetId: string) => void) | null>(null);
  const triggerFlightRef = useRef<((active?: boolean, durationSec?: number) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const boopTriggerRef = useRef<((strength?: number) => void) | null>(null);

  useEffect(() => {
    charRef.current = character;
    const preset = getCharacterProfileById(character.id);
    applyProfileRef.current?.(preset);
  }, [character]);

  useEffect(() => {
    applyEnvRef.current?.(lighting.id);
  }, [lighting.id]);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    onBoopRef.current = onBoop;
  }, [onBoop]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const getWidth = () => Math.max(280, container.clientWidth || 560);
    const getHeight = () => Math.max(260, container.clientHeight || (compact ? 300 : 420));

    const initialW = getWidth();
    const initialH = getHeight();

    let isSoftwareGl = false;
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2");
      if (!gl) {
        setWebglUnavailable(true);
        return;
      }
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || "");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
      alpha: true,
      preserveDrawingBuffer: false,
    });
    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(initialW, initialH);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className =
      "w-full h-full block outline-none cursor-grab active:cursor-grabbing";

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Proceed cleanly if PMREM is skipped on low-end GPUs
    }

    const camera = new THREE.PerspectiveCamera(42, initialW / initialH, 0.1, 80);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 2.4;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 1, 0);

    const renderTarget = new THREE.WebGLRenderTarget(initialW, initialH, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: isSoftwareGl ? 0 : 4,
    });
    const composer = new EffectComposer(renderer, renderTarget);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    let ssaoPass: SSAOPass | null = null;
    if (!isSoftwareGl) {
      try {
        ssaoPass = new SSAOPass(scene, camera, initialW, initialH);
        ssaoPass.kernelRadius = 0.28;
        ssaoPass.minDistance = 0.002;
        ssaoPass.maxDistance = 0.08;
        composer.addPass(ssaoPass);
      } catch {
        ssaoPass = null;
      }
    }

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(initialW, initialH),
      0.1,
      0.38,
      0.92
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const lightingRig = createLightingRig(scene, "studio");

    const simState = {
      baseColor: charRef.current.furColor || "#e0ecfa",
      tipColor: charRef.current.tipColor || "#ffffff",
      furLength: 0.22,
      furDensity: 0.88,
      roughness: 0.68,
      specular: 0.24,
      clumping: 0.32,
      curliness: 0.22,
      windStrength: 0.85,
      lightIntensity: 0.48,
      rimIntensity: 0.38,
      exposure: 0.9,
      bloomStrength: 0.1,
      environment: lighting.id || "studio",
      gpuFurEnabled: true,
    };

    const creature = createBlobCreature();
    scene.add(creature.root);

    const wings = createProceduralWings();
    creature.root.add(wings.group);

    const particleTrail = createParticleTrail(260);
    scene.add(particleTrail.points);

    const duckNPC = createProceduralDuck();
    scene.add(duckNPC.group);

    const gpuPhysics = createGPUFurPhysics(renderer);
    if (simState.gpuFurEnabled && !gpuPhysics.isGPGPUActive) {
      simState.gpuFurEnabled = false;
    }

    const furSystem = createGPUFurSystem(creature.bodyGeometry, {
      ...simState,
      keyColor: "#fff7ed",
      lightAngle: -74,
    });
    creature.root.add(furSystem.shellMesh);
    creature.root.add(furSystem.strandMesh);

    const envManager = createEnvironmentManager({
      scene,
      renderer,
      container,
      keyLight: lightingRig.keyLight,
      rimLight: lightingRig.rimLight,
      hemiLight: lightingRig.hemiLight,
      furSystem,
      camera,
    });

    let jellyPhase = 0.0;
    let jellyAmplitude = 0.0;
    let boopShockwave = 0.0;

    const setFurColor = (baseHex: string, tipHex: string) => {
      simState.baseColor = baseHex;
      simState.tipColor = tipHex;
      if (furSystem.sharedUniforms) {
        furSystem.sharedUniforms.uBaseColor.value.set(baseHex);
        furSystem.sharedUniforms.uTipColor.value.set(tipHex);
      }
      if (creature.skinMaterial) {
        creature.skinMaterial.color.set(baseHex).multiplyScalar(0.55);
      }
      wings.setTint(tipHex);
    };

    const syncLightingUniforms = (presetId: string) => {
      const preset = LIGHTING_PRESETS[presetId] || LIGHTING_PRESETS.studio;
      const rad = (preset.lightAngle * Math.PI) / 180.0;
      const lx = Math.sin(rad) * 2.8;
      const ly = 2.4;
      const lz = Math.cos(rad) * 2.8;

      lightingRig.keyLight.position.set(lx, ly, lz);
      lightingRig.keyLight.intensity = simState.lightIntensity;
      lightingRig.rimLight.intensity = simState.rimIntensity;
      lightingRig.keyLight.color.set(preset.keyColor);

      const u = furSystem.sharedUniforms;
      if (u) {
        u.uKeyLightColor.value.set(preset.keyColor);
        u.uKeyLightDir.value.set(lx, ly, lz).normalize();
        u.uKeyLightIntensity.value = simState.lightIntensity;
        u.uRimIntensity.value = simState.rimIntensity;
      }

      if (creature.skinMaterial) {
        creature.skinMaterial.color.set(simState.baseColor).multiplyScalar(0.55);
      }
    };

    const applyEnvironment = (presetId: string) => {
      const normalized = presetId === "sunset" ? "highrise" : presetId;
      simState.environment = presetId;
      const rigPreset = lightingRig.applyPreset(presetId);
      simState.lightIntensity = rigPreset.keyIntensity;
      simState.rimIntensity = rigPreset.rimIntensity;
      simState.windStrength = rigPreset.windStrength;

      const envIdForManager = ["studio", "meadow", "highrise"].includes(normalized)
        ? normalized
        : "studio";
      envManager.setEnvironment(envIdForManager);

      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = simState.exposure;
      creature.setEnvironmentScale(1.0, 0.0, 0.0);

      camera.position.set(0, 1.5, 4);
      camera.lookAt(0, 1, 0);
      controls.target.set(0, 1, 0);
      controls.update();

      if (furSystem.sharedUniforms) {
        furSystem.sharedUniforms.uWindStrength.value = simState.windStrength;
      }
      syncLightingUniforms(presetId);
    };

    const fluffCreature = new FluffCreature(creature);
    fluffCreature.setFurSystem(furSystem);

    const triggerBoop = (strength = 1.1) => {
      (creature as any).triggerBoop?.(strength);
      fluffCreature.triggerBoop(strength);
      boopShockwave = strength;
      jellyAmplitude = Math.min(0.38, 0.26 * strength);
      jellyPhase = 0.0;
    };

    const applyProfile = (profile: CharacterProfile) => {
      if (!profile) return;
      fluffCreature.applyCharacterProfile(profile, setFurColor);
      triggerBoop(1.05);
    };

    applyProfileRef.current = applyProfile;
    applyEnvRef.current = applyEnvironment;
    triggerFlightRef.current = (active = true, durationSec = 7.0) => {
      fluffCreature.triggerFlight(active, durationSec);
      triggerBoop(1.0);
    };
    resetCameraRef.current = () => {
      controls.target.set(0, 1, 0);
      camera.position.set(0, 1.5, 4);
      controls.update();
      triggerBoop(0.95);
    };
    boopTriggerRef.current = triggerBoop;

    applyEnvironment(lighting.id || "studio");
    applyProfile(getCharacterProfileById(charRef.current.id));

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(0, 0);
    const pointerLocalPos = new THREE.Vector3(0, 0, 2);
    const prevPointerLocalPos = new THREE.Vector3(0, 0, 2);
    const pointerVelocity = new THREE.Vector3(0, 0, 0);
    let isPointerOverCreature = false;
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;

      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObject(creature.bodyMesh, false);
      if (hits.length > 0) {
        prevPointerLocalPos.copy(pointerLocalPos);
        pointerLocalPos.copy(hits[0].point);
        creature.root.worldToLocal(pointerLocalPos);
        if (isPointerOverCreature) {
          pointerVelocity.subVectors(pointerLocalPos, prevPointerLocalPos).multiplyScalar(32.0);
        }
        isPointerOverCreature = true;
        renderer.domElement.style.cursor = "pointer";
      } else {
        isPointerOverCreature = false;
        pointerVelocity.multiplyScalar(0.5);
        renderer.domElement.style.cursor = "grab";
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      if (isPointerOverCreature) {
        controls.enabled = false;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      controls.enabled = true;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist < 8 && e.button === 0) {
        triggerBoop(1.15);
        if (soundRef.current) playCuteBoopTone(charRef.current.vfxType);
        onBoopRef.current?.();
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("pointermove", handlePointerMove);
    domElem.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    const handleContextLost = (ev: Event) => {
      ev.preventDefault();
      cancelAnimationFrame(animId);
      setWebglUnavailable(true);
    };
    const handleContextRestored = () => {
      setWebglUnavailable(false);
    };
    domElem.addEventListener("webglcontextlost", handleContextLost);
    domElem.addEventListener("webglcontextrestored", handleContextRestored);

    const handleResize = () => {
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
      ssaoPass?.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    let animId = 0;
    const clock = new THREE.Clock();
    let elapsedTime = 0.0;
    const webglInertiaDisp = new THREE.Vector3(0, 0, 0);
    const webglInertiaVel = new THREE.Vector3(0, 0, 0);
    const webglForceTmp = new THREE.Vector3(0, 0, 0);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.033);
      elapsedTime += dt;

      if (boopShockwave > 0.001) boopShockwave *= Math.exp(-dt * 2.8);
      else boopShockwave = 0.0;

      pointerVelocity.multiplyScalar(Math.exp(-dt * 12.0));

      (creature as any).update(dt, pointerNDC, camera.position, false);

      const chaseTarget = duckNPC.getPhase() === "being_chased" ? duckNPC.getPosition() : null;
      const flightStatus = fluffCreature.updateFlightAndPhysics(dt, elapsedTime, chaseTarget);

      controls.update();

      wings.update(dt, elapsedTime, fluffCreature.isFlying, flightStatus.flightSpeed);
      particleTrail.update(
        dt,
        elapsedTime,
        creature.root.position,
        fluffCreature.isFlying,
        fluffCreature.scaleMultiplier
      );

      if (flightStatus.justLanded || flightStatus.justPressedButton) {
        particleTrail.triggerDustBurst(
          creature.root.position,
          flightStatus.justLanded ? 56 : 32,
          flightStatus.justLanded ? 1.5 : 1.05
        );
        triggerBoop(flightStatus.justLanded ? 1.15 : 0.95);
      }

      duckNPC.update(
        dt,
        elapsedTime,
        creature.root.position,
        () => {
          triggerBoop(1.2);
          particleTrail.triggerDustBurst(duckNPC.getPosition(), 36, 1.2);
        },
        () => {}
      );

      if (jellyAmplitude > 0.001) {
        jellyPhase += dt * 18.0;
        jellyAmplitude *= Math.exp(-dt * 4.2);
        const wave = Math.sin(jellyPhase) * jellyAmplitude;
        const sx = creature.root.scale.x * (1.0 + wave * 0.65);
        const sy = creature.root.scale.y * Math.max(0.55, 1.0 - wave * 0.85);
        const sz = creature.root.scale.z * (1.0 + wave * 0.65);
        creature.root.scale.set(sx, sy, sz);
      } else {
        jellyAmplitude = 0.0;
      }

      envManager.update(elapsedTime, simState.windStrength, creature.root);

      let physicsTexture: any = gpuPhysics.fallbackTexture;
      if (simState.gpuFurEnabled) {
        physicsTexture = gpuPhysics.step({
          time: elapsedTime,
          dt,
          windStrength: simState.windStrength + (fluffCreature.isFlying ? 0.65 : 0.0),
          creatureVelocity: creature.animState.velocity,
          creatureAngularVel: creature.animState.angularVelocity,
          pointerLocalPos,
          pointerVelocity,
          pointerActive: isPointerOverCreature,
          boopShockwave,
        });
      } else {
        webglForceTmp.set(0, -0.32, 0);
        webglForceTmp.addScaledVector(creature.animState.velocity, -1.65);
        if (isPointerOverCreature) webglForceTmp.addScaledVector(pointerVelocity, 0.85);
        webglForceTmp.addScaledVector(webglInertiaDisp, -24.0);
        webglInertiaVel.addScaledVector(webglForceTmp, dt);
        webglInertiaVel.multiplyScalar(Math.exp(-5.5 * dt));
        webglInertiaDisp.addScaledVector(webglInertiaVel, dt);
        if (webglInertiaDisp.lengthSq() > 0.64) {
          webglInertiaDisp.normalize().multiplyScalar(0.8);
        }
      }

      const u: any = furSystem.sharedUniforms;
      if (u) {
        u.uPhysicsTex.value = physicsTexture;
        u.uTime.value = elapsedTime;
        u.uPointerLocalPos.value.copy(pointerLocalPos);
        u.uPointerActive.value = isPointerOverCreature ? 1.0 : 0.0;
        u.uWebGLInertia.value.copy(webglInertiaDisp);
        u.uBoopShockwave.value = boopShockwave;
      }

      if (isSoftwareGl) renderer.render(scene, camera);
      else composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      applyProfileRef.current = null;
      applyEnvRef.current = null;
      triggerFlightRef.current = null;
      resetCameraRef.current = null;
      boopTriggerRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      domElem.removeEventListener("pointermove", handlePointerMove);
      domElem.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      domElem.removeEventListener("webglcontextlost", handleContextLost);
      domElem.removeEventListener("webglcontextrestored", handleContextRestored);
      fluffCreature.dispose();
      wings.dispose();
      particleTrail.dispose();
      duckNPC.dispose();
      (envManager as any).dispose?.();
      renderTarget.dispose();
      composer.dispose();
      renderer.dispose();
      if (container.contains(domElem)) {
        container.removeChild(domElem);
      }
    };
  }, [compact]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 ${
        compact ? "h-[280px] sm:h-[320px]" : "h-[360px] sm:h-[440px]"
      }`}
      style={{
        background: `radial-gradient(circle at 50% 42%, ${lighting.glowColor}22 0%, ${lighting.bgGradient[0]} 68%, ${lighting.bgGradient[1]} 100%)`,
      }}
    >
      {webglUnavailable ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
          <div
            className="w-20 h-20 rounded-full border border-white/25 shadow-xl flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${character.tipColor}, ${character.furColor})`,
            }}
          />
          <p className="text-sm font-bold text-white">{character.name}</p>
          <p className="text-xs text-zinc-400">{character.tagline}</p>
        </div>
      ) : (
        <div
          ref={mountRef}
          className="w-full h-full touch-none select-none"
          aria-label={`HEYUKA Interactive 3D Character — ${character.name}`}
        />
      )}

      {/* Clean Interactive Controls */}
      <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => triggerFlightRef.current?.(true, 7.5)}
          title="3D Levitate / Winged Flight"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-white/15 text-[10px] font-semibold text-zinc-200 backdrop-blur-md cursor-pointer transition-colors"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Fly</span>
        </button>
        <button
          type="button"
          onClick={() => resetCameraRef.current?.()}
          title="Reset 3D Orbit Camera"
          className="p-1.5 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-white/15 text-zinc-200 backdrop-blur-md cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default HEYUKACreatureCanvas;
