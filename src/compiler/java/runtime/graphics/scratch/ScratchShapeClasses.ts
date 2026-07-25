import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchBoundsClass } from "./ScratchBoundsClass";
import { desktopOnly } from "./ScratchUnsupported";

export type Point = { x: number, y: number };

/** How many segments a full circle or ellipse is flattened into. */
const CURVE_SEGMENTS = 32;

/**
 * Geometry for custom hitboxes, mirroring org.openpatch.scratch.Shape and its
 * subclasses.
 *
 * Upstream wraps java.awt shapes and flattens them to a path when it needs to
 * test or draw. There is no java.awt here, so every shape IS its outline: the
 * primitives build their points up front and curves are flattened at
 * construction. That keeps contains/intersects/getBounds and — the reason this
 * exists — Sprite.setHitbox(Shape) working for real.
 *
 * Only draw() is desktop-only; it renders through Processing's PGraphics.
 */
export class ScratchShapeClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Shape extends Object", comment: "Geometrische Form, z.B. für eigene Trefferflächen" },

        { type: "method", signature: "boolean contains(double x, double y)", native: ScratchShapeClass.prototype._contains, comment: "Gibt genau dann true zurück, wenn der Punkt in der Form liegt" },
        { type: "method", signature: "boolean intersects(Shape other)", native: ScratchShapeClass.prototype._intersects, comment: "Gibt genau dann true zurück, wenn sich beide Formen überlappen" },
        { type: "method", signature: "Shape scale(double scaleX, double scaleY)", native: ScratchShapeClass.prototype._scale, comment: "Gibt die skalierte Form als neue Form zurück" },
        { type: "method", signature: "Shape translate(double dx, double dy)", native: ScratchShapeClass.prototype._translate, comment: "Gibt die verschobene Form als neue Form zurück" },
        { type: "method", signature: "Shape rotate(double theta, double anchorX, double anchorY)", native: ScratchShapeClass.prototype._rotate, comment: "Gibt die um theta Grad gedrehte Form als neue Form zurück" },
        { type: "method", signature: "Bounds getBounds()", native: ScratchShapeClass.prototype._getBounds, comment: "Gibt das umschließende Rechteck zurück" },
        { type: "method", signature: "void draw()", native: ScratchShapeClass.prototype._draw, comment: "Nur in der Desktop-Version: zeichnet die Form" },
    ];

    static type: NonPrimitiveType;

    /** The outline, in order. Curves arrive here already flattened. */
    points: Point[] = [];

    protected setPoints(points: Point[]) { this.points = points; }

    _contains(x: number, y: number): boolean {
        return ScratchShapeClass.pointInPolygon(this.points, x, y);
    }

    _intersects(other: ScratchShapeClass): boolean {
        if (!other) return false;
        return ScratchShapeClass.polygonsOverlap(this.points, other.points);
    }

    _scale(scaleX: number, scaleY: number): ScratchShapeClass {
        return ScratchShapeClass.of(this.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })));
    }

    _translate(dx: number, dy: number): ScratchShapeClass {
        return ScratchShapeClass.of(this.points.map(p => ({ x: p.x + dx, y: p.y + dy })));
    }

    /** theta is in DEGREES, as upstream converts before building the transform. */
    _rotate(theta: number, anchorX: number, anchorY: number): ScratchShapeClass {
        const rad = theta / 180 * Math.PI;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        return ScratchShapeClass.of(this.points.map(p => {
            const dx = p.x - anchorX, dy = p.y - anchorY;
            return { x: anchorX + dx * cos - dy * sin, y: anchorY + dx * sin + dy * cos };
        }));
    }

    _getBounds(): ScratchBoundsClass {
        if (this.points.length === 0) return new ScratchBoundsClass(0, 0, 0, 0);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of this.points) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        return new ScratchBoundsClass(minX, minY, maxX - minX, maxY - minY);
    }

    _draw() {
        desktopOnly("Shape.draw()", "Zeichne die Form mit einem Pen. / Draw the shape with a Pen instead.");
    }

    /** A bare Shape carrying the given outline. */
    static of(points: Point[]): ScratchShapeClass {
        const s = new ScratchShapeClass();
        s.points = points;
        return s;
    }

    /** Even-odd ray casting, the same answer java.awt.Shape.contains gives. */
    static pointInPolygon(points: Point[], x: number, y: number): boolean {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const hit = (points[i].y > y) !== (points[j].y > y)
                && x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x;
            if (hit) inside = !inside;
        }
        return inside;
    }

    /**
     * True when the outlines overlap: either polygon may sit inside the other,
     * or an edge pair may cross. Unlike a separating-axis test this is also
     * correct for concave outlines, which hand-written hitboxes often are.
     */
    static polygonsOverlap(a: Point[], b: Point[]): boolean {
        if (a.length < 3 || b.length < 3) return false;
        for (const p of a) if (ScratchShapeClass.pointInPolygon(b, p.x, p.y)) return true;
        for (const p of b) if (ScratchShapeClass.pointInPolygon(a, p.x, p.y)) return true;
        for (let i = 0; i < a.length; i++) {
            const a1 = a[i], a2 = a[(i + 1) % a.length];
            for (let j = 0; j < b.length; j++) {
                const b1 = b[j], b2 = b[(j + 1) % b.length];
                if (ScratchShapeClass.segmentsCross(a1, a2, b1, b2)) return true;
            }
        }
        return false;
    }

    private static segmentsCross(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
        const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (d === 0) return false;                       // parallel
        const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
        const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    /** Flatten an axis-aligned ellipse given by its bounding box. */
    static ellipsePoints(x: number, y: number, width: number, height: number): Point[] {
        const rx = width / 2, ry = height / 2;
        const cx = x + rx, cy = y + ry;
        const points: Point[] = [];
        for (let i = 0; i < CURVE_SEGMENTS; i++) {
            const a = (i / CURVE_SEGMENTS) * Math.PI * 2;
            points.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
        }
        return points;
    }
}

/** Circle(x, y, radius) — x and y are the CENTRE, as upstream. */
export class ScratchCircleClass extends ScratchShapeClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Circle extends Shape", comment: "Kreis; x und y sind der Mittelpunkt" },
        { type: "method", signature: "Circle(double x, double y, double radius)", native: ScratchCircleClass.prototype._c3, comment: "Erzeugt einen Kreis um (x, y) mit dem angegebenen Radius" },
    ];
    static type: NonPrimitiveType;

    _c3(x: number, y: number, radius: number) {
        this.setPoints(ScratchShapeClass.ellipsePoints(x - radius, y - radius, radius * 2, radius * 2));
        return this;
    }
}

/** Rectangle(x, y, width, height) — x and y are the TOP-LEFT corner. */
export class ScratchRectangleClass extends ScratchShapeClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Rectangle extends Shape", comment: "Rechteck; x und y sind die linke obere Ecke" },
        { type: "method", signature: "Rectangle(double x, double y, double width, double height)", native: ScratchRectangleClass.prototype._c4, comment: "Erzeugt ein Rechteck mit der linken oberen Ecke bei (x, y)" },
    ];
    static type: NonPrimitiveType;

    _c4(x: number, y: number, width: number, height: number) {
        this.setPoints([
            { x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height },
        ]);
        return this;
    }
}

/** Ellipse(x, y, width, height) — x and y are the bounding box's top-left. */
export class ScratchEllipseClass extends ScratchShapeClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Ellipse extends Shape", comment: "Ellipse; x und y sind die linke obere Ecke des umschließenden Rechtecks" },
        { type: "method", signature: "Ellipse(double x, double y, double width, double height)", native: ScratchEllipseClass.prototype._c4, comment: "Erzeugt eine Ellipse im angegebenen Rechteck" },
    ];
    static type: NonPrimitiveType;

    _c4(x: number, y: number, width: number, height: number) {
        this.setPoints(ScratchShapeClass.ellipsePoints(x, y, width, height));
        return this;
    }
}

export class ScratchTriangleClass extends ScratchShapeClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Triangle extends Shape", comment: "Dreieck aus drei Eckpunkten" },
        { type: "method", signature: "Triangle(double x1, double y1, double x2, double y2, double x3, double y3)", native: ScratchTriangleClass.prototype._c6, comment: "Erzeugt ein Dreieck aus den drei Eckpunkten" },
    ];
    static type: NonPrimitiveType;

    _c6(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        this.setPoints([{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }]);
        return this;
    }
}

export class ScratchPolygonClass extends ScratchShapeClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Polygon extends Shape", comment: "Vieleck aus beliebig vielen Punkten" },
        { type: "method", signature: "Polygon()", native: ScratchPolygonClass.prototype._c0, comment: "Erzeugt ein leeres Vieleck; Punkte kommen mit addPoint() dazu" },
        { type: "method", signature: "Polygon(double[] xPoints, double[] yPoints)", native: ScratchPolygonClass.prototype._c2, comment: "Erzeugt ein Vieleck aus x- und y-Koordinaten" },
        { type: "method", signature: "void addPoint(double x, double y)", native: ScratchPolygonClass.prototype._addPoint, comment: "Fügt dem Vieleck einen Punkt hinzu" },
    ];
    static type: NonPrimitiveType;

    _c0() { this.setPoints([]); return this; }

    _c2(xPoints: number[], yPoints: number[]) {
        if ((xPoints?.length ?? 0) !== (yPoints?.length ?? 0)) {
            throw new RuntimeExceptionClass(
                "xPoints und yPoints müssen gleich lang sein / xPoints and yPoints must have the same length");
        }
        const points: Point[] = [];
        for (let i = 0; i < (xPoints?.length ?? 0); i++) points.push({ x: xPoints[i], y: yPoints[i] });
        this.setPoints(points);
        return this;
    }

    _addPoint(x: number, y: number) { this.points.push({ x, y }); }
}
