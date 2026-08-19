import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { SRC } from "./ScratchLibraryComments";

/**
 * The stage's camera, mirroring org.openpatch.scratch.extensions.camera.Camera.
 * Moving it scrolls everything except the UI layer; the zoom is a percentage
 * and pivots on the middle of the stage.
 */
export class ScratchCameraClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.camera", signature: "class Camera extends Object", comment: SRC.cameraClassComment },

        { type: "method", signature: "Camera()", native: ScratchCameraClass.prototype._c0, comment: SRC.cameraConstructorComment },

        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchCameraClass.prototype._setPosition, comment: SRC.cameraSetPositionComment },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchCameraClass.prototype._setPositionV, comment: SRC.cameraSetPosition2Comment },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchCameraClass.prototype._getPosition, comment: SRC.cameraGetPositionComment },

        { type: "method", signature: "Vector2 toLocalPosition(Vector2 v)", native: ScratchCameraClass.prototype._toLocalPosition, comment: SRC.cameraToLocalPositionComment },
        { type: "method", signature: "double toLocalX(double x)", native: ScratchCameraClass.prototype._toLocalX, comment: SRC.cameraToLocalXComment },
        { type: "method", signature: "double toLocalY(double y)", native: ScratchCameraClass.prototype._toLocalY, comment: SRC.cameraToLocalYComment },
        { type: "method", signature: "Vector2 toGlobalPosition(Vector2 v)", native: ScratchCameraClass.prototype._toGlobalPosition, comment: SRC.cameraToGlobalPositionComment },
        { type: "method", signature: "double toGlobalX(double x)", native: ScratchCameraClass.prototype._toGlobalX, comment: SRC.cameraToGlobalXComment },
        { type: "method", signature: "double toGlobalY(double y)", native: ScratchCameraClass.prototype._toGlobalY, comment: SRC.cameraToGlobalYComment },

        { type: "method", signature: "double getX()", native: ScratchCameraClass.prototype._getX, comment: SRC.cameraGetXComment },
        { type: "method", signature: "void setX(double x)", native: ScratchCameraClass.prototype._setX, comment: SRC.cameraSetXComment },
        { type: "method", signature: "void changeX(double x)", native: ScratchCameraClass.prototype._changeX, comment: SRC.cameraChangeXComment },
        { type: "method", signature: "double getY()", native: ScratchCameraClass.prototype._getY, comment: SRC.cameraGetYComment },
        { type: "method", signature: "void setY(double y)", native: ScratchCameraClass.prototype._setY, comment: SRC.cameraSetYComment },
        { type: "method", signature: "void changeY(double y)", native: ScratchCameraClass.prototype._changeY, comment: SRC.cameraChangeYComment },

        { type: "method", signature: "void setZoomLimit(double low, double high)", native: ScratchCameraClass.prototype._setZoomLimit, comment: SRC.cameraSetZoomLimitComment },
        { type: "method", signature: "void setZoom(double zoom)", native: ScratchCameraClass.prototype._setZoom, comment: SRC.cameraSetZoomComment },
        { type: "method", signature: "double getZoom()", native: ScratchCameraClass.prototype._getZoom, comment: SRC.cameraGetZoomComment },
        { type: "method", signature: "void resetZoom()", native: ScratchCameraClass.prototype._resetZoom, comment: SRC.cameraResetZoomComment },
        { type: "method", signature: "void changeZoom(double dz)", native: ScratchCameraClass.prototype._changeZoom, comment: SRC.cameraChangeZoomComment },
    ];

    static type: NonPrimitiveType;

    x: number = 0;
    y: number = 0;
    zoom: number = 100;
    private zoomLimitLow: number = 50;
    private zoomLimitHigh: number = 200;

    _c0() { this.x = 0; this.y = 0; this.zoom = 100; this.zoomLimitLow = 50; this.zoomLimitHigh = 200; return this; }

    _setPosition(x: number, y: number) { this.x = x; this.y = y; }
    _setPositionV(v: ScratchVector2Class) { this._setPosition(v.x, v.y); }
    _getPosition(): ScratchVector2Class { return new ScratchVector2Class(this.x, this.y); }

    _toLocalPosition(v: ScratchVector2Class): ScratchVector2Class {
        const s = this.zoom / 100;
        return new ScratchVector2Class(v.x / s + this.x, v.y / s + this.y);
    }
    _toLocalX(x: number): number { return x / (this.zoom / 100) + this.x; }
    _toLocalY(y: number): number { return y / (this.zoom / 100) + this.y; }

    _toGlobalPosition(v: ScratchVector2Class): ScratchVector2Class {
        const s = this.zoom / 100;
        return new ScratchVector2Class((v.x - this.x) * s, (v.y - this.y) * s);
    }
    _toGlobalX(x: number): number { return (x - this.x) * (this.zoom / 100); }
    _toGlobalY(y: number): number { return (y - this.y) * (this.zoom / 100); }

    _getX(): number { return this.x; }
    _setX(x: number) { this.x = x; }
    // NOTE: upstream's changeX reads the y FIELD instead of its parameter
    // (`setX(getX() + y)`) — a typo that makes horizontal panning move by the
    // camera's y. Fixed here on purpose; see the note to the maintainer.
    _changeX(dx: number) { this._setX(this.x + dx); }
    _getY(): number { return this.y; }
    _setY(y: number) { this.y = y; }
    _changeY(dy: number) { this._setY(this.y + dy); }

    _setZoomLimit(low: number, high: number) { this.zoomLimitLow = low; this.zoomLimitHigh = high; }
    _setZoom(zoom: number) { this.zoom = Math.max(Math.min(zoom, this.zoomLimitHigh), this.zoomLimitLow); }
    _getZoom(): number { return this.zoom; }
    _resetZoom() { this.zoom = 100; }
    _changeZoom(dz: number) { this._setZoom(this.zoom + dz); }
}
