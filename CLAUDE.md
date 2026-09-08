# Claude working agreement

This repository is the standalone 2D Stageplot Generator. Never mix it with Gigboard or the separate Stageplay 3D prototype.

## Before changing code

- Read `README.md` and inspect the current working tree.
- Preserve user changes and browser-storage compatibility.
- Treat `stageplot-studio.html` as canonical.
- Do not replace local-first persistence with cloud-only writes.
- Do not commit exported user projects, credentials or personal contact data.

## After changing code

- When editing `stageplot-drums-v12.js`, `stageplot-symbols-v3.js`, `stageplot-export-v42.js`, `stageplot-geometry-v1.js` or `stageplot-venue-v1.js` / `.css`, run `npm run build` to regenerate the embedded copies in `stageplot-studio.html`. These `.js` files are the single source; never hand-edit the embedded blocks (between the `build-inline:start/end` markers).
- Run `npm test`.
- Verify the actual app through `npm run dev` when behavior or layout changed.
- Report browser validation separately from static or syntax checks.
- Keep Stageplot assets local so the editor continues to work offline.

The optional Supabase login and sync client are prepared. Production credentials and live integration testing remain outstanding; see `ACCOUNT_SETUP.md`. Keep the default public configuration empty and the SDK bundle local. Run `npm run build:vendor` when updating its dependencies.
