import * as PIXI from "pixi.js";
import { scratchGameClock } from './ScratchGameClock';
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { ScratchColorClass } from "./ScratchColorClass";
import { breakLines } from "./ScratchLineBreaker";
import { roundToScratchPixelGrid, scratchDefaultFontFamily, scratchFontMetrics, SCRATCH_PIXEL_FONT_FAMILY } from "./ScratchFont";
import { isPixelArt } from "./ScratchPixelArt";
import { textLayerOfLayer } from "./ScratchLayers";
import { Layer, LayerEnum } from "./LayerEnum";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { TextAlign, TextAlignEnum } from "./TextAlignEnum";
import { TextStyle, TextStyleEnum } from "./TextStyleEnum";
import { SRC } from "./ScratchLibraryComments";
import { ScratchWorkspaceAssets } from "./ScratchWorkspaceAssets";
import type { ScratchSpriteClass } from './ScratchSpriteClass';
import { WeakIterableSet } from '../WeakIterableSet';

/**
 * The font the Scratch library ships (see src/development/scratchAssetsGenerator.js):
 * the built-in default is UbuntuMono, or Jersey 10 in pixel-art mode — which of
 * the two a "default" font means is decided when the text is drawn, see
 * scratchDefaultFontFamily().
 */
const DEFAULT_FONT = "UbuntuMono, monospace";
/**
 * Upstream's Text.fontSize. It read 24 here, so every text came out too big.
 * In pixel-art mode the default size is instead 18 rounded to whole pixels of
 * Jersey 10, see _getDefaultFontSize().
 */
const DEFAULT_FONT_SIZE = 14;
/** The gap upstream leaves between a frame and the words inside it. */
const PAD = 8;
/** Upstream's Text.SPEAK_BUBBLE_MAX_LIMIT: how wide a bubble may grow. */
const SPEAK_BUBBLE_MAX_LIMIT = 330;
/** Upstream's Text.BUBBLE_MIN_WIDTH: how wide a bubble is at least, so that a short word still looks like a bubble. */
const BUBBLE_MIN_WIDTH = 80;

/**
 * A text laid out the way the desktop's TextLayout lays one out: its lines,
 * the width of the block they sit in, and the measures their baselines hang
 * from - the font's own, from its file, scaled by size / unitsPerEm.
 */
export interface ScratchTextLayout {
    /** The lines in order; an empty one only takes its step of height. */
    lines: { text: string; width: number }[];
    /** The widest line: the width of the block the lines sit in. */
    width: number;
    /** Lines × line step. */
    height: number;
    /** How far the letters reach above the baseline, at the drawn size. */
    ascent: number;
    /** How far they reach below it, negative, as the font file gives it. */
    descent: number;
    /** One baseline to the next: ascent - descent + lineGap, scaled. */
    lineStep: number;
    /** The canvas's own ascent, which places the glyphs inside a label. */
    pixiAscent: number;
}

/**
 * On-stage text, mirroring org.openpatch.scratch.Text (core subset).
 *
 * Like Sprite, its position uses the Scratch coordinate system (centre origin,
 * y up) and is converted to the world's top-left/y-down pixel space in redraw().
 */
export class ScratchTextClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Text extends Object", comment: SRC.textClassComment },

        { type: "method", signature: "Text()", java: ScratchTextClass.prototype._cj$_constructor_$Text$, comment: SRC.textConstructorComment },
        { type: "method", signature: "Text(string text, double x, double y, double width)", java: ScratchTextClass.prototype._cj$_constructor_$Text$string$double$double$double, comment: SRC.textConstructor2Comment },
        { type: "method", signature: "Text(string text, double x, double y, double width, TextStyle style)", java: ScratchTextClass.prototype._cj$_constructor_$Text$string$double$double$double$TextStyle, comment: SRC.textConstructor3Comment },

        { type: "method", signature: "void showText(string text)", native: ScratchTextClass.prototype._showText, comment: SRC.textShowTextComment },
        { type: "method", signature: "void showText(string text, double seconds)", native: ScratchTextClass.prototype._showTextFor, comment: SRC.textShowText2Comment },
        { type: "method", signature: "string getText()", native: ScratchTextClass.prototype._getText, comment: SRC.textGetTextComment },
        { type: "method", signature: "void show()", native: ScratchTextClass.prototype._show, comment: SRC.textShowComment },
        { type: "method", signature: "void hide()", native: ScratchTextClass.prototype._hide, comment: SRC.textHideComment },
        { type: "method", signature: "boolean isVisible()", native: ScratchTextClass.prototype._isVisible, comment: SRC.textIsVisibleComment },

        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchTextClass.prototype._setPosition, comment: SRC.textSetPositionComment },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchTextClass.prototype._setPositionV, comment: SRC.textSetPosition2Comment },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchTextClass.prototype._getPosition, comment: SRC.textGetPositionComment },
        { type: "method", signature: "void setX(double x)", native: ScratchTextClass.prototype._setX, comment: SRC.textSetXComment },
        { type: "method", signature: "double getX()", native: ScratchTextClass.prototype._getX, comment: SRC.textGetXComment },
        { type: "method", signature: "void setY(double y)", native: ScratchTextClass.prototype._setY, comment: SRC.textSetYComment },
        { type: "method", signature: "double getY()", native: ScratchTextClass.prototype._getY, comment: SRC.textGetYComment },

        { type: "method", signature: "void setTextColor(double r, double g, double b)", native: ScratchTextClass.prototype._setTextColorRGB, comment: SRC.textSetTextColorComment },
        { type: "method", signature: "void setTextColor(Color color)", native: ScratchTextClass.prototype._setTextColorObj, comment: SRC.textSetTextColor3Comment },
        { type: "method", signature: "void setBackgroundColor(double r, double g, double b)", native: ScratchTextClass.prototype._setBackgroundColorRGB, comment: SRC.textSetBackgroundColorComment },
        { type: "method", signature: "void setBackgroundColor(Color color)", native: ScratchTextClass.prototype._setBackgroundColorObj, comment: SRC.textSetBackgroundColor3Comment },
        { type: "method", signature: "void setStrokeColor(double r, double g, double b)", native: ScratchTextClass.prototype._setStrokeColorRGB, comment: SRC.textSetStrokeColorComment },
        { type: "method", signature: "void setStrokeColor(Color color)", native: ScratchTextClass.prototype._setStrokeColorObj, comment: SRC.textSetStrokeColor3Comment },

        { type: "method", signature: "void addFont(string name, string fontFamily)", native: ScratchTextClass.prototype._addFont, comment: SRC.textAddFontComment },
        { type: "method", signature: "void switchFont(string name)", native: ScratchTextClass.prototype._switchFont, comment: SRC.textSwitchFontComment },
        { type: "method", signature: "void nextFont()", native: ScratchTextClass.prototype._nextFont, comment: SRC.textNextFontComment },
        { type: "method", signature: "string getCurrentFontName()", native: ScratchTextClass.prototype._getCurrentFontName, comment: SRC.textGetCurrentFontNameComment },
        { type: "method", signature: "int getCurrentFontIndex()", native: ScratchTextClass.prototype._getCurrentFontIndex, comment: SRC.textGetCurrentFontIndexComment },
        { type: "method", signature: "void setFont(string name)", native: ScratchTextClass.prototype._switchFont, comment: SRC.textSetFontComment },
        { type: "method", signature: "string getFont()", native: ScratchTextClass.prototype._getCurrentFontName, comment: SRC.textGetFontComment },

        { type: "method", signature: "void setTextSize(double size)", native: ScratchTextClass.prototype._setTextSize, comment: SRC.textSetTextSizeComment },
        { type: "method", signature: "double getTextSize()", native: ScratchTextClass.prototype._getTextSize, comment: SRC.textGetTextSizeComment },
        { type: "method", signature: "double getWidth()", native: ScratchTextClass.prototype._getWidth, comment: SRC.textGetWidthComment },
        { type: "method", signature: "void setWidth(double width)", native: ScratchTextClass.prototype._setWidth, comment: SRC.textSetWidthComment },
        { type: "method", signature: "void setAlign(TextAlign align)", native: ScratchTextClass.prototype._setAlign, comment: SRC.textSetAlignComment },
        { type: "method", signature: "TextAlign getAlign()", native: ScratchTextClass.prototype._getAlign, comment: SRC.textGetAlignComment },
        { type: "method", signature: "void setStyle(TextStyle style)", native: ScratchTextClass.prototype._setStyle, comment: SRC.textSetStyleComment },
        { type: "method", signature: "TextStyle getStyle()", native: ScratchTextClass.prototype._getStyle, comment: SRC.textGetStyleComment },

        { type: "method", signature: "void remove()", native: ScratchTextClass.prototype._remove, comment: SRC.textRemoveComment },

        // which of several overlapping texts is on top, as on Sprite
        { type: "method", signature: "void goToFrontLayer()", native: ScratchTextClass.prototype._goToFrontLayer, comment: SRC.textGoToFrontLayerComment },
        { type: "method", signature: "void goToBackLayer()", native: ScratchTextClass.prototype._goToBackLayer, comment: SRC.textGoToBackLayerComment },
        { type: "method", signature: "void goLayersForwards(int number)", native: ScratchTextClass.prototype._goLayersForwards, comment: SRC.textGoLayersForwardsComment },
        { type: "method", signature: "void goLayersBackwards(int number)", native: ScratchTextClass.prototype._goLayersBackwards, comment: SRC.textGoLayersBackwardsComment },

        // UI texts ignore the camera, like UI sprites
        { type: "method", signature: "void setLayer(Layer layer)", native: ScratchTextClass.prototype._setLayer, comment: SRC.textSetLayerComment },
        { type: "method", signature: "Layer getLayer()", native: ScratchTextClass.prototype._getLayer, comment: SRC.textGetLayerComment },

        // stage lifecycle
        { type: "method", signature: "Stage getStage()", native: ScratchTextClass.prototype._getStage, comment: SRC.textGetStageComment },
        { type: "method", signature: "void whenAddedToStage()", java: ScratchTextClass.prototype._mj$whenAddedToStage$void$, comment: SRC.textWhenAddedToStageComment },
        { type: "method", signature: "void whenRemovedFromStage()", java: ScratchTextClass.prototype._mj$whenRemovedFromStage$void$, comment: SRC.textWhenRemovedFromStageComment },

        { type: "method", signature: "static string getDefaultFont()", native: ScratchTextClass._getDefaultFont, comment: SRC.textGetDefaultFontComment },
        { type: "method", signature: "static double getDefaultFontSize()", native: ScratchTextClass._getDefaultFontSize, comment: SRC.textGetDefaultFontSizeComment },
        { type: "method", signature: "static void useFont(string path, double pixelGrid)", native: ScratchTextClass._useFont2, comment: SRC.textUseFontComment },
        { type: "method", signature: "static void useFont(string path)", native: ScratchTextClass._useFont1, comment: SRC.textUseFont2Comment },
    ];

    static type: NonPrimitiveType;

    // ---- library-wide font defaults, set by the static useFont* methods ----
    // Upstream warns and ignores these once a Stage exists; here they simply
    // take effect for texts created afterwards.
    private static defaultFont: string = DEFAULT_FONT;
    /** Whether defaultFont is still the bundled one, so "default" can follow the pixel-art mode. */
    private static defaultFontIsBuiltin = true;
    private static defaultFontSizes: number[] = [DEFAULT_FONT_SIZE];

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
    /**
     * Where the words wrap. Upstream's Text() leaves it at 0, which means they
     * do not wrap at all - it read 200 here, so a plain text broke into lines
     * the desktop kept on one.
     */
    private boxWidth: number = 0;
    /** The size a new text starts at: the live default, see _getDefaultFontSize(). */
    private textSize: number = ScratchTextClass._getDefaultFontSize();
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

    // upstream's Text defaults: black on white, framed in (201,201,201)
    private textColor: ScratchColorClass = ScratchColorClass.fromRGB(0, 0, 0);
    private backgroundColor: ScratchColorClass = ScratchColorClass.defaultColor();
    private strokeColor: ScratchColorClass = ScratchColorClass.fromRGB(201, 201, 201);

    private container?: PIXI.Container;
    private hideTimeout?: any;
    private sprite?: ScratchSpriteClass;
    private static attached = new WeakMap<IWorld, WeakIterableSet<ScratchTextClass>>();

    _cj$_constructor_$Text$Sprite(t: Thread, callback: CallbackParameter, sprite: ScratchSpriteClass) {
        this.sprite = sprite;
        this.style = TextStyle.SPEAK;
        this.align = TextAlign.LEFT;
        this._cj$_constructor_$Text$(t, callback);
    }

    _cj$_constructor_$Text$Text(t: Thread, callback: CallbackParameter, text: ScratchTextClass) {
        for (const key of ['world', 'stage', 'text', 'tx', 'ty', 'boxWidth', 'textSize', 'align', 'style',
            'visible', 'textColor', 'backgroundColor', 'strokeColor', 'currentFont']) this[key] = text[key];
        this.fonts = text.fonts.map(font => ({ ...font }));
        this.redraw();
        t.s.push(this);
        callback?.();
    }

    _cj$_constructor_$Text$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Text$string$double$double$double(t, callback, "", 0, 0, 0);
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
        if (this.sprite) {
            this.tx = this.sprite._getX() + this.sprite._getSpriteWidth() / 2;
            this.ty = this.sprite._getY() + this.sprite._getSpriteHeight() / 2;
            this.stage = this.sprite.stage;
            if (this.world) {
                let texts = ScratchTextClass.attached.get(this.world);
                if (!texts) ScratchTextClass.attached.set(this.world, texts = new WeakIterableSet());
                texts.add(this);
            }
        }
        // Where the old one sat among the other texts. Redrawing builds a new
        // container, and a new child goes on top: without this, saying anything
        // - or moving the text, or recolouring it - would undo goToBackLayer().
        const wasIn = this.container && !this.container.destroyed ? this.container.parent ?? undefined : undefined;
        const wasAt = wasIn ? wasIn.getChildIndex(this.container!) : undefined;
        if (this.container && !this.container.destroyed) this.container.destroy({ children: true });
        this.container = undefined;
        if (!this.visible || !this.text || !this.world) return;

        // Upstream resolves the font when it draws: a text's own font, else
        // Text.useFont()'s, else UbuntuMono or Jersey 10 in pixel-art mode.
        // The "default" slot reads the live values, so a Window.usePixelArt()
        // or Text.useFont() also relayouts the texts already on stage; the
        // entry's family is only the snapshot taken when the text was built.
        const fontSlot = this.fonts[this.currentFont];
        const family = fontSlot.name === "default"
            ? (ScratchTextClass.defaultFontIsBuiltin ? scratchDefaultFontFamily() : ScratchTextClass.defaultFont)
            : fontSlot.family;
        // In pixel-art mode every drawn size is rounded to whole pixels of the
        // pixel font (upstream's layoutOf does the same); this.textSize itself
        // keeps what was set, as getTextSize() reports it unrounded.
        const size = family === SCRATCH_PIXEL_FONT_FAMILY ? roundToScratchPixelGrid(this.textSize) : this.textSize;
        // No leading and no align: the layout below places every line itself,
        // from the font's own metrics, so the style only carries the look.
        const style = new PIXI.TextStyle({
            fontFamily: family,
            fontSize: size,
            fill: this.textColor._get() & 0xffffff,
        });
        const layout = ScratchTextClass.layoutText(this.text, family, style, size, this.wrapWidth());

        // PLAIN is upstream's default: no frame, just the text. Its first
        // line's baseline sits (ascent + descent) / 2 below the position - the
        // descent negative, as the font file gives it - so the line's ink,
        // which reaches an ascent above and a descent below its baseline, is
        // centred on the position; the further lines hang below it, one line
        // step apart (upstream's Text.toDraw for a plain text). The block of
        // lines is placed by the align: its left edge, its centre or its right
        // one sits at the position.
        if (this.style === TextStyle.PLAIN) {
            const x = this.world.width / 2 + this.tx;
            const y = this.world.height / 2 - this.ty;
            let left = 0;
            if (this.align === TextAlign.CENTER) left = -layout.width / 2;
            else if (this.align === TextAlign.RIGHT) left = -layout.width;
            const plain = new PIXI.Container();
            ScratchTextClass.addLines(plain, layout, style, this.align, left, (layout.ascent + layout.descent) / 2);
            plain.position.set(x, y);
            this.attach(plain, wasIn, wasAt);
            return;
        }

        // Upstream's Text.toDraw: the words plus the padding, and a bubble at
        // least BUBBLE_MIN_WIDTH wide - the minimum REPLACES the padded width,
        // it is not added to it - so a short word still looks like a bubble; a
        // box is not given a minimum.
        const bw = this.style === TextStyle.BOX
            ? layout.width + PAD * 2
            : Math.max(BUBBLE_MIN_WIDTH, layout.width + PAD * 2);
        const bh = layout.height + PAD * 2;
        // Upstream's drawText rounds a BOX by 8 - the corners of Scratch's ask
        // box - and a bubble by 16. BOX used to be drawn rounded by 16 all
        // round here, with the bottom two corners left square as 6.x did.
        const radius = this.style === TextStyle.BOX ? 8 : 16;
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

        const box = new PIXI.Container();
        box.addChild(g);

        // Scratch coords -> world pixel space; align positions the box horizontally.
        // Upstream translates to (x, -y - height), so the anchor is the bottom
        // edge of the box and it grows upwards from there.
        const screenX = this.world.width / 2 + this.tx;
        const screenY = this.world.height / 2 - this.ty;
        let offsetX = 0;
        if (this.align === TextAlign.CENTER) offsetX = -bw / 2;
        else if (this.align === TextAlign.RIGHT) offsetX = -bw;
        box.position.set(screenX + offsetX, screenY - bh);

        // The lines sit inside the padding; the first one's baseline is an
        // ascent below the block's top (upstream's TextLayout.Line.baseline),
        // the further ones a line step below it.
        // The lines sit inside the padding, aligned within the BOX: for a
        // bubble that can be wider than the words (the minimum width), and
        // upstream's Renderer.drawLayout centres them in the box's inner
        // width, not in the block of the widest line.
        ScratchTextClass.addLines(box, layout, style, this.align, PAD, PAD + layout.ascent, bw - PAD * 2);

        // texts scroll with the world, like the sprites they label
        // UI texts sit outside the camera container, so they do not scroll
        this.attach(box, wasIn, wasAt);
    }

    /**
     * Puts a rebuilt text into its layer, and back to the place among the other
     * texts the old one had.
     */
    private attach(node: PIXI.Container, wasIn?: PIXI.Container, wasAt?: number) {
        const layer = textLayerOfLayer(this, this.textLayer) ?? this.world.app.stage;
        layer.addChild(node);
        // Only where it is the same layer: setIsUI() moves a text to another
        // one, where the old place means nothing.
        if (wasIn === layer && wasAt !== undefined) {
            layer.setChildIndex(node, Math.min(wasAt, layer.children.length - 1));
        }
        this.container = node;
    }

    /**
     * The width to wrap the words at, or none at all - upstream's Text.layout().
     *
     * <p>Only a bubble falls back to a width of its own when none was set; a
     * box or a plain text without a width does not wrap at all. The words wrap
     * inside the padding (`inner = wrap - 2 * PADDING`, at least 1, upstream's
     * Math.max), so a box never grows past the width it was given; a width
     * without room for even one letter becomes a column of single letters -
     * that is the LineBreaker's long-word rule, not something to decide here.
     */
    private wrapWidth(): number | undefined {
        const width = this.boxWidth;
        if (width <= 0) {
            return this.style === TextStyle.BOX || this.style === TextStyle.PLAIN
                ? undefined
                : SPEAK_BUBBLE_MAX_LIMIT;
        }
        return this.style === TextStyle.PLAIN ? width : Math.max(1, width - PAD * 2);
    }

    _showText(text: string) {
        if (this.hideTimeout) { this.hideTimeout(); this.hideTimeout = undefined; }
        this.text = text ?? "";
        this.visible = this.text.length > 0;
        this.redraw();
    }
    _showTextFor(text: string, seconds: number) {
        this._showText(text);
        this.hideTimeout = scratchGameClock().schedule(() => this._showText(""), seconds * 1000);
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

    /**
     * Lays the text out the way the desktop's TextLayout.of() does: its lines
     * from the ported LineBreaker, and the font's own metrics - read from its
     * file, see ScratchFont - scaled by size / unitsPerEm, with one line step
     * of ascent - descent + lineGap from one baseline to the next.
     *
     * <p>Where the font's file is unknown - a workspace font, which the
     * browser registers under a family of its own - the canvas's measurements
     * stand in for the file's: PIXI places the glyphs by them anyway, so the
     * layout stays self-consistent, but it will not match the desktop line
     * for line the way the bundled fonts' metrics do.
     */
    /** The layout of any text in any font - the sprite bubbles share this (ScratchSpriteClass.showSpeech). */
    static layoutText(text: string, family: string, style: PIXI.TextStyle, size: number, wrapAt: number | undefined): ScratchTextLayout {
        const metrics = scratchFontMetrics(family);
        // The canvas's own measures of the font. PIXI places the glyphs
        // inside a label by them; for a font whose file is unknown they also
        // stand in for the file's metrics below.
        const canvas = PIXI.CanvasTextMetrics.measureText(" ", style).fontProperties;
        // the same order as the desktop: size / unitsPerEm first, then scaled
        const scale = metrics ? size / metrics.unitsPerEm : 1;
        const ascent = metrics ? metrics.ascent * scale : canvas.ascent;
        const descent = metrics ? metrics.descent * scale : -canvas.descent;
        const lineStep = metrics
            ? (metrics.ascent - metrics.descent + metrics.lineGap) * scale
            : canvas.ascent + canvas.descent;
        const measure = (run: string) => PIXI.CanvasTextMetrics.measureText(run, style).width;
        const lines: { text: string; width: number }[] = [];
        let widest = 0;
        for (const [i, line] of breakLines(text, wrapAt ?? 0, measure).entries()) {
            const width = line ? measure(line) : 0;
            lines.push({ text: line, width });
            widest = Math.max(widest, width);
        }
        return { lines, width: widest, height: lines.length * lineStep, ascent, descent, lineStep, pixiAscent: canvas.ascent };
    }

    /**
     * The laid-out lines, as one PIXI.Text each, so every baseline lands
     * where the layout put it: the glyphs hang from the canvas's own ascent
     * inside their label - PIXI draws a line's baseline there - and only the
     * label's place comes from the real metrics. `left` is the block's left
     * edge and `firstBaseline` the first line's baseline, both relative to
     * the container's top left; within the block the lines sit per the align,
     * at its left edge, centred, or at its right one (upstream's
     * Renderer.drawLayout).
     */
    static addLines(container: PIXI.Container, layout: ScratchTextLayout, style: PIXI.TextStyle,
        align: TextAlign, left: number, firstBaseline: number, blockWidth: number = layout.width) {
        for (const [i, line] of layout.lines.entries()) {
            if (!line.text) continue; // an empty line only takes its step of height
            const label = new PIXI.Text({ text: line.text, style });
            let offset = 0;
            if (align === TextAlign.CENTER) offset = (blockWidth - line.width) / 2;
            else if (align === TextAlign.RIGHT) offset = blockWidth - line.width;
            label.position.set(left + offset, firstBaseline + i * layout.lineStep - layout.pixiAscent);
            container.addChild(label);
        }
    }

    // ---- fonts ----
    // A "font" here is a CSS font-family, or the path of a font file in the
    // workspace, which stands for the family that file was registered under.
    // "default" is always present and maps to the bundled fonts: UbuntuMono,
    // or Jersey 10 in pixel-art mode. It resolves when the text is drawn, so
    // a Window.usePixelArt() relayouts texts already on stage; Text.useFont()
    // pins "default" to the named font instead.
    private fonts: { name: string; family: string }[] = [{ name: "default", family: ScratchTextClass.defaultFont }];
    private currentFont: number = 0;

    _addFont(name: string, fontFamily: string) {
        if (this.fonts.some(f => f.name === name)) return;
        const own = ScratchWorkspaceAssets.getFontFamily(fontFamily);
        this.fonts.push({ name, family: own ?? fontFamily });
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
        if (this.world) ScratchTextClass.attached.get(this.world)?.delete(this);
        if (this.hideTimeout) { this.hideTimeout(); this.hideTimeout = undefined; }
        if (this.container && !this.container.destroyed) this.container.destroy({ children: true });
        this.container = undefined;
        this.visible = false;
    }

    static refreshAttached(world: IWorld) {
        for (const text of this.attached.get(world) ?? []) {
            const x = text.sprite!._getX() + text.sprite!._getSpriteWidth() / 2;
            const y = text.sprite!._getY() + text.sprite!._getSpriteHeight() / 2;
            if (x !== text.tx || y !== text.ty || text.stage !== text.sprite!.stage) text.redraw();
        }
    }

    // ---- layering ----
    // Texts are drawn above the sprites, so these order a text against the other
    // texts - the same as upstream, where the stage draws its texts after its
    // sprites and these move it within that list.
    private get siblings(): PIXI.Container | undefined {
        return this.container && !this.container.destroyed ? this.container.parent ?? undefined : undefined;
    }
    _goToFrontLayer() { const p = this.siblings; if (p) p.setChildIndex(this.container!, p.children.length - 1); }
    _goToBackLayer() { const p = this.siblings; if (p) p.setChildIndex(this.container!, 0); }
    private moveLayers(delta: number) {
        const p = this.siblings;
        if (!p) return;
        const index = p.getChildIndex(this.container!);
        p.setChildIndex(this.container!, Math.max(0, Math.min(p.children.length - 1, index + delta)));
    }
    _goLayersForwards(n: number) { this.moveLayers(n); }
    _goLayersBackwards(n: number) { this.moveLayers(-n); }

    // ---- visibility (7.0) ----
    _show() { this.visible = true; this.redraw(); }
    _hide() { this.visible = false; this.redraw(); }
    _isVisible(): boolean { return this.visible; }
    _getText(): string { return this.text; }

    // ---- layer (7.0) ----
    private textLayer: Layer = Layer.MAIN;
    _getLayer(): LayerEnum { return LayerEnum.values[this.textLayer]; }
    _setLayer(layer: LayerEnum) {
        const target = Layer[layer.name as keyof typeof Layer];
        if (this.textLayer === target) return;
        this.textLayer = target;
        this.redraw();      // rebuilds the box in the right layer
    }
    isUIText(): boolean { return this.textLayer === Layer.UI; }

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

    /**
     * 7.0's useFont/getDefaultFont: library-wide, as 6.x's were. useFont
     * names a pixel font's grid; the browser's text engine measures with the
     * font itself, so the size only seeds the default size texts start from.
     *
     * <p>Upstream's getDefaultFontSize() is 14 - or 18 rounded to whole pixels
     * of Jersey 10 in pixel-art mode, whatever a useFont said: the grid there
     * shapes the rounding of the font, not the default size.
     */
    static _getDefaultFont(): string { return ScratchTextClass.defaultFont; }
    static _getDefaultFontSize(): number {
        return isPixelArt() ? roundToScratchPixelGrid(18) : ScratchTextClass.defaultFontSizes[0];
    }

    static _useFont2(path: string, pixelGrid: number) {
        if (path) {
            ScratchTextClass.defaultFont = path;
            ScratchTextClass.defaultFontIsBuiltin = false;
        }
        if (pixelGrid > 0) ScratchTextClass.defaultFontSizes = [pixelGrid];
    }
    static _useFont1(path: string) { ScratchTextClass._useFont2(path, 0); }
}
