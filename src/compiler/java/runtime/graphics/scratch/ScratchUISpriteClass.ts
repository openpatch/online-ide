import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ScratchSpriteClass } from "./ScratchSpriteClass";

/**
 * Sprite for buttons, bars and other parts of a user interface, mirroring
 * org.openpatch.scratch.UISprite.
 *
 * It differs from a normal Sprite in three ways: it is drawn on top of
 * everything, it never takes part in collisions, and it can be given a width
 * and height in pixels (not just a size in percent). With nine-slice scaling a
 * single costume can stretch to any size without its corners smearing.
 */
export class ScratchUISpriteClass extends ScratchSpriteClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class UISprite extends Sprite", comment: "Figur für Benutzeroberflächen (Knöpfe, Balken); wird oben gezeichnet und kollidiert nicht" },

        { type: "method", signature: "UISprite()", java: ScratchUISpriteClass.prototype._cj$_constructor_$UISprite$, comment: "Erzeugt eine neue UI-Figur" },

        { type: "method", signature: "void setWidth(double width)", native: ScratchUISpriteClass.prototype._setWidthPx, comment: "Setzt die Breite in Pixeln" },
        { type: "method", signature: "void setHeight(double height)", native: ScratchUISpriteClass.prototype._setHeightPx, comment: "Setzt die Höhe in Pixeln" },
        { type: "method", signature: "void changeWidth(double amount)", native: ScratchUISpriteClass.prototype._changeWidthPx, comment: "Ändert die Breite um die angegebene Anzahl Pixel" },
        { type: "method", signature: "void changeHeight(double amount)", native: ScratchUISpriteClass.prototype._changeHeightPx, comment: "Ändert die Höhe um die angegebene Anzahl Pixel" },
        { type: "method", signature: "void setNineSlice(int top, int right, int bottom, int left)", native: ScratchUISpriteClass.prototype._setNineSlice, comment: "Hält die Ecken und Ränder des Kostüms beim Skalieren fest (Nine-Slice)" },
        { type: "method", signature: "void disableNineSlice()", native: ScratchUISpriteClass.prototype._disableNineSlice, comment: "Lässt das ganze Kostüm wieder mitskalieren" },
    ];

    static type: NonPrimitiveType;

    private uiWidth?: number;   // pixel size overrides; undefined = fall back to size%
    private uiHeight?: number;
    private nineSlice?: { top: number, right: number, bottom: number, left: number };

    _cj$_constructor_$UISprite$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Sprite$(t, callback);
    }

    isUI(): boolean { return true; }

    // Drawn on top: a fresh costume display is appended last (default) — for a UI
    // sprite that is what we want, so no extra layering work is needed here.

    // ---- pixel sizing ----
    protected scaleMagnitudeX(): number {
        if (this.nineSlice) return 1;               // NineSliceSprite sizes itself via width
        const { w } = this.currentTextureSize();
        if (this.uiWidth != null && w > 0) return this.uiWidth / w;
        return super.scaleMagnitudeX();
    }
    protected scaleMagnitudeY(): number {
        if (this.nineSlice) return 1;
        const { h } = this.currentTextureSize();
        if (this.uiHeight != null && h > 0) return this.uiHeight / h;
        return super.scaleMagnitudeY();
    }

    private applyNineSliceSize() {
        const c = this.container as any;
        if (this.nineSlice && c) {
            if (this.uiWidth != null) c.width = this.uiWidth;
            if (this.uiHeight != null) c.height = this.uiHeight;
        }
    }

    _setWidthPx(width: number) { this.uiWidth = width; this.applyNineSliceSize(); this.applyState(); }
    _setHeightPx(height: number) { this.uiHeight = height; this.applyNineSliceSize(); this.applyState(); }
    _changeWidthPx(amount: number) { this._setWidthPx((this.uiWidth ?? this.currentTextureSize().w) + amount); }
    _changeHeightPx(amount: number) { this._setHeightPx((this.uiHeight ?? this.currentTextureSize().h) + amount); }

    // ---- nine-slice ----
    protected createCostumeDisplay(texture: PIXI.Texture): PIXI.Container {
        if (this.nineSlice) {
            const ns = new PIXI.NineSliceSprite({
                texture,
                topHeight: this.nineSlice.top,
                rightWidth: this.nineSlice.right,
                bottomHeight: this.nineSlice.bottom,
                leftWidth: this.nineSlice.left,
            });
            // NineSliceSprite has no anchor; centre it via its pivot instead.
            ns.pivot.set(ns.width / 2, ns.height / 2);
            return ns;
        }
        return super.createCostumeDisplay(texture);
    }

    _setNineSlice(top: number, right: number, bottom: number, left: number) {
        this.nineSlice = { top, right, bottom, left };
        this.rebuildCostume();
    }
    _disableNineSlice() {
        this.nineSlice = undefined;
        this.rebuildCostume();
    }

    /** Recreate the current costume's display object (nine-slice ↔ plain). */
    private rebuildCostume() {
        if (this.currentCostume >= 0) {
            this._applyCostumeIndex(this.currentCostume);   // always rebuilds the display
            this.applyNineSliceSize();
            this.applyState();
        }
    }
}
