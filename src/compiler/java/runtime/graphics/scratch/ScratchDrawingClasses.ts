import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchColorClass } from "./ScratchColorClass";
import { ScratchCostumes } from "./ScratchCostumes";
import { ScratchSpriteClass } from "./ScratchSpriteClass";
import { isScratchStageActive } from "./ScratchStages";

export function drawingFinite(...values: number[]) {
    if (values.some(value => !Number.isFinite(value))) throw new RuntimeExceptionClass("Drawing coordinates and spacing must be finite.");
}

/** A single frame's drawing commands; textures belong to the shared asset cache. */
export class ScratchDrawingClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.drawing", signature: "class Drawing extends Object" },
        { type: "method", signature: "private Drawing()", native: ScratchDrawingClass.prototype._constructor },
        { type: "method", signature: "void polygon(double[] x, double[] y, Color color)", native: ScratchDrawingClass.prototype._polygon },
        { type: "method", signature: "void rectangle(double x, double y, double width, double height, Color color)", native: ScratchDrawingClass.prototype._rectangle },
        { type: "method", signature: "void image(string path, double x, double y)", java: ScratchDrawingClass.prototype._mj$image$void$string$double$double },
        { type: "method", signature: "void image(string path, double x, double y, double width, double height)", java: ScratchDrawingClass.prototype._mj$image$void$string$double$double$double$double },
        { type: "method", signature: "int imageWidth(string path)", java: ScratchDrawingClass.prototype._mj$imageWidth$int$string },
        { type: "method", signature: "int imageHeight(string path)", java: ScratchDrawingClass.prototype._mj$imageHeight$int$string },
        { type: "method", signature: "void clip(double x, double y, double width, double height)", native: ScratchDrawingClass.prototype._clip },
        { type: "method", signature: "void noClip()", native: ScratchDrawingClass.prototype._noClip },
    ];
    static type: NonPrimitiveType;
    readonly content = new PIXI.Container();
    private group = this.content;
    private active = true;
    owner!: ScratchDrawingSpriteClass;
    _constructor() { return this; }

    finish() { this.active = false; }
    private requireActive() {
        if (!this.active) throw new RuntimeExceptionClass("Draw only inside draw(Drawing). The previous frame's canvas has expired.");
    }
    private dimensions(x: number, y: number, width: number, height: number) {
        this.requireActive();
        drawingFinite(x, y, width, height);
        if (width < 0 || height < 0) throw new RuntimeExceptionClass("Drawing dimensions cannot be negative.");
    }
    _polygon(x: number[], y: number[], color: ScratchColorClass) {
        this.requireActive();
        if (!x || !y || !color || x.length < 3 || x.length !== y.length) {
            throw new RuntimeExceptionClass("A polygon needs a color, equally many x/y coordinates and at least three points.");
        }
        drawingFinite(...x, ...y);
        const points = x.flatMap((value, i) => [value, -y[i]]);
        this.group.addChild(new PIXI.Graphics().poly(points).fill(color._get() & 0xffffff));
    }
    _rectangle(x: number, y: number, width: number, height: number, color: ScratchColorClass) {
        this.dimensions(x, y, width, height);
        this._polygon([x - width / 2, x + width / 2, x + width / 2, x - width / 2],
            [y - height / 2, y - height / 2, y + height / 2, y + height / 2], color);
    }
    texture(path: string): PIXI.Texture {
        const texture = ScratchCostumes.getTexture(path);
        if (!texture) throw new RuntimeExceptionClass(`Image '${path}' has not been loaded.`);
        return texture;
    }
    _image(path: string, x: number, y: number, width?: number, height?: number) {
        this.requireActive();
        const texture = this.texture(path);
        width ??= texture.width; height ??= texture.height;
        this.dimensions(x, y, width, height);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(x, -y);
        sprite.width = width; sprite.height = height;
        this.group.addChild(sprite);
    }
    _mj$image$void$string$double$double(t: Thread, callback: CallbackParameter, path: string, x: number, y: number) {
        this.requireActive();
        ScratchCostumes.whenLoaded(t, [path], callback, () => this._image(path, x, y));
    }
    _mj$image$void$string$double$double$double$double(t: Thread, callback: CallbackParameter,
        path: string, x: number, y: number, width: number, height: number) {
        this.dimensions(x, y, width, height);
        ScratchCostumes.whenLoaded(t, [path], callback, () => this._image(path, x, y, width, height));
    }
    _mj$imageWidth$int$string(t: Thread, callback: CallbackParameter, path: string) {
        this.requireActive();
        ScratchCostumes.whenLoaded(t, [path], callback, () => t.s.push(this.texture(path).width));
    }
    _mj$imageHeight$int$string(t: Thread, callback: CallbackParameter, path: string) {
        this.requireActive();
        ScratchCostumes.whenLoaded(t, [path], callback, () => t.s.push(this.texture(path).height));
    }
    _clip(x: number, y: number, width: number, height: number) {
        this.dimensions(x, y, width, height);
        (this.owner.stage as any)?._applyCamera?.();
        const corners = [-1, 1].flatMap(dx => [-1, 1].map(dy =>
            this.owner.container.toGlobal({ x: x + dx * width / 2, y: -y + dy * height / 2 })));
        const left = Math.max(0, Math.min(...corners.map(p => p.x)));
        const top = Math.max(0, Math.min(...corners.map(p => p.y)));
        const right = Math.max(left, Math.min(this.owner.world.width, Math.max(...corners.map(p => p.x))));
        const bottom = Math.max(top, Math.min(this.owner.world.height, Math.max(...corners.map(p => p.y))));
        const points = [[left, top], [right, top], [right, bottom], [left, bottom]].flatMap(([px, py]) => {
            const local = this.owner.container.toLocal({ x: px, y: py });
            return [local.x, local.y];
        });
        const mask = new PIXI.Graphics().poly(points).fill(0xffffff);
        this.group = new PIXI.Container();
        this.content.addChild(mask, this.group);
        this.group.mask = mask;
    }
    _noClip() { this.requireActive(); this.group = this.content; }
}

/** A normal Sprite whose appearance is built by an interpreted draw hook. */
export class ScratchDrawingSpriteClass extends ScratchSpriteClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.drawing", signature: "class DrawingSprite extends Sprite" },
        { type: "method", signature: "DrawingSprite()", java: ScratchDrawingSpriteClass.prototype._cj$_constructor_$DrawingSprite$ },
        { type: "method", signature: "void draw(Drawing drawing)", java: ScratchDrawingSpriteClass.prototype._mj$draw$void$Drawing },
        { type: "method", signature: "void setIsUI(boolean isUI)", native: ScratchDrawingSpriteClass.prototype._setIsUI },
        { type: "method", signature: "void setTransparency(double percent)", native: ScratchDrawingSpriteClass.prototype._setTransparency },
        { type: "method", signature: "void changeTransparency(double step)", native: ScratchDrawingSpriteClass.prototype._changeTransparency },
        { type: "method", signature: "double getTransparency()", native: ScratchDrawingSpriteClass.prototype._getTransparency },
    ];
    static type: NonPrimitiveType;
    private appearance?: PIXI.Container;

    _cj$_constructor_$DrawingSprite$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Sprite$(t, () => { this._disableHitbox(); callback?.(); });
    }
    _setIsUI(isUI: boolean) { this._setUI(isUI); }
    _setTransparency(percent: number) { drawingFinite(percent); super._setTransparency(percent); }
    _mj$draw$void$Drawing(_t: Thread, callback: CallbackParameter, _drawing: ScratchDrawingClass): void { callback?.(); }

    _mj$act$void$(t: Thread, callback: CallbackParameter): void {
        if (this.stage && !isScratchStageActive(this.stage as any)) {
            super._mj$act$void$(t, callback);
            return;
        }
        super._mj$act$void$(t, () => {
            if (!this.container?.visible || this.container.destroyed) { callback?.(); return; }
            const drawing = new ScratchDrawingClass();
            drawing.owner = this;
            this._mj$draw$void$Drawing(t, () => {
                drawing.finish();
                if (!this.container.destroyed) {
                    this.appearance?.destroy({ children: true });
                    this.appearance = drawing.content;
                    this.container.addChild(this.appearance);
                } else drawing.content.destroy({ children: true });
                callback?.();
            }, drawing);
        });
    }
}
