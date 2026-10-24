import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { Layer, LayerEnum } from "./LayerEnum";
import { ScratchColorClass } from "./ScratchColorClass";
import { scratchLayerOf } from "./ScratchLayers";
import { activeScratchStage } from "./ScratchStages";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { SRC } from "./ScratchLibraryComments";
import { WeakIterableSet } from '../WeakIterableSet';

/**
 * Pen for drawing lines, mirroring org.openpatch.scratch.Pen (7.0). A pen may
 * be standalone or attached to a Sprite (the sprite pushes its position via
 * setPosition()); everything the sprite-related constructors did in 6.x is
 * internal now. Colour hue and transparency are 0 to 100, as in Scratch.
 *
 * Layers: BACKGROUND (default) draws on the shared pen canvas below the
 * sprites, FOREGROUND above them, UI on the screen-space canvas. MAIN shares
 * the background canvas here — the browser has no way to interleave a pen
 * with the sprites of the main layer.
 */
export class ScratchPenClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Pen extends Object", comment: SRC.penClassComment },

        { type: "method", signature: "Pen()", java: ScratchPenClass.prototype._cj$_constructor_$Pen$, comment: SRC.penConstructorComment },

        { type: "method", signature: "Color getColor()", native: ScratchPenClass.prototype._getColor, comment: SRC.penGetColorComment },
        { type: "method", signature: "void setColor(Color color)", native: ScratchPenClass.prototype._setColorObj, comment: SRC.penSetColorComment },
        { type: "method", signature: "void setColor(double hue)", native: ScratchPenClass.prototype._setColorHue, comment: SRC.penSetColor2Comment },
        { type: "method", signature: "void setColor(double red, double green, double blue)", native: ScratchPenClass.prototype._setColorRGB, comment: SRC.penSetColor3Comment },
        { type: "method", signature: "void changeColor(double by)", native: ScratchPenClass.prototype._changeColor, comment: SRC.penChangeColorComment },
        { type: "method", signature: "double getSize()", native: ScratchPenClass.prototype._getSize, comment: SRC.penGetSizeComment },
        { type: "method", signature: "void setSize(double size)", native: ScratchPenClass.prototype._setSize, comment: SRC.penSetSizeComment },
        { type: "method", signature: "void changeSize(double by)", native: ScratchPenClass.prototype._changeSize, comment: SRC.penChangeSizeComment },
        { type: "method", signature: "double getTransparency()", native: ScratchPenClass.prototype._getTransparency, comment: SRC.penGetTransparencyComment },
        { type: "method", signature: "void setTransparency(double transparency)", native: ScratchPenClass.prototype._setTransparency, comment: SRC.penSetTransparencyComment },
        { type: "method", signature: "void changeTransparency(double by)", native: ScratchPenClass.prototype._changeTransparency, comment: SRC.penChangeTransparencyComment },
        { type: "method", signature: "Layer getLayer()", native: ScratchPenClass.prototype._getLayer, comment: SRC.penGetLayerComment },
        { type: "method", signature: "void setLayer(Layer layer)", native: ScratchPenClass.prototype._setLayer, comment: SRC.penSetLayerComment },
        { type: "method", signature: "boolean isDown()", native: ScratchPenClass.prototype._isDown, comment: SRC.penIsDownComment },
        { type: "method", signature: "void down()", native: ScratchPenClass.prototype._down, comment: SRC.penDownComment },
        { type: "method", signature: "void up()", native: ScratchPenClass.prototype._up, comment: SRC.penUpComment },
        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchPenClass.prototype._setPosition, comment: SRC.penSetPositionComment },
        { type: "method", signature: "void setPosition(Vector2 position)", native: ScratchPenClass.prototype._setPositionV, comment: SRC.penSetPosition2Comment },
        { type: "method", signature: "void goToRandomPosition()", java: ScratchPenClass.prototype._mj$goToRandomPosition$void$, comment: SRC.penGoToRandomPositionComment },
        { type: "method", signature: "void goToMousePointer()", native: ScratchPenClass.prototype._goToMousePointer, comment: SRC.penGoToMousePointerComment },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchPenClass.prototype._getPosition, comment: SRC.penGetPositionComment },
        { type: "method", signature: "void stamp()", native: ScratchPenClass.prototype._stamp, comment: SRC.penStampComment },
        { type: "method", signature: "void eraseAll()", native: ScratchPenClass.prototype._eraseAll, comment: SRC.penEraseAllComment },
    ];

    static type: NonPrimitiveType;

    world!: IWorld;
    private layer?: PIXI.Graphics;

    /** Every live pen, so the stage can clear canvases. */
    private static allPens = new WeakMap<IWorld, WeakIterableSet<ScratchPenClass>>();

    px: number = 0;   // pen position in Scratch coords (centre origin, y up)
    py: number = 0;
    penDown: boolean = false;
    /** Whether a path has been begun and not yet closed, as upstream tracks. */
    private pathOpen: boolean = false;

    private color: ScratchColorClass = new ScratchColorClass(0, 0, 255);
    private colorInt: number = this.color._get() & 0xffffff;
    private size: number = 1;
    /** Transparency from 0 (opaque) to 100 (invisible), as in Scratch. */
    private transparency: number = 0;
    private penLayer: Layer = Layer.BACKGROUND;
    /** Set when the pen belongs to a sprite, so stamp() knows what to print. */
    sprite?: { _stamp(): void, _stampForeground(): void, isUI?(): boolean, stage?: object };
    /**
     * The stage this pen draws on: the one it was added to, or the one its sprite
     * belongs to. Until then it draws on the stage that is on screen.
     */
    stage?: object;

    _cj$_constructor_$Pen$(t: Thread, callback: CallbackParameter) {
        this.attachToWorld(t.scheduler.interpreter.retrieveObject("WorldClass") as IWorld);
        t.s.push(this);
        if (callback) callback();
    }

    /** Called by ScratchSpriteClass/ScratchStageClass to attach a pen without going through the interpreter. */
    attachToWorld(world: IWorld) {
        this.world = world;
        if (!world) return;
        let pens = ScratchPenClass.allPens.get(world);
        if (!pens) ScratchPenClass.allPens.set(world, pens = new WeakIterableSet());
        pens.add(this);
    }

    /** In-place copy of another pen's state (clones); see copyForClone. */
    _copyStateFrom(other: ScratchPenClass) {
        this.color = other.color;
        this.colorInt = other.colorInt;
        this.size = other.size;
        this.transparency = other.transparency;
        this.penLayer = other.penLayer;
        if (other.penDown) this._down(); else this._up();
    }

    /**
     * A copy of this pen for a clone, as 7.0's internal Pen(Pen, Sprite) does:
     * layer, colour, size and transparency, and down if it was.
     */
    copyForClone(sprite: ScratchPenClass["sprite"]): ScratchPenClass {
        const copy = new ScratchPenClass();
        copy.attachToWorld(this.world);
        copy.sprite = sprite;
        copy.px = this.px;
        copy.py = this.py;
        copy.color = this.color;
        copy.colorInt = this.colorInt;
        copy.size = this.size;
        copy.transparency = this.transparency;
        copy.penLayer = this.penLayer;
        if (this.penDown) copy._down(); else copy._up();
        return copy;
    }

    private containerName(): "pen" | "foregroundStamps" | "uiStamps" {
        if (this.penLayer === Layer.FOREGROUND) return "foregroundStamps";
        if (this.penLayer === Layer.UI) return "uiStamps";
        return "pen";   // BACKGROUND and MAIN
    }

    private getLayer(): PIXI.Graphics | undefined {
        if (!this.world) return undefined;
        if (!this.layer || this.layer.destroyed) {
            this.layer = new PIXI.Graphics();
            const penLayer = scratchLayerOf(this, this.containerName());
            if (penLayer) penLayer.addChild(this.layer);
            else this.world.app.stage.addChildAt(this.layer, 0);
        }
        return this.layer;
    }

    private toScreen(x: number, y: number): { x: number, y: number } {
        return { x: this.world.width / 2 + x, y: this.world.height / 2 - y };
    }

    private alpha(): number {
        return Math.max(0, Math.min(1, 1 - this.transparency / 100));
    }

    /**
     * Upstream's down() starts a path *with a point where the pen is*, so a pen
     * that is put down and lifted again without moving leaves a dot behind. A
     * lot of programs draw only that way - a dot every so often, at a new place
     * each time - and drawing nothing until the pen moves loses all of them.
     * Putting an already-down pen down again adds nothing, as upstream only
     * begins a path when the last one was closed.
     */
    _down() {
        this.penDown = true;
        if (this.pathOpen) return;
        this.pathOpen = true;
        this.drawDot(this.px, this.py);
    }

    _up() {
        this.penDown = false;
        this.pathOpen = false;
    }

    /**
     * The mark a single point leaves. Upstream draws every point as a filled
     * circle of half the pen size and joins consecutive points with a line of
     * the full size, so on its own a point is the smaller of the two.
     */
    private drawDot(x: number, y: number) {
        const layer = this.getLayer();
        if (!layer) return;
        const p = this.toScreen(x, y);
        layer.circle(p.x, p.y, this.size / 4).fill({ color: this.colorInt, alpha: this.alpha() });
    }

    _getColor(): ScratchColorClass { return this.color; }
    _setColorObj(color: ScratchColorClass) {
        if (color) { this.color = color; this.colorInt = color._get() & 0xffffff; }
    }
    _setColorHue(hue: number) {
        this.color = ScratchColorClass.fromHSB(hue, 100, 100)._withAlpha(this.color._getAlpha());
        this.colorInt = this.color._get() & 0xffffff;
    }
    _setColorRGB(red: number, green: number, blue: number) {
        this.color = new ScratchColorClass(red, green, blue);
        this.colorInt = this.color._get() & 0xffffff;
    }
    _changeColor(by: number) {
        this.color = this.color._withHue(this.color._getHue() + by);
        this.colorInt = this.color._get() & 0xffffff;
    }

    _getSize(): number { return this.size; }
    _setSize(size: number) { this.size = Math.max(1, size); }
    _changeSize(by: number) { this._setSize(this.size + by); }

    _getTransparency(): number { return this.transparency; }
    _setTransparency(transparency: number) { this.transparency = Math.max(0, Math.min(100, transparency)); }
    _changeTransparency(by: number) { this._setTransparency(this.transparency + by); }

    _getLayer(): LayerEnum { return LayerEnum.values[this.penLayer]; }
    _setLayer(layer: LayerEnum) {
        this.penLayer = Layer[layer.name as keyof typeof Layer];
        this.moveLayer();
    }

    _isDown(): boolean { return this.penDown; }

    /** Re-parent the existing drawing when the pen switches layer. */
    private moveLayer() {
        if (!this.layer || this.layer.destroyed || !this.world) return;
        const target = scratchLayerOf(this, this.containerName());
        if (target) target.addChild(this.layer);
    }

    /** Asked of the stage rather than the sprite class, which imports this module. */
    _goToMousePointer() {
        const stage = (this.stage ?? activeScratchStage<object>()) as
            { _getMouseX(): number, _getMouseY(): number } | undefined;
        if (stage?._getMouseX) this._setPosition(stage._getMouseX(), stage._getMouseY());
    }

    _mj$goToRandomPosition$void$(t: Thread, callback: CallbackParameter) {
        const w = this.world?.width ?? 480, h = this.world?.height ?? 360;
        this._setPosition(
            Math.round(-w / 2 + Math.random() * (w + 1)),
            Math.round(-h / 2 + Math.random() * (h + 1)));
        if (callback) callback();
    }

    _getPosition(): ScratchVector2Class { return new ScratchVector2Class(this.px, this.py); }

    _stamp() {
        // a stamp lands on the pen's own layer; the sprite owns the two stamp
        // canvases (below and above the sprites) until it takes a layer argument
        if (this.penLayer === Layer.FOREGROUND || this.penLayer === Layer.UI) this.sprite?._stampForeground();
        else this.sprite?._stamp();
    }

    _setPosition(x: number, y: number) {
        if (this.penDown) {
            const layer = this.getLayer();
            if (layer) {
                const a = this.toScreen(this.px, this.py);
                const b = this.toScreen(x, y);
                layer.moveTo(a.x, a.y).lineTo(b.x, b.y)
                    .stroke({ width: this.size, color: this.colorInt, alpha: this.alpha(), cap: "round", join: "round" });
            }
        }
        this.px = x;
        this.py = y;
    }
    _setPositionV(v: ScratchVector2Class) { if (v) this._setPosition(v.x, v.y); }

    /**
     * 7.0's eraseAll erases the canvas of the pen's whole layer, stamps and
     * other pens on it included, so the shared container is cleared here and
     * every pen drawing into it re-creates its graphics on its next move.
     */
    _eraseAll() {
        const container = scratchLayerOf(this, this.containerName());
        if (container) {
            for (const child of container.children.slice()) child.destroy();
        } else {
            this.getLayer()?.clear();
        }
    }

    /** Every pen that still lives in this world (internal). */
    static livePens(world: IWorld): Iterable<ScratchPenClass> {
        return ScratchPenClass.allPens.get(world) ?? [];
    }

    /** Clear only this pen's own drawing (internal). */
    _eraseOwnGraphics() { this.getLayer()?.clear(); }

    /** Stage lifecycle (internal; not part of the 7.0 API). */
    _removedFromStage(_stage: ObjectClass) {
        this._eraseOwnGraphics();
        if (this.world) ScratchPenClass.allPens.get(this.world)?.delete(this);
    }
}
