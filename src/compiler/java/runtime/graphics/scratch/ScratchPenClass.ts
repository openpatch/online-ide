import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { ScratchColorClass } from "./ScratchColorClass";
import { scratchLayerOf } from "./ScratchLayers";
import { ScratchVector2Class } from "./ScratchVector2Class";

/**
 * Pen for drawing lines, mirroring org.openpatch.scratch.Pen (core subset).
 * A pen may be standalone or attached to a Sprite; when attached, the sprite
 * pushes its position via setPosition() so the pen draws as the sprite moves.
 */
export class ScratchPenClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Pen extends Object", comment: "Stift, mit dem auf die Bühne gezeichnet werden kann" },

        { type: "method", signature: "Pen()", java: ScratchPenClass.prototype._cj$_constructor_$Pen$, comment: "Erzeugt einen neuen Stift" },

        { type: "method", signature: "void down()", native: ScratchPenClass.prototype._down, comment: "Senkt den Stift ab, so dass er beim Bewegen zeichnet" },
        { type: "method", signature: "void up()", native: ScratchPenClass.prototype._up, comment: "Hebt den Stift an, so dass er nicht mehr zeichnet" },
        { type: "method", signature: "void setColor(Color c)", native: ScratchPenClass.prototype._setColorObj, comment: "Setzt die Stiftfarbe" },
        { type: "method", signature: "void setColor(double h)", native: ScratchPenClass.prototype._setColorHue, comment: "Setzt die Stiftfarbe über den Farbton (0 bis 255)" },
        { type: "method", signature: "void setColor(double r, double g, double b)", native: ScratchPenClass.prototype._setColorRGB, comment: "Setzt die Stiftfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)" },
        { type: "method", signature: "void changeColor(double c)", native: ScratchPenClass.prototype._changeColor, comment: "Ändert den Farbton des Stifts um den angegebenen Wert" },
        { type: "method", signature: "void setSize(double size)", native: ScratchPenClass.prototype._setSize, comment: "Setzt die Strichstärke" },
        { type: "method", signature: "double getSize()", native: ScratchPenClass.prototype._getSize, comment: "Gibt die Strichstärke zurück" },
        { type: "method", signature: "void changeSize(double size)", native: ScratchPenClass.prototype._changeSize, comment: "Ändert die Strichstärke um den angegebenen Wert" },
        { type: "method", signature: "Color getColor()", native: ScratchPenClass.prototype._getColor, comment: "Gibt die Stiftfarbe zurück" },
        { type: "method", signature: "void setTransparency(double transparency)", native: ScratchPenClass.prototype._setTransparency, comment: "Setzt die Deckkraft von 0 (unsichtbar) bis 255 (deckend)" },
        { type: "method", signature: "void changeTransparency(double step)", native: ScratchPenClass.prototype._changeTransparency, comment: "Ändert die Deckkraft um den angegebenen Wert" },
        { type: "method", signature: "void goToBackground()", native: ScratchPenClass.prototype._goToBackground, comment: "Zeichnet hinter den Figuren" },
        { type: "method", signature: "void goToForeground()", native: ScratchPenClass.prototype._goToForeground, comment: "Zeichnet vor den Figuren" },
        { type: "method", signature: "boolean isInBackground()", native: ScratchPenClass.prototype._isInBackground, comment: "Gibt genau dann true zurück, wenn der Stift hinter den Figuren zeichnet" },
        { type: "method", signature: "void goToRandomPosition()", java: ScratchPenClass.prototype._mj$goToRandomPosition$void$, comment: "Setzt den Stift an eine zufällige Position der Bühne" },
        { type: "method", signature: "void goToMousePointer()", native: ScratchPenClass.prototype._goToMousePointer, comment: "Setzt den Stift auf die Position des Mauszeigers" },
        { type: "method", signature: "void stamp()", native: ScratchPenClass.prototype._stamp, comment: "Druckt ein Abbild der zugehörigen Figur auf die Bühne" },
        { type: "method", signature: "String toString()", java: ScratchPenClass.prototype._mj$toString$String$, comment: "Gibt den Stift als Zeichenkette zurück" },
        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchPenClass.prototype._setPosition, comment: "Setzt den Stift an die angegebene Position; bei abgesenktem Stift wird eine Linie gezeichnet" },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchPenClass.prototype._setPositionV, comment: "Setzt den Stift an die angegebene Position; bei abgesenktem Stift wird eine Linie gezeichnet" },
        { type: "method", signature: "void eraseAll()", native: ScratchPenClass.prototype._eraseAll, comment: "Löscht alles Gezeichnete" },
        { type: "method", signature: "void addedToStage(Stage stage)", native: ScratchPenClass.prototype._addedToStage, comment: "Wird aufgerufen, wenn der Stift der Bühne hinzugefügt wird" },
        { type: "method", signature: "void removedFromStage(Stage stage)", native: ScratchPenClass.prototype._removedFromStage, comment: "Wird aufgerufen, wenn der Stift von der Bühne entfernt wird" },
    ];

    static type: NonPrimitiveType;

    world!: IWorld;
    private layer?: PIXI.Graphics;

    /** Every live pen, so Stage.eraseAll() can clear all of them at once. */
    private static allPens: ScratchPenClass[] = [];

    px: number = 0;   // pen position in Scratch coords (centre origin, y up)
    py: number = 0;
    penDown: boolean = false;

    private colorHue: ScratchColorClass = ScratchColorClass.fromHue(0);   // upstream: new Color(0)
    private colorInt: number = ScratchColorClass.fromHue(0)._get() & 0xffffff;
    private size: number = 1;
    /** Upstream stores an opacity of 0..255, where 255 is fully opaque. */
    private opacity: number = 255;
    /** false = draws below the sprites, which is upstream's default. */
    private foreground: boolean = false;
    /** Set when the pen belongs to a sprite, so stamp() knows what to print. */
    sprite?: { _stamp(): void, _stampForeground(): void };

    _cj$_constructor_$Pen$(t: Thread, callback: CallbackParameter) {
        this.attachToWorld(t.scheduler.interpreter.retrieveObject("WorldClass") as IWorld);
        t.s.push(this);
        if (callback) callback();
    }

    /** Called by ScratchSpriteClass/ScratchStageClass to attach a pen without going through the interpreter. */
    attachToWorld(world: IWorld) {
        this.world = world;
        if (ScratchPenClass.allPens.indexOf(this) < 0) ScratchPenClass.allPens.push(this);
    }

    /** Stage.eraseAll(): clear every pen layer belonging to this world. */
    static eraseAllLayers(world: IWorld) {
        for (const pen of ScratchPenClass.allPens) {
            if (pen.world === world) pen._eraseAll();
        }
    }

    private getLayer(): PIXI.Graphics | undefined {
        if (!this.world) return undefined;
        if (!this.layer || this.layer.destroyed) {
            this.layer = new PIXI.Graphics();
            // draw beneath the sprites, above the backdrop
            const penLayer = scratchLayerOf(this.world, this.foreground ? "foregroundStamps" : "pen");
            if (penLayer) penLayer.addChild(this.layer);
            else this.world.app.stage.addChildAt(this.layer, 0);
        }
        return this.layer;
    }

    private toScreen(x: number, y: number): { x: number, y: number } {
        return { x: this.world.width / 2 + x, y: this.world.height / 2 - y };
    }

    _down() { this.penDown = true; }
    _up() { this.penDown = false; }

    _setColorObj(c: ScratchColorClass) { if (c) { this.colorHue = c; this.colorInt = c._get() & 0xffffff; } }
    _setColorHue(h: number) { this.colorHue = new ScratchColorClass(); this.colorHue._cHue(h); this.colorInt = this.colorHue._get() & 0xffffff; }
    _setColorRGB(r: number, g: number, b: number) { this.colorHue = new ScratchColorClass(); this.colorHue._cRGB(r, g, b); this.colorInt = this.colorHue._get() & 0xffffff; }
    _changeColor(c: number) { this.colorHue._changeColor(c); this.colorInt = this.colorHue._get() & 0xffffff; }

    _setSize(size: number) { this.size = size; }
    _getSize(): number { return this.size; }
    _changeSize(size: number) { this.size += size; }
    _getColor(): ScratchColorClass { return this.colorHue; }
    // NOTE: this is an opacity of 0..255 (255 = opaque), not a percentage —
    // upstream hands the value straight to Processing's stroke alpha.
    _setTransparency(transparency: number) { this.opacity = transparency; }
    _changeTransparency(step: number) { this._setTransparency((this.opacity + step) % 255); }

    _goToBackground() { this.foreground = false; this.moveLayer(); }
    _goToForeground() { this.foreground = true; this.moveLayer(); }
    _isInBackground(): boolean { return !this.foreground; }

    /** Re-parent the existing drawing when the pen switches layer. */
    private moveLayer() {
        if (!this.layer || this.layer.destroyed || !this.world) return;
        const target = scratchLayerOf(this.world, this.foreground ? "foregroundStamps" : "pen");
        if (target) target.addChild(this.layer);
    }

    /** Asked of the stage rather than the sprite class, which imports this module. */
    _goToMousePointer() {
        const stage = (this.world as any)?.interpreter?.retrieveObject("ScratchStage") as
            { _getMouseX(): number, _getMouseY(): number } | undefined;
        if (stage) this._setPosition(stage._getMouseX(), stage._getMouseY());
    }

    _mj$goToRandomPosition$void$(t: Thread, callback: CallbackParameter) {
        const w = this.world?.width ?? 480, h = this.world?.height ?? 360;
        this._setPosition(
            Math.round(-w / 2 + Math.random() * (w + 1)),
            Math.round(-h / 2 + Math.random() * (h + 1)));
        if (callback) callback();
    }

    _stamp() { if (this.foreground) this.sprite?._stampForeground(); else this.sprite?._stamp(); }

    _mj$toString$String$(t: Thread, callback: CallbackParameter) {
        t.s.push(new StringClass(`Pen(x: ${this.px}, y: ${this.py}, down: ${this.penDown})`));
        if (callback) callback();
    }

    _setPosition(x: number, y: number) {
        if (this.penDown) {
            const layer = this.getLayer();
            if (layer) {
                const a = this.toScreen(this.px, this.py);
                const b = this.toScreen(x, y);
                const alpha = Math.max(0, Math.min(1, this.opacity / 255));
                layer.moveTo(a.x, a.y).lineTo(b.x, b.y)
                    .stroke({ width: this.size, color: this.colorInt, alpha, cap: "round", join: "round" });
            }
        }
        this.px = x;
        this.py = y;
    }
    _setPositionV(v: ScratchVector2Class) { if (v) this._setPosition(v.x, v.y); }

    _eraseAll() { this.getLayer()?.clear(); }

    /** Upstream's stage-lifecycle hooks; the world is already set up here. */
    _addedToStage(_stage: ObjectClass) { }
    _removedFromStage(_stage: ObjectClass) { this._eraseAll(); }
}
