import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";

/**
 * The parts of Scratch for Java that a browser cannot provide: GLSL shaders,
 * the raw pixel buffer, sprite sorting by a java.util.Comparator, GIF/video
 * recording and the file system.
 *
 * They are declared so that a program written against the desktop library still
 * compiles and runs here. Every method prints a one-time notice (see
 * ScratchUnsupported.ts) and then does nothing, so the rest of the program is
 * unaffected.
 */

/** Raw access to the three render buffers — no equivalent in the browser. */
export class ScratchPixelsClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Pixels extends Object", comment: "Nur in der Desktop-Version: Zugriff auf einzelne Bildpunkte" },
        { type: "method", signature: "int[] main()", native: ScratchPixelsClass.prototype._main, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "int[] background()", native: ScratchPixelsClass.prototype._background, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "int[] foreground()", native: ScratchPixelsClass.prototype._foreground, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    private static readonly HINT = "Der Bildpuffer ist im Browser nicht zugänglich. / The pixel buffer is not reachable in the browser.";
    _main(): number[] { return desktopOnlyValue("Pixels.main()", [], ScratchPixelsClass.HINT); }
    _background(): number[] { return desktopOnlyValue("Pixels.background()", [], ScratchPixelsClass.HINT); }
    _foreground(): number[] { return desktopOnlyValue("Pixels.foreground()", [], ScratchPixelsClass.HINT); }
}

/** Draw-order sorting driven by a java.util.Comparator. */
export class ScratchSortingClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Sorting extends Object", comment: "Nur in der Desktop-Version: Sortierreihenfolge der Figuren" },
        { type: "method", signature: "void byY()", native: ScratchSortingClass.prototype._byY, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void off()", native: ScratchSortingClass.prototype._off, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "boolean isOn()", native: ScratchSortingClass.prototype._isOn, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    _byY() { desktopOnly("Sorting.byY()"); }
    _off() { desktopOnly("Sorting.off()"); }
    _isOn(): boolean { return desktopOnlyValue("Sorting.isOn()", false); }
}

/** A single GLSL program. */
export class ScratchShaderClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Shader extends Object", comment: "Nur in der Desktop-Version: ein Shader-Programm" },
        { type: "method", signature: "Shader(string name, string fragmentShaderPath, string vertexShaderPath)", native: ScratchShaderClass.prototype._c3, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "string getName()", native: ScratchShaderClass.prototype._getName, comment: "Gibt den Namen des Shaders zurück" },
        { type: "method", signature: "void setName(string name)", native: ScratchShaderClass.prototype._setName, comment: "Setzt den Namen des Shaders" },
        { type: "method", signature: "void set(string name, int x)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, boolean x)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, double x)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, int x, int y)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, boolean x, boolean y)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, double x, double y)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, Vector2 vec)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, Color c)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, int[] values, int ncoords)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void set(string name, double[] values, int ncoords)", native: ScratchShaderClass.prototype._set, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    static readonly HINT = "Shader brauchen OpenGL. / Shaders need OpenGL.";
    name: string = "";

    _c3(name: string, _fragmentShaderPath: string, _vertexShaderPath: string) {
        this.name = name;
        desktopOnly("Shader", ScratchShaderClass.HINT);
        return this;
    }
    // the name is just a label, so it can behave normally
    _getName(): string { return this.name; }
    _setName(name: string) { this.name = name; }
    _set() { desktopOnly("Shader.set()", ScratchShaderClass.HINT); }
}

/** The shader collection a stage or sprite owns. */
export class ScratchShadersClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Shaders extends Object", comment: "Nur in der Desktop-Version: Sammlung von Shadern" },
        { type: "method", signature: "Shaders(string owner)", native: ScratchShadersClass.prototype._c1, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "Shader add(string name, string fragmentShaderPath, string vertexShaderPath)", native: ScratchShadersClass.prototype._add, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "Shader get(string name)", native: ScratchShadersClass.prototype._get, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void switchTo(string name)", native: ScratchShadersClass.prototype._switchTo, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void switchTo(double index)", native: ScratchShadersClass.prototype._switchTo, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void next()", native: ScratchShadersClass.prototype._next, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void reset()", native: ScratchShadersClass.prototype._reset, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "Shader getCurrent()", native: ScratchShadersClass.prototype._getCurrent, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "int getCurrentIndex()", native: ScratchShadersClass.prototype._getCurrentIndex, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "string getCurrentName()", native: ScratchShadersClass.prototype._getCurrentName, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    _c1(_owner: string) { desktopOnly("Shaders", ScratchShaderClass.HINT); return this; }
    _add(): ScratchShaderClass | undefined { return desktopOnlyValue("Shaders.add()", undefined, ScratchShaderClass.HINT); }
    _get(): ScratchShaderClass | undefined { return desktopOnlyValue("Shaders.get()", undefined, ScratchShaderClass.HINT); }
    _switchTo() { desktopOnly("Shaders.switchTo()", ScratchShaderClass.HINT); }
    _next() { desktopOnly("Shaders.next()", ScratchShaderClass.HINT); }
    _reset() { desktopOnly("Shaders.reset()", ScratchShaderClass.HINT); }
    _getCurrent(): ScratchShaderClass | undefined { return desktopOnlyValue("Shaders.getCurrent()", undefined, ScratchShaderClass.HINT); }
    _getCurrentIndex(): number { return desktopOnlyValue("Shaders.getCurrentIndex()", -1, ScratchShaderClass.HINT); }
    _getCurrentName(): string { return desktopOnlyValue("Shaders.getCurrentName()", "", ScratchShaderClass.HINT); }
}

const RECORDER_HINT = "Aufnahmen gibt es nur in der Desktop-Version. / Recording is desktop only.";

/** Base recorder; GifRecorder, FFmpegRecorder and FrameRecorder extend it. */
export class ScratchRecorderClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Recorder extends Object", comment: "Nur in der Desktop-Version: nimmt die Bühne auf" },
        { type: "method", signature: "void start()", native: ScratchRecorderClass.prototype._start, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void stop()", native: ScratchRecorderClass.prototype._stop, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "boolean isRecording()", native: ScratchRecorderClass.prototype._isRecording, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    _start() { desktopOnly("Recorder.start()", RECORDER_HINT); }
    _stop() { desktopOnly("Recorder.stop()", RECORDER_HINT); }
    _isRecording(): boolean { return desktopOnlyValue("Recorder.isRecording()", false, RECORDER_HINT); }
}

export class ScratchGifRecorderClass extends ScratchRecorderClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class GifRecorder extends Recorder", comment: "Nur in der Desktop-Version: nimmt ein GIF auf" },
        { type: "method", signature: "GifRecorder(string path)", native: ScratchGifRecorderClass.prototype._c1, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;
    _c1(_path: string) { desktopOnly("GifRecorder", RECORDER_HINT); return this; }
}

export class ScratchFFmpegRecorderClass extends ScratchRecorderClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class FFmpegRecorder extends Recorder", comment: "Nur in der Desktop-Version: nimmt ein Video auf" },
        { type: "method", signature: "FFmpegRecorder(string path)", native: ScratchFFmpegRecorderClass.prototype._c1, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;
    _c1(_path: string) { desktopOnly("FFmpegRecorder", RECORDER_HINT); return this; }
}

export class ScratchFrameRecorderClass extends ScratchRecorderClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class FrameRecorder extends Recorder", comment: "Nur in der Desktop-Version: speichert Einzelbilder" },
        { type: "method", signature: "FrameRecorder(string path)", native: ScratchFrameRecorderClass.prototype._c1, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;
    _c1(_path: string) { desktopOnly("FrameRecorder", RECORDER_HINT); return this; }
}

const FILE_HINT = "Auf Dateien kann im Browser nicht zugegriffen werden. / Files are not accessible in the browser.";

/** org.openpatch.scratch.extensions.fs.File */
export class ScratchFileClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class File extends Object", comment: "Nur in der Desktop-Version: liest und schreibt Dateien" },
        { type: "method", signature: "File(string path)", native: ScratchFileClass.prototype._c1, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "string read()", native: ScratchFileClass.prototype._read, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void write(string content)", native: ScratchFileClass.prototype._write, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void append(string content)", native: ScratchFileClass.prototype._append, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "boolean exists()", native: ScratchFileClass.prototype._exists, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void delete()", native: ScratchFileClass.prototype._delete, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    _c1(_path: string) { desktopOnly("File", FILE_HINT); return this; }
    _read(): string { return desktopOnlyValue("File.read()", "", FILE_HINT); }
    _write(_content: string) { desktopOnly("File.write()", FILE_HINT); }
    _append(_content: string) { desktopOnly("File.append()", FILE_HINT); }
    _exists(): boolean { return desktopOnlyValue("File.exists()", false, FILE_HINT); }
    _delete() { desktopOnly("File.delete()", FILE_HINT); }
}

const TILED_HINT = "Tiled-Karten gibt es nur in der Desktop-Version. / Tiled maps are desktop only.";

/** One object out of a Tiled object layer. */
export class ScratchMapObjectClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class MapObject extends Object", comment: "Nur in der Desktop-Version: ein Objekt aus einer Tiled-Karte" },
        { type: "field", signature: "double height" },
        { type: "field", signature: "int id" },
        { type: "field", signature: "String name" },
        { type: "field", signature: "double rotation" },
        { type: "field", signature: "boolean visible" },
        { type: "field", signature: "double width" },
        { type: "field", signature: "String type" },
        { type: "field", signature: "double x" },
        { type: "field", signature: "double y" },
        { type: "method", signature: "int getPropertyInt(string name)", native: ScratchMapObjectClass.prototype._getPropertyInt, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "string getProperty(string name)", native: ScratchMapObjectClass.prototype._getProperty, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "float getPropertyFloat(string name)", native: ScratchMapObjectClass.prototype._getPropertyFloat, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "boolean getPropertyBoolean(string name)", native: ScratchMapObjectClass.prototype._getPropertyBoolean, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    _getPropertyInt(): number { return desktopOnlyValue("MapObject.getPropertyInt()", 0, TILED_HINT); }
    _getProperty(): string { return desktopOnlyValue("MapObject.getProperty()", "", TILED_HINT); }
    _getPropertyFloat(): number { return desktopOnlyValue("MapObject.getPropertyFloat()", 0, TILED_HINT); }
    _getPropertyBoolean(): boolean { return desktopOnlyValue("MapObject.getPropertyBoolean()", false, TILED_HINT); }
}

/** A map made with the Tiled editor. Loading one needs the file system. */
export class ScratchTiledMapClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class TiledMap extends Object", comment: "Nur in der Desktop-Version: eine mit Tiled erstellte Karte" },
        { type: "method", signature: "TiledMap(string path, Stage stage)", native: ScratchTiledMapClass.prototype._c2, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "MapObject[] getObjectsFromLayer(string name)", native: ScratchTiledMapClass.prototype._getObjectsFromLayer, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void stampLayerToForeground(string name)", native: ScratchTiledMapClass.prototype._stampLayerToForeground, comment: "Nur in der Desktop-Version" },
        { type: "method", signature: "void stampLayerToBackground(string name)", native: ScratchTiledMapClass.prototype._stampLayerToBackground, comment: "Nur in der Desktop-Version" },
    ];
    static type: NonPrimitiveType;

    _c2(_path: string, _stage: ObjectClass) { desktopOnly("TiledMap", TILED_HINT); return this; }
    _getObjectsFromLayer(): ScratchMapObjectClass[] { return desktopOnlyValue("TiledMap.getObjectsFromLayer()", [], TILED_HINT); }
    _stampLayerToForeground() { desktopOnly("TiledMap.stampLayerToForeground()", TILED_HINT); }
    _stampLayerToBackground() { desktopOnly("TiledMap.stampLayerToBackground()", TILED_HINT); }
}

/** A key/value pair attached to a Tiled object. */
export class ScratchPropertyClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Property extends Object", comment: "Nur in der Desktop-Version: Eigenschaft eines Tiled-Objekts" },
        { type: "field", signature: "String name" },
        { type: "field", signature: "String type" },
        { type: "field", signature: "String value" },
    ];
    static type: NonPrimitiveType;
}

/** The image a Tiled tileset refers to. */
export class ScratchTilesetImageClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class TilesetImage extends Object", comment: "Nur in der Desktop-Version: Bild eines Tiled-Tilesets" },
        { type: "field", signature: "String source" },
        { type: "field", signature: "int width" },
        { type: "field", signature: "int height" },
    ];
    static type: NonPrimitiveType;
}
