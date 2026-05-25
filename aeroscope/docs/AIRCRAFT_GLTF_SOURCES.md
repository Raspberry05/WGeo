# Aircraft GLTF sources

Aeroscope maps [OpenSky emitter categories](https://opensky-network.org/apidoc/) to 3D models. Until you add real assets, procedural placeholders live in `client/public/models/`.

## License rules

- Prefer **CC0** (no attribution required) or **CC-BY** (credit the author in your app or README).
- Avoid models that forbid redistribution or commercial use unless you have explicit permission.
- Keep a short `MODELS_ATTRIBUTION.md` if you use CC-BY assets.

## Where to search

| Source | URL | Notes |
|--------|-----|--------|
| Khronos glTF Sample Models | https://github.com/KhronosGroup/glTF-Sample-Models | Reference quality; few aircraft |
| Sketchfab (downloadable + CC) | https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1010&type=models | Filter by license; export GLB |
| Poly Pizza | https://poly.pizza | Low-poly, often CC0 |
| Cesium ion Asset Depot | https://cesium.com/ion/assets | May require ion token; good for Cesium |
| OpenGameArt | https://opengameart.org | Check per-file license |
| NASA 3D Resources | https://nasa3d.arc.nasa.gov/models | Public domain; mostly spacecraft |

## Search terms by category

| Category | OpenSky code | Suggested search |
|----------|--------------|------------------|
| Balloon | 10 | `hot air balloon glb low poly CC0` |
| Glider | 9 | `glider aircraft gltf` |
| Light | 2 | `cessna 172 gltf low poly` |
| Small | 3, 7 | `regional jet gltf` / `business jet glb` |
| Large | 4, 5 | `airliner gltf boeing 737` |
| Heavy | 6 | `wide body aircraft gltf A380 747` |
| Default (rotorcraft, UAV, unknown) | 8, 13, other | `helicopter gltf` / `drone quadcopter glb` |

## Drop-in steps

1. Download **glTF 2.0** (`.gltf` + `.bin`) or **GLB** (single file).
2. Place files in `aeroscope/public/models/` (e.g. `heavy-boeing.glb`).
3. Edit `aeroscope/src/config/aircraftModels.ts`:
   - Update the `MODELS` paths (e.g. `heavy: "/models/heavy-boeing.glb"`).
   - Tune `scaleForCategory()` so wingspan looks right at airport zoom.
4. Reload the dev server. Select aircraft of each category to verify silhouette and heading.
5. If the model points the wrong way, add `model.orientation` in `AircraftEntities.tsx` (HeadingPitchRoll offset).

## Current placeholder files

| File | Category |
|------|----------|
| `balloon-placeholder.gltf` | Balloon (10) |
| `glider-placeholder.gltf` | Glider (9) |
| `light-placeholder.gltf` | Light (2) |
| `small-placeholder.gltf` | Small (3), high performance (7) |
| `large-placeholder.gltf` | Large (4), high vortex (5) |
| `heavy-placeholder.gltf` | Heavy (6) |
| `plane-placeholder.gltf` | Default / rotorcraft / UAV / unknown |

Regenerate placeholders: `node scripts/generate-placeholders.mjs` from `aeroscope/`.
