import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { NullPointerExceptionClass } from "../../system/javalang/NullPointerExceptionClass";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ColorClass } from "../ColorClass";
import { colorToRGB, farbeZuName, nameZuFarbe, rgbToColor } from "./FarbmanagmentClasses";
import { ZeichnenGraphicsClass } from "./ZeichnenGraphicsClass";
import { RGB } from "./ZeichnenRuntime";

/** What a Figur needs of the Zeichenflaeche it is on (kept structural to avoid an import cycle). */
export interface ZeichnenFrame {
    markDirty(): void;
    graphicsObject(): ZeichnenGraphicsClass;
    _setzeEinsNachVorneFigur(f: any): void;
    _setzeGanzNachVorneFigur(f: any): void;
    _setzeEinsNachHintenFigur(f: any): void;
    _setzeGanzNachHintenFigur(f: any): void;
}

/** "class zeichnen.Rechteck", "class Quadrat": what getClass().toString() gives on the desktop. */
export function classString(o: ObjectClass): string {
    let type = o.getType() as NonPrimitiveType;
    return "class " + (type?.pathAndIdentifierAsDotSeparatedString ?? o.constructor.name);
}

export class FigurClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "abstract class Figur extends Object implements ZeichnendesObjekt", comment: "Eine auf einer Zeichenfläche darstellbare Figur mit Position, Farbe und Sichtbarkeit." },

        { type: "field", signature: "protected int xKoord", comment: "Die x-Koordinate der Figur innerhalb der Zeichenfläche." },
        { type: "field", signature: "protected int yKoord", comment: "Die y-Koordinate der Figur innerhalb der Zeichenfläche." },
        { type: "field", signature: "protected Color farbe", comment: "Die Farbe der Figur." },
        { type: "field", signature: "protected boolean sichtbar", comment: "Gibt an, ob die Figur sichtbar ist." },
        { type: "field", signature: "protected Zeichenflaeche meinFrame", comment: "Die Zeichenfläche, auf der sich die Figur befindet." },

        { type: "method", signature: "Figur(int pXKoord, int pYKoord, String pFarbe)", native: FigurClass.prototype._figurMitFarbname, comment: "Legt die Koordinaten und die Farbe (als Farbname, z. B. \"rot\") fest." },
        { type: "method", signature: "Figur(int pXKoord, int pYKoord, int pRot, int pGruen, int pBlau)", native: FigurClass.prototype._figurMitRGB, comment: "Legt die Koordinaten und die Farbe (als RGB-Wert) fest." },

        { type: "method", signature: "void setFlaeche(Zeichenflaeche pFrame)", native: FigurClass.prototype._setFlaeche, comment: "Legt fest, auf welcher Zeichenfläche sich die Figur befindet." },
        { type: "method", signature: "void setzeFarbe(String pFarbe)", native: FigurClass.prototype._setzeFarbeName, comment: "Ändert die Farbe der Figur. Mögliche Farben: schwarz, blau, zyan, dunkelgrau, grau, gruen, hellgrau, magenta, orange, pink, rot, weiss, gelb, braun." },
        { type: "method", signature: "void setzeFarbe(int pRot, int pGruen, int pBlau)", native: FigurClass.prototype._setzeFarbeRGB, comment: "Ändert die Farbe der Figur auf den angegebenen RGB-Wert (jeweils 0 bis 255)." },
        { type: "method", signature: "void setzeXKoord(int pXKoord)", native: FigurClass.prototype._setzeXKoord, comment: "Setzt die x-Koordinate auf den gegebenen Wert." },
        { type: "method", signature: "void setzeYKoord(int pYKoord)", native: FigurClass.prototype._setzeYKoord, comment: "Setzt die y-Koordinate auf den gegebenen Wert." },
        { type: "method", signature: "void zeichneDich()", java: FigurClass.prototype._mj$zeichneDich$void$, comment: "Zeichnet die Figur, sofern sie sichtbar ist. Greift auf zeichneDich(java.awt.Graphics stift) zurück." },
        { type: "method", signature: "protected abstract void zeichneDich(java.awt.Graphics stift)", java: FigurClass.prototype._mj$zeichneDich$void$Graphics, comment: "Zeichnet die Figur mit dem Zeichenstift der Zeichenfläche. Wird in den Unterklassen implementiert." },
        { type: "method", signature: "int getXKoord()", native: FigurClass.prototype._getXKoord, comment: "Liefert die x-Koordinate." },
        { type: "method", signature: "int getYKoord()", native: FigurClass.prototype._getYKoord, comment: "Liefert die y-Koordinate." },
        { type: "method", signature: "String getFarbe()", native: FigurClass.prototype._getFarbe, comment: "Liefert die Farbe als Farbname, z. B. \"rot\"." },
        { type: "method", signature: "int getRot()", native: FigurClass.prototype._getRot, comment: "Liefert den Rotanteil der Farbe in der RGB-Darstellung." },
        { type: "method", signature: "int getGruen()", native: FigurClass.prototype._getGruen, comment: "Liefert den Grünanteil der Farbe in der RGB-Darstellung." },
        { type: "method", signature: "int getBlau()", native: FigurClass.prototype._getBlau, comment: "Liefert den Blauanteil der Farbe in der RGB-Darstellung." },
        { type: "method", signature: "void setzeSichtbar(boolean pSichtbar)", native: FigurClass.prototype._setzeSichtbar, comment: "Setzt die Sichtbarkeit auf den Wert pSichtbar." },
        { type: "method", signature: "boolean istSichtbar()", native: FigurClass.prototype._istSichtbar, comment: "Liefert, ob die Figur sichtbar ist." },
        { type: "method", signature: "String toString()", java: FigurClass.prototype._mj$toString$String$, comment: "Beschreibt die Figur in einer Zeile, wie im Infofenster." },
        { type: "method", signature: "void kommeEinsVor()", native: FigurClass.prototype._kommeEinsVor, comment: "Setzt die Figur in der Liste der Figuren der Zeichenfläche eins nach vorne." },
        { type: "method", signature: "void kommeGanzVor()", native: FigurClass.prototype._kommeGanzVor, comment: "Setzt die Figur in der Liste der Figuren der Zeichenfläche ganz nach vorne." },
        { type: "method", signature: "void geheEinsZurueck()", native: FigurClass.prototype._geheEinsZurueck, comment: "Setzt die Figur in der Liste der Figuren der Zeichenfläche eins nach hinten." },
        { type: "method", signature: "void geheGanzZurueck()", native: FigurClass.prototype._geheGanzZurueck, comment: "Setzt die Figur in der Liste der Figuren der Zeichenfläche ganz nach hinten." },
    ];

    static type: NonPrimitiveType;

    // The protected fields are accessors, so that a subclass writing
    // xKoord = 10; gets the figure repainted just like setzeXKoord(10) does.
    _x: number = 0;
    _y: number = 0;
    _rgb: RGB = { r: 0, g: 0, b: 0 };
    _farbeObjekt?: ColorClass;
    _sichtbar: boolean = true;
    _frame: ZeichnenFrame | null = null;

    get xKoord(): number { return this._x; }
    set xKoord(v: number) { this._x = v; this.changed(); }
    get yKoord(): number { return this._y; }
    set yKoord(v: number) { this._y = v; this.changed(); }
    get sichtbar(): boolean { return this._sichtbar; }
    set sichtbar(v: boolean) { this._sichtbar = v; this.changed(); }
    get meinFrame(): ZeichnenFrame | null { return this._frame; }
    set meinFrame(v: ZeichnenFrame | null) { this._frame = v; this.changed(); }

    get farbe(): ColorClass {
        if (!this._farbeObjekt) this._farbeObjekt = rgbToColor(this._rgb);
        return this._farbeObjekt;
    }

    set farbe(c: ColorClass) {
        if (c == null) throw new NullPointerExceptionClass("Die Farbe darf nicht null sein.");
        this._rgb = colorToRGB(c);
        this._farbeObjekt = c;
        this.changed();
    }

    changed() {
        this._frame?.markDirty();
    }

    _figurMitFarbname(x: number, y: number, farbe: StringClass): FigurClass {
        this._x = x;
        this._y = y;
        this._setzeFarbeName(farbe);
        this._sichtbar = true;
        return this;
    }

    _figurMitRGB(x: number, y: number, rot: number, gruen: number, blau: number): FigurClass {
        this._x = x;
        this._y = y;
        this._setzeFarbeRGB(rot, gruen, blau);
        this._sichtbar = true;
        return this;
    }

    _setFlaeche(frame: ZeichnenFrame | null) {
        this.meinFrame = frame;
    }

    _setzeFarbeName(farbe: StringClass) {
        this._rgb = farbeZuName(farbe?.value);
        this._farbeObjekt = undefined;
        this.changed();
    }

    _setzeFarbeRGB(rot: number, gruen: number, blau: number) {
        let bad: string[] = [];
        if (rot < 0 || rot > 255) bad.push("Red");
        if (gruen < 0 || gruen > 255) bad.push("Green");
        if (blau < 0 || blau > 255) bad.push("Blue");
        if (bad.length > 0) throw new RuntimeExceptionClass("Color parameter outside of expected range: " + bad.join(" "));
        this._rgb = { r: rot, g: gruen, b: blau };
        this._farbeObjekt = undefined;
        this.changed();
    }

    _setzeXKoord(x: number) { this.xKoord = x; }
    _setzeYKoord(y: number) { this.yKoord = y; }

    _mj$zeichneDich$void$(t: Thread, callback: CallbackFunction) {
        if (this._sichtbar && this._frame) {
            let stift = this._frame.graphicsObject();
            this._mj$zeichneDich$void$Graphics(t, callback, stift);
            return;
        }
        if (callback) callback();
    }

    /** abstract: implemented by Linie, Oval, ... and by subclasses of the program */
    declare _mj$zeichneDich$void$Graphics: (t: Thread, callback: CallbackFunction, stift: ZeichnenGraphicsClass) => void;

    _getXKoord(): number { return this._x; }
    _getYKoord(): number { return this._y; }
    farbname(): string { return nameZuFarbe(this._rgb); }
    _getFarbe(): StringClass { return new StringClass(this.farbname()); }
    _getRot(): number { return this._rgb.r; }
    _getGruen(): number { return this._rgb.g; }
    _getBlau(): number { return this._rgb.b; }
    _setzeSichtbar(sichtbar: boolean) { this.sichtbar = sichtbar; }
    _istSichtbar(): boolean { return this._sichtbar; }

    beschreibung(): string {
        let klasse = classString(this);
        let abstand = " ".repeat(Math.max(0, 30 - klasse.length));
        let punktIndex = klasse.lastIndexOf(".") + 1;
        return (klasse + abstand + "\t (" + this._x + " | " + this._y + ") \t " + this.farbname()).substring(punktIndex)
            + "\t" + (this._sichtbar ? "sichtbar" : "unsichtbar");
    }

    _mj$toString$String$(t: Thread, callback: CallbackFunction) {
        t.s.push(new StringClass(this.beschreibung()));
        if (callback) callback();
    }

    private frameOrNPE(): ZeichnenFrame {
        if (!this._frame) throw new NullPointerExceptionClass("Die Figur wurde noch keiner Zeichenfläche hinzugefügt.");
        return this._frame;
    }

    _kommeEinsVor() { this.frameOrNPE()._setzeEinsNachVorneFigur(this); }
    _kommeGanzVor() { this.frameOrNPE()._setzeGanzNachVorneFigur(this); }
    _geheEinsZurueck() { this.frameOrNPE()._setzeEinsNachHintenFigur(this); }
    _geheGanzZurueck() { this.frameOrNPE()._setzeGanzNachHintenFigur(this); }
}

function gefuelltText(gefuellt: boolean) {
    return gefuellt ? "gefuellt" : "nicht gefuellt";
}

export class LinieClass extends FigurClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Linie extends Figur", comment: "Eine Linie auf der Zeichenfläche vom Punkt (xKoord|yKoord) zum Punkt (xEnde|yEnde)." },

        { type: "field", signature: "protected int xEnde", comment: "Die x-Koordinate des Endpunktes." },
        { type: "field", signature: "protected int yEnde", comment: "Die y-Koordinate des Endpunktes." },

        { type: "method", signature: "Linie(int pXKoord, int pYKoord, int pXEnde, int pYEnde, String pFarbe)", native: LinieClass.prototype._linieMitFarbname, comment: "Erstellt eine Linie von (pXKoord|pYKoord) bis (pXEnde|pYEnde). Die Farbe wird als Farbname angegeben." },
        { type: "method", signature: "Linie(int pXKoord, int pYKoord, int pXEnde, int pYEnde, int pRot, int pGruen, int pBlau)", native: LinieClass.prototype._linieMitRGB, comment: "Erstellt eine Linie von (pXKoord|pYKoord) bis (pXEnde|pYEnde). Die Farbe wird als RGB-Wert angegeben." },

        { type: "method", signature: "void setzeXEnde(int pXEnde)", native: LinieClass.prototype._setzeXEnde, comment: "Setzt die x-Koordinate des Endpunktes." },
        { type: "method", signature: "void setzeYEnde(int pYEnde)", native: LinieClass.prototype._setzeYEnde, comment: "Setzt die y-Koordinate des Endpunktes." },
        { type: "method", signature: "int getXEnde()", native: LinieClass.prototype._getXEnde, comment: "Liefert die x-Koordinate des Endpunktes." },
        { type: "method", signature: "int getYEnde()", native: LinieClass.prototype._getYEnde, comment: "Liefert die y-Koordinate des Endpunktes." },
        { type: "method", signature: "protected void zeichneDich(java.awt.Graphics stift)", native: LinieClass.prototype._zeichneLinie, comment: "Zeichnet die Linie." },
        { type: "method", signature: "String toString()", java: LinieClass.prototype._mj$toString$String$ },
    ];

    static type: NonPrimitiveType;

    _xEnde: number = 0;
    _yEnde: number = 0;

    get xEnde(): number { return this._xEnde; }
    set xEnde(v: number) { this._xEnde = v; this.changed(); }
    get yEnde(): number { return this._yEnde; }
    set yEnde(v: number) { this._yEnde = v; this.changed(); }

    _linieMitFarbname(x: number, y: number, xEnde: number, yEnde: number, farbe: StringClass): LinieClass {
        this._figurMitFarbname(x, y, farbe);
        this._xEnde = xEnde;
        this._yEnde = yEnde;
        return this;
    }

    _linieMitRGB(x: number, y: number, xEnde: number, yEnde: number, r: number, g: number, b: number): LinieClass {
        this._figurMitRGB(x, y, r, g, b);
        this._xEnde = xEnde;
        this._yEnde = yEnde;
        return this;
    }

    _setzeXEnde(v: number) { this.xEnde = v; }
    _setzeYEnde(v: number) { this.yEnde = v; }
    _getXEnde(): number { return this._xEnde; }
    _getYEnde(): number { return this._yEnde; }

    _zeichneLinie(stift: ZeichnenGraphicsClass) {
        stift.setRGB(this._rgb);
        stift._drawLine(this._x, this._y, this._xEnde, this._yEnde);
    }

    beschreibung(): string {
        return super.beschreibung() + "\t (" + this._xEnde + " | " + this._yEnde + ")";
    }
}

export class OvalClass extends FigurClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Oval extends Figur", comment: "Ein Oval (Ellipse) auf der Zeichenfläche. (xKoord|yKoord) ist die linke obere Ecke des umgebenden Rechtecks." },

        { type: "method", signature: "Oval(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe)", native: OvalClass.prototype._ovalMitFarbname, comment: "Erstellt ein neues Oval. Die Farbe wird als Farbname angegeben." },
        { type: "method", signature: "Oval(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, int pRot, int pGruen, int pBlau)", native: OvalClass.prototype._ovalMitRGB, comment: "Erstellt ein neues Oval. Die Farbe wird als RGB-Wert angegeben." },

        { type: "method", signature: "protected void zeichneDich(java.awt.Graphics stift)", native: OvalClass.prototype._zeichneOval, comment: "Zeichnet das Oval." },
        { type: "method", signature: "void setzeBreite(int pBreite)", native: OvalClass.prototype._setzeBreite, comment: "Setzt die Breite." },
        { type: "method", signature: "void setzeHoehe(int pHoehe)", native: OvalClass.prototype._setzeHoehe, comment: "Setzt die Höhe." },
        { type: "method", signature: "void setzeGefuellt(boolean pGefuellt)", native: OvalClass.prototype._setzeGefuellt, comment: "Legt fest, ob das Oval ausgefüllt oder nur als Umriss gezeichnet wird." },
        { type: "method", signature: "int getBreite()", native: OvalClass.prototype._getBreite, comment: "Liefert die Breite." },
        { type: "method", signature: "int getHoehe()", native: OvalClass.prototype._getHoehe, comment: "Liefert die Höhe." },
        { type: "method", signature: "boolean istGefuellt()", native: OvalClass.prototype._istGefuellt, comment: "Liefert, ob das Oval ausgefüllt ist." },
        { type: "method", signature: "String toString()", java: OvalClass.prototype._mj$toString$String$ },
    ];

    static type: NonPrimitiveType;

    // private in the desktop library, so no Java fields
    breite: number = 0;
    hoehe: number = 0;
    gefuellt: boolean = false;

    _ovalMitFarbname(x: number, y: number, breite: number, hoehe: number, gefuellt: boolean, farbe: StringClass): OvalClass {
        this._figurMitFarbname(x, y, farbe);
        this.breite = breite;
        this.hoehe = hoehe;
        this.gefuellt = gefuellt;
        return this;
    }

    _ovalMitRGB(x: number, y: number, breite: number, hoehe: number, gefuellt: boolean, r: number, g: number, b: number): OvalClass {
        this._figurMitRGB(x, y, r, g, b);
        this.breite = breite;
        this.hoehe = hoehe;
        this.gefuellt = gefuellt;
        return this;
    }

    _zeichneOval(stift: ZeichnenGraphicsClass) {
        stift.setRGB(this._rgb);
        if (this.gefuellt) {
            stift._fillOval(this._x, this._y, this.breite, this.hoehe);
        } else {
            stift._drawOval(this._x, this._y, this.breite, this.hoehe);
        }
    }

    _setzeBreite(v: number) { this.breite = v; this.changed(); }
    _setzeHoehe(v: number) { this.hoehe = v; this.changed(); }
    _setzeGefuellt(v: boolean) { this.gefuellt = v; this.changed(); }
    _getBreite(): number { return this.breite; }
    _getHoehe(): number { return this.hoehe; }
    _istGefuellt(): boolean { return this.gefuellt; }

    beschreibung(): string {
        return super.beschreibung() + "\t" + this.breite + "x" + this.hoehe + "\t" + gefuelltText(this.gefuellt);
    }
}

export class RechteckClass extends FigurClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Rechteck extends Figur", comment: "Ein Rechteck auf der Zeichenfläche. (xKoord|yKoord) ist die linke obere Ecke." },

        { type: "field", signature: "protected int breite", comment: "Die Breite des Rechtecks." },
        { type: "field", signature: "protected int hoehe", comment: "Die Höhe des Rechtecks." },
        { type: "field", signature: "protected boolean gefuellt", comment: "Gibt an, ob das Rechteck ausgefüllt ist oder nur der Umriss zu sehen ist." },

        { type: "method", signature: "Rechteck(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe)", native: RechteckClass.prototype._rechteckMitFarbname, comment: "Erstellt ein neues Rechteck. Die Farbe wird als Farbname angegeben." },
        { type: "method", signature: "Rechteck(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, int pRot, int pGruen, int pBlau)", native: RechteckClass.prototype._rechteckMitRGB, comment: "Erstellt ein neues Rechteck. Die Farbe wird als RGB-Wert angegeben." },

        { type: "method", signature: "protected void zeichneDich(java.awt.Graphics stift)", native: RechteckClass.prototype._zeichneRechteck, comment: "Zeichnet das Rechteck." },
        { type: "method", signature: "void setzeBreite(int pBreite)", native: RechteckClass.prototype._setzeBreite, comment: "Setzt die Breite." },
        { type: "method", signature: "void setzeHoehe(int pHoehe)", native: RechteckClass.prototype._setzeHoehe, comment: "Setzt die Höhe." },
        { type: "method", signature: "void setzeGefuellt(boolean pGefuellt)", native: RechteckClass.prototype._setzeGefuellt, comment: "Legt fest, ob das Rechteck ausgefüllt oder nur als Umriss gezeichnet wird." },
        { type: "method", signature: "int getBreite()", native: RechteckClass.prototype._getBreite, comment: "Liefert die Breite." },
        { type: "method", signature: "int getHoehe()", native: RechteckClass.prototype._getHoehe, comment: "Liefert die Höhe." },
        { type: "method", signature: "boolean istGefuellt()", native: RechteckClass.prototype._istGefuellt, comment: "Liefert, ob das Rechteck ausgefüllt ist." },
        { type: "method", signature: "String toString()", java: RechteckClass.prototype._mj$toString$String$ },
    ];

    static type: NonPrimitiveType;

    _breite: number = 0;
    _hoehe: number = 0;
    _gefuellt: boolean = false;

    get breite(): number { return this._breite; }
    set breite(v: number) { this._breite = v; this.changed(); }
    get hoehe(): number { return this._hoehe; }
    set hoehe(v: number) { this._hoehe = v; this.changed(); }
    get gefuellt(): boolean { return this._gefuellt; }
    set gefuellt(v: boolean) { this._gefuellt = v; this.changed(); }

    _rechteckMitFarbname(x: number, y: number, breite: number, hoehe: number, gefuellt: boolean, farbe: StringClass): RechteckClass {
        this._figurMitFarbname(x, y, farbe);
        this._breite = breite;
        this._hoehe = hoehe;
        this._gefuellt = gefuellt;
        return this;
    }

    _rechteckMitRGB(x: number, y: number, breite: number, hoehe: number, gefuellt: boolean, r: number, g: number, b: number): RechteckClass {
        this._figurMitRGB(x, y, r, g, b);
        this._breite = breite;
        this._hoehe = hoehe;
        this._gefuellt = gefuellt;
        return this;
    }

    _zeichneRechteck(stift: ZeichnenGraphicsClass) {
        stift.setRGB(this._rgb);
        stift._drawRect(this._x, this._y, this._breite, this._hoehe);
        if (this._gefuellt) stift._fillRect(this._x, this._y, this._breite, this._hoehe);
    }

    _setzeBreite(v: number) { this.breite = v; }
    _setzeHoehe(v: number) { this.hoehe = v; }
    _setzeGefuellt(v: boolean) { this.gefuellt = v; }
    _getBreite(): number { return this._breite; }
    _getHoehe(): number { return this._hoehe; }
    _istGefuellt(): boolean { return this._gefuellt; }

    beschreibung(): string {
        return super.beschreibung() + "\t" + this._breite + "x" + this._hoehe + "\t" + gefuelltText(this._gefuellt);
    }
}

export class DreieckClass extends FigurClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Dreieck extends Figur", comment: "Ein Dreieck auf der Zeichenfläche, gegeben durch seine drei Eckpunkte." },

        { type: "field", signature: "protected boolean gefuellt", comment: "Gibt an, ob das Dreieck ausgefüllt ist oder nur der Umriss zu sehen ist." },
        { type: "field", signature: "protected int[] meineX", comment: "Die x-Koordinaten der drei Eckpunkte." },
        { type: "field", signature: "protected int[] meineY", comment: "Die y-Koordinaten der drei Eckpunkte." },

        { type: "method", signature: "Dreieck(int pX1, int pY1, int pX2, int pY2, int pX3, int pY3, boolean pGefuellt, String pFarbe)", native: DreieckClass.prototype._dreieckMitFarbname, comment: "Erstellt ein neues Dreieck mit den Eckpunkten (pX1|pY1), (pX2|pY2) und (pX3|pY3). Die Farbe wird als Farbname angegeben." },
        { type: "method", signature: "Dreieck(int pX1, int pY1, int pX2, int pY2, int pX3, int pY3, boolean pGefuellt, int pRot, int pGruen, int pBlau)", native: DreieckClass.prototype._dreieckMitRGB, comment: "Erstellt ein neues Dreieck mit den Eckpunkten (pX1|pY1), (pX2|pY2) und (pX3|pY3). Die Farbe wird als RGB-Wert angegeben." },

        { type: "method", signature: "protected void zeichneDich(java.awt.Graphics stift)", native: DreieckClass.prototype._zeichneDreieck, comment: "Zeichnet das Dreieck." },
        { type: "method", signature: "void setzeGefuellt(boolean pGefuellt)", native: DreieckClass.prototype._setzeGefuellt, comment: "Legt fest, ob das Dreieck ausgefüllt oder nur als Umriss gezeichnet wird." },
        { type: "method", signature: "void setzeXWerte(int pX1, int pX2, int pX3)", native: DreieckClass.prototype._setzeXWerte, comment: "Setzt die x-Koordinaten der drei Eckpunkte." },
        { type: "method", signature: "void setzeYWerte(int pY1, int pY2, int pY3)", native: DreieckClass.prototype._setzeYWerte, comment: "Setzt die y-Koordinaten der drei Eckpunkte." },
        { type: "method", signature: "int[] getXWerte()", native: DreieckClass.prototype._getXWerte, comment: "Liefert die x-Koordinaten der Eckpunkte als Array." },
        { type: "method", signature: "int[] getYWerte()", native: DreieckClass.prototype._getYWerte, comment: "Liefert die y-Koordinaten der Eckpunkte als Array." },
        { type: "method", signature: "boolean getGefuellt()", native: DreieckClass.prototype._istGefuellt, comment: "Liefert, ob das Dreieck ausgefüllt ist." },
        { type: "method", signature: "boolean istGefuellt()", native: DreieckClass.prototype._istGefuellt, comment: "Liefert, ob das Dreieck ausgefüllt ist." },
        { type: "method", signature: "String toString()", java: DreieckClass.prototype._mj$toString$String$ },
    ];

    static type: NonPrimitiveType;

    _gefuellt: boolean = false;
    meineX: number[] = [0, 0, 0];
    meineY: number[] = [0, 0, 0];

    get gefuellt(): boolean { return this._gefuellt; }
    set gefuellt(v: boolean) { this._gefuellt = v; this.changed(); }

    private ecken(x2: number, y2: number, x3: number, y3: number, gefuellt: boolean) {
        this.meineX = [this._x, x2, x3];
        this.meineY = [this._y, y2, y3];
        this._gefuellt = gefuellt;
    }

    _dreieckMitFarbname(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, gefuellt: boolean, farbe: StringClass): DreieckClass {
        this._figurMitFarbname(x1, y1, farbe);
        this.ecken(x2, y2, x3, y3, gefuellt);
        return this;
    }

    _dreieckMitRGB(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, gefuellt: boolean, r: number, g: number, b: number): DreieckClass {
        this._figurMitRGB(x1, y1, r, g, b);
        this.ecken(x2, y2, x3, y3, gefuellt);
        return this;
    }

    /** As on the desktop the corners are drawn from meineX/meineY, not from xKoord/yKoord. */
    _zeichneDreieck(stift: ZeichnenGraphicsClass) {
        stift.setRGB(this._rgb);
        stift._drawPolyline(this.meineX, this.meineY, this.meineX.length);
        stift._drawLine(this.meineX[2], this.meineY[2], this.meineX[0], this.meineY[0]);
        if (this._gefuellt) stift._fillPolygon(this.meineX, this.meineY, this.meineX.length);
    }

    _setzeGefuellt(v: boolean) { this.gefuellt = v; }

    _setzeXWerte(x1: number, x2: number, x3: number) {
        this.meineX[0] = x1; this.meineX[1] = x2; this.meineX[2] = x3;
        this.changed();
    }

    _setzeYWerte(y1: number, y2: number, y3: number) {
        this.meineY[0] = y1; this.meineY[1] = y2; this.meineY[2] = y3;
        this.changed();
    }

    _getXWerte(): number[] { return this.meineX; }
    _getYWerte(): number[] { return this.meineY; }
    _istGefuellt(): boolean { return this._gefuellt; }

    beschreibung(): string {
        return super.beschreibung() + "\t" + " (" + this.meineX[1] + "|" + this.meineY[1] + ")" + " (" + this.meineX[2] + "|" + this.meineY[2] + ")"
            + "\t" + gefuelltText(this._gefuellt);
    }
}
