import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchShapeClass } from "./ScratchShapeClasses";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";
import { SRC } from "./ScratchLibraryComments";

/**
 * The parts of Scratch for Java that a browser cannot provide: GIF recording
 * and the file system.
 *
 * They are declared so that a program written against the desktop library still
 * compiles and runs here. Every method prints a one-time notice (see
 * ScratchUnsupported.ts) and then does nothing, so the rest of the program is
 * unaffected.
 */

const RECORDER_HINT = "Aufnahmen gibt es nur in der Desktop-Version. / Recording is desktop only.";

/** 7.0 keeps only GifRecorder; Recorder, FFmpegRecorder and FrameRecorder are gone. */
export class ScratchGifRecorderClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.recorder", signature: "class GifRecorder extends Object", comment: SRC.gifRecorderClassComment },
        { type: "method", signature: "GifRecorder(string path)", native: ScratchGifRecorderClass.prototype._c1, comment: SRC.gifRecorderConstructorComment },
        { type: "method", signature: "void start()", native: ScratchGifRecorderClass.prototype._start, comment: SRC.recorderStartComment },
        { type: "method", signature: "void stop()", native: ScratchGifRecorderClass.prototype._stop, comment: SRC.recorderStopComment },
        { type: "method", signature: "void snapshot()", native: ScratchGifRecorderClass.prototype._snapshot, comment: SRC.gifRecorderSnapshotComment },
    ];
    static type: NonPrimitiveType;

    _c1(_path: string) { desktopOnly("GifRecorder", RECORDER_HINT); return this; }
    _start() { desktopOnly("GifRecorder.start()", RECORDER_HINT); }
    _stop() { desktopOnly("GifRecorder.stop()", RECORDER_HINT); }
    _snapshot() { desktopOnly("GifRecorder.snapshot()", RECORDER_HINT); }
}

const FILE_HINT = "Auf Dateien kann im Browser nicht zugegriffen werden. / Files are not accessible in the browser.";

/** org.openpatch.scratch.save.File (7.0 members; desktop only in the browser) */
export class ScratchFileClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.save", signature: "class File extends Object", comment: SRC.fileClassComment },
        { type: "method", signature: "File()", native: ScratchFileClass.prototype._c0, comment: SRC.fileConstructorComment },
        { type: "method", signature: "static void save(string path, Object value)", native: ScratchFileClass._save, comment: SRC.fileSaveComment },
        { type: "method", signature: "static Object load(string path, Class type)", native: ScratchFileClass._load, comment: SRC.fileLoadComment },
        { type: "method", signature: "static Object loadOrCreate(string path, Class type)", native: ScratchFileClass._loadOrCreate, comment: SRC.fileLoadOrCreateComment },
    ];
    static type: NonPrimitiveType;

    _c0() { desktopOnly("File", FILE_HINT); return this; }
    static _save(_path: string, _value: any) { desktopOnly("File.save()", FILE_HINT); }
    static _load(_path: string, _type: any): any { return desktopOnlyValue("File.load()", null, FILE_HINT); }
    static _loadOrCreate(_path: string, _type: any): any { return desktopOnlyValue("File.loadOrCreate()", null, FILE_HINT); }
}

/** One object out of a Tiled object layer. */
export class ScratchMapObjectClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.tiled", signature: "class MapObject extends Object", comment: SRC.mapObjectClassComment },
        // upstream's data classes are made by its TMX reader, and have the default constructor
        { type: "method", signature: "MapObject()", native: ScratchMapObjectClass.prototype._c0 },
        { type: "method", signature: "Shape getShape()", native: ScratchMapObjectClass.prototype._getShape },
        { type: "field", signature: "double height" },
        { type: "field", signature: "int id" },
        { type: "field", signature: "string name" },
        { type: "field", signature: "double rotation" },
        { type: "field", signature: "boolean visible" },
        { type: "field", signature: "double width" },
        { type: "field", signature: "string type" },
        { type: "field", signature: "double x" },
        { type: "field", signature: "double y" },
        { type: "method", signature: "int getPropertyInt(string name)", native: ScratchMapObjectClass.prototype._getPropertyInt, comment: SRC.mapObjectGetPropertyIntComment },
        { type: "method", signature: "string getProperty(string name)", native: ScratchMapObjectClass.prototype._getProperty, comment: SRC.mapObjectGetPropertyComment },
        { type: "method", signature: "float getPropertyFloat(string name)", native: ScratchMapObjectClass.prototype._getPropertyFloat, comment: SRC.mapObjectGetPropertyFloatComment },
        { type: "method", signature: "boolean getPropertyBoolean(string name)", native: ScratchMapObjectClass.prototype._getPropertyBoolean, comment: SRC.mapObjectGetPropertyBooleanComment },
        { type: "method", signature: "void setClassName(string name)", native: ScratchMapObjectClass.prototype._setClassName, comment: SRC.mapObjectSetClassNameComment },
        { type: "field", signature: "boolean ellipse" },
        { type: "field", signature: "boolean point" },
        { type: "field", signature: "Property[] properties" },
    ];
    static type: NonPrimitiveType;

    id = 0; name = ""; type = ""; x = 0; y = 0; width = 0; height = 0; rotation = 0; visible = true;
    customProperties = new Map<string, string>();
    shape = ScratchShapeClass.of([]);
    isPoint = false;
    isPolygon = false;
    _getProperty(name: string): string {
        const value = this.customProperties.get(name);
        if (value === undefined) throw new RuntimeExceptionClass(`Property '${name}' does not exist on map object '${this.name}'.`);
        return value;
    }
    _getPropertyInt(name: string): number {
        const value = this._getProperty(name);
        if (!/^[+-]?\d+$/.test(value) || Number(value) < -2147483648 || Number(value) > 2147483647) throw new RuntimeExceptionClass(`Not an integer: '${value}'`);
        return Number(value);
    }
    _getPropertyFloat(name: string): number {
        const value = this._getProperty(name), result = Number(value);
        if (Number.isNaN(result) && value !== "NaN") throw new RuntimeExceptionClass(`Not a number: '${value}'`);
        return Math.fround(result);
    }
    _getPropertyBoolean(name: string): boolean { return this._getProperty(name).toLowerCase() === "true"; }
    _getShape(): ScratchShapeClass { return ScratchShapeClass.of(this.shape.points.map(point => ({ ...point }))); }
    _setClassName(name: string) { (this as any).className = name; }
    _c0() { return this; }

}

/** A key/value pair attached to a Tiled object. */
export class ScratchPropertyClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.tiled", signature: "class Property extends Object", comment: SRC.propertyClassComment },
        { type: "method", signature: "Property()", native: ScratchPropertyClass.prototype._c0 },
        { type: "method", signature: "void setText(String text)", native: ScratchPropertyClass.prototype._setText, comment: SRC.propertySetTextComment },
        { type: "field", signature: "String name" },
        { type: "field", signature: "String type" },
        { type: "field", signature: "String value" },
        { type: "field", signature: "Property[] properties" },
    ];
    static type: NonPrimitiveType;
    _setText(text: string) { (this as any).text = text; }
    _c0() { return this; }
}

/** The image a Tiled tileset refers to. */
export class ScratchTilesetImageClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.tiled", signature: "class TilesetImage extends Object", comment: SRC.tilesetImageClassComment },
        { type: "field", signature: "String source" },
        { type: "field", signature: "int width" },
        { type: "field", signature: "int height" },
        { type: "method", signature: "TilesetImage()", native: ScratchTilesetImageClass.prototype._c0 },
    ];
    static type: NonPrimitiveType;
    _c0() { return this; }
}
