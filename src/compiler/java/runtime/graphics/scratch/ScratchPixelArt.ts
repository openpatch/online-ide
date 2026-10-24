import * as PIXI from "pixi.js";
import type { Interpreter } from "../../../../common/interpreter/Interpreter";

/**
 * 7.0's Window.usePixelArt(): nearest-neighbour filtering for every costume,
 * so pixel art scaled up keeps sharp squares; useSmoothPixelArt() goes back to
 * the default linear filter.
 *
 * Costumes share their texture sources (one atlas holds hundreds of them, and
 * an image used by several sprites is loaded once), so the filter belongs to
 * the source and changes for every costume at once — upstream's setting is
 * just as global. Every source a costume can come from is registered here.
 */

let pixelArt = false;
const sources: Set<PIXI.TextureSource> = new Set();
const watchedInterpreters: WeakSet<Interpreter> = new WeakSet();

export function isPixelArt(): boolean {
    return pixelArt;
}

export function setPixelArt(on: boolean) {
    pixelArt = on;
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
    interpreter.eventManager.on("resetRuntime", () => setPixelArt(false));
}

function applySampling(source: PIXI.TextureSource) {
    const filter: PIXI.SCALE_MODE = pixelArt ? "nearest" : "linear";
    if (source.minFilter === filter && source.magFilter === filter) return;
    source.minFilter = filter;
    source.magFilter = filter;
    // the renderer caches its sampler by the style's id; this drops the old one
    source.style.update();
}
