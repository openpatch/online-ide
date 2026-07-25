import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { StringClass } from "../../system/javalang/ObjectClassStringClass";
import { IntegerClass } from "../../system/primitiveTypes/wrappers/IntegerClass";
import { FunctionInterface } from "../../system/functional/FunctionInterface";
import { ScratchCostumes } from "./ScratchCostumes";
import { ScratchSpriteClass } from "./ScratchSpriteClass";

/**
 * Sprite that can play named frame animations, mirroring
 * org.openpatch.scratch.AnimatedSprite.
 *
 * An animation is just a list of costumes; playAnimation() advances through them
 * on a timer, exactly as upstream does (same interval semantics, same `once`
 * behaviour), so animation code copy-pastes between the two.
 */
export class ScratchAnimatedSpriteClass extends ScratchSpriteClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class AnimatedSprite extends Sprite", comment: "Figur, die Animationen aus mehreren Einzelbildern abspielen kann" },

        { type: "method", signature: "AnimatedSprite()", java: ScratchAnimatedSpriteClass.prototype._cj$_constructor_$AnimatedSprite$, comment: "Erzeugt eine neue animierte Figur" },
        { type: "method", signature: "AnimatedSprite(AnimatedSprite other)", java: ScratchAnimatedSpriteClass.prototype._cj$_constructor_$AnimatedSprite$AnimatedSprite, comment: "Erzeugt eine Kopie der angegebenen animierten Figur" },
        { type: "method", signature: "AnimatedSprite clone()", java: ScratchAnimatedSpriteClass.prototype._mj$clone$AnimatedSprite$, comment: "Erzeugt eine Kopie dieser Figur" },
        { type: "method", signature: "String toString()", java: ScratchAnimatedSpriteClass.prototype._mj$toString$String$, comment: "Gibt die Figur als Zeichenkette zurück" },

        {
            type: "method", signature: "void addAnimation(string name, string pattern, int frames)",
            native: ScratchAnimatedSpriteClass.prototype._addAnimationPattern,
            comment: "Fügt eine Animation hinzu. %d im Muster wird durch 1..frames ersetzt, z.B. bunny1_walk%d",
        },
        {
            type: "method", signature: "void addAnimation(string name, string imagePath, int frames, int width, int height)",
            native: ScratchAnimatedSpriteClass.prototype._addAnimationSheet,
            comment: "Zerlegt ein Bild in gleich große Einzelbilder und legt daraus eine Animation an",
        },
        {
            type: "method", signature: "void addAnimation(string name, string imagePath, int frames, int width, int height, int row)",
            native: ScratchAnimatedSpriteClass.prototype._addAnimationSheetRow,
            comment: "Wie addAnimation(name, imagePath, frames, width, height), beginnt aber in der angegebenen Zeile",
        },
        {
            type: "method", signature: "void addAnimation(string name, string imagePath, int frames, int width, int height, int column, boolean useColumns)",
            native: ScratchAnimatedSpriteClass.prototype._addAnimationSheetColumn,
            comment: "Legt eine Animation aus einer Spalte des Bildes an",
        },
        {
            type: "method", signature: "void addAnimation(string name, Function<Integer, String> builder, int frames)",
            java: ScratchAnimatedSpriteClass.prototype._mj$addAnimation$void$String$Function$int,
            comment: "Legt eine Animation an; builder liefert zu 1..frames jeweils den Bildpfad",
        },

        { type: "method", signature: "void playAnimation(string name)", native: ScratchAnimatedSpriteClass.prototype._playAnimation, comment: "Spielt die Animation in einer Schleife ab" },
        { type: "method", signature: "void playAnimation(string name, boolean once)", native: ScratchAnimatedSpriteClass.prototype._playAnimationOnce, comment: "Spielt die Animation ab; bei once == true nur ein einziges Mal" },
        { type: "method", signature: "void resetAnimation()", native: ScratchAnimatedSpriteClass.prototype._resetAnimation, comment: "Setzt die Animation auf das erste Einzelbild zurück" },
        { type: "method", signature: "void setAnimationInterval(int interval)", native: ScratchAnimatedSpriteClass.prototype._setAnimationInterval, comment: "Legt fest, wie viele Millisekunden ein Einzelbild angezeigt wird" },
        { type: "method", signature: "int getAnimationInterval()", native: ScratchAnimatedSpriteClass.prototype._getAnimationInterval, comment: "Gibt zurück, wie viele Millisekunden ein Einzelbild angezeigt wird" },
        { type: "method", signature: "int getAnimationFrame()", native: ScratchAnimatedSpriteClass.prototype._getAnimationFrame, comment: "Gibt die Nummer des aktuellen Einzelbildes zurück" },
        { type: "method", signature: "void setAnimationFrame(int frame)", native: ScratchAnimatedSpriteClass.prototype._setAnimationFrame, comment: "Springt zum Einzelbild mit der angegebenen Nummer" },
        { type: "method", signature: "boolean isAnimationPlayed()", native: ScratchAnimatedSpriteClass.prototype._isAnimationPlayed, comment: "Gibt genau dann true zurück, wenn eine mit once gestartete Animation durchgelaufen ist" },
    ];

    static type: NonPrimitiveType;

    /** animation name -> the costume names making up its frames */
    private animations: Map<string, string[]> = new Map();
    private animationInterval: number = 100;
    private animationFrame: number = 0;
    private animationPlayed: boolean = false;

    _cj$_constructor_$AnimatedSprite$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Sprite$(t, callback);
    }

    /** Copy constructor: shares costumes and copies the animation table. */
    _cj$_constructor_$AnimatedSprite$AnimatedSprite(t: Thread, callback: CallbackParameter, other: ScratchAnimatedSpriteClass) {
        this._cj$_constructor_$AnimatedSprite$(t, () => {
            t.s.pop();
            if (other) {
                this.costumes = other.costumes.slice();
                this.animations = new Map(other.animations);
                this.sx = other.sx; this.sy = other.sy;
                this.direction = other.direction;
                this.size = other.size;
                this.rotationStyle = other.rotationStyle;
                if (other.currentCostume >= 0) this._applyCostumeIndex(other.currentCostume);
            }
            t.s.push(this);
            if (callback) callback();
        });
    }

    _mj$clone$AnimatedSprite$(t: Thread, callback: CallbackParameter) {
        const copy = new ScratchAnimatedSpriteClass();
        copy._cj$_constructor_$AnimatedSprite$AnimatedSprite(t, callback, this);
    }

    /**
     * Upstream builds each frame's file name with String.format(pattern, i + 1),
     * so the pattern uses a printf placeholder — "bunny1_walk%d" gives
     * bunny1_walk1, bunny1_walk2, ... Frames are numbered from 1.
     */
    private formatFrame(pattern: string, frameNumber: number): string {
        if (pattern.indexOf("%") < 0) return pattern + frameNumber;
        // supports %d and zero-padded forms such as %02d
        return pattern.replace(/%(0(\d+))?d/, (_m, _pad, width) =>
            width ? String(frameNumber).padStart(parseInt(width), "0") : String(frameNumber));
    }

    _addAnimationPattern(name: string, pattern: string, frames: number) {
        const frameNames: string[] = [];
        for (let i = 0; i < frames; i++) {
            const costumeName = "_animation_" + name + "_" + i;
            this._addCostume2(costumeName, this.formatFrame(pattern, i + 1));
            frameNames.push(costumeName);
        }
        this.animations.set(name, frameNames);
    }

    _addAnimationSheet(name: string, imagePath: string, frames: number, width: number, height: number) {
        this._addAnimationSheetRow(name, imagePath, frames, width, height, 0);
    }

    /**
     * Slice `frames` sub-images of width x height out of `imagePath`, starting at
     * the given row. Sub-textures are cut relative to the source image's own frame,
     * so this works for images that are themselves regions of a packed atlas.
     */
    _addAnimationSheetRow(name: string, imagePath: string, frames: number, width: number, height: number, row: number) {
        const base = ScratchCostumes.getTexture(imagePath);
        if (!base) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + imagePath);

        const perRow = Math.max(1, Math.floor(base.frame.width / width));
        const frameNames: string[] = [];
        for (let i = 0; i < frames; i++) {
            const col = i % perRow;
            const r = row + Math.floor(i / perRow);
            const rect = new PIXI.Rectangle(
                base.frame.x + col * width,
                base.frame.y + r * height,
                width, height,
            );
            const texture = new PIXI.Texture({ source: base.source, frame: rect });
            const costumeName = "_animation_" + name + "_" + i;
            if (!this.costumes.some(c => c.name === costumeName)) {
                this.costumes.push({ name: costumeName, texture });
                if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
            }
            frameNames.push(costumeName);
        }
        this.animations.set(name, frameNames);
    }

    /**
     * Upstream's 7-argument form: the frames run DOWN one column of the sheet
     * instead of across a row. `useColumns` only picks this overload.
     */
    _addAnimationSheetColumn(name: string, imagePath: string, frames: number, width: number, height: number,
        column: number, _useColumns: boolean) {
        const base = ScratchCostumes.getTexture(imagePath);
        if (!base) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + imagePath);

        const frameNames: string[] = [];
        for (let row = 0; row < frames; row++) {
            const rect = new PIXI.Rectangle(
                base.frame.x + column * width,
                base.frame.y + row * height,
                width, height,
            );
            const texture = new PIXI.Texture({ source: base.source, frame: rect });
            const costumeName = "_animation_" + name + "_" + column + "_" + row;
            if (!this.costumes.some(c => c.name === costumeName)) {
                this.costumes.push({ name: costumeName, texture });
                if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
            }
            frameNames.push(costumeName);
        }
        this.animations.set(name, frameNames);
    }

    /**
     * Upstream's builder form: `builder.apply(i + 1)` yields each frame's image
     * path. The lambda is Java code, so the frames are walked one callback at a
     * time rather than in a plain loop.
     */
    _mj$addAnimation$void$String$Function$int(t: Thread, callback: CallbackParameter,
        name: StringClass, builder: FunctionInterface, frames: number) {
        const nameStr = name instanceof StringClass ? name.value : String(name);
        const frameNames: string[] = [];

        const step = (i: number) => {
            if (!builder || i >= frames) {
                this.animations.set(nameStr, frameNames);
                if (callback) callback();
                return;
            }
            builder._mj$apply$F$E(t, () => {
                const produced = t.s.pop();
                const imagePath = produced instanceof StringClass ? produced.value : String(produced);
                const costumeName = "_animation_" + nameStr + "_" + i;
                this._addCostumeFromName(costumeName, imagePath);
                frameNames.push(costumeName);
                step(i + 1);
            }, new IntegerClass(i + 1));
        };
        step(0);
    }

    /** addCostume(name, path) without failing when the costume already exists. */
    private _addCostumeFromName(costumeName: string, imagePath: string) {
        if (this.costumes.some(c => c.name === costumeName)) return;
        const texture = ScratchCostumes.getTexture(imagePath);
        if (!texture) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + imagePath);
        this.costumes.push({ name: costumeName, texture });
        if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
    }

    _playAnimation(name: string) { this._playAnimationOnce(name, false); }

    /**
     * Mirrors upstream exactly: the current frame is shown every call, and the
     * frame only advances when the shared "animation" timer ticks.
     */
    _playAnimationOnce(name: string, once: boolean) {
        const animation = this.animations.get(name);
        if (!animation || animation.length === 0) {
            console.warn(`Scratch: animation '${name}' not found. Use addAnimation() first.`);
            return;
        }
        this._switchCostumeByName(animation[this.animationFrame % animation.length]);
        if (this._getNamedTimer("animation")._everyMillis(this.animationInterval)) {
            if ((!this.animationPlayed && this.animationFrame !== animation.length - 1) || !once) {
                if (this.animationFrame >= animation.length) this.animationFrame = 0;
                this._switchCostumeByName(animation[this.animationFrame]);
                this.animationFrame = (this.animationFrame + 1) % animation.length;
            } else {
                this.animationPlayed = true;
            }
        }
    }

    _resetAnimation() { this.animationFrame = 0; this.animationPlayed = false; }
    _setAnimationInterval(interval: number) { this.animationInterval = interval; }
    _getAnimationInterval(): number { return this.animationInterval; }
    _getAnimationFrame(): number { return this.animationFrame; }
    _setAnimationFrame(frame: number) { this.animationFrame = frame; }
    _isAnimationPlayed(): boolean { return this.animationPlayed; }

    _mj$toString$String$(t: Thread, callback: CallbackParameter): void {
        t.s.push(new StringClass("AnimatedSprite []"));
        if (callback) callback();
    }
}
