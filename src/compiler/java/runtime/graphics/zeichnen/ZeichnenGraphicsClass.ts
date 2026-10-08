import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { ColorClass } from "../ColorClass";
import { RGB, ZeichnenLayer } from "./ZeichnenRuntime";

/**
 * The part of java.awt.Graphics the library draws with. A class of the program
 * that extends Figur gets one in zeichneDich(Graphics stift).
 */
export class ZeichnenGraphicsClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "java.awt", signature: "abstract class Graphics extends Object", comment: "Zeichenstift einer Zeichenfläche (Ausschnitt aus java.awt.Graphics). Koordinaten in Pixeln, (0|0) ist die linke obere Ecke." },

        { type: "method", signature: "void setColor(Color c)", native: ZeichnenGraphicsClass.prototype._setColor, comment: "Setzt die Farbe, mit der ab jetzt gezeichnet wird." },
        { type: "method", signature: "Color getColor()", native: ZeichnenGraphicsClass.prototype._getColor, comment: "Liefert die Farbe, mit der gezeichnet wird." },
        { type: "method", signature: "void drawLine(int x1, int y1, int x2, int y2)", native: ZeichnenGraphicsClass.prototype._drawLine, comment: "Zeichnet eine Linie von (x1|y1) nach (x2|y2)." },
        { type: "method", signature: "void drawRect(int x, int y, int width, int height)", native: ZeichnenGraphicsClass.prototype._drawRect, comment: "Zeichnet den Umriss eines Rechtecks mit der linken oberen Ecke (x|y)." },
        { type: "method", signature: "void fillRect(int x, int y, int width, int height)", native: ZeichnenGraphicsClass.prototype._fillRect, comment: "Zeichnet ein ausgefülltes Rechteck mit der linken oberen Ecke (x|y)." },
        { type: "method", signature: "void drawOval(int x, int y, int width, int height)", native: ZeichnenGraphicsClass.prototype._drawOval, comment: "Zeichnet den Umriss eines Ovals, das in das Rechteck mit der linken oberen Ecke (x|y) passt." },
        { type: "method", signature: "void fillOval(int x, int y, int width, int height)", native: ZeichnenGraphicsClass.prototype._fillOval, comment: "Zeichnet ein ausgefülltes Oval, das in das Rechteck mit der linken oberen Ecke (x|y) passt." },
        { type: "method", signature: "void drawPolyline(int[] xPoints, int[] yPoints, int nPoints)", native: ZeichnenGraphicsClass.prototype._drawPolyline, comment: "Zeichnet einen Linienzug durch die ersten nPoints Punkte." },
        { type: "method", signature: "void drawPolygon(int[] xPoints, int[] yPoints, int nPoints)", native: ZeichnenGraphicsClass.prototype._drawPolygon, comment: "Zeichnet den Umriss des Vielecks aus den ersten nPoints Punkten." },
        { type: "method", signature: "void fillPolygon(int[] xPoints, int[] yPoints, int nPoints)", native: ZeichnenGraphicsClass.prototype._fillPolygon, comment: "Zeichnet das ausgefüllte Vieleck aus den ersten nPoints Punkten." },
        { type: "method", signature: "void drawArc(int x, int y, int width, int height, int startAngle, int arcAngle)", native: ZeichnenGraphicsClass.prototype._drawArc, comment: "Zeichnet einen Ellipsenbogen; die Winkel werden in Grad gegen den Uhrzeigersinn angegeben, 0° zeigt nach rechts." },
        { type: "method", signature: "void fillArc(int x, int y, int width, int height, int startAngle, int arcAngle)", native: ZeichnenGraphicsClass.prototype._fillArc, comment: "Zeichnet ein ausgefülltes Kreissegment; die Winkel werden in Grad gegen den Uhrzeigersinn angegeben, 0° zeigt nach rechts." },
        { type: "method", signature: "void drawString(String str, int x, int y)", native: ZeichnenGraphicsClass.prototype._drawString, comment: "Schreibt den Text so, dass seine Grundlinie bei y beginnt." },
    ];

    static type: NonPrimitiveType;

    color: RGB = { r: 0, g: 0, b: 0 };

    /** the surface whose layer this Graphics draws on */
    owner?: { layer?: ZeichnenLayer };

    static on(owner: { layer?: ZeichnenLayer }): ZeichnenGraphicsClass {
        let g = new ZeichnenGraphicsClass();
        g.owner = owner;
        return g;
    }

    get layer(): ZeichnenLayer | undefined {
        return this.owner?.layer;
    }

    setRGB(color: RGB) {
        this.color = color;
    }

    _setColor(c: ColorClass) {
        if (c == null) return;      // as in AWT
        this.color = { r: c.red, g: c.green, b: c.blue };
    }

    _getColor(): ColorClass {
        let c = new ColorClass();
        c.red = this.color.r;
        c.green = this.color.g;
        c.blue = this.color.b;
        return c;
    }

    _drawLine(x1: number, y1: number, x2: number, y2: number) {
        this.layer?.drawLine(x1, y1, x2, y2, this.color);
    }

    _drawRect(x: number, y: number, w: number, h: number) {
        this.layer?.drawRect(x, y, w, h, this.color);
    }

    _fillRect(x: number, y: number, w: number, h: number) {
        this.layer?.fillRect(x, y, w, h, this.color);
    }

    _drawOval(x: number, y: number, w: number, h: number) {
        this.layer?.drawOval(x, y, w, h, this.color);
    }

    _fillOval(x: number, y: number, w: number, h: number) {
        this.layer?.fillOval(x, y, w, h, this.color);
    }

    _drawPolyline(xs: number[], ys: number[], n: number) {
        this.layer?.drawPolyline(xs, ys, n, this.color);
    }

    _drawPolygon(xs: number[], ys: number[], n: number) {
        this.layer?.drawPolyline(xs, ys, n, this.color, true);
    }

    _fillPolygon(xs: number[], ys: number[], n: number) {
        this.layer?.fillPolygon(xs, ys, n, this.color);
    }

    _drawArc(x: number, y: number, w: number, h: number, start: number, arc: number) {
        this.layer?.drawArc(x, y, w, h, start, arc, this.color, false);
    }

    _fillArc(x: number, y: number, w: number, h: number, start: number, arc: number) {
        this.layer?.drawArc(x, y, w, h, start, arc, this.color, true);
    }

    _drawString(s: StringClass, x: number, y: number) {
        if (s == null) return;
        this.layer?.drawString(s.value, x, y, this.color);
    }
}
