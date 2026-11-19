import { NextResponse } from "next/server";
import {
  DISTRIBUTED_NODE_MESH_SPEC,
  POS_IMMUTABLE_CORE_LOCK,
  STANDBY_ARSENAL_VAULT_ITEMS,
} from "@/lib/zebra-x/arsenal-vault";
import { CREATIVE_BRIDGE_SPECS, getConfiguredSidecarUrl } from "@/lib/zebra-x/sidecar-bridge";
import { PUBLIC_APIS_CATALOG_COUNT } from "@/lib/zebra-x/tools/public-apis-hub";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "HEYUKA AI Platform API (KASPI)",
      version: "10.5.0",
      description:
        "Unified HEYUKA-Core & HEYUKA-Vision developer endpoints for Background Removal, Blender 3D Hub, Multilingual Transcription, Stem Separation, 100x Opt-In Distributed Mesh, and Nador/Oriental Localization.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "zx-live-...",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    "x-zebra-platform": {
      models: ["HEYUKA-Core", "HEYUKA-Vision"],
      immutablePosCoreLock: POS_IMMUTABLE_CORE_LOCK,
      arsenalVaultCount: STANDBY_ARSENAL_VAULT_ITEMS.length,
      noKeyPublicApisCount: PUBLIC_APIS_CATALOG_COUNT,
      sidecarConfigured: Boolean(getConfiguredSidecarUrl()),
      creativeBridges: CREATIVE_BRIDGE_SPECS,
      distributedNodeMesh: DISTRIBUTED_NODE_MESH_SPEC,
    },
    paths: {
      "/api/v1/vision/remove-bg": {
        post: {
          operationId: "removeImageBackground",
          summary: "Remove background via Sidecar BiRefNet/RMBG-1.4 or return zero-cost @imgly WebGPU cutout profile.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    imageUrl: { type: "string" },
                    imageBase64: { type: "string" },
                    model: { type: "string", enum: ["rmbg-1.4", "birefnet", "imgly-webgpu"] },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Background removal execution result" } },
        },
      },
      "/api/v1/3d/assets": {
        get: {
          operationId: "listThreeDAssets",
          summary: "Query live No-Key PolyHaven 3D models/textures/HDRIs and Openverse transparent PNG assets for Blender.",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "type", in: "query", schema: { type: "string", enum: ["models", "textures", "hdris"] } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: { "200": { description: "Catalog of 3D models & PNG assets" } },
        },
      },
      "/api/v1/3d/generate": {
        post: {
          operationId: "generateThreeDMesh",
          summary: "Generate .glb/.fbx/.blend 3D assets via Sidecar TripoSR/InstantMesh or Blender bpy + PolyHaven starter.",
          responses: { "200": { description: "3D generation / Blender bpy pipeline result" } },
        },
      },
      "/api/v1/audio/transcribe": {
        post: {
          operationId: "transcribeAudioOrVideo",
          summary: "Transcribe video/audio URL or uploaded audio file via Faster-Whisper / WhisperX or Whisper-Turbo.",
          responses: { "200": { description: "Formatted multilingual transcript" } },
        },
      },
      "/api/v1/audio/separate": {
        post: {
          operationId: "separateVocalAndMusicStems",
          summary: "Separate vocals from instrumental stems via Meta Demucs / UVR5 + FFmpeg Sidecar.",
          responses: { "200": { description: "Vocal & instrumental stem separation result" } },
        },
      },
      "/api/v1/zebra-x/auto-connect": {
        post: {
          operationId: "autoDiscoverOpenApi",
          summary: "Inspect external public OpenAPI/Swagger JSON or register an MCP/Webhook bridge into the Capability Registry.",
          responses: { "200": { description: "Registered connector metadata & extracted operations" } },
        },
      },
    },
  });
}
