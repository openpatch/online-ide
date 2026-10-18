import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchCostumes } from "./ScratchCostumes";
import { drawingFinite, ScratchDrawingClass, ScratchDrawingSpriteClass } from "./ScratchDrawingClasses";
import { TextAlign, TextAlignEnum } from "./TextAlignEnum";

export class ScratchBitmapTextClass extends ScratchDrawingSpriteClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.text", signature: "class BitmapText extends DrawingSprite" },
        { type: "method", signature: "BitmapText(string pattern)", java: ScratchBitmapTextClass.prototype._cj$_constructor_$BitmapText$string },
        { type: "method", signature: "void showText(string text)", java: ScratchBitmapTextClass.prototype._mj$showText$void$string },
        { type: "method", signature: "string getContent()", native: ScratchBitmapTextClass.prototype._getContent },
        { type: "method", signature: "void setFont(string pattern)", java: ScratchBitmapTextClass.prototype._mj$setFont$void$string },
        { type: "method", signature: "void addGlyph(char character, string path)", java: ScratchBitmapTextClass.prototype._mj$addGlyph$void$char$string },
        { type: "method", signature: "void setAlign(TextAlign align)", native: ScratchBitmapTextClass.prototype._setAlign },
        { type: "method", signature: "void setSpaceWidth(double width)", native: ScratchBitmapTextClass.prototype._setSpaceWidth },
        { type: "method", signature: "void setLetterSpacing(double spacing)", native: ScratchBitmapTextClass.prototype._setLetterSpacing },
        { type: "method", signature: "void setLineSpacing(double spacing)", native: ScratchBitmapTextClass.prototype._setLineSpacing },
        { type: "method", signature: "int getWidth()", native: ScratchBitmapTextClass.prototype._getSpriteWidth },
        { type: "method", signature: "int getHeight()", native: ScratchBitmapTextClass.prototype._getSpriteHeight },
        { type: "method", signature: "void draw(Drawing drawing)", java: ScratchBitmapTextClass.prototype._mj$draw$void$Drawing },
    ];
    static type: NonPrimitiveType;
    private pattern = "";
    private content = "";
    private align = TextAlign.LEFT;
    private spaceWidth = 22;
    private letterSpacing = 0;
    private lineSpacing = 0;
    private glyphs = new Map<string, string>();

    _cj$_constructor_$BitmapText$string(t: Thread, callback: CallbackParameter, pattern: string) {
        this.validate(pattern);
        this.pattern = pattern;
        this._cj$_constructor_$DrawingSprite$(t, callback);
    }
    private validate(pattern: string) {
        const conversions = pattern?.replace(/%%/g, "");
        if (conversions == null || !/%(?:0?[1-9][0-9]*)?d/.test(conversions)
            || conversions.replace(/%(?:0?[1-9][0-9]*)?d/, "").includes("%")) {
            throw new RuntimeExceptionClass("A bitmap font pattern needs one integer format, such as font%03d.png.");
        }
    }
    private path(character: string, pattern = this.pattern): string {
        const custom = this.glyphs.get(character);
        if (custom != null) return custom;
        return pattern.replace(/%%|%(0?[1-9][0-9]*)?d/g, (format, width) => {
            if (format === "%%") return "%";
            return String(character.codePointAt(0)).padStart(Number(width) || 0, width?.startsWith("0") ? "0" : " ");
        });
    }
    private paths(content: string, pattern = this.pattern): string[] {
        return [...content].filter(c => c !== " " && c !== "\n").map(c => this.path(c, pattern));
    }
    _mj$showText$void$string(t: Thread, callback: CallbackParameter, text: string) {
        if (text == null) throw new RuntimeExceptionClass("Text cannot be null.");
        ScratchCostumes.whenLoaded(t, this.paths(text), callback, () => { this.content = text; });
    }
    _getContent() { return this.content; }
    _mj$setFont$void$string(t: Thread, callback: CallbackParameter, pattern: string) {
        this.validate(pattern);
        ScratchCostumes.whenLoaded(t, this.paths(this.content, pattern), callback, () => { this.pattern = pattern; });
    }
    _mj$addGlyph$void$char$string(t: Thread, callback: CallbackParameter, character: string, path: string) {
        if (path == null) throw new RuntimeExceptionClass("Glyph image cannot be null.");
        ScratchCostumes.whenLoaded(t, this.content.includes(character) ? [path] : [], callback, () => this.glyphs.set(character, path));
    }
    _setAlign(align: TextAlignEnum) {
        if (!align) throw new RuntimeExceptionClass("Alignment cannot be null.");
        this.align = align.ordinal;
    }
    _setSpaceWidth(width: number) {
        drawingFinite(width);
        if (width < 0) throw new RuntimeExceptionClass("Space width cannot be negative.");
        this.spaceWidth = width;
    }
    _setLetterSpacing(spacing: number) { drawingFinite(spacing); this.letterSpacing = spacing; }
    _setLineSpacing(spacing: number) {
        drawingFinite(spacing);
        if (spacing < 0) throw new RuntimeExceptionClass("Line spacing cannot be negative.");
        this.lineSpacing = spacing;
    }
    private texture(character: string) {
        const texture = ScratchCostumes.getTexture(this.path(character));
        if (!texture) throw new RuntimeExceptionClass(`Missing glyph for '${character}'.`);
        return texture;
    }
    private width(character: string): number { return character === " " ? this.spaceWidth : this.texture(character).width; }
    private lineWidth(line: string): number {
        return Math.max(0, [...line].reduce((sum, c) => sum + this.width(c), 0) + Math.max(0, [...line].length - 1) * this.letterSpacing);
    }
    private lineHeight(): number {
        return Math.max(0, ...[...this.content].filter(c => c !== " " && c !== "\n").map(c => this.texture(c).height));
    }
    _getSpriteWidth(): number { return Math.ceil(Math.max(...this.content.split("\n").map(line => this.lineWidth(line))) * this.size / 100); }
    _getSpriteHeight(): number {
        if (!this.content) return 0;
        const lines = this.content.split("\n").length;
        return Math.ceil((this.lineHeight() * lines + this.lineSpacing * (lines - 1)) * this.size / 100);
    }
    _mj$draw$void$Drawing(_t: Thread, callback: CallbackParameter, drawing: ScratchDrawingClass) {
        let y = 0;
        const step = this.lineHeight() + this.lineSpacing;
        for (const line of this.content.split("\n")) {
            const width = this.lineWidth(line);
            let x = this.align === TextAlign.CENTER ? -width / 2 : this.align === TextAlign.RIGHT ? -width : 0;
            for (const character of line) {
                const glyphWidth = this.width(character);
                if (character !== " ") drawing._image(this.path(character), x + glyphWidth / 2, y - this.texture(character).height / 2);
                x += glyphWidth + this.letterSpacing;
            }
            y -= step;
        }
        callback?.();
    }
}
