import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, ObjectClassOrNull, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";
import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";

/**
 * Immutable colour, mirroring org.openpatch.scratch.Color (7.0). One colour
 * model, Scratch's: hue, saturation and brightness from 0 to 100 next to red,
 * green and blue from 0 to 255; alpha from 0 to 255. The with* methods return
 * new colours.
 *
 * Internal helpers (fromRGB, fromHex, fromHue, defaultColor, _get,
 * _changeColor) are not declared to Java; they exist for the runtime's own
 * code while the 6.x hue-based call sites are ported away.
 */
export class ScratchColorClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Color extends Object", comment: SRC.colorClassComment },

        { type: "method", signature: "Color(string hex)", native: ScratchColorClass.prototype._cHex, comment: SRC.colorConstructorComment },
        { type: "method", signature: "Color(double red, double green, double blue)", native: ScratchColorClass.prototype._cRGB, comment: SRC.colorConstructor2Comment },
        { type: "method", signature: "Color(double red, double green, double blue, double alpha)", native: ScratchColorClass.prototype._cRGBA, comment: SRC.colorConstructor3Comment },

        { type: "method", signature: "static Color fromHSB(double hue, double saturation, double brightness)", native: ScratchColorClass._fromHSB, comment: SRC.colorFromHSBComment },
        { type: "method", signature: "static Color fromARGB(int argb)", native: ScratchColorClass._fromARGB, comment: SRC.colorFromARGBComment },

        { type: "method", signature: "double getRed()", native: ScratchColorClass.prototype._getRed, comment: SRC.colorGetRedComment },
        { type: "method", signature: "double getGreen()", native: ScratchColorClass.prototype._getGreen, comment: SRC.colorGetGreenComment },
        { type: "method", signature: "double getBlue()", native: ScratchColorClass.prototype._getBlue, comment: SRC.colorGetBlueComment },
        { type: "method", signature: "double getAlpha()", native: ScratchColorClass.prototype._getAlpha, comment: SRC.colorGetAlphaComment },
        { type: "method", signature: "double getHue()", native: ScratchColorClass.prototype._getHue, comment: SRC.colorGetHueComment },
        { type: "method", signature: "double getSaturation()", native: ScratchColorClass.prototype._getSaturation, comment: SRC.colorGetSaturationComment },
        { type: "method", signature: "double getBrightness()", native: ScratchColorClass.prototype._getBrightness, comment: SRC.colorGetBrightnessComment },

        { type: "method", signature: "Color withRed(double red)", native: ScratchColorClass.prototype._withRed, comment: SRC.colorWithRedComment },
        { type: "method", signature: "Color withGreen(double green)", native: ScratchColorClass.prototype._withGreen, comment: SRC.colorWithGreenComment },
        { type: "method", signature: "Color withBlue(double blue)", native: ScratchColorClass.prototype._withBlue, comment: SRC.colorWithBlueComment },
        { type: "method", signature: "Color withAlpha(double alpha)", native: ScratchColorClass.prototype._withAlpha, comment: SRC.colorWithAlphaComment },
        { type: "method", signature: "Color withHue(double hue)", native: ScratchColorClass.prototype._withHue, comment: SRC.colorWithHueComment },
        { type: "method", signature: "Color withSaturation(double saturation)", native: ScratchColorClass.prototype._withSaturation, comment: SRC.colorWithSaturationComment },
        { type: "method", signature: "Color withBrightness(double brightness)", native: ScratchColorClass.prototype._withBrightness, comment: SRC.colorWithBrightnessComment },

        { type: "method", signature: "int toARGB()", native: ScratchColorClass.prototype._toARGB, comment: SRC.colorToARGBComment },
        { type: "method", signature: "String toString()", java: ScratchColorClass.prototype._mj$toString$String$, comment: SRC.colorToStringComment },
        { type: "method", signature: "boolean equals(Object other)", java: ScratchColorClass.prototype._mj$equals$boolean$Object, comment: SRC.colorEqualsComment },
        { type: "method", signature: "int hashCode()", native: ScratchColorClass.prototype._hashCode },
    ];

    static type: NonPrimitiveType;

    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;

    constructor(r?: number, g?: number, b?: number, a?: number) {
        super();
        if (typeof r === "string") {
            const rgba = ScratchColorClass.parseHex(r);
            this.r = rgba[0]; this.g = rgba[1]; this.b = rgba[2]; this.a = rgba[3];
        } else {
            this.r = ScratchColorClass.clamp(r ?? 255, 255);
            this.g = ScratchColorClass.clamp(g ?? 255, 255);
            this.b = ScratchColorClass.clamp(b ?? 255, 255);
            this.a = ScratchColorClass.clamp(a ?? 255, 255);
        }
    }

    _cHex(hex: string) {
        const rgba = ScratchColorClass.parseHex(hex);
        return new ScratchColorClass(rgba[0], rgba[1], rgba[2], rgba[3]);
    }
    _cRGB(r: number, g: number, b: number) { return new ScratchColorClass(r, g, b); }
    _cRGBA(r: number, g: number, b: number, a: number) { return new ScratchColorClass(r, g, b, a); }

    static _fromHSB(hue: number, saturation: number, brightness: number): ScratchColorClass {
        return ScratchColorClass.fromHSB(hue, saturation, brightness);
    }
    static _fromARGB(argb: number): ScratchColorClass {
        return new ScratchColorClass((argb >> 16) & 0xff, (argb >> 8) & 0xff, argb & 0xff, (argb >>> 24) & 0xff);
    }

    _getRed(): number { return this.r; }
    _getGreen(): number { return this.g; }
    _getBlue(): number { return this.b; }
    _getAlpha(): number { return this.a; }

    /** Scratch's colour (hue) from 0 to 100; 0 for greys. */
    _getHue(): number {
        const max = Math.max(this.r, this.g, this.b);
        const min = Math.min(this.r, this.g, this.b);
        const d = max - min;
        if (d === 0) return 0;
        let h: number;
        if (max === this.r) h = ((this.g - this.b) / d) % 6;
        else if (max === this.g) h = (this.b - this.r) / d + 2;
        else h = (this.r - this.g) / d + 4;
        return ScratchColorClass.wrap(h / 6 * 100, 100);
    }

    /** Saturation from 0 (grey) to 100. */
    _getSaturation(): number {
        const max = Math.max(this.r, this.g, this.b);
        const min = Math.min(this.r, this.g, this.b);
        return max === 0 ? 0 : (max - min) / max * 100;
    }

    /** Brightness from 0 (black) to 100. */
    _getBrightness(): number {
        return Math.max(this.r, this.g, this.b) / 255 * 100;
    }

    _withRed(red: number): ScratchColorClass { return new ScratchColorClass(red, this.g, this.b, this.a); }
    _withGreen(green: number): ScratchColorClass { return new ScratchColorClass(this.r, green, this.b, this.a); }
    _withBlue(blue: number): ScratchColorClass { return new ScratchColorClass(this.r, this.g, blue, this.a); }
    _withAlpha(alpha: number): ScratchColorClass { return new ScratchColorClass(this.r, this.g, this.b, alpha); }
    _withHue(hue: number): ScratchColorClass { return ScratchColorClass.fromHSB(hue, this._getSaturation(), this._getBrightness())._withAlpha(this.a); }
    _withSaturation(saturation: number): ScratchColorClass { return ScratchColorClass.fromHSB(this._getHue(), saturation, this._getBrightness())._withAlpha(this.a); }
    _withBrightness(brightness: number): ScratchColorClass { return ScratchColorClass.fromHSB(this._getHue(), this._getSaturation(), brightness)._withAlpha(this.a); }

    _toARGB(): number {
        return Math.round(this.a) << 24 | Math.round(this.r) << 16
            | Math.round(this.g) << 8 | Math.round(this.b);
    }

    // ---- internals ----

    private static clamp(value: number, max: number): number {
        return Number.isNaN(value) ? 0 : Math.max(0, Math.min(max, value));
    }

    private static wrap(value: number, range: number): number {
        const w = value % range;
        return w < 0 ? w + range : w;
    }

    /** fromHSB with whole channels, as Scratch keeps colours. */
    static fromHSB(hue: number, saturation: number, brightness: number): ScratchColorClass {
        const h = ScratchColorClass.wrap(hue, 100) / 100 * 6;
        const s = ScratchColorClass.clamp(saturation, 100) / 100;
        const v = ScratchColorClass.clamp(brightness, 100) / 100;
        const sector = Math.floor(h) % 6;
        const f = h - Math.floor(h);
        const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
        let r: number, g: number, b: number;
        switch (sector) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            default: r = v; g = p; b = q; break;
        }
        return new ScratchColorClass(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
    }

    private static parseHex(hex: string): number[] {
        let h = hex.trim();
        if (h.startsWith("#")) h = h.substring(1);
        if (h.length === 3 || h.length === 4) {
            h = h.split("").map(c => c + c).join("");
        }
        if (h.length !== 6 && h.length !== 8) {
            throw new Error("Not a colour: \"" + hex + "\". Use a hex code such as \"#ff8000\".");
        }
        if (!/^[0-9a-fA-F]+$/.test(h)) {
            throw new Error("Not a colour: \"" + hex + "\". Use a hex code such as \"#ff8000\".");
        }
        const value = parseInt(h, 16);
        if (h.length === 6) {
            return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 255];
        }
        return [(value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
    }

    /** factories for other Scratch classes (no interpreter thread involved) */
    static fromRGB(r: number, g: number, b: number): ScratchColorClass {
        return new ScratchColorClass(r, g, b);
    }
    static fromHex(hexCode: string): ScratchColorClass {
        const rgba = ScratchColorClass.parseHex(hexCode);
        return new ScratchColorClass(rgba[0], rgba[1], rgba[2], rgba[3]);
    }
    /**
     * Internal, 6.x hue helper (hue 0..255): a fully saturated colour at that
     * hue, which is what 6.x's setTint(hue) multiplied a costume by. It goes
     * away when the last hue-based call site is ported to the colour effect.
     */
    static fromHue(h: number): ScratchColorClass {
        return ScratchColorClass.fromHSB(ScratchColorClass.wrap(h, 255) / 2.55, 100, 100);
    }
    /** The colour an untinted sprite or backdrop starts out with: white. */
    static defaultColor(): ScratchColorClass {
        return new ScratchColorClass(255, 255, 255);
    }

    /** helper for other Scratch classes: current color as a CSS hex string */
    toHexString(): string {
        const c = (v: number) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0");
        return "#" + c(this.r) + c(this.g) + c(this.b);
    }

    toStringValue(): StringClass { return new StringClass(this.toHexString()); }

    /** Upstream's format is "#rrggbb" (plus the alpha byte when it is not 255). */
    _mj$toString$String$(t: Thread, callback: CallbackFunction): void {
        t.s.push(new StringClass(this.format()));
        if (callback) callback();
    }

    private format(): string {
        const argb = this._toARGB();
        const rgb = "#" + (argb & 0xffffff).toString(16).padStart(6, "0");
        return (argb >>> 24) === 255 ? rgb : rgb + ((argb >>> 24) & 0xff).toString(16).padStart(2, "0");
    }

    /** Two colours are equal when they pack into the same ARGB number. */
    _mj$equals$boolean$Object(t: Thread, callback: CallbackFunction, other: ObjectClassOrNull): void {
        t.s.push(other instanceof ScratchColorClass && other._toARGB() === this._toARGB());
        if (callback) callback();
    }

    _hashCode(): number { return this._toARGB(); }

    // ---- 6.x internals still used by unported call sites (not Java-visible) ----

    /** 6.x packed int (java.awt style); used by Pen's colour sensing. */
    _get(): number {
        return (0xff000000 | (Math.round(this.r) & 0xff) << 16
            | (Math.round(this.g) & 0xff) << 8 | (Math.round(this.b) & 0xff)) | 0;
    }

    /** 6.x changeColor on a colour: turn the hue, in place (internal only). */
    _changeColor(step: number): void {
        const hue = this._getHue();
        const turned = ScratchColorClass.wrap(hue + step / 2.55, 100);
        const next = ScratchColorClass.fromHSB(turned, this._getSaturation(), this._getBrightness())._withAlpha(this.a);
        (this as any).r = next.r; (this as any).g = next.g; (this as any).b = next.b; (this as any).a = next.a;
    }
}
