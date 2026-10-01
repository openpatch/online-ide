import * as PIXI from "pixi.js";
import type { Interpreter } from "../../../../common/interpreter/Interpreter";
import { TextureSampling } from "./TextureSamplingEnum";

/**
 * How costumes are filtered when they are drawn larger or smaller than they are,
 * as Window.useTextureSampling sets it on the desktop.
 *
 * Pixel art drawn at three times its size turns blurry with the default linear
 * filter; POINT keeps every pixel a sharp square. The browser only knows
 * "nearest" and "linear", so BILINEAR and TRILINEAR are drawn like LINEAR.
 *
 * Costumes share their texture sources (one atlas holds hundreds of them, and an
 * image used by several sprites is loaded once), so the filter belongs to the
 * source and changes for every costume at once — upstream's setting is just as
 * global. Every source a costume can come from is registered here.
 */

let sampling: TextureSampling = TextureSampling.LINEAR;
const sources: Set<PIXI.TextureSource> = new Set();
const watchedInterpreters: WeakSet<Interpreter> = new WeakSet();

export function getTextureSampling(): TextureSampling {
    return sampling;
}

export function setTextureSampling(newSampling: TextureSampling) {
    sampling = newSampling;
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
 * A program that does not ask for POINT must not inherit it from the previous
 * one, so every run starts out linear again — before main(), where a program
 * calls useTextureSampling.
 */
export function resetTextureSamplingOnEveryRun(interpreter: Interpreter) {
    // an interpreter without events (as in some tests) has no runs to tell apart
    if (!interpreter?.eventManager || watchedInterpreters.has(interpreter)) return;
    watchedInterpreters.add(interpreter);
    interpreter.eventManager.on("resetRuntime", () => setTextureSampling(TextureSampling.LINEAR));
}

function applySampling(source: PIXI.TextureSource) {
    const filter: PIXI.SCALE_MODE = sampling === TextureSampling.POINT ? "nearest" : "linear";
    if (source.minFilter === filter && source.magFilter === filter) return;
    source.minFilter = filter;
    source.magFilter = filter;
    // the renderer caches its sampler by the style's id; this drops the old one
    source.style.update();
}
