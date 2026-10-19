import * as PIXI from 'pixi.js';

// Maps and repeated stamps share the same frames, including after a room is
// rebuilt. A Texture subscribes to its source, so making one per cell per
// frame would keep every old texture alive for as long as the image is cached.
const frames = new WeakMap<PIXI.Texture, Map<string, PIXI.Texture>>();

export function tiledTexture(image: PIXI.Texture, x: number, y: number, width: number, height: number): PIXI.Texture {
    let textures = frames.get(image);
    if (!textures) frames.set(image, textures = new Map());
    const key = `${x},${y},${width},${height}`;
    let texture = textures.get(key);
    if (!texture || texture.destroyed) {
        texture = new PIXI.Texture({ source: image.source,
            frame: new PIXI.Rectangle(image.frame.x + x, image.frame.y + y, width, height) });
        textures.set(key, texture);
    }
    return texture;
}

/** An immutable layer snapshot, reused once eraseAll() has detached it. */
export class ScratchTiledStamp extends PIXI.Container {}

export function clearScratchStampLayer(layer: PIXI.Container | undefined): void {
    for (const stamp of layer?.removeChildren() ?? []) {
        // The Tiled map owns these snapshots. Other stamps are one-off copies.
        if (!(stamp instanceof ScratchTiledStamp)) stamp.destroy({ children: true });
    }
}
