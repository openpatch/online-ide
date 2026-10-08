import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { ColorClass } from "../ColorClass";
import { RGB } from "./ZeichnenRuntime";

/**
 * The colour names of the library and the java.awt.Color constants behind them.
 * Order as in Farbmanager.gibFarbname, which returns the first name that fits.
 */
const farbnamen: [string, RGB][] = [
    ["schwarz", { r: 0, g: 0, b: 0 }],
    ["blau", { r: 0, g: 0, b: 255 }],
    ["zyan", { r: 0, g: 255, b: 255 }],
    ["dunkelgrau", { r: 64, g: 64, b: 64 }],
    ["grau", { r: 128, g: 128, b: 128 }],
    ["gruen", { r: 0, g: 255, b: 0 }],
    ["hellgrau", { r: 192, g: 192, b: 192 }],
    ["magenta", { r: 255, g: 0, b: 255 }],
    ["orange", { r: 255, g: 200, b: 0 }],
    ["pink", { r: 255, g: 175, b: 175 }],
    ["rot", { r: 255, g: 0, b: 0 }],
    ["weiss", { r: 255, g: 255, b: 255 }],
    ["gelb", { r: 255, g: 255, b: 0 }],
    ["braun", { r: 139, g: 69, b: 19 }],
];

/** Farbmanager.gibFarbe: unknown names and null give black. */
export function farbeZuName(name: string | null | undefined): RGB {
    if (name == null) return { r: 0, g: 0, b: 0 };
    let lower = name.toLowerCase();
    let entry = farbnamen.find(([n]) => n == lower);
    return entry ? { ...entry[1] } : { r: 0, g: 0, b: 0 };
}

/** Farbmanager.gibFarbname: a colour without name as java.awt.Color prints it, e.g. "[r=127,g=127,b=127]". */
export function nameZuFarbe(c: RGB): string {
    let entry = farbnamen.find(([, rgb]) => rgb.r == c.r && rgb.g == c.g && rgb.b == c.b);
    return entry ? entry[0] : `[r=${c.r},g=${c.g},b=${c.b}]`;
}

export function rgbToColor(c: RGB): ColorClass {
    let color = new ColorClass();
    color.red = c.r;
    color.green = c.g;
    color.blue = c.b;
    return color;
}

export function colorToRGB(c: ColorClass): RGB {
    return { r: c.red, g: c.green, b: c.blue };
}

export class FarbmanagerClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "farbmanagment", signature: "class Farbmanager extends Object", comment: "Übersetzt zwischen Farbnamen (schwarz, blau, zyan, dunkelgrau, grau, gruen, hellgrau, magenta, orange, pink, rot, weiss, gelb, braun) und Farben." },
        { type: "method", signature: "Farbmanager()", native: FarbmanagerClass.prototype._erzeuge },
        { type: "method", signature: "static String gibFarbname(Color farbe)", native: FarbmanagerClass._gibFarbname, comment: "Liefert den Namen der Farbe, bei Farben ohne Namen ihre RGB-Werte." },
        { type: "method", signature: "static Color gibFarbe(String pText)", native: FarbmanagerClass._gibFarbe, comment: "Liefert die Farbe zum Namen (Groß- und Kleinschreibung egal), bei unbekannten Namen schwarz." },
    ];

    static type: NonPrimitiveType;

    _erzeuge(): FarbmanagerClass {
        return this;
    }

    static _gibFarbname(farbe: ColorClass): StringClass {
        return new StringClass(nameZuFarbe(colorToRGB(farbe)));
    }

    static _gibFarbe(text: StringClass): ColorClass {
        return rgbToColor(farbeZuName(text?.value));
    }
}

export class ZuordnungClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "farbmanagment", signature: "class Zuordnung extends Object", comment: "Ordnet einer Bezeichnung eine Farbe zu." },
        { type: "method", signature: "Zuordnung(String pBezeichnung, Color pFarbe)", native: ZuordnungClass.prototype._erzeuge },
        { type: "method", signature: "boolean istGleich(String pBezeichnung)", native: ZuordnungClass.prototype._istGleichBezeichnung, comment: "true, wenn die Bezeichnung (ohne Beachtung der Groß- und Kleinschreibung) gleich ist." },
        { type: "method", signature: "boolean istGleich(Color pFarbe)", native: ZuordnungClass.prototype._istGleichFarbe, comment: "true, wenn die Farbe gleich ist." },
        { type: "method", signature: "String getBezeichnung()", native: ZuordnungClass.prototype._getBezeichnung, comment: "Liefert die Bezeichnung." },
        { type: "method", signature: "Color getFarbe()", native: ZuordnungClass.prototype._getFarbe, comment: "Liefert die Farbe." },
    ];

    static type: NonPrimitiveType;

    bezeichnung: StringClass | null = null;
    farbe: ColorClass | null = null;

    _erzeuge(bezeichnung: StringClass, farbe: ColorClass): ZuordnungClass {
        this.bezeichnung = bezeichnung;
        this.farbe = farbe;
        return this;
    }

    _istGleichBezeichnung(bezeichnung: StringClass): boolean {
        if (this.bezeichnung == null || bezeichnung == null) return false;
        return bezeichnung.value.toLowerCase() == this.bezeichnung.value.toLowerCase();
    }

    _istGleichFarbe(farbe: ColorClass): boolean {
        if (farbe == null || this.farbe == null) return false;
        return farbe.red == this.farbe.red && farbe.green == this.farbe.green && farbe.blue == this.farbe.blue
            && farbe.alpha == this.farbe.alpha;
    }

    _getBezeichnung(): StringClass | null {
        return this.bezeichnung;
    }

    _getFarbe(): ColorClass | null {
        return this.farbe;
    }
}
