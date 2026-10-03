import * as PIXI from "pixi.js";
import type { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import type { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchWorkspaceAssets } from "./ScratchWorkspaceAssets";
import { trackTexture } from "./ScratchTextureSampling";
import { resolveAssetUrl } from "./ScratchAssetUrls";

// Kenney atlases imported by src/development/scratchAssetsGenerator.js.
// Both JSON descriptor and PNG are imported as hashed asset URLs (loaded on demand);
// the descriptor is fetched + parsed at runtime, matching the main spritesheet.
import platformerJson from "/assets/graphics/scratch/platformer.json.txt";
import platformerPng from "/assets/graphics/scratch/platformer.png";
import jumperJson from "/assets/graphics/scratch/jumper.json.txt";
import jumperPng from "/assets/graphics/scratch/jumper.png";
import spaceShooterJson from "/assets/graphics/scratch/space_shooter.json.txt";
import spaceShooterPng from "/assets/graphics/scratch/space_shooter.png";
import tappyPlaneJson from "/assets/graphics/scratch/tappy_plane.json.txt";
import tappyPlanePng from "/assets/graphics/scratch/tappy_plane.png";

type SheetDef = { name: string; json: string; png: string };

// Resolution order: a bare costume name resolves to the FIRST sheet defining it.
const SHEET_DEFS: SheetDef[] = [
    { name: "platformer", json: platformerJson, png: platformerPng },
    { name: "jumper", json: jumperJson, png: jumperPng },
    { name: "space_shooter", json: spaceShooterJson, png: spaceShooterPng },
    { name: "tappy_plane", json: tappyPlaneJson, png: tappyPlanePng },
];

/**
 * Registry of the built-in kenney.nl costumes bundled with the Scratch library.
 * Loaded once (lazily) the first time a Stage is created. Lookup is case-insensitive
 * by bare name (`"bunny1_stand"`) across the sheets in order, or sheet-qualified
 * (`"jumper/spring"`) to disambiguate names that appear in more than one sheet.
 */
export class ScratchCostumes {
    private static sheets: Map<string, PIXI.Spritesheet> = new Map();
    // lower-cased bare name -> sheet name (first sheet that defines it)
    private static bareNameToSheet: Map<string, string> = new Map();
    private static loadPromise: Promise<void> | undefined;
    private static externalTextures: Map<string, Promise<PIXI.Texture>> = new Map();
    // the same images once they have arrived, for the synchronous lookups
    private static loadedTextures: Map<string, PIXI.Texture> = new Map();
    // "sheet/frame" (lower-cased) -> the way that built-in is drawn facing, for
    // the ones the atlas says do not face right
    private static drawnFacing: Map<string, number> = new Map();
    // a texture -> the same picture turned to face right from each direction
    private static turnedTextures: Map<PIXI.Texture, Map<number, PIXI.Texture>> = new Map();

    static load(): Promise<void> {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = (async () => {
            for (const def of SHEET_DEFS) {
                try {
                    const data: any = await fetch(def.json).then(r => r.json());
                    const texture: PIXI.Texture = trackTexture(await PIXI.Assets.load(def.png));
                    data.meta = { ...data.meta, size: { w: texture.width, h: texture.height } };
                    const sheet = new PIXI.Spritesheet(texture, data);
                    await sheet.parse();
                    this.sheets.set(def.name, sheet);
                    for (const frameName of Object.keys(data.frames)) {
                        const key = frameName.toLowerCase();
                        if (!this.bareNameToSheet.has(key)) this.bareNameToSheet.set(key, def.name);
                        const direction = data.frames[frameName].direction;
                        if (direction !== undefined) this.drawnFacing.set(def.name + "/" + key, direction);
                    }
                } catch (e) {
                    // A missing sheet must not break the whole library.
                    console.warn(`Scratch: could not load costume sheet '${def.name}'`, e);
                }
            }
        })();
        return this.loadPromise;
    }

    /**
     * Resolve a costume name to a texture, or undefined if unknown. An image of
     * the workspace wins over a built-in costume, as a file next to the program
     * does on the desktop.
     */
    static getTexture(name: string): PIXI.Texture | undefined {
        const own = ScratchWorkspaceAssets.getTexture(name);
        if (own) return own;

        // an image URL this page has already loaded, e.g. by addCostume
        const loaded = this.loadedTextures.get(resolveAssetUrl(name));
        if (loaded) return loaded;

        // strip an optional .png suffix students might copy from the atlas
        name = name.replace(/\.png$/i, "");

        const slash = name.indexOf("/");
        if (slash >= 0) {
            const sheetName = name.substring(0, slash);
            const frame = name.substring(slash + 1);
            return this.textureFromSheet(sheetName, frame);
        }

        const sheetName = this.bareNameToSheet.get(name.toLowerCase());
        if (!sheetName) return undefined;
        return this.textureFromSheet(sheetName, name);
    }

    static has(name: string): boolean {
        return this.getTexture(name) !== undefined;
    }

    /**
     * Resolve a bundled costume or load an image URL. External images are cached,
     * so using the same URL for several sprites only downloads it once.
     *
     * The browser's normal CORS rules apply. Loading through PIXI (instead of an
     * HTMLImageElement without CORS) also keeps the texture readable for hitboxes
     * and other pixel based operations.
     */
    static async loadTexture(nameOrUrl: string): Promise<PIXI.Texture> {
        const bundled = this.getTexture(nameOrUrl);
        if (bundled) return bundled;

        // a relative path is relative to the project folder, see ScratchAssetUrls
        const url = resolveAssetUrl(nameOrUrl);
        let pending = this.externalTextures.get(url);
        if (!pending) {
            pending = PIXI.Assets.load<PIXI.Texture>(url).then(texture => {
                if (!texture) throw new Error("The response is not a supported image");
                this.loadedTextures.set(url, texture);
                return trackTexture(texture);
            });
            this.externalTextures.set(url, pending);
            // A temporary network problem must not poison the cache forever.
            pending.catch(() => this.externalTextures.delete(url));
        }
        return pending;
    }

    /**
     * Run `action` once every image in `paths` can be looked up with getTexture,
     * then continue the program.
     *
     * Cutting costumes out of a sprite sheet, or naming the frames of an
     * animation, happens synchronously on textures that are already there — which
     * built-in costumes and workspace files are, but an image URL is not until it
     * has been downloaded. Such URLs are loaded first, the thread waiting as it
     * does for addCostume(name, url); everything else runs at once.
     */
    static whenLoaded(t: Thread, paths: string[], callback: CallbackParameter, action: () => void) {
        const missing = [...new Set(paths)].filter(path => !this.getTexture(path));
        if (missing.length === 0) {
            action();
            if (callback) callback();
            return;
        }

        const oldState = t.state;
        t.state = ThreadState.waiting;
        Promise.all(missing.map(path => this.loadTexture(path).catch(reason => {
            throw new RuntimeExceptionClass(
                `Bild konnte nicht geladen werden / could not load image '${path}': ${reason}`);
        }))).then(() => {
            t.state = oldState;
            action();
            if (callback) callback();
        }).catch(exception => {
            t.state = oldState;
            t.throwRuntimeExceptionOnLastExecutedStep(exception instanceof RuntimeExceptionClass
                ? exception : new RuntimeExceptionClass(String(exception)));
        });
    }

    private static textureFromSheet(sheetName: string, frame: string): PIXI.Texture | undefined {
        const sheet = this.sheets.get(sheetName.toLowerCase());
        if (!sheet) return undefined;
        // spritesheet.textures is keyed by the exact frame name; match case-insensitively
        const key = sheet.textures[frame] ? frame
            : Object.keys(sheet.textures).find(k => k.toLowerCase() === frame.toLowerCase());
        if (!key) return undefined;
        // Every built-in with a front faces right, as on the desktop; the atlas
        // names the ones Kenney drew facing another way.
        const facing = this.drawnFacing.get(sheetName.toLowerCase() + "/" + key.toLowerCase());
        return facing === undefined ? sheet.textures[key] : this.turnToFaceRight(sheet.textures[key], facing);
    }

    /**
     * Maps a direction onto 0, 90, 180 or 270, as upstream's Image does, or
     * explains why it cannot.
     */
    static normaliseDirection(direction: number): number {
        const degrees = ((direction % 360) + 360) % 360;
        if (degrees % 90 !== 0) {
            throw new RuntimeExceptionClass(
                "Ein Bild kann nur nach oben (0), rechts (90), unten (180) oder links (-90) schauen, nicht " + direction + ". / "
                + "A picture can only be drawn facing up (0), right (90), down (180) or left (-90), not " + direction + ".");
        }
        return degrees;
    }

    /**
     * The picture of `texture`, which is drawn facing `direction`, turned so that
     * it faces right — the way a sprite faces at direction 90. Upstream's
     * Image.turnToFaceRight: a picture facing up is turned a quarter clockwise,
     * one facing down a quarter anticlockwise, and one facing left is mirrored,
     * so that it stays upright.
     *
     * The result is a texture of its own rather than a rotated view of the atlas,
     * so cutting tiles out of it by its frame keeps working. It is made once per
     * texture and direction.
     */
    static turnToFaceRight(texture: PIXI.Texture, direction: number): PIXI.Texture {
        const facing = this.normaliseDirection(direction);
        if (facing === 90) return texture;

        let byDirection = this.turnedTextures.get(texture);
        if (!byDirection) {
            byDirection = new Map();
            this.turnedTextures.set(texture, byDirection);
        }
        const cached = byDirection.get(facing);
        if (cached) return cached;

        const { x, y, width: w, height: h } = texture.frame;
        const quarter = facing !== 270;
        const canvas = document.createElement("canvas");
        canvas.width = quarter ? h : w;
        canvas.height = quarter ? w : h;
        const context = canvas.getContext("2d")!;
        context.imageSmoothingEnabled = false;
        switch (facing) {
            // up: the top edge becomes the right edge
            case 0: context.translate(h, 0); context.rotate(Math.PI / 2); break;
            // down: the bottom edge becomes the right edge
            case 180: context.translate(0, w); context.rotate(-Math.PI / 2); break;
            // left: mirrored
            default: context.translate(w, 0); context.scale(-1, 1); break;
        }
        context.drawImage(texture.source.resource as CanvasImageSource, x, y, w, h, 0, 0, w, h);

        const turned = trackTexture(PIXI.Texture.from(canvas));
        byDirection.set(facing, turned);
        return turned;
    }

    private static contentBoundsCache: Map<PIXI.Texture, ContentBounds> = new Map();

    /**
     * The part of a costume that has anything painted on it, in the costume's own
     * pixels.
     *
     * <p>Costumes are drawn into a canvas bigger than what they use — a standing
     * pose in a costume tall enough to also hold a jumping one — and upstream's
     * Sprite#getHitbox wraps the painted pixels rather than that whole canvas, so
     * that colliding with the empty space around a sprite is not possible. The
     * Kenney atlases are packed untrimmed (`"trimmed": false` in every frame), so
     * there is nothing to read it off and the pixels have to be looked at. That
     * happens once per costume, the first time one is worn.
     */
    static contentBounds(texture: PIXI.Texture, renderer: PIXI.Renderer | undefined): ContentBounds {
        const whole: ContentBounds = { x: 0, y: 0, width: texture.width, height: texture.height };
        if (!renderer || texture.width === 0 || texture.height === 0) return whole;

        const cached = this.contentBoundsCache.get(texture);
        if (cached) return cached;

        let bounds = whole;
        const sprite = new PIXI.Sprite(texture);
        try {
            const { pixels, width, height } = renderer.extract.pixels(sprite);
            let minX = width, minY = height, maxX = -1, maxY = -1;
            for (let y = 0; y < height; y++) {
                const row = y * width * 4;
                for (let x = 0; x < width; x++) {
                    // the same test upstream makes: anything not fully transparent
                    if (pixels[row + x * 4 + 3] !== 0) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (maxX >= 0) {
                bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
            }
        } catch (e) {
            // a costume whose pixels cannot be read keeps its whole rectangle
            console.warn("Scratch: could not measure a costume", e);
        } finally {
            sprite.destroy();
        }

        this.contentBoundsCache.set(texture, bounds);
        return bounds;
    }
}

/** A rectangle in a costume's own pixels. */
export type ContentBounds = { x: number, y: number, width: number, height: number };
