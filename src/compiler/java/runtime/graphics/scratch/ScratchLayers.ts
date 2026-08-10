import * as PIXI from 'pixi.js';
import { activeScratchStage } from './ScratchStages';

/**
 * The stage's drawing layers.
 *
 * Everything the camera moves lives inside `camera`, in this order:
 *   backdrop → pen → backgroundStamps → sprites → texts → foregroundStamps
 * The `ui` layer sits outside it, so UI sprites and UI stamps stay put when the
 * camera pans or zooms — the same split upstream makes when it draws the main
 * buffer with the camera transform and the UI pass without it.
 *
 * Texts have a layer of their own above the sprites because upstream draws them
 * that way: its main buffer is every sprite and then every text. Sharing the
 * sprites' layer put a text behind any sprite added after it, and made
 * Text.goToBackLayer() mean something else here than it means there — where it
 * orders a text against the other texts.
 *
 * Giving each kind of content its own container is what keeps the order stable.
 * Before this, everything that wanted to be at the back competed for child
 * index 0 of the PIXI root, so whatever was added last sank to the bottom and
 * stamps piled up in reverse.
 */
export type ScratchLayerName = "root" | "camera" | "backdrop" | "pen" | "backgroundStamps" | "sprites"
    | "texts" | "foregroundStamps" | "debugWorld" | "ui" | "uiTexts" | "debugScreen";

export type ScratchLayers = Record<ScratchLayerName, PIXI.Container>;

/**
 * Inside the camera container, back to front. `debugWorld` is last so hitbox
 * outlines sit over the sprites they belong to, and it is inside the camera
 * because upstream draws the per-sprite debug with the camera transform applied.
 */
const INSIDE_CAMERA: ScratchLayerName[] = ["backdrop", "pen", "backgroundStamps", "sprites", "texts", "foregroundStamps", "debugWorld"];

/**
 * Build a set of layers for one stage.
 *
 * Everything belonging to the stage hangs below its own `root`, which is what
 * lets several stages coexist: showing a stage is `root.visible = true` and
 * hiding it leaves its sprites, pens and stamps untouched underneath.
 */
export function createScratchLayers(parent: PIXI.Container): ScratchLayers {
    const layers = {
        root: new PIXI.Container(),
        camera: new PIXI.Container(),
        backdrop: new PIXI.Container(),
        pen: new PIXI.Container(),
        backgroundStamps: new PIXI.Container(),
        sprites: new PIXI.Container(),
        texts: new PIXI.Container(),
        foregroundStamps: new PIXI.Container(),
        debugWorld: new PIXI.Container(),
        ui: new PIXI.Container(),
        uiTexts: new PIXI.Container(),
        debugScreen: new PIXI.Container(),
    };
    layers.root.addChild(layers.camera);
    for (const name of INSIDE_CAMERA) layers.camera.addChild(layers[name]);
    layers.root.addChild(layers.ui);
    // and above the UI sprites, the same way texts sit above the sprites
    layers.root.addChild(layers.uiTexts);
    // outside the camera: the crosshair, FPS and camera readout are in screen
    // space, and this must cover everything else
    layers.root.addChild(layers.debugScreen);
    parent.addChild(layers.root);
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

/**
 * The stage whose layers `context` draws into: the stage itself, the stage a
 * sprite/pen/text was added to, or — for something not yet added anywhere — the
 * stage currently on screen.
 */
function stageOf(context: any): { scratchLayers?: ScratchLayers } | undefined {
    if (context?.scratchLayers) return context;
    const owner = context?.stage;
    if (owner?.scratchLayers) return owner;
    return activeScratchStage<{ scratchLayers?: ScratchLayers }>();
}

/**
 * Look up one of a stage's layers; undefined before the stage has any.
 *
 * Pass the object that wants to draw (a sprite, pen or text) rather than the
 * world, so that what it draws lands on the stage it belongs to and not on
 * whichever stage happens to be showing.
 */
export function scratchLayerOf(context: any, name: ScratchLayerName): PIXI.Container | undefined {
    const layer = stageOf(context)?.scratchLayers?.[name];
    return layer && !layer.destroyed ? layer : undefined;
}

/** Where a sprite's own display object belongs: UI sprites ignore the camera. */
export function spriteLayerOf(context: any, isUI: boolean): PIXI.Container | undefined {
    return scratchLayerOf(context, isUI ? "ui" : "sprites");
}

/** Where a text belongs: above the sprites, and UI texts above the UI sprites. */
export function textLayerOf(context: any, isUI: boolean): PIXI.Container | undefined {
    return scratchLayerOf(context, isUI ? "uiTexts" : "texts");
}
