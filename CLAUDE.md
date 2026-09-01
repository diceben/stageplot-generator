# Claude working agreement

This repository is the standalone 2D Stageplot Generator. Never mix it with Gigboard or the separate Stageplay 3D prototype.

## Before changing code

- Read `README.md` and inspect the current working tree.
- Preserve user changes and browser-storage compatibility.
- Treat `stageplot-studio.html` as canonical.
- Keep `stageplot-prototyp-detail.html` byte-identical to it.
- Do not replace local-first persistence with cloud-only writes.
- Do not commit exported user projects, credentials or personal contact data.

## After changing code

- Run `npm test`.
- Verify the actual app through `npm run dev` when behavior or layout changed.
- Report browser validation separately from static or syntax checks.
- Keep Stageplot assets local so the editor continues to work offline.

The Supabase adapter is prepared but the visible login and production configuration are not yet complete.
