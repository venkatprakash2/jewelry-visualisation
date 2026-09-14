# Jewelry visualisation — AI agent handoff

Updated: 2026-09-14. This document combines both project sessions with inspection of the current working tree. Current source code takes precedence over earlier completion claims. Update this file when continuing the project.

## Start here

This is a GRT-branded mobile web jewelry try-on demonstrator. React/TypeScript controls a Three.js renderer with local MediaPipe face/hand fitting. Seven catalog products and face/hand sample photos are included. The latest work corrected severely inaccurate placement and sizing; it did not establish exact physical sizing or finish every feature in the original renderer plan.

Read `docs/ornament-fitting.md`, `src/utils/fitting.ts`, `src/utils/renderer.ts`, and `src/components/TryOnCanvas.tsx` before changing placement. Preserve the source-image coordinate system and automatic-fit reset behavior.

**Important working-tree state:** branch `main`; latest project commit `bda409c` (`feat: initialize virtual try-on application`). Both sessions' upgrades are still uncommitted, with many modified and untracked files. Do not reset, clean, or overwrite these changes. Git history alone does not contain the current implementation. This handoff does not commit or deploy anything.

## Source sessions and user intent

1. **Explore renderer upgrade ideas** — `codex://threads/01a09aab-e0d4-7d13-a8cd-ad8e7f4a0591`
   - User requested exploration, upgrade ideas, then implementation of the full mobile-web renderer plan.
   - Agreed target: Android Chrome, responsive desktop support, existing maroon/gold identity, free browser-local processing with no API keys or paid services, approximate geometry allowed.
   - User authorized a temporary free HTTPS tunnel for phone testing. Native apps, permanent deployment, exact CAD reconstruction, and production certification were excluded.
   - Session implemented the initial Three.js/local fitting upgrade and opened a tunnel. Vite rejected the tunnel host; `server.allowedHosts` was set to `true` to unblock it.
2. **Fix ornament sizing and placement** — `codex://threads/01a09ac6-8e6f-7333-9cd1-1e179c241071`
   - User called ornament sizing/placement “truly horrific,” supplied four screenshots, and requested an accurate fix. Retailer model images could be researched if training data was needed.
   - Diagnosis found coordinate errors and fitting bugs. No training dataset was needed or trained. Retail dimensions were consulted as references, not substituted for this catalog's different products.
   - Session added source-coordinate fitting, independent earrings, anatomy-relative sizing/rotation, wrist edge refinement, and two-point photo calibration.
   - Final report stated 24 tests, browser checks, TypeScript, and build passed; physical sizing and procedural designs remained approximate.

The user wants working implementation, not another proposal. Avoid presenting automatic estimates as measured fit, fabricated confidence, or exact product reconstruction. Preserve customer photos as session-only data and custom ornaments as local persisted data.

## Run and verify

Workspace at handoff: `/Users/Shiva_1/Desktop/jewelry-visualisation`.
Verified local runtime: Node `v22.19.0`, npm `10.9.3`.

```sh
npm ci
npm run dev
# Opens Express + Vite at http://localhost:3000

npm test
npm run lint
npm run build

# Serve the built app, explicitly selecting production mode:
NODE_ENV=production npm start
```

`PORT` defaults to 3000 and can be overridden. Run from the project root: production serving resolves `dist` from the current working directory. `npm start` alone does not set `NODE_ENV=production`, so it would enter Vite middleware mode. Build produces static frontend assets plus `dist/server.cjs`; the frontend can be hosted statically if a future task requests it. There is no `preview` script.

`GET /api/health` returns `{ status: 'ok', processing: 'on-device', aiKeyRequired: false }`. Placement and stylist API calls were removed. `.env.example` still contains obsolete Gemini/AI Studio placeholder instructions; no Gemini key is needed. Dependency ranges remain in `package.json`; `package-lock.json` provides the resolved installation.

### Validation evidence

Freshly rerun for this handoff on 2026-09-14:

- `npm test`: **24/24 pass**, one file (`tests/fitting.test.ts`).
- `npm run lint`: **pass**; this command runs TypeScript (`tsc --noEmit`), not ESLint.
- `npm run build`: **pass**, Vite 6.4.3; main JS approximately 850 kB uncompressed. Existing >500 kB chunk advisory remains.

Historical evidence from the fitting session, not rerun during handoff:

- Browser checks for size changes, exact reset restoration, two-point calibration/reset, drag offset, comparison, ring rotation, and 375 px/landscape overflow.
- `scripts/validate-fit-browser.js` is a Playwright callback intended for a `browser_run_code` tool's filename argument. It is **not** a standalone `node` script and Playwright is not a declared project dependency. If that tool is unavailable, adapt the callback to a suitable browser runner.
- Screenshots: `artifacts/earrings-fit.png`, `choker-fit.png`, `bangle-fit.png`, `ring-fit.png`. Older `necklace-fit.png` and `hand-landmarks.png` come from the initial upgrade.

No physical-device camera/performance acceptance result is recorded in either session. Do not treat desktop/mobile viewport screenshots as Android hardware evidence.

## Implementation map

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Catalog/photo selection, face/hand mode, compatible layers, modals, custom-item persistence |
| `src/types.ts` | Catalog asset metadata, normalized landmarks, body analysis, independent ornament transforms |
| `src/data/jewelryCatalog.ts` | Seven products, matching codes, estimated dimensions, attachments, render modes |
| `src/data/samplePhotos.ts` | Local sample portrait and hand photo |
| `src/utils/fitting.ts` | Shared contain transform, pointer mapping, category geometry, calibration |
| `src/utils/vision.ts` | Lazy local MediaPipe face/hand IMAGE-mode detection, honest fallback states |
| `src/utils/wristEdges.ts` | Conservative local chroma-boundary check, rejects ambiguous/asymmetric boundaries |
| `src/utils/renderer.ts` | Three.js orthographic background and jewelry scene, cached textures, atomic updates, procedural bands, PNG export |
| `src/components/TryOnCanvas.tsx` | Photo/live lifecycle, transforms, gestures, calibration, fit sliders, comparison, layer visibility, download |
| `src/utils/imageUtils.ts` | Runtime alpha removal/trimming and pair-to-single earring extraction |
| `src/components/CustomOrnamentModal.tsx` | Custom upload and basic local cutout with feather setting |
| `src/utils/customCatalog.ts` | IndexedDB `grt-tryon` / `custom-jewelry` store |
| `src/components/AIStylistModal.tsx` | Deterministic local styling guidance; legacy filename |
| `src/components/CompleteTheLook.tsx` | Catalog-based coordinating products and layer toggles |
| `src/components/SelfieModal.tsx` | Separate still-camera capture flow; inspect independently of live renderer |
| `server.ts`, `vite.config.ts` | Dev/build serving and tunnel host configuration |
| `public/models/`, `public/vision/` | Local MediaPipe models and WASM runtime files |
| `scripts/generate_jewelry_models.py` | Blender generation of illustrative GLBs |
| `docs/ornament-fitting.md` | Latest fitting design, limits, reference links, and historical verification |

The old `src/utils/drapeEngine.ts` is intentionally deleted. Do not restore it as the placement/rendering authority.

## Coordinate and fitting contracts to preserve

- Landmarks normalize X by **source width** and Y by **source height** independently. Convert to source pixels before angles/distances.
- `imageRect()` supplies an aspect-preserving `contain` transform; `viewportToPhoto()` accounts for letterboxing. The orthographic camera uses the same source geometry.
- `FittedPiece.center` is the texture's attachment point, not necessarily the image center. Attachment coordinates are local texture fractions.
- Three.js origin is centered with Y upward. Instance position is `fit.x - width/2 + transform.x*width`, `height/2 - fit.y + transform.y*height`. Drag therefore subtracts downward photo motion from transform Y. Slider UI reverses transform Y to stay intuitive.
- Default transform is zero translation/rotation, scale/opacity 1, visible true. It applies on top of the computed fit. Reset restores automatic fit, rather than catalog percentage positioning.
- Still analysis is reused while switching products in the same body mode. New photo/body mode clears transforms/calibrations. Rendering and background loads reject obsolete versions; photo analysis checks effect liveness.
- Earrings use lower side-face contour estimates (132/361), with outward correction. Cheek landmarks 234/454 are not earlobes. Each earring is attached separately; the second is mirrored. Size uses estimated product millimeters and a **63 mm interpupillary-distance prior**, with a face-width fallback. This prior is not a customer measurement.
- Chokers/necklaces attach below the chin using face roll; choker width is constrained relative to face width. They are currently flat textured planes, not deforming neck surfaces.
- Rings fit the proximal ring-finger segment (landmarks 13/14), rotated across its axis. Bangles use wrist/palm orientation and accepted wrist boundaries where available.
- No landmarks/model failure in photo mode exposes manual placement with an `adjustment-needed` message. Live jewelry is suppressed whenever status is not `tracking`.
- Two-point calibration is photo/category-scoped: earlobes for earrings; wearing-position finger/wrist edges for bands; left/right neck points for neckwear. Band/neck points determine center, width, and angle. Earring calibration changes attachments but retains automatic size. Points are sorted by photo X. Reset clears the selected category calibration.

## Current capabilities and limits

Implemented: local face/hand landmark fitting; photo try-on; front live-camera toggle; drag/pinch/twist plus size/position/rotation/opacity controls; independent transform records; compatible layering/visibility; still original-photo comparison; PNG download; custom ornaments saved locally; local styling suggestions; local model/WASM serving; stale update rejection and GPU disposal paths.

Important differences from the original requested full upgrade:

- **Vision:** detection runs on the main thread in MediaPipe `IMAGE` mode, including video inputs. No workers, pose model, segmentation/hair masks, or anatomical neck reconstruction. Live inference schedules the next call after 120 ms plus detection time and smooths landmarks 40% previous / 60% current.
- **Live camera:** `TryOnCanvas` requests `facingMode: 'user'`; no rear/front selector, adaptive quality tiers, timing/FPS telemetry, explicit mirroring transform, or live capture/freeze comparison. Comparison only displays in photo mode. Streams stop on mode/photo/body changes and unmount; there is no page-hidden cleanup listener in this component. Missing tracking hides jewelry immediately rather than implementing a timed hold/loss policy.
- **Rendering:** textured jewelry is planar. There is no necklace deformation, hair/face occlusion, invisible finger/wrist depth geometry, category shading maps, contact shadows, or studio reflection environment. Procedural bands omit the back half to avoid drawing it over skin; that is not full anatomical occlusion.
- **3D assets:** two GLBs exist and have a Blender generator, but the current renderer does not load them. It builds fitted front band surfaces and decorative settings procedurally in `createBand()`. These illustrate a style and do not reproduce the catalog ring/kada. Do not claim GLB-driven rendering just because files exist.
- **Asset extraction:** cutouts are generated at runtime with luminance heuristics, not seven manually verified authored alpha assets. Catalog dark backgrounds use threshold 28/ramp 26, which can remove dark ornament details. Pair earrings still extract the left half and mirror it. `prepareUploadedCutout()` calls itself background-connected in a comment but actually tests luminance globally; it is not flood fill/segmentation.
- **Custom editor:** only upload/basic feather processing is present. No crop UI, erase/restore brushes, undo, foreground selection, interactive segmentation, or attachment-point authoring. Existing alpha is drawn but can be further modified by the heuristics. The feather value is applied when loading a file; moving the slider does not reprocess an already loaded preview.
- **Export:** renders the current preview canvas and downloads its data URL. No separate <=2048 px export target, source-size cap, product footer, native sharing, or wait for pending asynchronous scene updates. Controls and comparison overlay are outside canvas, so excluded from download.
- **Performance/recovery:** renderer pixel ratio caps at 2, not requested 1.5; no 1280 backing-size cap or measured adaptive scheduling. No explicit WebGL-loss restoration UI or manual no-WebGL fallback. Geometry is recreated on scene updates; caches/disposal exist but resource stability has not been benchmarked.
- **Layers:** compatibility/duplicate filtering and per-item transform records exist; tray toggles visibility. Full layer selection/editing/order controls are not implemented.
- **Reproducibility:** lockfile/local models/checksum README exist. `public/models/README.md` lists model and GLB hashes but does not provide a complete model/WASM acquisition and attribution workflow. `.env.example` is stale.

Exact physical fit needs measured product dimensions and a measured customer scale reference. Automatic ear/neck placements remain anatomical approximations. Existing jewelry in customer images is not removed. Extreme poses and diverse body/photo conditions have not been validated as an accuracy benchmark.

## Assets and testing references

Original photos are retained under `src/assets/images/`. Prepared canvases/textures are runtime caches, not exported asset files. Custom uploaded ornament PNG data URLs and metadata persist in IndexedDB; customer photos live in React/session state.

Blender generator, if Blender is installed at this path:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/generate_jewelry_models.py
```

Hashes and provenance notes: `public/models/README.md`. Verify regenerated hashes rather than assuming generated bytes match the README. The latest fitting documentation links MediaPipe coordinate documentation and a Tanishq measurement reference; no retailer images were trained on.

## Recommended continuation

1. Inspect `git status` and preserve all current work. Read the fitting documentation and tests; reproduce the latest screenshots and calibration behavior before altering geometry.
2. If continuing the full upgrade, prioritize real Android Chrome validation and accurate product appearance. Do not infer acceptance from the earlier completion message. Record phone model/OS/Chrome version, front/rear behavior, gestures, capture/export, and a two-minute live performance sample. Original target was 30 fps, allowing an adaptive tier with minimum 24 fps average on the tested phone.
3. Improve authored cutouts/attachment metadata and measured dimensions before using more training data. For exact design identity, obtain suitable wearing-view assets or calibrated meshes; generic bands cannot supply it.
4. Finish camera lifecycle/mirroring, worker inference and measured quality adaptation, then segmentation/occlusion/deformation if still in scope. Keep manual photo calibration available.
5. Add robust export and WebGL recovery/fallback; complete the custom editor and layer controls if the user continues to want the original full plan.
6. Add meaningful checks for changed behavior. Existing tests cover geometry/calibration/edges, not full camera lifecycle, GPU resource growth, sharing, custom persistence, or population fit accuracy.
7. Update this handoff and `docs/ornament-fitting.md` with actual evidence and remaining limits. Commit/publish only when requested.

## Operational notes

The historical tunnel URL was `https://sensor-caring-entry-soap.trycloudflare.com`; it is ephemeral and must not be assumed available. Handoff creation did not start/stop or verify any server/tunnel. Check current processes/ports before launching another server. The intended phone-test workflow is to serve the built app through temporary HTTPS and close the tunnel after testing; the historical session instead ran `npm run dev`.

`vite.config.ts` currently permits all dev hostnames for that temporary tunnel. Review/narrow it when changing hosting context. Authorization was for temporary phone testing, not permanent publication.

The original four user screenshots were macOS clipboard temp files under `/var/folders/...`; do not rely on those surviving a transfer. Durable screenshots in `artifacts/` and both session links retain useful context. `.playwright-mcp/` is historical browser-tool output, not application source.

To pass this project on, give the agent this folder including untracked `public/`, `scripts/`, `docs/`, `tests/`, `package-lock.json`, new utility files, and useful `artifacts/`. A clone of the existing committed branch alone will omit the upgrade.
