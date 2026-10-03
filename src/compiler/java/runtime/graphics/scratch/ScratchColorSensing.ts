import * as PIXI from "pixi.js";
import type { ScratchLayers } from "./ScratchLayers";

/**
 * Scratch's "touching color?" and "color is touching color?", as upstream's
 * Sprite#isTouchingColor and Sprite#isColorTouchingColor.
 *
 * Upstream works the colours out on the CPU from the costumes, the backdrop and
 * a copy of its pen layers. Here the pen is vector graphics, so there is no pen
 * picture to look at; instead the few stage pixels around the sprite are drawn
 * twice into small offscreen textures - once without the sprite, once the
 * sprite on its own - and read back. That sees everything exactly as it is
 * drawn: pen lines, stamps, tints, the camera. The cost follows the size of the
 * sprite, not of the stage, plus one wait for the graphics card per question.
 *
 * Texts, speech bubbles, the debug overlay and UI sprites are left out, as
 * upstream leaves them out.
 */

/** What the colour check needs from a sprite. */
export type ColorSensingSprite = {
    container: PIXI.Container | undefined;
};

/** What the colour check needs from its stage. */
export type ColorSensingStage = {
    scratchLayers?: ScratchLayers;
    world: { width: number, height: number };
    backgroundColor: number;
};

/**
 * Per renderer: the two offscreen textures, resized only when a sprite needs
 * more room, a view onto each for reading them back, and the stand-in that is
 * drawn in the sprite's place. Rendering a container on its own turns it into
 * a render group of PIXI's for good, which the live sprite must not become,
 * so its costume is drawn through this stand-in instead.
 */
type Targets = { scene: PIXI.RenderTexture, self: PIXI.RenderTexture, sceneView: PIXI.Texture,
    selfView: PIXI.Texture, standIn: PIXI.Sprite };
const targets: WeakMap<PIXI.Renderer, Targets> = new WeakMap();

/**
 * Scratch's tolerance: red and green compared on their top five bits, blue on
 * its top four, so anti-aliased edges and nearly-equal colours still count.
 */
export function colorKey(r: number, g: number, b: number): number {
    return ((Math.round(r) & 0xf8) << 16) | ((Math.round(g) & 0xf8) << 8) | (Math.round(b) & 0xf0);
}

/**
 * Whether a painted pixel of the sprite lies over a colour.
 *
 * @param mine   only pixels of the sprite of this colour (a colorKey) count, or undefined
 * @param target the colour (a colorKey) to look for under the sprite
 */
export function isTouchingColor(renderer: PIXI.Renderer | undefined, stage: ColorSensingStage | undefined,
    sprite: ColorSensingSprite, mine: number | undefined, target: number): boolean {
    const layers = stage?.scratchLayers;
    const container = sprite.container;
    if (!renderer || !layers || !container || container.destroyed || !container.visible) return false;
    // a costume is a Sprite; the nine-slice of a UISprite is not, and UI sprites do not sense
    if (!(container instanceof PIXI.Sprite)) return false;

    // The sprite's transform on the stage: camera, then its layer, then itself.
    // They are taken from the containers' own local transforms, which the
    // sprite and the camera update at once, rather than from world transforms,
    // which are only brought up to date by the next frame.
    layers.camera.updateLocalTransform();
    layers.sprites.updateLocalTransform();
    container.updateLocalTransform();
    const placed = layers.camera.localTransform.clone()
        .append(layers.sprites.localTransform)
        .append(container.localTransform);

    const local = container.getLocalBounds();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of [[local.minX, local.minY], [local.maxX, local.minY], [local.minX, local.maxY], [local.maxX, local.maxY]]) {
        const p = placed.apply(new PIXI.Point(x, y));
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const left = Math.max(0, Math.floor(minX));
    const top = Math.max(0, Math.floor(minY));
    const right = Math.min(stage!.world.width, Math.ceil(maxX));
    const bottom = Math.min(stage!.world.height, Math.ceil(maxY));
    const width = right - left, height = bottom - top;
    if (width <= 0 || height <= 0) return false;

    const { scene, self, sceneView, selfView, standIn } = targetsFor(renderer, width, height);

    // the stage without the sprite, its texts and the debug overlay
    const hidden = [container, layers.texts, layers.debugWorld].filter(c => c.visible);
    for (const c of hidden) c.visible = false;
    try {
        renderer.render({
            container: layers.camera,
            target: scene,
            clear: true,
            // an array: the number 0 for black would be taken for "no colour"
            clearColor: PIXI.Color.shared.setValue(stage!.backgroundColor).toArray(),
            transform: layers.camera.localTransform.clone().translate(-left, -top),
        });
    } finally {
        for (const c of hidden) c.visible = true;
    }

    // The sprite's costume on its own, as upstream samples it: with its tint,
    // but at full opacity - a ghosted sprite still senses - and without its
    // shader.
    standIn.texture = container.texture;
    standIn.anchor.copyFrom(container.anchor);
    standIn.tint = container.tint;
    renderer.render({
        container: standIn,
        target: self,
        clear: true,
        clearColor: [0, 0, 0, 0],
        transform: placed.clone().translate(-left, -top),
    });

    for (const view of [sceneView, selfView]) {
        view.frame.width = width;
        view.frame.height = height;
    }
    const under = renderer.extract.pixels({ target: sceneView }).pixels;
    const own = renderer.extract.pixels({ target: selfView }).pixels;

    for (let i = 0; i < width * height * 4; i += 4) {
        const alpha = own[i + 3];
        if (alpha === 0) continue;
        if (mine !== undefined) {
            // the texture holds colours multiplied by their alpha
            const scale = 255 / alpha;
            if (colorKey(own[i] * scale, own[i + 1] * scale, own[i + 2] * scale) !== mine) continue;
        }
        if (colorKey(under[i], under[i + 1], under[i + 2]) === target) return true;
    }
    return false;
}

function targetsFor(renderer: PIXI.Renderer, width: number, height: number): Targets {
    let made = targets.get(renderer);
    if (!made) {
        const make = () => PIXI.RenderTexture.create({ width, height, resolution: 1 });
        const scene = make();
        const self = make();
        // the views are kept: a Texture listens to its source until it is destroyed
        made = {
            scene, self,
            sceneView: new PIXI.Texture({ source: scene.source, frame: new PIXI.Rectangle(0, 0, width, height) }),
            selfView: new PIXI.Texture({ source: self.source, frame: new PIXI.Rectangle(0, 0, width, height) }),
            standIn: new PIXI.Sprite(),
        };
        targets.set(renderer, made);
    }
    for (const texture of [made.scene, made.self]) {
        if (texture.width < width || texture.height < height) {
            texture.resize(Math.max(texture.width, width), Math.max(texture.height, height), 1);
        }
    }
    return made;
}
