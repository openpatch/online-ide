import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { ScratchBoundsClass } from "./ScratchBoundsClass";
import { ScratchShapeClass } from "./ScratchShapeClasses";
import { desktopOnly } from "./ScratchUnsupported";

type Point = { x: number, y: number };

/**
 * A sprite's collision outline, mirroring org.openpatch.scratch.Hitbox.
 *
 * Upstream this wraps a java.awt Shape. Here a Shape is itself just its
 * outline (see ScratchShapeClasses.ts), so the two representations are the
 * same points and getShape()/the Shape constructor convert between them.
 */
export class ScratchHitboxClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Hitbox extends Object", comment: "Umriss einer Figur, mit dem Berührungen berechnet werden" },

        { type: "method", signature: "Hitbox(double[] xPoints, double[] yPoints)", native: ScratchHitboxClass.prototype._c2, comment: "Erzeugt einen Umriss aus x- und y-Koordinaten" },
        { type: "method", signature: "Hitbox(Shape shape)", native: ScratchHitboxClass.prototype._c1, comment: "Erzeugt einen Umriss aus einer Form" },
        { type: "method", signature: "Shape getShape()", native: ScratchHitboxClass.prototype._getShape, comment: "Gibt den Umriss als Form zurück" },

        { type: "method", signature: "void translateAndRotateAndResize(double degrees, double originX, double originY, double translateX, double translateY, double size)", native: ScratchHitboxClass.prototype._transform, comment: "Verschiebt, dreht und skaliert den Umriss" },
        { type: "method", signature: "boolean contains(double x, double y)", native: ScratchHitboxClass.prototype._contains, comment: "Gibt genau dann true zurück, wenn der Punkt im Umriss liegt" },
        { type: "method", signature: "Bounds getBounds()", native: ScratchHitboxClass.prototype._getBounds, comment: "Gibt das umschließende Rechteck zurück" },
        { type: "method", signature: "boolean intersects(Hitbox hitbox)", native: ScratchHitboxClass.prototype._intersects, comment: "Gibt genau dann true zurück, wenn sich beide Umrisse überlappen" },
        { type: "method", signature: "void drawDebug()", native: ScratchHitboxClass.prototype._drawDebug, comment: "Nur in der Desktop-Version: zeichnet den Umriss" },
        { type: "method", signature: "void drawShape()", native: ScratchHitboxClass.prototype._drawShape, comment: "Nur in der Desktop-Version: zeichnet den Umriss" },
    ];

    static type: NonPrimitiveType;

    /** The outline as given, before the sprite's transform is applied. */
    originalPoints: Point[] = [];
    /** The outline in stage coordinates. */
    points: Point[] = [];

    constructor(points: Point[] = []) {
        super();
        this.originalPoints = points.map(p => ({ x: p.x, y: p.y }));
        this.points = this.originalPoints.map(p => ({ x: p.x, y: p.y }));
    }

    _c2(xPoints: number[], yPoints: number[]) {
        const n = Math.min(xPoints?.length ?? 0, yPoints?.length ?? 0);
        this.originalPoints = [];
        for (let i = 0; i < n; i++) this.originalPoints.push({ x: xPoints[i], y: yPoints[i] });
        this.points = this.originalPoints.map(p => ({ x: p.x, y: p.y }));
        return this;
    }

    _c1(shape: ScratchShapeClass) {
        this.originalPoints = (shape?.points ?? []).map(p => ({ x: p.x, y: p.y }));
        this.points = this.originalPoints.map(p => ({ x: p.x, y: p.y }));
        return this;
    }

    /** The transformed outline, so it describes where the hitbox is right now. */
    _getShape(): ScratchShapeClass {
        return ScratchShapeClass.of(this.points.map(p => ({ x: p.x, y: p.y })));
    }

    _transform(degrees: number, originX: number, originY: number, translateX: number, translateY: number, size: number) {
        const s = size / 100;
        const rad = degrees / 180 * Math.PI;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        this.points = this.originalPoints.map(p => {
            const x = p.x * s + translateX;
            const y = p.y * s + translateY;
            const dx = x - originX, dy = y - originY;
            return { x: originX + dx * cos - dy * sin, y: originY + dx * sin + dy * cos };
        });
    }

    /** Even-odd ray casting, the same answer java.awt.Shape.contains gives. */
    _contains(x: number, y: number): boolean {
        const pts = this.points;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const intersects = (pts[i].y > y) !== (pts[j].y > y)
                && x < (pts[j].x - pts[i].x) * (y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x;
            if (intersects) inside = !inside;
        }
        return inside;
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

    _intersects(other: ScratchHitboxClass): boolean {
        if (!other) return false;
        // cheap rejection first, exactly as upstream does
        if (!this._getBounds()._intersects(other._getBounds())) return false;
        // one implementation, in ScratchShapeClasses: correct for concave
        // outlines too, which hand-written hitboxes often are
        return ScratchShapeClass.polygonsOverlap(this.points, other.points);
    }

    _drawDebug() { desktopOnly("Hitbox.drawDebug()"); }
    _drawShape() { desktopOnly("Hitbox.drawShape()"); }
}
