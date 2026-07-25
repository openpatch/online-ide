import * as PIXI from 'pixi.js';

/**
 * The stage's drawing layers.
 *
 * Everything the camera moves lives inside `camera`, in this order:
 *   backdrop → pen → backgroundStamps → sprites → foregroundStamps
 * The `ui` layer sits outside it, so UI sprites and UI stamps stay put when the
 * camera pans or zooms — the same split upstream makes when it draws the main
 * buffer with the camera transform and the UI pass without it.
 *
 * Giving each kind of content its own container is what keeps the order stable.
 * Before this, everything that wanted to be at the back competed for child
 * index 0 of the PIXI root, so whatever was added last sank to the bottom and
 * stamps piled up in reverse.
 */
export type ScratchLayerName = "camera" | "backdrop" | "pen" | "backgroundStamps" | "sprites"
    | "foregroundStamps" | "debugWorld" | "ui" | "debugScreen";

export type ScratchLayers = Record<ScratchLayerName, PIXI.Container>;

/**
 * Inside the camera container, back to front. `debugWorld` is last so hitbox
 * outlines sit over the sprites they belong to, and it is inside the camera
 * because upstream draws the per-sprite debug with the camera transform applied.
 */
const INSIDE_CAMERA: ScratchLayerName[] = ["backdrop", "pen", "backgroundStamps", "sprites", "foregroundStamps", "debugWorld"];

export function createScratchLayers(root: PIXI.Container): ScratchLayers {
    const layers = {
        camera: new PIXI.Container(),
        backdrop: new PIXI.Container(),
        pen: new PIXI.Container(),
        backgroundStamps: new PIXI.Container(),
        sprites: new PIXI.Container(),
        foregroundStamps: new PIXI.Container(),
        debugWorld: new PIXI.Container(),
        ui: new PIXI.Container(),
        debugScreen: new PIXI.Container(),
    };
    root.addChild(layers.camera);
    for (const name of INSIDE_CAMERA) layers.camera.addChild(layers[name]);
    root.addChild(layers.ui);
    // outside the camera: the crosshair, FPS and camera readout are in screen
    // space, and this must cover everything else
    root.addChild(layers.debugScreen);
    return layers;
}

/**
 * Point the camera at (camX, camY) with the given zoom.
 *
 * A PIXI container maps a child at p to `position + scale * (p - pivot)`, and
 * the sprites already hold absolute screen coordinates for an unmoved camera.
 * Upstream's transform is translate(w/2, h/2) · scale(z) · translate(-camX, camY),
 * which comes out as position = centre and pivot = centre + (camX, -camY).
 */
export function applyCameraTransform(layers: ScratchLayers | undefined, width: number, height: number,
    camX: number, camY: number, zoom: number) {
    if (!layers) return;
    const camera = layers.camera;
    if (camera.destroyed) return;
    const scale = zoom / 100;
    camera.position.set(width / 2, height / 2);
    camera.pivot.set(width / 2 + camX, height / 2 - camY);
    camera.scale.set(scale, scale);
}

/** Look up a layer of the running stage; undefined before the stage exists. */
export function scratchLayerOf(world: any, name: ScratchLayerName): PIXI.Container | undefined {
    const stage = world?.interpreter?.retrieveObject("ScratchStage") as { scratchLayers?: ScratchLayers } | undefined;
    const layer = stage?.scratchLayers?.[name];
    return layer && !layer.destroyed ? layer : undefined;
}

/** Where a sprite's own display object belongs: UI sprites ignore the camera. */
export function spriteLayerOf(world: any, isUI: boolean): PIXI.Container | undefined {
    return scratchLayerOf(world, isUI ? "ui" : "sprites");
}
