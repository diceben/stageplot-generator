# Claude working agreement

This repository is the standalone 2D Stageplot Generator. Never mix it with Gigboard or the separate Stageplay 3D prototype.

## Before changing code

- Read `README.md` and inspect the current working tree.
- Preserve user changes and browser-storage compatibility.
- Treat `stageplot-studio.html` as canonical.
- Do not replace local-first persistence with cloud-only writes.
- Do not commit exported user projects, credentials or personal contact data.

## After changing code

- When editing `stageplot-drums-v12.js`, `stageplot-symbols-v3.js` or `stageplot-export-v42.js`, run `npm run build` to regenerate the embedded copies in `stageplot-studio.html`. These `.js` files are the single source; never hand-edit the embedded blocks (between the `build-inline:start/end` markers).
- Run `npm test`.
- Verify the actual app through `npm run dev` when behavior or layout changed.
- Report browser validation separately from static or syntax checks.
- Keep Stageplot assets local so the editor continues to work offline.

The Supabase adapter is prepared but the visible login and production configuration are not yet complete.
