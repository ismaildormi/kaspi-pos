import { buildPhotorealisticCinemaVideoBundle } from "@/lib/heyuka/tools/photorealistic-video-builder";

/**
 * Dominance v90.5: Cinema Storyboard Director, Remotion Composition Spec & 3D WebGL Scene Planner.
 */
export function buildCinemaStoryboardAnd3dScene(params: {
  title: string;
  conceptPrompt: string;
  durationSec?: number;
  fps?: 30 | 60;
  brand?: "heyuka" | "kaspi_pos";
}) {
  const fps = params.fps === 60 ? 60 : 30;
  const durationSec = Math.min(120, Math.max(4, Number(params.durationSec || 12)));
  const totalFrames = durationSec * fps;

  const baseBundle = buildPhotorealisticCinemaVideoBundle(
    params.conceptPrompt || params.title
  );

  const shots = [
    {
      shotIndex: 1,
      fromFrame: 0,
      toFrame: Math.floor(totalFrames * 0.35),
      cameraOrbitDeg: [0, 35],
      lightingRig: "key-rim-three-point-studio",
      caption: params.title,
    },
    {
      shotIndex: 2,
      fromFrame: Math.floor(totalFrames * 0.35),
      toFrame: Math.floor(totalFrames * 0.75),
      cameraOrbitDeg: [35, 145],
      lightingRig: "dramatic-volumetric-depth",
      caption: params.conceptPrompt.slice(0, 90),
    },
    {
      shotIndex: 3,
      fromFrame: Math.floor(totalFrames * 0.75),
      toFrame: totalFrames,
      cameraOrbitDeg: [145, 360],
      lightingRig: "hero-reveal-bloom",
      caption: params.brand === "kaspi_pos" ? "KASPI POS 3D Showcase" : "HEYUKA Cinema Output",
    },
  ];

  const remotionProps = {
    compositionId: "HeyukaCinemaScene",
    width: 1920,
    height: 1080,
    fps,
    durationInFrames: totalFrames,
    shots,
  };

  const threeSceneJson = {
    metadata: { version: 4.5, type: "Object", generator: "HEYUKA-Dominance-v90.5" },
    object: {
      type: "Scene",
      name: params.title,
      children: [
        { type: "DirectionalLight", color: 0xffffff, intensity: 1.4, position: [6, 10, 8] },
        { type: "Mesh", name: "HeroStage", geometry: "BoxGeometry", material: "MeshStandardMaterial" },
      ],
    },
  };

  return {
    ok: true,
    engine: "secret5_cinema_3d_aesthetic_v90_5",
    remotionProps,
    threeSceneJson,
    photorealisticSpec: baseBundle,
  };
}
