# Repository instructions

Follow `CLAUDE.md` for the shared project boundaries and validation rules.

- Keep the 2D Stageplot Generator independent from Gigboard and Stageplay 3D.
- Preserve offline-first saving and migration of existing local drafts.
- `stageplot-drums-v12.js`, `stageplot-symbols-v3.js` and `stageplot-export-v42.js` are the single source; run `npm run build` after editing them to refresh the embedded copies in the HTML. Never hand-edit the embedded blocks.
- Run `npm test` after every implementation change.
- Never commit secrets, exported projects or personal contact data.
