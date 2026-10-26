import * as PIXI from "pixi.js";
import type { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchColorClass } from "./ScratchColorClass";
import { ScratchCostumes } from "./ScratchCostumes";
import { isScratchShaderFilter } from "./ScratchShaders";
import type { ScratchLayers } from "./ScratchLayers";
import { SRC } from "./ScratchLibraryComments";
import { activeScratchStage } from "./ScratchStages";

/** What Pixels.of(stage) needs from a stage. */
type PixelsStage = {
    scratchLayers?: ScratchLayers;
    world: { width: number, height: number, app?: { renderer?: PIXI.Renderer } };
    _getColor?(): ScratchColorClass | undefined;
};

/**
 * org.openpatch.scratch.Pixels: the pixels of the stage or of an image file,
 * read on the spot. Coordinates count pixels from the top left corner.
 *
 * Upstream composes the stage's world layers on the CPU; here they are drawn
 * once into an offscreen texture of the stage's size and read back, as colour
 * sensing does (ScratchColorSensing). The same parts are left out as upstream
 * leaves them out: texts, shaders, the debug overlay and the UI layer, which
 * sits outside the camera container.
 */
export class ScratchPixelsClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Pixels extends Object", comment: SRC.pixelsClassComment },
        { type: "method", signature: "static Pixels of(Stage stage)", native: ScratchPixelsClass._ofStage, comment: SRC.pixelsOfComment },
        { type: "method", signature: "static Pixels of(string path)", java: ScratchPixelsClass._ofPath, comment: SRC.pixelsOf2Comment },
        { type: "method", signature: "int getWidth()", native: ScratchPixelsClass.prototype._getWidth, comment: SRC.pixelsGetWidthComment },
        { type: "method", signature: "int getHeight()", native: ScratchPixelsClass.prototype._getHeight, comment: SRC.pixelsGetHeightComment },
        { type: "method", signature: "Color getColor(int x, int y)", native: ScratchPixelsClass.prototype._getColor, comment: SRC.pixelsGetColorComment },
        { type: "method", signature: "int getArgb(int x, int y)", native: ScratchPixelsClass.prototype._getArgb, comment: SRC.pixelsGetArgbComment },
    ];
    static type: NonPrimitiveType;

    private width = 0;
    private height = 0;
    /** straight ARGB, row by row from the top left, as upstream's int[] */
    private argb: Int32Array = new Int32Array(0);

    /** From the renderer's premultiplied RGBA bytes. */
    static fromRgba(width: number, height: number, rgba: ArrayLike<number>): ScratchPixelsClass {
        const pixels = new ScratchPixelsClass();
        pixels.width = width;
        pixels.height = height;
        pixels.argb = new Int32Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const a = rgba[i * 4 + 3];
            if (a === 0) continue;
            const scale = 255 / a;
            const r = Math.min(255, Math.round(rgba[i * 4] * scale));
            const g = Math.min(255, Math.round(rgba[i * 4 + 1] * scale));
            const b = Math.min(255, Math.round(rgba[i * 4 + 2] * scale));
            pixels.argb[i] = (a << 24) | (r << 16) | (g << 8) | b;
        }
        return pixels;
    }

    static _ofStage(stage: PixelsStage): ScratchPixelsClass {
        const layers = stage?.scratchLayers;
        const renderer = stage?.world?.app?.renderer ?? activeScratchStage<PixelsStage>()?.world?.app?.renderer;
        if (!layers || !renderer) {
            throw new RuntimeExceptionClass("Pixels.of(stage) braucht eine Bühne in einem Fenster / needs a stage in a window");
        }
        const width = stage.world.width, height = stage.world.height;
        // the stage colour under everything, white unless set (as colour sensing)
        const colour = stage._getColor?.();
        const background = colour ? colour._get() & 0xffffff : 0xffffff;
        const target = PIXI.RenderTexture.create({ width, height, resolution: 1 });

        // what the world layers show, without texts, shaders and the debug overlay
        const hidden = [layers.texts, layers.debugWorld].filter(c => c.visible);
        const filtered: [PIXI.Container, PIXI.Filter[]][] = [];
        // the shaders go, the effects (colour effect, ghost) stay, as upstream
        const unfilter = (c: PIXI.Container) => {
            const filters = c.filters as PIXI.Filter[] | null | undefined;
            if (filters && filters.some(isScratchShaderFilter)) {
                filtered.push([c, filters]);
                c.filters = filters.filter(f => !isScratchShaderFilter(f));
            }
            for (const child of c.children) unfilter(child);
        };
        for (const c of hidden) c.visible = false;
        unfilter(layers.camera);
        try {
            renderer.render({
                container: layers.camera,
                target,
                clear: true,
                // an array: the number 0 for black would be taken for "no colour"
                clearColor: PIXI.Color.shared.setValue(background).toArray(),
                transform: layers.camera.localTransform.clone(),
            });
            const read = renderer.extract.pixels({ target });
            return ScratchPixelsClass.fromRgba(read.width, read.height, read.pixels);
        } finally {
            for (const c of hidden) c.visible = true;
            for (const [c, filters] of filtered) c.filters = filters;
            target.destroy(true);
        }
    }

    /** An image's pixels; a URL that is not loaded yet is loaded first, the thread waiting. */
    static _ofPath(t: Thread, path: string) {
        ScratchCostumes.whenLoaded(t, [path], undefined, () => {
            const texture = ScratchCostumes.getTexture(path)!;
            const renderer = activeScratchStage<PixelsStage>()?.world?.app?.renderer;
            t.s.push(renderer ? ScratchPixelsClass.ofTexture(renderer, texture) : ScratchPixelsClass.ofImage(texture));
        });
    }

    private static ofTexture(renderer: PIXI.Renderer, texture: PIXI.Texture): ScratchPixelsClass {
        const read = renderer.extract.pixels({ target: texture });
        return ScratchPixelsClass.fromRgba(read.width, read.height, read.pixels);
    }

    /** Before a window exists: through a 2D canvas, from the texture's image. */
    private static ofImage(texture: PIXI.Texture): ScratchPixelsClass {
        const width = Math.round(texture.frame.width), height = Math.round(texture.frame.height);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d")!;
        const resource = texture.source.resource as CanvasImageSource;
        context.drawImage(resource, texture.frame.x, texture.frame.y, width, height, 0, 0, width, height);
        // getImageData hands out straight colours; fromRgba expects premultiplied ones
        const data = context.getImageData(0, 0, width, height).data;
        const premultiplied = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            premultiplied[i] = data[i] * a / 255;
            premultiplied[i + 1] = data[i + 1] * a / 255;
            premultiplied[i + 2] = data[i + 2] * a / 255;
            premultiplied[i + 3] = a;
        }
        return ScratchPixelsClass.fromRgba(width, height, premultiplied);
    }

    _getWidth(): number { return this.width; }
    _getHeight(): number { return this.height; }

    /** as upstream: transparent black outside */
    _getArgb(x: number, y: number): number {
        return x < 0 || y < 0 || x >= this.width || y >= this.height ? 0 : this.argb[y * this.width + x];
    }

    _getColor(x: number, y: number): ScratchColorClass {
        return ScratchColorClass._fromARGB(this._getArgb(x, y));
    }
}
