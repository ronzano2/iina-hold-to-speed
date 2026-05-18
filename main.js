// Hold to Speed — IINA Plugin
// Hold Space = 2x speed (like YouTube). Tap Space = play/pause.
//
// Strategy: use mpv.set("pause", ...) and mpv.set("speed", ...) directly,
// and track pause state ourselves via the mpv.pause.changed event.

const { core, input, mpv, event, console: log } = iina;

const HOLD_SPEED   = 2.0;
const HOLD_DELAY   = 250; // ms — tweak if needed

let holdTimer      = null;
let isHolding      = false;
let spaceDown      = false;
let savedSpeed     = 1.0;
let isPaused       = false;

// ── Track pause state via mpv event ─────────────────────────────────────────
event.on("mpv.pause.changed", () => {
  isPaused = mpv.getFlag("pause");
  log.log("[hold-to-speed] pause changed: " + isPaused);
});

event.on("iina.file-loaded", () => {
  isPaused   = mpv.getFlag("pause");
  savedSpeed = mpv.getNumber("speed") || 1.0;
});

// ── Space DOWN ───────────────────────────────────────────────────────────────
input.onKeyDown("Space", (data) => {
  if (data.isRepeat) return true; // eat repeats — stops IINA toggling pause on hold
  if (spaceDown)     return true;

  spaceDown  = true;
  isHolding  = false;
  savedSpeed = mpv.getNumber("speed") || 1.0;

  holdTimer = setTimeout(() => {
    if (!spaceDown) return;
    isHolding = true;

    if (isPaused) mpv.set("pause", false);
    mpv.set("speed", HOLD_SPEED);
    core.osd("▶▶  2× Speed");
    log.log("[hold-to-speed] boosted to 2×");
  }, HOLD_DELAY);

  return true; // consume — IINA's default Space handler never fires
}, input.PRIORITY_HIGH);

// ── Space UP ─────────────────────────────────────────────────────────────────
input.onKeyUp("Space", () => {
  spaceDown = false;

  if (holdTimer !== null) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  if (isHolding) {
    mpv.set("speed", savedSpeed);
    isHolding = false;
    core.osd("▶  Normal Speed");
    log.log("[hold-to-speed] restored speed");
  } else {
    // Short tap → toggle pause ourselves
    mpv.set("pause", !isPaused);
    log.log("[hold-to-speed] tap: pause=" + !isPaused);
  }

  return true;
}, input.PRIORITY_HIGH);

log.log("[hold-to-speed] loaded");
