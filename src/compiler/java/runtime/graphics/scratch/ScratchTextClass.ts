import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { ScratchColorClass } from "./ScratchColorClass";
import { scratchLayerOf } from "./ScratchLayers";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { TextAlign, TextAlignEnum } from "./TextAlignEnum";
import { TextStyle, TextStyleEnum } from "./TextStyleEnum";
import { SRC } from "./ScratchLibraryComments";

/** Font shipped with the Scratch library (see src/development/scratchAssetsGenerator.js). */
const DEFAULT_FONT = "UbuntuMono, monospace";
/** Upstream's Text.fontSize. It read 24 here, so every text came out too big. */
const DEFAULT_FONT_SIZE = 14;

/**
 * On-stage text, mirroring org.openpatch.scratch.Text (core subset).
 *
 * Like Sprite, its position uses the Scratch coordinate system (centre origin,
 * y up) and is converted to the world's top-left/y-down pixel space in redraw().
 */
export class ScratchTextClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Text extends Object", comment: SRC.textClassComment },

        { type: "method", signature: "Text()", java: ScratchTextClass.prototype._cj$_constructor_$Text$, comment: SRC.textConstructorComment },
        { type: "method", signature: "Text(string text, double x, double y, double width)", java: ScratchTextClass.prototype._cj$_constructor_$Text$string$double$double$double, comment: SRC.textConstructor2Comment },
        { type: "method", signature: "Text(string text, double x, double y, double width, TextStyle style)", java: ScratchTextClass.prototype._cj$_constructor_$Text$string$double$double$double$TextStyle, comment: SRC.textConstructor3Comment },

        { type: "method", signature: "void showText(string text)", native: ScratchTextClass.prototype._showText, comment: SRC.textShowTextComment },
        { type: "method", signature: "void showText(string text, int millis)", native: ScratchTextClass.prototype._showTextFor, comment: SRC.textShowText2Comment },

        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchTextClass.prototype._setPosition, comment: SRC.textSetPositionComment },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchTextClass.prototype._setPositionV, comment: SRC.textSetPosition2Comment },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchTextClass.prototype._getPosition, comment: SRC.textGetPositionComment },
        { type: "method", signature: "void setX(double x)", native: ScratchTextClass.prototype._setX, comment: SRC.textSetXComment },
        { type: "method", signature: "double getX()", native: ScratchTextClass.prototype._getX, comment: SRC.textGetXComment },
        { type: "method", signature: "void setY(double y)", native: ScratchTextClass.prototype._setY, comment: SRC.textSetYComment },
        { type: "method", signature: "double getY()", native: ScratchTextClass.prototype._getY, comment: SRC.textGetYComment },

        { type: "method", signature: "void setTextColor(int r, int g, int b)", native: ScratchTextClass.prototype._setTextColorRGB, comment: SRC.textSetTextColorComment },
        { type: "method", signature: "void setTextColor(double h)", native: ScratchTextClass.prototype._setTextColorHue, comment: SRC.textSetTextColor2Comment },
        { type: "method", signature: "void setTextColor(Color c)", native: ScratchTextClass.prototype._setTextColorObj, comment: SRC.textSetTextColor3Comment },
        { type: "method", signature: "void setBackgroundColor(int r, int g, int b)", native: ScratchTextClass.prototype._setBackgroundColorRGB, comment: SRC.textSetBackgroundColorComment },
        { type: "method", signature: "void setBackgroundColor(double h)", native: ScratchTextClass.prototype._setBackgroundColorHue, comment: SRC.textSetBackgroundColor2Comment },
        { type: "method", signature: "void setBackgroundColor(Color c)", native: ScratchTextClass.prototype._setBackgroundColorObj, comment: SRC.textSetBackgroundColor3Comment },
        { type: "method", signature: "void setStrokeColor(int r, int g, int b)", native: ScratchTextClass.prototype._setStrokeColorRGB, comment: SRC.textSetStrokeColorComment },
        { type: "method", signature: "void setStrokeColor(double h)", native: ScratchTextClass.prototype._setStrokeColorHue, comment: SRC.textSetStrokeColor2Comment },
        { type: "method", signature: "void setStrokeColor(Color c)", native: ScratchTextClass.prototype._setStrokeColorObj, comment: SRC.textSetStrokeColor3Comment },

        { type: "method", signature: "void addFont(string name, string fontFamily)", native: ScratchTextClass.prototype._addFont, comment: SRC.textAddFontComment },
        { type: "method", signature: "void switchFont(string name)", native: ScratchTextClass.prototype._switchFont, comment: SRC.textSwitchFontComment },
        { type: "method", signature: "void nextFont()", native: ScratchTextClass.prototype._nextFont, comment: SRC.textNextFontComment },
        { type: "method", signature: "string getCurrentFontName()", native: ScratchTextClass.prototype._getCurrentFontName, comment: SRC.textGetCurrentFontNameComment },
        { type: "method", signature: "int getCurrentFontIndex()", native: ScratchTextClass.prototype._getCurrentFontIndex, comment: SRC.textGetCurrentFontIndexComment },
        { type: "method", signature: "void setFont(string name)", native: ScratchTextClass.prototype._switchFont, comment: SRC.textSetFontComment },
        { type: "method", signature: "string getFont()", native: ScratchTextClass.prototype._getCurrentFontName, comment: SRC.textGetFontComment },

        { type: "method", signature: "void setTextSize(int size)", native: ScratchTextClass.prototype._setTextSize, comment: SRC.textSetTextSizeComment },
        { type: "method", signature: "int getTextSize()", native: ScratchTextClass.prototype._getTextSize, comment: SRC.textGetTextSizeComment },
        { type: "method", signature: "double getWidth()", native: ScratchTextClass.prototype._getWidth, comment: SRC.textGetWidthComment },
        { type: "method", signature: "void setWidth(double width)", native: ScratchTextClass.prototype._setWidth, comment: SRC.textSetWidthComment },
        { type: "method", signature: "void setAlign(TextAlign align)", native: ScratchTextClass.prototype._setAlign, comment: SRC.textSetAlignComment },
        { type: "method", signature: "TextAlign getAlign()", native: ScratchTextClass.prototype._getAlign, comment: SRC.textGetAlignComment },
        { type: "method", signature: "void setStyle(TextStyle style)", native: ScratchTextClass.prototype._setStyle, comment: SRC.textSetStyleComment },
        { type: "method", signature: "TextStyle getStyle()", native: ScratchTextClass.prototype._getStyle, comment: SRC.textGetStyleComment },

        { type: "method", signature: "void remove()", native: ScratchTextClass.prototype._remove, comment: SRC.textRemoveComment },

        // UI texts ignore the camera, like UI sprites
        { type: "method", signature: "boolean isUI()", native: ScratchTextClass.prototype._isUI, comment: SRC.textIsUIComment },
        { type: "method", signature: "void setIsUI(boolean isUI)", native: ScratchTextClass.prototype._setIsUI, comment: SRC.textSetIsUIComment },

        // stage lifecycle
        { type: "method", signature: "Stage getStage()", native: ScratchTextClass.prototype._getStage, comment: SRC.textGetStageComment },
        { type: "method", signature: "void addedToStage(Stage stage)", java: ScratchTextClass.prototype._mj$addedToStage$void$Stage, comment: SRC.textAddedToStageComment },
        { type: "method", signature: "void removedFromStage(Stage stage)", java: ScratchTextClass.prototype._mj$removedFromStage$void$Stage, comment: SRC.textRemovedFromStageComment },
        { type: "method", signature: "void whenAddedToStage()", java: ScratchTextClass.prototype._mj$whenAddedToStage$void$, comment: SRC.textWhenAddedToStageComment },
        { type: "method", signature: "void whenAddedToStage(Stage stage)", java: ScratchTextClass.prototype._mj$whenAddedToStage$void$Stage, comment: SRC.textWhenAddedToStage2Comment },
        { type: "method", signature: "void whenRemovedFromStage()", java: ScratchTextClass.prototype._mj$whenRemovedFromStage$void$, comment: SRC.textWhenRemovedFromStageComment },
        { type: "method", signature: "void whenRemovedFromStage(Stage stage)", java: ScratchTextClass.prototype._mj$whenRemovedFromStage$void$Stage, comment: SRC.textWhenRemovedFromStage2Comment },

        { type: "method", signature: "static string getDefaultFont()", native: ScratchTextClass._getDefaultFont, comment: SRC.textGetDefaultFontComment },
        { type: "method", signature: "static int getDefaultFontSize()", native: ScratchTextClass._getDefaultFontSize, comment: SRC.textGetDefaultFontSizeComment },
        { type: "method", signature: "static int[] getDefaultFontSizes()", native: ScratchTextClass._getDefaultFontSizes, comment: SRC.textGetDefaultFontSizesComment },
        { type: "method", signature: "static void useFont(string path, int size)", native: ScratchTextClass._useFont2, comment: SRC.textUseFontComment },
        { type: "method", signature: "static void useFont(string path)", native: ScratchTextClass._useFont1, comment: SRC.textUseFont2Comment },
        { type: "method", signature: "static void useFontSizes(int... sizes)", native: ScratchTextClass._useFontSizes, comment: SRC.textUseFontSizesComment },
        { type: "method", signature: "static void useSmoothing(boolean smooth)", native: ScratchTextClass._useSmoothing, comment: SRC.textUseSmoothingComment },
        { type: "method", signature: "boolean isSmoothing()", native: ScratchTextClass.prototype._isSmoothing, comment: SRC.textIsSmoothingComment },
    ];

    static type: NonPrimitiveType;

    // ---- library-wide font defaults, set by the static useFont* methods ----
    // Upstream warns and ignores these once a Stage exists; here they simply
    // take effect for texts created afterwards.
    private static defaultFont: string = DEFAULT_FONT;
    private static defaultFontSizes: number[] = [DEFAULT_FONT_SIZE];
    private static smoothing: boolean = true;

    world!: IWorld;
    /** The stage this text was added to; until then it draws on the active one. */
    stage?: object;

    /** Move the text onto `stage`, rebuilding it in that stage's layers. */
    attachToStage(stage: object) {
        if (this.stage === stage) return;
        this.stage = stage;
        this.redraw();
    }

    private text: string = "";
    private tx: number = 0;         // Scratch coords: centre origin, y up
    private ty: number = 0;
    private boxWidth: number = 200;
    private textSize: number = ScratchTextClass.defaultFontSizes[0];
    /**
     * Centred on its position, as upstream centres every Text: a sprite put at
     * (0, 60) has its middle there and so does a text. The stage's display and
     * ask bands are drawn by ScratchStageClass and a speech bubble by
     * ScratchSpriteClass, so the edge-anchored ones never come through here.
     *
     * DEFAULT is still what setAlign(TextAlign.DEFAULT) gives, and still draws
     * like LEFT while reporting itself as DEFAULT, as upstream does.
     */
    private align: TextAlign = TextAlign.CENTER;
    // upstream's Text() leaves the style PLAIN; Text(Sprite) switches to SPEAK
    private style: TextStyle = TextStyle.PLAIN;
    private visible: boolean = false;

    private textColor: ScratchColorClass = ScratchColorClass.fromRGB(120, 120, 120);
    private backgroundColor: ScratchColorClass = ScratchColorClass.defaultColor();
    private strokeColor: ScratchColorClass = ScratchColorClass.fromRGB(218, 218, 218);

    private container?: PIXI.Container;
    private hideTimeout?: any;

    _cj$_constructor_$Text$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Text$string$double$double$double(t, callback, "", 0, 0, 200);
    }

    _cj$_constructor_$Text$string$double$double$double(
        t: Thread, callback: CallbackParameter, text: string, x: number, y: number, width: number,
    ) {
        this.world = t.scheduler.interpreter.retrieveObject("WorldClass") as IWorld;
        this.text = text ?? "";
        this.tx = x;
        this.ty = y;
        this.boxWidth = width;
        // Upstream shows the words it was built with straight away. Leaving the
        // text invisible until the first showText() meant that `new Text("Hello",
        // 0, 0, 400)` - which is how the documentation introduces the class -
        // put nothing on the stage at all. Blank counts as nothing to say, as
        // upstream's isBlank() check does.
        this.visible = this.text.trim().length > 0;
        t.s.push(this);
        this.redraw();
        if (callback) callback();
    }

    _cj$_constructor_$Text$string$double$double$double$TextStyle(
        t: Thread, callback: CallbackParameter,
        text: string, x: number, y: number, width: number, style: TextStyleEnum,
    ) {
        this._cj$_constructor_$Text$string$double$double$double(t, undefined, text, x, y, width);
        if (style) this.style = style.ordinal as TextStyle;
        this.redraw();
        if (callback) callback();
    }

    // ---- rendering ----
    private redraw() {
        if (this.container && !this.container.destroyed) this.container.destroy({ children: true });
        this.container = undefined;
        if (!this.visible || !this.text || !this.world) return;

        const style = new PIXI.TextStyle({
            fontFamily: this.fonts[this.currentFont].family,
            fontSize: this.textSize,
            fill: this.textColor._get() & 0xffffff,
            // `leading` is the gap BETWEEN lines, which is what Processing's
            // textLeading(textSize + 4) means upstream
            leading: 4,
            wordWrap: true,
            wordWrapWidth: Math.max(20, this.boxWidth),
            align: this.align === TextAlign.CENTER ? "center" : this.align === TextAlign.RIGHT ? "right" : "left",
        });
        const label = new PIXI.Text({ text: this.text, style });
        const pad = 8;

        // PLAIN is upstream's default: no frame, just the text. It translates to
        // (x, -y) and draws at (8, 8), so the label sits below/right of the
        // anchor rather than being centred on it like the framed styles.
        if (this.style === TextStyle.PLAIN) {
            const x = this.world.width / 2 + this.tx;
            const y = this.world.height / 2 - this.ty;
            let offset = 0;
            if (this.align === TextAlign.CENTER) offset = -label.width / 2;
            else if (this.align === TextAlign.RIGHT) offset = -label.width;
            const plain = new PIXI.Container();
            plain.addChild(label);
            label.position.set(pad + offset, pad);
            plain.position.set(x, y);
            (scratchLayerOf(this, this.ui ? "ui" : "sprites") ?? this.world.app.stage).addChild(plain);
            this.container = plain;
            return;
        }

        const bw = Math.max(label.width, 0) + pad * 2;
        const bh = label.height + pad * 2;
        // Upstream rounds every framed style by 16 (Text#drawBox, #drawBubble).
        // Its BOX leaves the bottom two corners square, which only shows when
        // the box sits on an edge; a floating one is rounded all round here.
        const radius = 16;
        const fill = this.backgroundColor._get() & 0xffffff;
        const stroke = { width: 2, color: this.strokeColor._get() & 0xffffff };

        const g = new PIXI.Graphics();
        g.roundRect(0, 0, bw, bh, radius).fill(fill).stroke(stroke);
        if (this.style === TextStyle.SPEAK) {
            // triangle(0, 20, 0, 0, 20, 0) at x = 10 below the box, upstream
            // Outlined like the bubble it hangs off. Filled only, it was a
            // white triangle on a white stage and the bubble looked tail-less.
            g.moveTo(10, bh + 20).lineTo(10, bh).lineTo(30, bh).closePath()
                .fill(fill).stroke(stroke);
            // hides the seam where the tail meets the border, as upstream does
            g.moveTo(12, bh).lineTo(26, bh).stroke({ width: 3, color: fill });
        } else if (this.style === TextStyle.THINK) {
            // circle(x, y, d) upstream takes a diameter, so these are radii
            g.circle(20, bh, 5).fill(fill).stroke(stroke);
            g.circle(7, bh + 7, 3).fill(fill).stroke(stroke);
            g.circle(0, bh + 10, 2).fill(fill).stroke(stroke);
        }
        label.position.set(pad, pad);

        const box = new PIXI.Container();
        box.addChild(g, label);

        // Scratch coords -> world pixel space; align positions the box horizontally.
        // Upstream translates to (x, -y - height), so the anchor is the bottom
        // edge of the box and it grows upwards from there.
        const screenX = this.world.width / 2 + this.tx;
        const screenY = this.world.height / 2 - this.ty;
        let offsetX = 0;
        if (this.align === TextAlign.CENTER) offsetX = -bw / 2;
        else if (this.align === TextAlign.RIGHT) offsetX = -bw;
        box.position.set(screenX + offsetX, screenY - bh);

        // texts scroll with the world, like the sprites they label
        // UI texts sit outside the camera container, so they do not scroll
        (scratchLayerOf(this, this.ui ? "ui" : "sprites") ?? this.world.app.stage).addChild(box);
        this.container = box;
    }

    _showText(text: string) {
        if (this.hideTimeout) { clearTimeout(this.hideTimeout); this.hideTimeout = undefined; }
        this.text = text ?? "";
        this.visible = this.text.length > 0;
        this.redraw();
    }
    _showTextFor(text: string, millis: number) {
        this._showText(text);
        this.hideTimeout = setTimeout(() => this._showText(""), millis);
    }

    // ---- position ----
    _setPosition(x: number, y: number) { this.tx = x; this.ty = y; this.redraw(); }
    _setPositionV(v: ScratchVector2Class) { if (v) this._setPosition(v.x, v.y); }
    _getPosition(): ScratchVector2Class { return new ScratchVector2Class(this.tx, this.ty); }
    _setX(x: number) { this.tx = x; this.redraw(); }
    _getX(): number { return this.tx; }
    _setY(y: number) { this.ty = y; this.redraw(); }
    _getY(): number { return this.ty; }

    // ---- colours ----
    _setTextColorRGB(r: number, g: number, b: number) { this.textColor = ScratchColorClass.fromRGB(r, g, b); this.redraw(); }
    _setTextColorHue(h: number) { this.textColor = ScratchColorClass.fromHue(h); this.redraw(); }
    _setTextColorObj(c: ScratchColorClass) { if (c) { this.textColor = c; this.redraw(); } }
    _setBackgroundColorRGB(r: number, g: number, b: number) { this.backgroundColor = ScratchColorClass.fromRGB(r, g, b); this.redraw(); }
    _setBackgroundColorHue(h: number) { this.backgroundColor = ScratchColorClass.fromHue(h); this.redraw(); }
    _setBackgroundColorObj(c: ScratchColorClass) { if (c) { this.backgroundColor = c; this.redraw(); } }
    _setStrokeColorRGB(r: number, g: number, b: number) { this.strokeColor = ScratchColorClass.fromRGB(r, g, b); this.redraw(); }
    _setStrokeColorHue(h: number) { this.strokeColor = ScratchColorClass.fromHue(h); this.redraw(); }
    _setStrokeColorObj(c: ScratchColorClass) { if (c) { this.strokeColor = c; this.redraw(); } }

    // ---- fonts ----
    // The browser has no font files to load, so a "font" here is a CSS font-family.
    // "default" is always present and maps to the bundled UbuntuMono.
    // "default" follows Text.useFont(), so changing it affects new texts
    private fonts: { name: string; family: string }[] = [{ name: "default", family: ScratchTextClass.defaultFont }];
    private currentFont: number = 0;

    _addFont(name: string, fontFamily: string) {
        if (this.fonts.some(f => f.name === name)) return;
        this.fonts.push({ name, family: fontFamily });
    }
    _switchFont(name: string) {
        const i = this.fonts.findIndex(f => f.name === name);
        if (i >= 0) { this.currentFont = i; this.redraw(); }
    }
    _nextFont() {
        this.currentFont = (this.currentFont + 1) % this.fonts.length;
        this.redraw();
    }
    _getCurrentFontName(): string { return this.fonts[this.currentFont].name; }
    _getCurrentFontIndex(): number { return this.currentFont; }

    // ---- layout ----
    _setTextSize(size: number) { this.textSize = size; this.redraw(); }
    _getTextSize(): number { return this.textSize; }
    _getWidth(): number { return this.boxWidth; }
    _setWidth(width: number) { this.boxWidth = width; this.redraw(); }
    _setAlign(align: TextAlignEnum) { if (align) { this.align = align.ordinal as TextAlign; this.redraw(); } }
    _getAlign(): TextAlignEnum { return TextAlignEnum.values[this.align] as TextAlignEnum; }
    _setStyle(style: TextStyleEnum) { if (style) { this.style = style.ordinal as TextStyle; this.redraw(); } }
    _getStyle(): TextStyleEnum { return TextStyleEnum.values[this.style] as TextStyleEnum; }

    _remove() {
        if (this.hideTimeout) { clearTimeout(this.hideTimeout); this.hideTimeout = undefined; }
        if (this.container && !this.container.destroyed) this.container.destroy({ children: true });
        this.container = undefined;
        this.visible = false;
    }

    // ---- UI flag ----
    private ui: boolean = false;
    _isUI(): boolean { return this.ui; }
    _setIsUI(isUI: boolean) {
        if (this.ui === isUI) return;
        this.ui = isUI;
        this.redraw();      // rebuilds the box in the right layer
    }

    // ---- stage lifecycle ----
    _getStage(): ObjectClass | undefined {
        return this.stage as ObjectClass | undefined;
    }

    /** Upstream calls the two whenAddedToStage overloads from here. */
    _mj$addedToStage$void$Stage(t: Thread, callback: CallbackParameter, stage: ObjectClass) {
        this._mj$whenAddedToStage$void$(t, () => {
            this._mj$whenAddedToStage$void$Stage(t, callback, stage);
        });
    }

    _mj$removedFromStage$void$Stage(t: Thread, callback: CallbackParameter, stage: ObjectClass) {
        this._mj$whenRemovedFromStage$void$(t, () => {
            this._mj$whenRemovedFromStage$void$Stage(t, callback, stage);
        });
    }

    _mj$whenAddedToStage$void$(_t: Thread, callback: CallbackParameter) { if (callback) callback(); }
    _mj$whenAddedToStage$void$Stage(_t: Thread, callback: CallbackParameter, _stage: ObjectClass) { if (callback) callback(); }
    _mj$whenRemovedFromStage$void$(_t: Thread, callback: CallbackParameter) { if (callback) callback(); }
    _mj$whenRemovedFromStage$void$Stage(_t: Thread, callback: CallbackParameter, _stage: ObjectClass) { if (callback) callback(); }

    static _getDefaultFont(): string { return ScratchTextClass.defaultFont; }
    static _getDefaultFontSize(): number { return ScratchTextClass.defaultFontSizes[0]; }
    static _getDefaultFontSizes(): number[] { return ScratchTextClass.defaultFontSizes.slice(); }

    static _useFont2(path: string, size: number) {
        if (path) ScratchTextClass.defaultFont = path;
        if (size > 0) ScratchTextClass.defaultFontSizes = [size];
    }
    static _useFont1(path: string) { ScratchTextClass._useFont2(path, 0); }
    static _useFontSizes(sizes: number[]) {
        if (sizes && sizes.length > 0) ScratchTextClass.defaultFontSizes = sizes.slice();
    }
    static _useSmoothing(smooth: boolean) { ScratchTextClass.smoothing = smooth; }
    _isSmoothing(): boolean { return ScratchTextClass.smoothing; }
}
