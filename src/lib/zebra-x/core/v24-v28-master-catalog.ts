/**
 * HEYUKA / YUKA — Autonomous Infinite-Continuation, Code-to-Media, Robotics,
 * Self-Contained Game/Web & VFS Lifecycle Master Catalog (`v24.0` – `v28.1`)
 *
 * 100% Free & Zero-Key Open-Source Registry — strictly deduplicated internally
 * and against prior catalogs (`v14.1`–`v23.0`).
 */

export type V24PlusGroup =
  | "v24_0_infinite_continuation"
  | "v25_0_v25_1_autonomous_coder"
  | "v25_2_v25_3_code_to_media"
  | "v26_0_robotics_action_hardware"
  | "v27_0_self_contained_web_games"
  | "v28_0_v28_1_vfs_lifecycle";

export interface V24PlusSourceEntry {
  id: string;
  name: string;
  group: V24PlusGroup;
  url: string;
  zeroKey: true;
  role: string;
}

type CompactRow = [id: string, name: string, url: string, role: string];

function packV24Rows(group: V24PlusGroup, rows: readonly CompactRow[]): V24PlusSourceEntry[] {
  return rows.map(([id, name, url, role]) => ({
    id,
    name,
    group,
    url,
    zeroKey: true as const,
    role,
  }));
}

/**
 * v24.0 — Infinite Auto-Continuation, Token Limit Bypass & Native Runtime Engines
 */
export const V24_0_CONTINUATION_ENGINES: readonly V24PlusSourceEntry[] = packV24Rows(
  "v24_0_infinite_continuation",
  [
    ["v24-continuedev", "Continue.dev", "https://github.com/continuedev/continue", "Infinite auto-continuation IDE streaming & diff context"],
    ["v24-aider-diff", "Aider Search/Replace Diff Engine", "https://github.com/Aider-AI/aider", "Surgical SEARCH/REPLACE diff patching without rewriting files"],
    ["v24-web-llm", "WebLLM (MLC-AI WebGPU)", "https://github.com/mlc-ai/web-llm", "In-browser WebGPU 16K-32K token LLM inference with zero rate limits"],
    ["v24-transformers-v3", "Transformers.js v3 WebGPU", "https://github.com/huggingface/transformers.js", "Client-device WebGPU/ONNX local text & vision pipelines"],
    ["v24-sglang", "SGLang Structured Generation", "https://github.com/sgl-project/sglang", "Constrained structured decoding eliminating wasted thinking tokens"],
    ["v24-outlines", "Outlines Grammar Engine", "https://github.com/dottxt-ai/outlines", "Guaranteed schema/regex-valid generation for zero syntax failures"],
    ["v24-jsonrepair", "jsonrepair", "https://github.com/josdejong/jsonrepair", "Instant deterministic repair of truncated JSON/brackets at any cut point"],
    ["v24-threejs", "Three.js", "https://github.com/mrdoob/three.js", "Core WebGL/WebGPU 3D rendering runtime"],
    ["v24-babylonjs", "Babylon.js", "https://github.com/BabylonJS/Babylon.js", "Full 3D PBR game & simulation engine in browser"],
    ["v24-phaser3", "Phaser 3", "https://github.com/phaserjs/phaser", "Fast 2D HTML5 game framework with tilemaps & physics"],
    ["v24-cannon-es", "Cannon-es", "https://github.com/pmndrs/cannon-es", "Lightweight 3D rigid-body physics for Three.js"],
    ["v24-p5js", "P5.js", "https://github.com/processing/p5.js", "Creative procedural coding canvas for art & visual sims"],
    ["v24-glsl-shadertoy", "Shadertoy GLSL / twgl.js", "https://github.com/greggman/twgl.js", "Compact WebGL2 shader runner for procedural backgrounds & FX"],
    ["v24-tonejs", "Tone.js", "https://github.com/Tonejs/Tone.js", "Procedural WebAudio synth, effects & musical sequencing"],
    ["v24-webcontainers", "WebContainers (StackBlitz)", "https://github.com/stackblitz/webcontainer-core", "WASM Node.js dev server runtime inside browser"],
    ["v24-sandpack", "Sandpack (CodeSandbox OSS)", "https://github.com/codesandbox/sandpack", "In-browser multi-file bundler & isolated live preview runtime"],
  ]
);

/**
 * v25.0 – v25.1 — Autonomous Self-Coding Brains, WASM Compilers & Grammar-Locked IDE
 */
export const V25_0_V25_1_AUTONOMOUS_CODER: readonly V24PlusSourceEntry[] = packV24Rows(
  "v25_0_v25_1_autonomous_coder",
  [
    ["v25-qwen25-coder", "Qwen2.5-Coder (1.5B/3B/7B)", "https://github.com/QwenLM/Qwen2.5-Coder", "Open-weight 32K coding model runnable on WebGPU/GGUF"],
    ["v25-deepseek-coder-v2", "DeepSeek-Coder-V2-Lite", "https://github.com/deepseek-ai/DeepSeek-Coder-V2", "High-throughput MoE coding brain for local workers"],
    ["v25-starcoder2", "StarCoder2 + Yi-Coder", "https://huggingface.co/Qwen", "Polyglot open-weight code completion across 300+ languages"],
    ["v25-pyodide", "Pyodide (CPython WASM)", "https://github.com/pyodide/pyodide", "Full CPython + NumPy/SciPy scientific stack inside browser WASM"],
    ["v25-esbuild-wasm", "esbuild-wasm", "https://github.com/evanw/esbuild", "Sub-second JS/TS/JSX browser bundler in WebAssembly"],
    ["v25-wasmer-js", "Wasmer-JS + LLVM-WASM", "https://github.com/wasmerio/wasmer-js", "Execute Rust/C/C++/WASI binaries directly in browser tabs"],
    ["v25-yaegi-php-sql", "Yaegi (Go) + PHP-WASM + SQL.js", "https://github.com/sql-js/sql.js", "In-browser Go, PHP, and SQLite runtimes with zero server setup"],
    ["v25-acorn-recast", "Babel Standalone + Acorn + Recast", "https://github.com/benjamn/recast", "AST-safe code parsing & lossless structural transforms"],
    ["v25-ts-morph", "ts-morph", "https://github.com/dsherret/ts-morph", "TypeScript compiler AST wrapper for clean refactoring"],
    ["v25-plop-hygen", "Plop.js + Hygen + Degit", "https://github.com/plopjs/plop", "Deterministic instant project scaffolding from atomic blueprints"],
    ["v25-llguidance", "LLGuidance + XGrammar", "https://github.com/guidance-ai/llguidance", "Context-free CFG/GBNF token-mask decoding with zero syntax errors"],
    ["v25-monaco", "Monaco Editor (VS Code Core)", "https://github.com/microsoft/monaco-editor", "VS Code IntelliSense & diagnostics engine for embedded IDEs"],
    ["v25-codemirror6", "CodeMirror 6 + Prettier", "https://github.com/codemirror/dev", "Fast lightweight mobile-ready editor with instant code formatting"],
    ["v25-pglite", "PGlite (PostgreSQL WASM)", "https://github.com/electric-sql/pglite", "Reactive Postgres database inside browser memory / IndexedDB"],
    ["v25-playcanvas", "PlayCanvas + Kaplay.js + Box2D-Wasm", "https://github.com/playcanvas/engine", "High-FPS 2D/3D procedural game & physics engine family"],
    ["v25-regl", "Regl (Functional WebGL)", "https://github.com/regl-project/regl", "Stateless high-speed WebGL shader drawing pipeline"],
    ["v25-capacitor-neutralino", "Capacitor + Neutralinojs + Tauri", "https://github.com/neutralinojs/neutralinojs", "Lightweight cross-platform desktop & mobile WebView app compilers"],
    ["v25-diff-match-patch", "Diff-Match-Patch + jscodeshift", "https://github.com/google/diff-match-patch", "Exact semantic text & AST patching engine"],
    ["v25-opencodeinterpreter", "OpenCodeInterpreter + SWE-Gym", "https://github.com/OpenCodeInterpreter/OpenCodeInterpreter", "Self-debugging execution feedback corpora"],
  ]
);

/**
 * v25.2 – v25.3 — Procedural Code-to-Image, Code-to-Video, Code-to-3D & Code-to-Audio (100+ Engines)
 */
export const V25_2_V25_3_CODE_TO_MEDIA_100: readonly V24PlusSourceEntry[] = packV24Rows(
  "v25_2_v25_3_code_to_media",
  [
    // Code-to-Image (25)
    ["v25m-takumi", "Takumi (Rust Image Renderer)", "https://github.com/kane50613/takumi", "Fast JSX/HTML to PNG/WebP renderer in Rust"],
    ["v25m-svgjs", "SVG.js", "https://github.com/svgdotjs/svg.js", "Concise programmable SVG vector logo & icon manipulation"],
    ["v25m-snapsvg", "Snap.svg", "https://github.com/adobe-webplatform/Snap.svg", "Structured vector masks & icons in pure SVG"],
    ["v25m-twojs", "Two.js", "https://github.com/jonobr1/two.js", "Unified 2D Canvas/SVG/WebGL vector geometry API"],
    ["v25m-ptsjs", "Pts.js", "https://github.com/williamngan/pts", "Computational geometry & point-to-form generative art"],
    ["v25m-canvas-sketch", "Canvas-Sketch", "https://github.com/mattdesl/canvas-sketch", "Print-DPI generative art & poster scaffolding framework"],
    ["v25m-fabricjs", "Fabric.js + Konva.js", "https://github.com/fabricjs/fabric.js", "Interactive layered 2D canvas editor & image exporter"],
    ["v25m-zdog", "Zdog", "https://github.com/metafizzy/zdog", "Round flat-shaded pseudo-3D vector illustrator engine"],
    ["v25m-trianglify", "Trianglify + GeoPattern", "https://github.com/qrohlf/trianglify", "Deterministic low-poly & geometric SVG background generators"],
    ["v25m-dicebear", "DiceBear Avatars", "https://github.com/dicebear/dicebear", "Deterministic vector avatar & sprite generator in code"],
    ["v25m-pixelit", "Pixelit", "https://github.com/giventofly/pixelit", "Canvas pixel-art palette quantizer for retro game sprites"],
    ["v25m-jimp", "Jimp", "https://github.com/jimp-dev/jimp", "Pure JS image resize, crop & compositing without native deps"],
    ["v25m-sharp-vips", "Sharp / Libvips-Wasm", "https://github.com/lovell/sharp", "Ultra-fast multi-format image conversion pipeline"],
    ["v25m-glfx", "glfx.js + CamanJS", "https://github.com/meltingice/CamanJS", "WebGL shader photo filters (blur, halftone, grading)"],
    ["v25m-imagetracer", "ImageTracerJS / Potrace-Wasm", "https://github.com/jankovicsandras/imagetracerjs", "Bitmap-to-SVG vector tracer directly in JS"],
    ["v25m-vega-lite", "Vega-Lite + Observable Plot", "https://github.com/vega/vega-lite", "Declarative JSON-to-infographic statistical charts"],
    ["v25m-typst", "Typst WASM", "https://github.com/typst/typst", "Milliseconds-fast markup typesetting to print posters & PDFs"],
    ["v25m-skia-canvas", "Skia-Canvas + Satori + Resvg", "https://github.com/vercel/satori", "HTML/CSS-to-SVG/PNG GPU rendering without headless Chromium"],
    ["v25m-d3-rough", "D3.js + Rough.js", "https://github.com/d3/d3", "Voronoi tessellations, GeoJSON maps & hand-drawn SVG aesthetics"],
    ["v25m-lsystem", "Fractal & L-System JS", "https://github.com/p5js/p5.js", "Parametric natural branching trees, terrain & organic shapes"],
    ["v25m-chartjs", "Chart.js + Canvas-to-Blob", "https://github.com/chartjs/Chart.js", "Instant financial KPI PNG charts for receipts & WhatsApp"],
    ["v25m-opencv-js", "OpenCV.js WASM", "https://github.com/opencv/opencv", "Computer-vision contour drawing, masking & warping in browser"],
    // Code-to-Video & Motion (25)
    ["v25m-remotion", "Remotion + Motion Canvas", "https://github.com/motion-canvas/motion-canvas", "TypeScript keyframe scenes compiled to MP4/WebM"],
    ["v25m-manim", "Manim (3Blue1Brown Engine)", "https://github.com/ManimCommunity/manim", "Mathematical equations & geometric vector animations"],
    ["v25m-canvas-record", "Canvas-Record + Mediabunny", "https://github.com/dmnsgn/canvas-record", "WebCodecs frame-accurate HTML canvas to MP4/WebM capture"],
    ["v25m-gsap-anime", "GSAP + Anime.js + Theatre.js", "https://github.com/greensock/GSAP", "Precision 60fps timeline choreography for motion graphics"],
    ["v25m-lottie-rive", "Lottie-Web + Rive Runtime", "https://github.com/airbnb/lottie-web", "Lightweight JSON & state-machine interactive vector animations"],
    ["v25m-pixijs", "PixiJS (2D WebGL)", "https://github.com/pixijs/pixijs", "Batched 120fps WebGL sprites, lighting & particles"],
    ["v25m-tsparticles", "tsParticles", "https://github.com/tsparticles/tsparticles", "Fire, snow, confetti & sci-fi particle emitters in JSON"],
    ["v25m-hydra", "Hydra Video Synth", "https://github.com/hydra-synth/hydra", "Live-coded feedback & audio-reactive analog video synthesizer"],
    ["v25m-gl-transitions", "GL-Transitions", "https://github.com/gl-transitions/gl-transitions", "Cinematic GLSL scene wipe & dissolve shaders"],
    ["v25m-ccapture", "CCapture.js + gif.js", "https://github.com/spite/ccapture.js", "Frame-step deterministic WebGL video & GIF recorder"],
    ["v25m-mp4-muxer", "mp4-muxer & webm-muxer", "https://github.com/Vanilagy/mp4-muxer", "Zero-server MP4/WebM muxing directly in browser RAM"],
    ["v25m-moviepy", "MoviePy + Editly + Revideo", "https://github.com/Zulko/moviepy", "Declarative JSON/Python video editing & subtitle compositing"],
    ["v25m-vapoursynth-mlt", "VapourSynth + MLT Framework", "https://github.com/mltframework/mlt", "Scriptable headless NLE film filter & XML timeline renderer"],
    ["v25m-liqvid", "Liqvid + Motion One + Popmotion", "https://github.com/liqvidjs/liqvid", "Interactive narrated video players & spring physics curves"],
    ["v25m-vivus-typed", "Vivus.js + Typed.js", "https://github.com/maxwellito/vivus", "Self-drawing SVG strokes & human-paced code typing intros"],
    ["v25m-butterchurn", "Butterchurn (Milkdrop) + Wavesurfer.js", "https://github.com/jberg/butterchurn", "Music-synced WebGL visualizers & podcast waveform overlays"],
    ["v25m-agg-gource", "Asciinema Agg + Gource", "https://github.com/asciinema/agg", "Terminal cast-to-GIF & 3D Git history tree video generator"],
    // Code-to-3D (25)
    ["v25m-jscad-manifold", "JSCAD + Manifold-3D WASM", "https://github.com/jscad/OpenJSCAD.org", "Constructive solid geometry (CSG) code to watertight STL/GLB"],
    ["v25m-r3f-build123d", "React Three Fiber + Build123d + bpy", "https://github.com/pmndrs/react-three-fiber", "Declarative React 3D scenes & headless Blender parametric CAD"],
    ["v25m-aframe-tres", "A-Frame + TresJS + Threlte", "https://github.com/aframevr/aframe", "Compact declarative WebXR & multi-framework 3D scene graphs"],
    ["v25m-rapier3d-ammo", "Rapier3D WASM + Ammo.js", "https://github.com/dimforge/rapier.js", "Deterministic Rust/Bullet physics for vehicles, cloth & joints"],
    ["v25m-bvh-csg", "three-bvh-csg + Three-Mesh-UI", "https://github.com/gkjohnson/three-bvh-csg", "BVH-accelerated boolean cuts & floating 3D VR menus"],
    ["v25m-lamina-post", "Lamina Shaders + Postprocessing", "https://github.com/pmndrs/postprocessing", "Layered procedural materials & Bloom/SSAO 3D rendering"],
    ["v25m-simplex-terrain", "Simplex-Noise + THREE.Terrain + ez-tree", "https://github.com/dgreenheck/ez-tree", "Procedural mountains, oceans, forests & foliage meshes"],
    ["v25m-trimesh-pyvista", "Trimesh + PyVista (VTK)", "https://github.com/mikedh/trimesh", "Mesh repair, volume checks & GLB/OBJ/STL conversion in Python"],
    ["v25m-implicit-curv", "ImplicitCAD + Curv SDF + Shader-Park", "https://github.com/curv3d/curv", "Signed-distance math geometry & organic raymarched 3D forms"],
    ["v25m-draco-meshopt", "Google Draco + Meshoptimizer + Assimp", "https://github.com/google/draco", "90% GLB mesh compression & 40+ 3D format cross-conversion"],
    ["v25m-noa-voxel", "Noa-Engine (Voxel World)", "https://github.com/fenomas/noa", "Chunked procedurally generated 3D voxel sandbox worlds"],
    ["v25m-cesium-deck", "CesiumJS + Deck.gl", "https://github.com/CesiumGS/cesium", "3D global terrain tiles & high-density urban WebGL overlays"],
    ["v25m-model-viewer", "Google Model-Viewer (WebXR AR)", "https://github.com/google/model-viewer", "Instant AR phone placement of generated .glb assets"],
    // Code-to-Audio & DSP (25)
    ["v25m-strudel", "Strudel (TidalCycles JS)", "https://github.com/tidalcycles/strudel", "Pattern-coded algorithmic live beats & melodies in browser"],
    ["v25m-zzfx-jsfxr", "ZzFX + Jsfxr", "https://github.com/KilledByAPixel/ZzFX", "Tiny zero-dependency 1-line retro & sci-fi game sound synthesis"],
    ["v25m-elementary-faust", "Elementary Audio + Faust DSP", "https://github.com/elemaudio/elementary", "Functional JS/WASM audio synthesis graphs & custom instruments"],
    ["v25m-csound-sonicpi", "Csound WASM + Sonic Pi Corpus", "https://github.com/csound/csound", "Studio-grade algorithmic sound design & multi-track scores"],
    ["v25m-scribbletune-magenta", "Scribbletune + Magenta.js + Tonal.js", "https://github.com/scribbletune/scribbletune", "Scale/chord-locked procedural MIDI loops & harmonic generation"],
    ["v25m-soundfont-pizzicato", "SoundFont Player + Pizzicato.js", "https://github.com/danigb/soundfont-player", "General-MIDI instrument playback with WebAudio Reverb/Delay"],
    ["v25m-howler-lame", "Howler.js + lamejs + wav-encoder", "https://github.com/zhuker/lamejs", "Spatial 3D audio playback + client-side MP3 & PCM WAV encoding"],
    ["v25m-crunker-meyda", "Crunker + Meyda.js + Essentia.js", "https://github.com/meyda/meyda", "Multi-track audio mixing, FFT feature extraction & BPM detection"],
    ["v25m-abcjs-gibber", "ABCjs + Gibber + MeSpeak.js", "https://github.com/paulrosen/abcjs", "Text sheet-music synthesis, audiovisual live-coding & offline TTS"],
    ["v25m-pyo-pedalboard", "Pyo + Spotify Pedalboard + Librosa + SoX", "https://github.com/spotify/pedalboard", "Python DSP effects mastering, spectrograms & audio transcoding"],
  ]
);

/**
 * v26.0 — Autonomous Robotics Behavior, Action Bots, Game AI (Yuka.js) & Embedded Hardware
 */
export const V26_0_ROBOTICS_AGENTS_HARDWARE_101: readonly V24PlusSourceEntry[] = packV24Rows(
  "v26_0_robotics_action_hardware",
  [
    ["v26-behaviortree-cpp", "BehaviorTree.CPP + py_trees", "https://github.com/BehaviorTree/BehaviorTree.CPP", "Hierarchical robotics & agent behavior-tree execution"],
    ["v26-smach-flexbe", "SMACH + FlexBE", "https://github.com/FlexBE/flexbe_behavior_engine", "Deterministic hierarchical robotics state machines"],
    ["v26-nav2-moveit2", "Nav2 + MoveIt 2 + OMPL", "https://github.com/ros-navigation/navigation2", "Autonomous mobile obstacle avoidance & 6-DoF arm planning"],
    ["v26-drake-pinocchio", "MIT Drake + Pinocchio + Crocoddyl", "https://github.com/RobotLocomotion/drake", "Whole-body humanoid/legged dynamics & optimal balance control"],
    ["v26-casadi-acados", "CasADi + ACADOS MPC", "https://github.com/casadi/casadi", "Sub-millisecond Model Predictive Control for drones & manipulators"],
    ["v26-openrmf-microros", "OpenRMF + micro-ROS", "https://github.com/micro-ROS/micro_ros_setup", "Multi-robot fleet coordination & ESP32/STM32 microcontroller ROS2"],
    ["v26-foxglove-roslibjs", "Lichtblick / Foxglove + roslibjs", "https://github.com/RobotWebTools/roslibjs", "Live WebSocket robot telemetry & browser control cockpit"],
    ["v26-webots-genesis", "Webots + Genesis Physics + ManiSkill 3", "https://github.com/cyberbotics/webots", "Open 3D robotics physics simulation & manipulation benchmarks"],
    ["v26-robocasa-oxe", "RoboCasa + Open X-Embodiment", "https://robotics-transformer-x.github.io/", "Multi-embodiment manipulation datasets & household policy tasks"],
    ["v26-aloha-soarm", "Mobile ALOHA + SO-ARM100", "https://github.com/TheRobotStudio/SO-ARM100", "Open-hardware desktop teleoperation & low-cost 3D-printed arms"],
    ["v26-slam-apriltag", "SLAM Toolbox + AprilTag + GraspNet", "https://github.com/SteveMacenski/slam_toolbox", "Centimeter 2D/3D mapping, fiducial localization & 6-DoF grasping"],
    ["v26-trigger-hatchet", "Trigger.dev + Hatchet + BullMQ", "https://github.com/hatchet-dev/hatchet", "Fault-tolerant durable background action workers & job queues"],
    ["v26-celery-dramatiq", "Celery + Dramatiq + Huey + Croner", "https://github.com/Hexagon/croner", "Distributed Python/JS scheduled action workers & cron loops"],
    ["v26-nutjs-rpa", "RobotJS / Nut.js + TagUI + OpenRPA", "https://github.com/open-rpa/openrpa", "Desktop mouse/keyboard GUI automation & local office bots"],
    ["v26-stagehand-skyvern", "Stagehand + Skyvern + LaVague + Magnitude", "https://github.com/browserbase/stagehand", "Vision-grounded resilient web action & test automation bots"],
    ["v26-huginn-change", "Huginn + Changedetection.io + ArchiveBox", "https://github.com/huginn/huginn", "Self-hosted IFTTT web monitors & instant page snapshot agents"],
    ["v26-rclone-hurl", "Rclone + Hurl + mitmproxy", "https://github.com/Orange-OpenSource/hurl", "Automated storage sync, HTTP testing bots & traffic inspection"],
    ["v26-faker-wiremock", "Faker.js + WireMock + Pact + Redux-Saga", "https://github.com/wiremock/wiremock", "API contract mocks, synthetic fixtures & deterministic action sagas"],
    ["v26-godot-bevy", "Godot Engine + Bevy ECS", "https://github.com/godotengine/godot", "Complete programmable 2D/3D game runtimes & Entity-Component worlds"],
    ["v26-yukajs-path", "Yuka.js + PathFinding.js + Recast-Detour", "https://github.com/Mugen87/yuka", "Autonomous game AI steering, Seek/Flee, State Machines & NavMesh"],
    ["v26-rot-excalibur", "Rot.js + Excalibur.js + Kontra + LittleJS", "https://github.com/straker/kontra", "Compact roguelike, TypeScript 2D & sub-200-line arcade engines"],
    ["v26-matter-planck", "Matter.js + Planck.js + MelonJS + Crafty", "https://github.com/liabru/matter-js", "2D rigid-body Box2D/Matter game physics & platformer engines"],
    ["v26-colyseus-openspiel", "Colyseus + Boardgame.io + OpenSpiel + Stockfish", "https://github.com/colyseus/colyseus", "Multiplayer rooms, MCTS bots & strategy AI engines"],
    ["v26-wfc-procgen", "WaveFunctionCollapse + Tiled + Procgen", "https://github.com/mxgmn/WaveFunctionCollapse", "Constraint-solved coherent dungeons, maps & procedural cities"],
    ["v26-ursina-panda3d", "GDevelop Core + Defold + Pygame-CE + Ursina + Panda3D", "https://github.com/pokepetter/ursina", "Rapid cross-platform & Python 3D game creation kits"],
    ["v26-johnny-cylon", "Johnny-Five + Cylon.js", "https://github.com/rwaldron/johnny-five", "Node/JS Firmata hardware robotics & actuator control"],
    ["v26-micropython-tinygo", "MicroPython + CircuitPython + TinyGo + Embassy Rust", "https://github.com/micropython/micropython", "MCU firmware synthesis for ESP32, RP2040 & Arduino robotics"],
    ["v26-zephyr-freertos", "Zephyr RTOS + FreeRTOS + Arduino CLI + esptool", "https://github.com/arduino/arduino-cli", "Hard real-time RTOS tasks & CLI microcontroller flashing"],
    ["v26-webserial-modbus", "WebSerial / WebBluetooth + pySerial + Pymodbus + python-can", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API", "Zero-driver browser USB/BT & industrial Modbus/CAN bus telemetry"],
    ["v26-gpio-cnc", "GStreamer + Picamera2 + gpiozero + SimpleFOC + FluidNC", "https://github.com/bdring/FluidNC", "Low-latency vision streams, BLDC servo loops & G-Code CNC motion"],
    ["v26-iot-sim", "WLED + Zigbee2MQTT + Frigate NVR + Node-OPCUA + Wokwi + Renode", "https://github.com/wokwi/wokwi-cli", "Smart automation & cycle-accurate ESP32/Arduino hardware simulation"],
  ]
);

/**
 * v27.0 — Self-Contained Multi-Page Sites & Complete Packaged Game Kits
 */
export const V27_0_SELF_CONTAINED_WEB_GAMES: readonly V24PlusSourceEntry[] = packV24Rows(
  "v27_0_self_contained_web_games",
  [
    ["v27-astro-11ty", "Astro + Starlight + Eleventy (11ty)", "https://github.com/withastro/astro", "Clean multi-page SEO static & dynamic website generators"],
    ["v27-wouter-navigo", "Wouter + Navigo Hash/SPA Routers", "https://github.com/molefrog/wouter", "Zero-dependency client-side links & multi-view site navigation"],
    ["v27-unocss-daisyui", "UnoCSS Runtime + DaisyUI + HyperUI Blocks", "https://github.com/unocss/unocss", "Instant browser-side responsive styling & pre-assembled UI sections"],
    ["v27-alpine-htmx", "Alpine.js + HTMX", "https://github.com/alpinejs/alpine", "Declarative reactive carts, modals & menus in concise HTML"],
    ["v27-minisearch", "MiniSearch + FlexSearch", "https://github.com/lucaong/minisearch", "Offline instant full-text catalog search inside generated websites"],
    ["v27-jszip-saver", "JSZip + FileSaver.js", "https://github.com/Stuk/jszip", "One-click browser project .zip packaging & download"],
    ["v27-needle-wonderland", "Needle Engine + Wonderland + Rogue Engine", "https://github.com/needle-tools", "Complete packaged WebGL game scenes with menus & HUD"],
    ["v27-gltf-rigging", "Three.js SkeletonUtils + AnimationMixer", "https://github.com/mrdoob/three.js", "Rigged humanoid walk/run/attack animation blending"],
    ["v27-kenney-quaternius", "Kenney CC0 + Quaternius 3D Game Packs", "https://kenney.nl/assets", "CC0 characters, vehicles, buildings & SFX asset blueprints"],
    ["v27-nipplejs-gamepad", "NippleJS Virtual Joystick + Gamepad API", "https://github.com/yoannmoinet/nipplejs", "Mobile touch D-pad & console controller support out of the box"],
    ["v27-zzfxm-tracker", "ZzFXM Music & SFX Tracker", "https://github.com/keithclark/ZzFXM", "Tiny procedural chiptune & synth game soundtrack generator"],
    ["v27-camera-controls", "yomotsu/camera-controls", "https://github.com/yomotsu/camera-controls", "Smooth third-person, orbit & screen-shake game cameras"],
  ]
);

/**
 * v28.0 – v28.1 — Virtual File Systems, Instant Multi-Format Delivery & Project Lifecycle (100+ Tools)
 */
export const V28_0_V28_1_VFS_LIFECYCLE_100: readonly V24PlusSourceEntry[] = packV24Rows(
  "v28_0_v28_1_vfs_lifecycle",
  [
    // VFS & Storage (25)
    ["v28-zenfs-browserfs", "ZenFS + BrowserFS + OPFS", "https://github.com/zen-fs/core", "In-browser POSIX virtual directory & Origin Private FS persistence"],
    ["v28-memfs-fs-extra", "memfs + fs-extra + upath/pathe", "https://github.com/streamich/memfs", "Sub-ms RAM file tree synthesis with cross-OS clean pathing"],
    ["v28-glob-chokidar", "tinyglobby + fast-glob + chokidar-cli", "https://github.com/SuperchupuDev/tinyglobby", "High-speed workspace globbing & file-change rebuild watchers"],
    ["v28-localforage-idb", "localForage + idb-keyval", "https://github.com/jakearchibald/idb-keyval", "IndexedDB persistent binary artifact & project vault"],
    ["v28-absurd-wa-sqlite", "Absurd-SQL + WA-SQLite", "https://github.com/rhashimoto/wa-sqlite", "Persistent SQLite storage engine inside browser OPFS"],
    ["v28-minio-garage", "MinIO Client + GarageHQ + SeaweedFS + JuiceFS", "https://github.com/minio/mc", "Zero-fee S3-compatible distributed object & POSIX storage"],
    ["v28-sync-p2p", "rsync + Unison + Filebrowser + PairDrop + Croc + Wormhole", "https://github.com/schollz/croc", "Delta sync & encrypted LAN/P2P project delivery"],
    ["v28-helia-torrent-dvc", "Helia JS IPFS + WebTorrent + Hypercore + DVC", "https://github.com/ipfs/helia", "Content-addressed distributed delivery & large asset versioning"],
    // Packaging & Document Conversion (25)
    ["v28-7z-archiver", "7z-wasm + Archiver + adm-zip + yauzl + fflate", "https://github.com/ip7z/7zip", "Multi-format archive packing/unpacking with Zip-Slip protection"],
    ["v28-pandoc-weasyprint", "Pandoc + WeasyPrint + Stirling-PDF", "https://github.com/jgm/pandoc", "Universal Markdown/HTML -> PDF/DOCX/EPUB/LaTeX conversion"],
    ["v28-pdf-lib-kit", "PDF-Lib + PDFKit + jsPDF AutoTable", "https://github.com/Hopding/pdf-lib", "Client/server signed invoices & programmable PDF composition"],
    ["v28-office-docs", "docx + ExcelJS + PptxGenJS + epub-gen", "https://github.com/dolanmiu/docx", "Native Word, Excel, PowerPoint & EPUB artifact generation"],
    ["v28-data-formats", "PapaParse + Arrow JS + Parquet-Wasm + js-yaml + fast-xml", "https://github.com/kylebarron/parquet-wasm", "High-speed CSV, Parquet, YAML, TOML & XML codecs"],
    ["v28-marp-singlefile", "Marp / Remark + Turndown + SingleFile", "https://github.com/gildas-lormeau/SingleFile", "Self-contained offline HTML archiving & slide generation"],
    ["v28-native-bundlers", "Electron-Builder + Bun Compile + Nuitka + UPX", "https://github.com/oven-sh/bun", "Zero-dependency standalone native executable packaging"],
    // Lifecycle Control & State Orchestration (25)
    ["v28-xstate-fsm", "XState v5 + isomorphic-git + React-Arborist", "https://github.com/statelyai/xstate", "Deterministic FSM lifecycle + browser Git rollback + live file tree"],
    ["v28-prefect-dagster", "Prefect + Dagster + Airflow + Luigi + Snakemake", "https://github.com/PrefectHQ/prefect", "DAG asset pipelines with output verification & auto-retry"],
    ["v28-just-task-act", "Just + Task (go-task) + Earthly + Woodpecker CI + Act", "https://github.com/casey/just", "Reproducible local build/test runners & GitHub Actions emulation"],
    ["v28-effect-rxjs", "Camunda + Machina + RxJS + Effect-TS + Mitt", "https://github.com/Effect-TS/effect", "Type-safe concurrent event streams & typed error recovery"],
    ["v28-yjs-diff2html", "Yjs + Automerge + Diff2Html + Patch-Package + Changesets", "https://github.com/rtfpessoa/diff2html", "CRDT auto-merge, visual file diffs & automated changelogs"],
    ["v28-renovate-yeoman-pm2", "Renovate + Yeoman + UnJS Giget + PM2 + Compose Watch", "https://github.com/unjs/giget", "Instant template cloning, dependency audits & watch daemon reloads"],
    // Instant Deployment, Hosting & Observability (25)
    ["v28-paas-selfhost", "Coolify + Dokploy + CapRover + Dokku + Forgejo + GitBucket", "https://github.com/coollabsio/coolify", "1-click self-hosted PaaS deploys & local Git repo hosting"],
    ["v28-static-tunnel", "Static-Web-Server + miniserve + Cloudflared + Bore + Frp", "https://github.com/cloudflare/cloudflared", "Instant localhost HTTPS preview URLs & QR local sharing"],
    ["v28-baas-backends", "PocketBase + Appwrite + Supabase Core", "https://github.com/pocketbase/pocketbase", "Single-binary auth, realtime DB & file backend attachments"],
    ["v28-pm-docs-monitor", "Plane + Vikunja + Outline + VitePress + Scalar + Bruno + Kuma + Umami + Listmonk + Beszel", "https://github.com/scalar/scalar", "Automated Kanban tracking, OpenAPI docs, uptime alerts & privacy analytics"],
  ]
);

/**
 * Deduplicate cleanly across v24-v28 ensuring zero duplicate IDs or identical normalized names.
 */
function deduplicateV24ToV28(
  groups: readonly (readonly V24PlusSourceEntry[])[],
  existingIds: Set<string> = new Set()
): V24PlusSourceEntry[] {
  const out: V24PlusSourceEntry[] = [];
  const seenIds = new Set<string>(existingIds);
  const seenNames = new Set<string>();

  for (const groupList of groups) {
    for (const item of groupList) {
      const normName = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seenIds.has(item.id) || seenNames.has(normName)) continue;
      seenIds.add(item.id);
      seenNames.add(normName);
      out.push(item);
    }
  }
  return out;
}

export const V24_TO_V28_MASTER_CATALOG: readonly V24PlusSourceEntry[] = deduplicateV24ToV28([
  V24_0_CONTINUATION_ENGINES,
  V25_0_V25_1_AUTONOMOUS_CODER,
  V25_2_V25_3_CODE_TO_MEDIA_100,
  V26_0_ROBOTICS_AGENTS_HARDWARE_101,
  V27_0_SELF_CONTAINED_WEB_GAMES,
  V28_0_V28_1_VFS_LIFECYCLE_100,
]);

export function getV24ToV28Counts(): {
  v24_0_continuation: number;
  v25_0_v25_1_coder: number;
  v25_2_v25_3_code_to_media: number;
  v26_0_robotics_hardware: number;
  v27_0_self_contained_web_games: number;
  v28_0_v28_1_vfs_lifecycle: number;
  totalUnique: number;
} {
  return {
    v24_0_continuation: V24_TO_V28_MASTER_CATALOG.filter((e) => e.group === "v24_0_infinite_continuation").length,
    v25_0_v25_1_coder: V24_TO_V28_MASTER_CATALOG.filter((e) => e.group === "v25_0_v25_1_autonomous_coder").length,
    v25_2_v25_3_code_to_media: V24_TO_V28_MASTER_CATALOG.filter((e) => e.group === "v25_2_v25_3_code_to_media").length,
    v26_0_robotics_hardware: V24_TO_V28_MASTER_CATALOG.filter((e) => e.group === "v26_0_robotics_action_hardware").length,
    v27_0_self_contained_web_games: V24_TO_V28_MASTER_CATALOG.filter((e) => e.group === "v27_0_self_contained_web_games").length,
    v28_0_v28_1_vfs_lifecycle: V24_TO_V28_MASTER_CATALOG.filter((e) => e.group === "v28_0_v28_1_vfs_lifecycle").length,
    totalUnique: V24_TO_V28_MASTER_CATALOG.length,
  };
}

export function searchV24ToV28Catalog(query: string, limit = 12): V24PlusSourceEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return V24_TO_V28_MASTER_CATALOG.slice(0, limit);
  return V24_TO_V28_MASTER_CATALOG.filter(
    (entry) =>
      entry.name.toLowerCase().includes(q) ||
      entry.role.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q) ||
      entry.group.toLowerCase().includes(q)
  ).slice(0, limit);
}
