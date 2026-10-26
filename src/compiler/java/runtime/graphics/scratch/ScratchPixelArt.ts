import * as PIXI from "pixi.js";
import type { Interpreter } from "../../../../common/interpreter/Interpreter";

/**
 * 7.0's Window.usePixelArt(): nearest-neighbour filtering for every costume,
 * so pixel art scaled up keeps sharp squares. useSmoothPixelArt() is pixel art
 * as well (upstream: pixelArt and smoothPixelArt), whose stage fills the
 * output at any scale instead of stepping whole numbers.
 *
 * Costumes share their texture sources (one atlas holds hundreds of them, and
 * an image used by several sprites is loaded once), so the filter belongs to
 * the source and changes for every costume at once — upstream's setting is
 * just as global. Every source a costume can come from is registered here.
 */

let pixelArt = false;
let smoothPixelArt = false;
const sources: Set<PIXI.TextureSource> = new Set();
const watchedInterpreters: WeakSet<Interpreter> = new WeakSet();

export function isPixelArt(): boolean {
    return pixelArt;
}

/** Window.useFrameSmoothing: how much of the previous frame each one keeps, 0 to 100 */
let frameSmoothing = 0;
export function getFrameSmoothing(): number { return frameSmoothing; }
export function setFrameSmoothing(percent: number) {
    frameSmoothing = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
}

export function isSmoothPixelArt(): boolean {
    return smoothPixelArt;
}

/** usePixelArt(): (true, false); useSmoothPixelArt(): (true, true); a new run: (false, false) */
export function setPixelArt(on: boolean, smooth: boolean = false) {
    pixelArt = on;
    smoothPixelArt = on && smooth;
    for (const source of sources) {
        if (source.destroyed) sources.delete(source);
        else applySampling(source);
    }
}

/** Filter a newly loaded texture as the program asked, now and on later changes. */
export function trackTexture<T extends PIXI.Texture>(texture: T): T {
    sources.add(texture.source);
    applySampling(texture.source);
    return texture;
}

/**
 * The setting is static, and statics of the library outlive a program run here.
 * A program that does not ask for pixel art must not inherit it from the
 * previous one, so every run starts out smooth again — before main(), where a
 * program calls usePixelArt().
 */
export function resetPixelArtOnEveryRun(interpreter: Interpreter) {
    // an interpreter without events (as in some tests) has no runs to tell apart
    if (!interpreter?.eventManager || watchedInterpreters.has(interpreter)) return;
    watchedInterpreters.add(interpreter);
    interpreter.eventManager.on("resetRuntime", () => { setPixelArt(false); setFrameSmoothing(0); });
}

function applySampling(source: PIXI.TextureSource) {
    const filter: PIXI.SCALE_MODE = pixelArt ? "nearest" : "linear";
    if (source.minFilter === filter && source.magFilter === filter) return;
    source.minFilter = filter;
    source.magFilter = filter;
    // the renderer caches its sampler by the style's id; this drops the old one
    source.style.update();
}
