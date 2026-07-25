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

/** Font shipped with the Scratch library (see src/development/scratchAssetsGenerator.js). */
const DEFAULT_FONT = "UbuntuMono, monospace";
const DEFAULT_FONT_SIZE = 24;

/**
 * On-stage text, mirroring org.openpatch.scratch.Text (core subset).
 *
 * Like Sprite, its position uses the Scratch coordinate system (centre origin,
 * y up) and is converted to the world's top-left/y-down pixel space in redraw().
 */
export class ScratchTextClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Text extends Object", comment: "Text auf der Bühne" },

        { type: "method", signature: "Text()", java: ScratchTextClass.prototype._cj$_constructor_$Text$, comment: "Erzeugt einen leeren Text in der Mitte der Bühne" },
        { type: "method", signature: "Text(string text, double x, double y, double width)", java: ScratchTextClass.prototype._cj$_constructor_$Text$string$double$double$double, comment: "Erzeugt einen Text an der angegebenen Position mit der angegebenen Breite" },

        { type: "method", signature: "void showText(string text)", native: ScratchTextClass.prototype._showText, comment: "Zeigt den Text an" },
        { type: "method", signature: "void showText(string text, int millis)", native: ScratchTextClass.prototype._showTextFor, comment: "Zeigt den Text für die angegebene Zeit in Millisekunden an" },

        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchTextClass.prototype._setPosition, comment: "Setzt den Text an die angegebene Position (Mitte der Bühne ist 0/0)" },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchTextClass.prototype._setPositionV, comment: "Setzt den Text an die angegebene Position (Mitte der Bühne ist 0/0)" },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchTextClass.prototype._getPosition, comment: "Gibt die Position des Texts zurück" },
        { type: "method", signature: "void setX(double x)", native: ScratchTextClass.prototype._setX, comment: "Setzt die x-Position" },
        { type: "method", signature: "double getX()", native: ScratchTextClass.prototype._getX, comment: "Gibt die x-Position zurück" },
        { type: "method", signature: "void setY(double y)", native: ScratchTextClass.prototype._setY, comment: "Setzt die y-Position" },
        { type: "method", signature: "double getY()", native: ScratchTextClass.prototype._getY, comment: "Gibt die y-Position zurück" },

        { type: "method", signature: "void setTextColor(int r, int g, int b)", native: ScratchTextClass.prototype._setTextColorRGB, comment: "Setzt die Schriftfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)" },
        { type: "method", signature: "void setTextColor(double h)", native: ScratchTextClass.prototype._setTextColorHue, comment: "Setzt die Schriftfarbe über den Farbton (0 bis 255)" },
        { type: "method", signature: "void setTextColor(Color c)", native: ScratchTextClass.prototype._setTextColorObj, comment: "Setzt die Schriftfarbe" },
        { type: "method", signature: "void setBackgroundColor(int r, int g, int b)", native: ScratchTextClass.prototype._setBackgroundColorRGB, comment: "Setzt die Hintergrundfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)" },
        { type: "method", signature: "void setBackgroundColor(double h)", native: ScratchTextClass.prototype._setBackgroundColorHue, comment: "Setzt die Hintergrundfarbe über den Farbton (0 bis 255)" },
        { type: "method", signature: "void setBackgroundColor(Color c)", native: ScratchTextClass.prototype._setBackgroundColorObj, comment: "Setzt die Hintergrundfarbe" },
        { type: "method", signature: "void setStrokeColor(int r, int g, int b)", native: ScratchTextClass.prototype._setStrokeColorRGB, comment: "Setzt die Rahmenfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)" },
        { type: "method", signature: "void setStrokeColor(double h)", native: ScratchTextClass.prototype._setStrokeColorHue, comment: "Setzt die Rahmenfarbe über den Farbton (0 bis 255)" },
        { type: "method", signature: "void setStrokeColor(Color c)", native: ScratchTextClass.prototype._setStrokeColorObj, comment: "Setzt die Rahmenfarbe" },

        { type: "method", signature: "void addFont(string name, string fontFamily)", native: ScratchTextClass.prototype._addFont, comment: "Fügt eine Schriftart hinzu" },
        { type: "method", signature: "void switchFont(string name)", native: ScratchTextClass.prototype._switchFont, comment: "Wechselt zur Schriftart mit dem angegebenen Namen" },
        { type: "method", signature: "void nextFont()", native: ScratchTextClass.prototype._nextFont, comment: "Wechselt zur nächsten Schriftart" },
        { type: "method", signature: "string getCurrentFontName()", native: ScratchTextClass.prototype._getCurrentFontName, comment: "Gibt den Namen der aktuellen Schriftart zurück" },
        { type: "method", signature: "int getCurrentFontIndex()", native: ScratchTextClass.prototype._getCurrentFontIndex, comment: "Gibt die Nummer der aktuellen Schriftart zurück" },
        { type: "method", signature: "void setFont(string name)", native: ScratchTextClass.prototype._switchFont, comment: "Wechselt zur Schriftart mit dem angegebenen Namen" },
        { type: "method", signature: "string getFont()", native: ScratchTextClass.prototype._getCurrentFontName, comment: "Gibt den Namen der aktuellen Schriftart zurück" },

        { type: "method", signature: "void setTextSize(int size)", native: ScratchTextClass.prototype._setTextSize, comment: "Setzt die Schriftgröße" },
        { type: "method", signature: "int getTextSize()", native: ScratchTextClass.prototype._getTextSize, comment: "Gibt die Schriftgröße zurück" },
        { type: "method", signature: "double getWidth()", native: ScratchTextClass.prototype._getWidth, comment: "Gibt die Breite des Textfelds zurück" },
        { type: "method", signature: "void setWidth(double width)", native: ScratchTextClass.prototype._setWidth, comment: "Setzt die Breite des Textfelds; längere Texte werden umgebrochen" },
        { type: "method", signature: "void setAlign(TextAlign align)", native: ScratchTextClass.prototype._setAlign, comment: "Legt fest, wie der Text zu seiner Position ausgerichtet wird" },
        { type: "method", signature: "TextAlign getAlign()", native: ScratchTextClass.prototype._getAlign, comment: "Gibt die Ausrichtung des Texts zurück" },
        { type: "method", signature: "void setStyle(TextStyle style)", native: ScratchTextClass.prototype._setStyle, comment: "Legt fest, ob der Text als Kasten, Sprech- oder Denkblase dargestellt wird" },

        { type: "method", signature: "void remove()", native: ScratchTextClass.prototype._remove, comment: "Entfernt den Text von der Bühne" },

        // UI texts ignore the camera, like UI sprites
        { type: "method", signature: "boolean isUI()", native: ScratchTextClass.prototype._isUI, comment: "Gibt genau dann true zurück, wenn der Text zur Benutzeroberfläche gehört" },
        { type: "method", signature: "void setIsUI(boolean isUI)", native: ScratchTextClass.prototype._setIsUI, comment: "Legt fest, ob der Text zur Benutzeroberfläche gehört und sich nicht mit der Kamera bewegt" },

        // stage lifecycle
        { type: "method", signature: "Stage getStage()", native: ScratchTextClass.prototype._getStage, comment: "Gibt die Bühne zurück, auf der der Text liegt" },
        { type: "method", signature: "void addedToStage(Stage stage)", java: ScratchTextClass.prototype._mj$addedToStage$void$Stage, comment: "Wird aufgerufen, wenn der Text der Bühne hinzugefügt wird" },
        { type: "method", signature: "void removedFromStage(Stage stage)", java: ScratchTextClass.prototype._mj$removedFromStage$void$Stage, comment: "Wird aufgerufen, wenn der Text von der Bühne entfernt wird" },
        { type: "method", signature: "void whenAddedToStage()", java: ScratchTextClass.prototype._mj$whenAddedToStage$void$, comment: "Wird aufgerufen, wenn der Text der Bühne hinzugefügt wird" },
        { type: "method", signature: "void whenAddedToStage(Stage stage)", java: ScratchTextClass.prototype._mj$whenAddedToStage$void$Stage, comment: "Wird aufgerufen, wenn der Text der Bühne hinzugefügt wird" },
        { type: "method", signature: "void whenRemovedFromStage()", java: ScratchTextClass.prototype._mj$whenRemovedFromStage$void$, comment: "Wird aufgerufen, wenn der Text von der Bühne entfernt wird" },
        { type: "method", signature: "void whenRemovedFromStage(Stage stage)", java: ScratchTextClass.prototype._mj$whenRemovedFromStage$void$Stage, comment: "Wird aufgerufen, wenn der Text von der Bühne entfernt wird" },

        { type: "method", signature: "static string getDefaultFont()", native: ScratchTextClass._getDefaultFont, comment: "Gibt die Standardschriftart zurück" },
        { type: "method", signature: "static int getDefaultFontSize()", native: ScratchTextClass._getDefaultFontSize, comment: "Gibt die Standardschriftgröße zurück" },
        { type: "method", signature: "static int[] getDefaultFontSizes()", native: ScratchTextClass._getDefaultFontSizes, comment: "Gibt die voreingestellten Schriftgrößen zurück" },
        { type: "method", signature: "static void useFont(string path, int size)", native: ScratchTextClass._useFont2, comment: "Legt Schriftart und -größe für alle Texte fest" },
        { type: "method", signature: "static void useFont(string path)", native: ScratchTextClass._useFont1, comment: "Legt die Schriftart für alle Texte fest" },
        { type: "method", signature: "static void useFontSizes(int... sizes)", native: ScratchTextClass._useFontSizes, comment: "Legt die verfügbaren Schriftgrößen fest; die erste ist die Standardgröße" },
        { type: "method", signature: "static void useSmoothing(boolean smooth)", native: ScratchTextClass._useSmoothing, comment: "Legt fest, ob Schrift geglättet wird" },
        { type: "method", signature: "boolean isSmoothing()", native: ScratchTextClass.prototype._isSmoothing, comment: "Gibt genau dann true zurück, wenn Schrift geglättet wird" },
    ];

    static type: NonPrimitiveType;

    // ---- library-wide font defaults, set by the static useFont* methods ----
    // Upstream warns and ignores these once a Stage exists; here they simply
    // take effect for texts created afterwards.
    private static defaultFont: string = DEFAULT_FONT;
    private static defaultFontSizes: number[] = [DEFAULT_FONT_SIZE];
    private static smoothing: boolean = true;

    world!: IWorld;

    private text: string = "";
    private tx: number = 0;         // Scratch coords: centre origin, y up
    private ty: number = 0;
    private boxWidth: number = 200;
    private textSize: number = ScratchTextClass.defaultFontSizes[0];
    private align: TextAlign = TextAlign.LEFT;
    // upstream's Text() leaves the style PLAIN; Text(Sprite) switches to SPEAK
    private style: TextStyle = TextStyle.PLAIN;
    private visible: boolean = false;

    private textColor: ScratchColorClass = ScratchColorClass.fromRGB(120, 120, 120);
    private backgroundColor: ScratchColorClass = ScratchColorClass.fromRGB(255, 255, 255);
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
        this.visible = false;
        t.s.push(this);
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
            (scratchLayerOf(this.world, this.ui ? "ui" : "sprites") ?? this.world.app.stage).addChild(plain);
            this.container = plain;
            return;
        }

        const bw = Math.max(label.width, 0) + pad * 2;
        const bh = label.height + pad * 2;
        const radius = this.style === TextStyle.BOX ? 4 : 12;

        const g = new PIXI.Graphics();
        g.roundRect(0, 0, bw, bh, radius)
            .fill(this.backgroundColor._get() & 0xffffff)
            .stroke({ width: 2, color: this.strokeColor._get() & 0xffffff });
        if (this.style === TextStyle.SPEAK) {
            g.moveTo(bw * 0.25, bh).lineTo(bw * 0.12, bh + 14).lineTo(bw * 0.45, bh)
                .fill(this.backgroundColor._get() & 0xffffff);
        } else if (this.style === TextStyle.THINK) {
            g.circle(bw * 0.22, bh + 7, 5).fill(this.backgroundColor._get() & 0xffffff);
            g.circle(bw * 0.14, bh + 17, 3).fill(this.backgroundColor._get() & 0xffffff);
        }
        label.position.set(pad, pad);

        const box = new PIXI.Container();
        box.addChild(g, label);

        // Scratch coords -> world pixel space; align positions the box horizontally.
        const screenX = this.world.width / 2 + this.tx;
        const screenY = this.world.height / 2 - this.ty;
        let offsetX = 0;
        if (this.align === TextAlign.CENTER) offsetX = -bw / 2;
        else if (this.align === TextAlign.RIGHT) offsetX = -bw;
        box.position.set(screenX + offsetX, screenY - bh / 2);

        // texts scroll with the world, like the sprites they label
        // UI texts sit outside the camera container, so they do not scroll
        (scratchLayerOf(this.world, this.ui ? "ui" : "sprites") ?? this.world.app.stage).addChild(box);
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
        return (this.world as any)?.interpreter?.retrieveObject("ScratchStage");
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
