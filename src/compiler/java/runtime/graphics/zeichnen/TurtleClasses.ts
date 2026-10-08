import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { warte } from "./ZeichnenFlaecheClasses";
import { ZeichnenLayer, ZeichnenRuntime, ZeichnenSurface } from "./ZeichnenRuntime";

const SCHWARZ = { r: 0, g: 0, b: 0 };
const WEISS = { r: 255, g: 255, b: 255 };

/** how Java prints a double: 90.0, 12.5 */
function javaDouble(d: number): string {
    return Number.isInteger(d) ? d.toFixed(1) : "" + d;
}

export class BasisturtleClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "turtle", signature: "class Basisturtle extends Object", comment: "Eine Turtle, die sich ihre Position merkt, aber nicht zeichnet." },
        { type: "method", signature: "Basisturtle(int pXKoord, int pYKoord)", native: BasisturtleClass.prototype._basisturtle, comment: "Erstellt eine Turtle an der Position (pXKoord|pYKoord)." },
        { type: "method", signature: "void gibInfo()", java: BasisturtleClass.prototype._mj$gibInfo$void$, comment: "Gibt die Position auf der Konsole aus." },
        { type: "method", signature: "void moveRight(int pWeite)", native: BasisturtleClass.prototype._moveRight, comment: "Verschiebt die Turtle um pWeite nach rechts." },
        { type: "method", signature: "void moveUp(int pWeite)", native: BasisturtleClass.prototype._moveUp, comment: "Verschiebt die Turtle um pWeite nach oben." },
        { type: "method", signature: "void zufallsposition(int pMaxX, int pMaxY)", native: BasisturtleClass.prototype._zufallsposition, comment: "Setzt die Turtle an eine zufällige Position mit 0 <= x < pMaxX und 0 <= y < pMaxY." },
        { type: "method", signature: "int getXKoord()", native: BasisturtleClass.prototype._getXKoord, comment: "Liefert die x-Koordinate." },
        { type: "method", signature: "int getYKoord()", native: BasisturtleClass.prototype._getYKoord, comment: "Liefert die y-Koordinate." },
    ];

    static type: NonPrimitiveType;

    x: number = 0;
    y: number = 0;

    _basisturtle(x: number, y: number): BasisturtleClass {
        this.x = x;
        this.y = y;
        return this;
    }

    info(): string {
        return "Meine Position ist (" + this.x + "|" + this.y + ").";
    }

    _mj$gibInfo$void$(t: Thread, callback: CallbackFunction) {
        t.print(this.info(), undefined);
        if (callback) callback();
    }

    _moveRight(weite: number) { this.x += weite; }
    _moveUp(weite: number) { this.y -= weite; }

    _zufallsposition(maxX: number, maxY: number) {
        this.x = Math.trunc(Math.random() * maxX);
        this.y = Math.trunc(Math.random() * maxY);
    }

    _getXKoord(): number { return this.x; }
    _getYKoord(): number { return this.y; }
}

export class ZeichenturtleClass extends BasisturtleClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "turtle", signature: "class Zeichenturtle extends Basisturtle", comment: "Eine Turtle, die beim Bewegen auf ihrer Turtlefläche Linien zeichnet. Winkel 0 zeigt nach oben, drehe dreht im Uhrzeigersinn." },
        { type: "method", signature: "Zeichenturtle(int pXKoord, int pYKoord, Turtleflaeche pFlaeche)", native: ZeichenturtleClass.prototype._zeichenturtle, comment: "Erstellt eine Turtle an der Position (pXKoord|pYKoord) auf der Turtlefläche." },
        { type: "method", signature: "void gibInfo()", java: ZeichenturtleClass.prototype._mj$gibInfo$void$, comment: "Gibt Position und Winkel auf der Konsole aus." },
        { type: "method", signature: "void geheNachRechts(int pWeite)", native: ZeichenturtleClass.prototype._geheNachRechts, comment: "Geht pWeite nach rechts und zeichnet dabei, wenn der Stift unten ist." },
        { type: "method", signature: "void geheNachOben(int pWeite)", native: ZeichenturtleClass.prototype._geheNachOben, comment: "Geht pWeite nach oben und zeichnet dabei, wenn der Stift unten ist." },
        { type: "method", signature: "void machePunkt(int pRadius)", native: ZeichenturtleClass.prototype._machePunkt, comment: "Zeichnet einen Punkt mit dem Durchmesser pRadius an der Position der Turtle." },
        { type: "method", signature: "void drehe(double pWinkel)", native: ZeichenturtleClass.prototype._drehe, comment: "Dreht die Turtle um pWinkel Grad im Uhrzeigersinn." },
        { type: "method", signature: "void geheVor(int pWeite)", native: ZeichenturtleClass.prototype._geheVor, comment: "Geht pWeite in Blickrichtung und zeichnet dabei, wenn der Stift unten ist." },
        { type: "method", signature: "void warte(int pDauer)", java: ZeichenturtleClass.prototype._mj$warte$void$int, comment: "Hält das Programm pDauer Millisekunden lang an." },
        { type: "method", signature: "void stiftHoch()", native: ZeichenturtleClass.prototype._stiftHoch, comment: "Hebt den Stift: die Turtle zeichnet beim Gehen nicht mehr." },
        { type: "method", signature: "void stiftRunter()", native: ZeichenturtleClass.prototype._stiftRunter, comment: "Senkt den Stift: die Turtle zeichnet beim Gehen." },
    ];

    static type: NonPrimitiveType;

    flaeche: TurtleflaecheClass | null = null;
    winkel: number = 0;
    stiftUnten: boolean = true;

    _zeichenturtle(x: number, y: number, flaeche: TurtleflaecheClass): ZeichenturtleClass {
        this._basisturtle(x, y);
        this.flaeche = flaeche;
        return this;
    }

    private linie(x1: number, y1: number, x2: number, y2: number) {
        if (this.stiftUnten) this.flaeche?.layer?.drawLine(x1, y1, x2, y2, SCHWARZ);
    }

    _mj$gibInfo$void$(t: Thread, callback: CallbackFunction) {
        t.println(this.info() + " Mein Winkel ist " + javaDouble(this.winkel) + ".", undefined);
        if (callback) callback();
    }

    _geheNachRechts(weite: number) {
        this.linie(this.x, this.y, this.x + weite, this.y);
        this._moveRight(weite);
    }

    _geheNachOben(weite: number) {
        this.linie(this.x, this.y, this.x, this.y - weite);
        this._moveUp(weite);
    }

    _machePunkt(radius: number) {
        let r = Math.trunc(radius / 2);
        this.flaeche?.layer?.fillOval(this.x - r, this.y - r, radius, radius, SCHWARZ);
    }

    _drehe(winkel: number) {
        this.winkel = (this.winkel + winkel) % 360;
    }

    _geheVor(weite: number) {
        let dx = Math.round(weite * Math.sin(this.winkel * Math.PI / 180));
        let dy = Math.round(weite * Math.cos(this.winkel * Math.PI / 180));
        this.linie(this.x, this.y, this.x + dx, this.y - dy);
        this._moveRight(dx);
        this._moveUp(dy);
    }

    _mj$warte$void$int(t: Thread, callback: CallbackFunction, dauer: number) {
        warte(t, dauer);
        if (callback) callback();
    }

    _stiftHoch() { this.stiftUnten = false; }
    _stiftRunter() { this.stiftUnten = true; }
}

export class TurtleflaecheClass extends ObjectClass implements ZeichnenSurface {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "turtle", signature: "class Turtleflaeche extends Object", comment: "Eine Zeichenfläche mit einer Zeichenturtle in der Mitte. Was die Turtle zeichnet, bleibt stehen." },
        { type: "method", signature: "Turtleflaeche()", java: TurtleflaecheClass.prototype._cj$_constructor_$Turtleflaeche$, comment: "Erstellt eine Turtlefläche mit den Abmessungen 800 mal 600; die Turtle steht bei (400|300)." },
        { type: "method", signature: "Turtleflaeche(int pBreite, int pHoehe)", java: TurtleflaecheClass.prototype._cj$_constructor_$Turtleflaeche$int$int, comment: "Erstellt eine Turtlefläche mit den angegebenen Abmessungen; die Turtle steht in der Mitte." },
        { type: "method", signature: "Zeichenturtle getTurtle()", native: TurtleflaecheClass.prototype._getTurtle, comment: "Liefert die Turtle der Fläche." },
        { type: "method", signature: "int getBreite()", native: TurtleflaecheClass.prototype._getBreite, comment: "Liefert die Breite der Fläche." },
        { type: "method", signature: "int getHoehe()", native: TurtleflaecheClass.prototype._getHoehe, comment: "Liefert die Höhe der Fläche." },
    ];

    static type: NonPrimitiveType;

    width: number = 800;
    height: number = 600;
    layer?: ZeichnenLayer;
    meineTurtle?: ZeichenturtleClass;

    _cj$_constructor_$Turtleflaeche$(t: Thread, callback: CallbackFunction) {
        this.erzeuge(t, callback, 800, 600, 400, 300);
    }

    _cj$_constructor_$Turtleflaeche$int$int(t: Thread, callback: CallbackFunction, breite: number, hoehe: number) {
        this.erzeuge(t, callback, breite, hoehe, Math.trunc(breite / 2), Math.trunc(hoehe / 2));
    }

    private erzeuge(t: Thread, callback: CallbackFunction, breite: number, hoehe: number, x: number, y: number) {
        this.meineTurtle = new ZeichenturtleClass()._zeichenturtle(x, y, this);
        this.width = breite;
        this.height = hoehe;
        ZeichnenRuntime.of(t).addSurface(t, this, () => {
            this.layer?.clear(WEISS, breite, hoehe);
            t.s.push(this);
            if (callback) callback();
        });
    }

    /** The turtle draws straight onto the layer, nothing to repaint. */
    paint(_t: Thread, callback: () => void) {
        callback();
    }

    needsContinuousRepaint(): boolean {
        return false;
    }

    _getTurtle(): ZeichenturtleClass | undefined { return this.meineTurtle; }
    _getBreite(): number { return this.width; }
    _getHoehe(): number { return this.height; }
}
