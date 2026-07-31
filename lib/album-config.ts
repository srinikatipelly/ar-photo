// Single source of truth for album limits. Raising the cap is a one-line change
// here — the builder UI, /api/albums, the partner album API, and (later) the Drive
// + ZIP import all read ALBUM_MAX_ITEMS. Note: MindAR tracking quality and .mind
// size degrade past ~10 targets, so raise deliberately.
export const ALBUM_MAX_ITEMS = 10
