import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, ObjectClassOrNull, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";
import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";

/**
 * Color in the Scratch environment, mirroring org.openpatch.scratch.Color.
 * Uses the java.awt HSB (really HSV) model with all channels in [0..255].
 */
export class ScratchColorClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Color extends Object", comment: SRC.colorClassComment },

        { type: "method", signature: "Color()", native: ScratchColorClass.prototype._c0, comment: SRC.colorConstructorComment },
        { type: "method", signature: "Color(string hexCode)", native: ScratchColorClass.prototype._cHex, comment: SRC.colorConstructor2Comment },
        { type: "method", signature: "Color(double h)", native: ScratchColorClass.prototype._cHue, comment: SRC.colorConstructor3Comment },
        { type: "method", signature: "Color(double r, double g, double b)", native: ScratchColorClass.prototype._cRGB, comment: SRC.colorConstructor4Comment },
        { type: "method", signature: "Color(Color c)", native: ScratchColorClass.prototype._cCopy, comment: SRC.colorConstructor5Comment },

        { type: "method", signature: "int get()", native: ScratchColorClass.prototype._get, comment: SRC.colorGetComment },
        { type: "method", signature: "double getHSB()", native: ScratchColorClass.prototype._getHSB, comment: SRC.colorGetHSBComment },
        { type: "method", signature: "void setHSB(double h)", native: ScratchColorClass.prototype._setHSB1, comment: SRC.colorSetHSBComment },
        { type: "method", signature: "void setHSB(double h, double s, double l)", native: ScratchColorClass.prototype._setHSB3, comment: SRC.colorSetHSB2Comment },
        { type: "method", signature: "void setRGB(double r, double g, double b)", native: ScratchColorClass.prototype._setRGB, comment: SRC.colorSetRGBComment },
        { type: "method", signature: "void changeColor(double h)", native: ScratchColorClass.prototype._changeColor, comment: SRC.colorChangeColorComment },
        { type: "method", signature: "double getRed()", native: ScratchColorClass.prototype._getRed, comment: SRC.colorGetRedComment },
        { type: "method", signature: "double getGreen()", native: ScratchColorClass.prototype._getGreen, comment: SRC.colorGetGreenComment },
        { type: "method", signature: "double getBlue()", native: ScratchColorClass.prototype._getBlue, comment: SRC.colorGetBlueComment },
        { type: "method", signature: "double getH()", native: ScratchColorClass.prototype._getH, comment: SRC.colorGetHComment },
        { type: "method", signature: "double getS()", native: ScratchColorClass.prototype._getS, comment: SRC.colorGetSComment },
        { type: "method", signature: "double getL()", native: ScratchColorClass.prototype._getL, comment: SRC.colorGetLComment },
        { type: "method", signature: "String toString()", java: ScratchColorClass.prototype._mj$toString$String$, comment: SRC.colorToStringComment },
        { type: "method", signature: "boolean equals(Object other)", java: ScratchColorClass.prototype._mj$equals$boolean$Object, comment: SRC.colorEqualsComment },
    ];

    static type: NonPrimitiveType;

    r: number = 255;
    g: number = 255;
    b: number = 255;
    h: number = 255;
    s: number = 255;
    l: number = 255;

    _c0() { return this; }

    _cHex(hexCode: string) {
        if (hexCode.startsWith("#")) hexCode = hexCode.substring(1);
        const r = parseInt(hexCode.substring(0, 2), 16);
        const g = parseInt(hexCode.substring(2, 4), 16);
        const b = parseInt(hexCode.substring(4, 6), 16);
        this._setRGB(r, g, b);
        return this;
    }

    _cHue(h: number) { this._setHSB1(h); return this; }
    _cRGB(r: number, g: number, b: number) { this._setRGB(r, g, b); return this; }
    _cCopy(c: ScratchColorClass) {
        this.r = c.r; this.g = c.g; this.b = c.b;
        this.h = c.h; this.s = c.s; this.l = c.l;
        return this;
    }

    _get(): number {
        let v1 = Math.min(255, Math.max(0, this.r));
        let v2 = Math.min(255, Math.max(0, this.g));
        let v3 = Math.min(255, Math.max(0, this.b));
        // 0xff000000 | rgb, forced into a signed 32-bit int as Java does
        return (0xff000000 | ((v1 & 0xff) << 16) | ((v2 & 0xff) << 8) | (v3 & 0xff)) | 0;
    }

    _getHSB(): number { return this.h; }
    _setHSB1(h: number) { this._setHSB3(h, this.s, this.l); }
    _setHSB3(h: number, s: number, l: number) {
        while (h > 255) h -= 255;
        while (s > 255) s -= 255;
        while (l > 255) l -= 255;
        this.h = h; this.s = s; this.l = l;
        const rgb = ScratchColorClass.hsbToRgb(h / 255, s / 255, l / 255);
        this.r = rgb[0]; this.g = rgb[1]; this.b = rgb[2];
    }
    _setRGB(r: number, g: number, b: number) {
        this.r = r; this.g = g; this.b = b;
        const hsb = ScratchColorClass.rgbToHsb(r, g, b);
        this.h = hsb[0] * 255; this.s = hsb[1] * 255; this.l = hsb[2] * 255;
    }
    _changeColor(h: number) { this._setHSB1(this.h + h); }
    _getRed(): number { return this.r; }
    _getGreen(): number { return this.g; }
    _getBlue(): number { return this.b; }
    _getH(): number { return this.h; }
    _getS(): number { return this.s; }
    _getL(): number { return this.l; }

    /** java.awt.Color.HSBtoRGB semantics: h,s,v in [0,1] -> [r,g,b] in [0,255] */
    static hsbToRgb(h: number, s: number, v: number): [number, number, number] {
        let r = 0, g = 0, b = 0;
        if (s === 0) {
            r = g = b = v * 255 + 0.5;
        } else {
            const hh = (h - Math.floor(h)) * 6;
            const f = hh - Math.floor(hh);
            const p = v * (1 - s);
            const q = v * (1 - s * f);
            const tt = v * (1 - s * (1 - f));
            switch (Math.floor(hh)) {
                case 0: r = v * 255 + 0.5; g = tt * 255 + 0.5; b = p * 255 + 0.5; break;
                case 1: r = q * 255 + 0.5; g = v * 255 + 0.5; b = p * 255 + 0.5; break;
                case 2: r = p * 255 + 0.5; g = v * 255 + 0.5; b = tt * 255 + 0.5; break;
                case 3: r = p * 255 + 0.5; g = q * 255 + 0.5; b = v * 255 + 0.5; break;
                case 4: r = tt * 255 + 0.5; g = p * 255 + 0.5; b = v * 255 + 0.5; break;
                case 5: r = v * 255 + 0.5; g = p * 255 + 0.5; b = q * 255 + 0.5; break;
            }
        }
        return [Math.floor(r), Math.floor(g), Math.floor(b)];
    }

    /** java.awt.Color.RGBtoHSB semantics: r,g,b in [0,255] -> [h,s,v] in [0,1] */
    static rgbToHsb(r: number, g: number, b: number): [number, number, number] {
        r = Math.round(r); g = Math.round(g); b = Math.round(b);
        const cmax = Math.max(r, g, b);
        const cmin = Math.min(r, g, b);
        const brightness = cmax / 255;
        const saturation = cmax !== 0 ? (cmax - cmin) / cmax : 0;
        let hue = 0;
        if (saturation !== 0) {
            const redc = (cmax - r) / (cmax - cmin);
            const greenc = (cmax - g) / (cmax - cmin);
            const bluec = (cmax - b) / (cmax - cmin);
            if (r === cmax) hue = bluec - greenc;
            else if (g === cmax) hue = 2 + redc - bluec;
            else hue = 4 + greenc - redc;
            hue /= 6;
            if (hue < 0) hue += 1;
        }
        return [hue, saturation, brightness];
    }

    /** factories for other Scratch classes (no interpreter thread involved) */
    /**
     * The colour an untinted sprite or backdrop starts out with, matching what
     * `new Color()` gives upstream: white, but with the hue, saturation and
     * brightness still at their defaults rather than derived from that white.
     *
     * <p>This is not the same as `fromRGB(255, 255, 255)`. Deriving HSB from
     * white gives a saturation of 0, and changeColor() only moves the hue - so a
     * colour seeded that way stays white however far the hue is turned, and
     * changeTint() on a sprite that was never tinted does nothing at all.
     */
    static defaultColor(): ScratchColorClass {
        return new ScratchColorClass();
    }

    static fromRGB(r: number, g: number, b: number): ScratchColorClass {
        const c = new ScratchColorClass();
        c._setRGB(r, g, b);
        return c;
    }
    static fromHex(hexCode: string): ScratchColorClass {
        return new ScratchColorClass()._cHex(hexCode);
    }
    static fromHue(h: number): ScratchColorClass {
        const c = new ScratchColorClass();
        c._setHSB1(h);
        return c;
    }

    /** helper for other Scratch classes: current color as a CSS hex string */
    toHexString(): string {
        const c = (v: number) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0");
        return "#" + c(this.r) + c(this.g) + c(this.b);
    }

    toStringValue(): StringClass { return new StringClass(this.toHexString()); }

    /** Upstream's format is "Color[r=255.0, g=128.0, b=0.0]". */
    _mj$toString$String$(t: Thread, callback: CallbackFunction): void {
        const d = (n: number) => Number.isInteger(n) ? n.toFixed(1) : String(n);
        t.s.push(new StringClass(`Color[r=${d(this.r)}, g=${d(this.g)}, b=${d(this.b)}]`));
        if (callback) callback();
    }

    /** Two colours are the same when they are the same colour. */
    _mj$equals$boolean$Object(t: Thread, callback: CallbackFunction, other: ObjectClassOrNull): void {
        t.s.push(other instanceof ScratchColorClass
            && other.r === this.r && other.g === this.g && other.b === this.b);
        if (callback) callback();
    }
}
