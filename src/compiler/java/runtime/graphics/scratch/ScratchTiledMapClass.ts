import * as PIXI from "pixi.js";
import { inflate } from "pako";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { resolveAssetUrl } from "./ScratchAssetUrls";
import { ScratchCostumes } from "./ScratchCostumes";
import { LayerEnum } from "./LayerEnum";
import { ScratchMapObjectClass } from "./ScratchDesktopOnlyClasses";
import { ScratchShapeClass } from "./ScratchShapeClasses";
import type { ScratchStageClass } from "./ScratchStageClass";
import { ScratchWorkspaceAssets } from "./ScratchWorkspaceAssets";
import { JavaClass } from "../../../types/JavaClass";
import { ArrayListClass } from "../../system/collections/ArrayListClass";
import { ClassClass } from "../../system/ClassClass";
import { ScratchSpriteClass } from "./ScratchSpriteClass";
import { ScratchTiledStamp, tiledTexture } from "./ScratchTiledRendering";
import { SRC } from "./ScratchLibraryComments";

const children = (element: Element, tag: string) => Array.from(element.children).filter(child => child.tagName === tag);
const child = (element: Element, tag: string) => children(element, tag)[0];
const number = (element: Element, key: string) => Number(element.getAttribute(key) ?? 0);
// Match desktop TiledMap.GID_MASK: even orthogonal maps can retain bit 29.
const GID_MASK = 0x0fffffff;

/** Resolve TSX and image paths relative to the file that names them. */
export function tiledPath(file: string, relative: string): string {
    if (/^(?:https?:|data:)/.test(relative)) return relative;
    if (/^https?:/.test(file)) return new URL(relative, file).href;
    const parts: string[] = [];
    const joined = relative.startsWith("/") ? relative : file.slice(0, file.lastIndexOf("/") + 1) + relative;
    for (const part of joined.split("/")) {
        if (part === "..") parts.pop();
        else if (part && part !== ".") parts.push(part);
    }
    return (file.startsWith("/") || relative.startsWith("/") ? "/" : "") + parts.join("/");
}

function properties(element: Element): Map<string, string> {
    const group = child(element, "properties");
    return new Map(group ? children(group, "property").map(property => [property.getAttribute("name") ?? "",
        property.getAttribute("value") ?? property.textContent ?? ""]) : []);
}

export function tiledObject(element: Element): ScratchMapObjectClass {
    const object = new ScratchMapObjectClass();
    Object.assign(object, {
        id: number(element, "id"), x: number(element, "x"), y: number(element, "y"),
        width: number(element, "width"), height: number(element, "height"), rotation: number(element, "rotation"),
        visible: element.getAttribute("visible") !== "0", name: element.getAttribute("name") ?? "",
        type: element.getAttribute("type") || element.getAttribute("class") || "", customProperties: properties(element),
        isPoint: !!child(element, "point"), isPolygon: !!child(element, "polygon"),
    });
    const polygon = child(element, "polygon") ?? child(element, "polyline");
    if (polygon) {
        object.shape = ScratchShapeClass.of((polygon.getAttribute("points") ?? "").trim().split(/\s+/).filter(Boolean).map(pair => {
            const [x, y] = pair.split(",").map(Number); return { x, y };
        }));
    } else if (child(element, "ellipse")) {
        object.shape = ScratchShapeClass.of(ScratchShapeClass.ellipsePoints(0, 0, object.width, object.height));
    } else {
        const w = child(element, "point") ? 1 : object.width, h = child(element, "point") ? 1 : object.height;
        object.shape = ScratchShapeClass.of([{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }]);
    }
    return object;
}

type Tile = { width: number, height: number, image: string, x: number, y: number, collisions: ScratchMapObjectClass[] };
type TileLayer = { width: number, height: number, data: number[], paths?: string[], stamps?: ScratchTiledStamp[] };

/** Finite orthogonal TMX maps, supplied as workspace assets or fetched by URL. */
export class ScratchTiledMapClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.tiled", signature: "class TiledMap extends Object" },
        { type: "method", signature: "TiledMap(string path)", java: ScratchTiledMapClass.prototype._cj$_constructor_$TiledMap$string },
        { type: "method", signature: "TiledMap(string path, Stage stage)", java: ScratchTiledMapClass.prototype._cj$_constructor_$TiledMap$string$Stage },
        { type: "method", signature: "int getWidth()", native: ScratchTiledMapClass.prototype._getWidth },
        { type: "method", signature: "int getHeight()", native: ScratchTiledMapClass.prototype._getHeight },
        { type: "method", signature: "int getTileWidth()", native: ScratchTiledMapClass.prototype._getTileWidth },
        { type: "method", signature: "int getTileHeight()", native: ScratchTiledMapClass.prototype._getTileHeight },
        { type: "method", signature: "string getProperty(string name)", native: ScratchTiledMapClass.prototype._getProperty },
        { type: "method", signature: "string getProperty(string name, string defaultValue)", native: ScratchTiledMapClass.prototype._getPropertyDefault },
        { type: "method", signature: "int getPropertyInt(string name)", native: ScratchTiledMapClass.prototype._getPropertyInt },
        { type: "method", signature: "float getPropertyFloat(string name)", native: ScratchTiledMapClass.prototype._getPropertyFloat },
        { type: "method", signature: "boolean getPropertyBoolean(string name)", native: ScratchTiledMapClass.prototype._getPropertyBoolean },
        { type: "method", signature: "int getTileId(string layerName, int column, int row)", native: ScratchTiledMapClass.prototype._getTileId },
        { type: "method", signature: "Shape[] getTileCollisionShapes(int tileId)", native: ScratchTiledMapClass.prototype._getTileCollisionShapes },
        { type: "method", signature: "Shape[] getTileCollisionShapes(string layerName, int column, int row)", native: ScratchTiledMapClass.prototype._getCellCollisionShapes },
        { type: "method", signature: "MapObject[] getObjectsFromLayer(string name)", native: ScratchTiledMapClass.prototype._getObjectsFromLayer },
        { type: "method", signature: "java.util.List<Sprite> spawn(string layerName, Class<? extends Sprite>... types)", java: ScratchTiledMapClass.prototype._mj$spawn$List$string$Class_I },
        { type: "method", signature: "void showLayer(string name, Layer layer)", java: ScratchTiledMapClass.prototype._mj$showLayer$void$string$Layer, comment: SRC.tiledShowLayerComment },
        { type: "method", signature: "void hideLayer(string name)", native: ScratchTiledMapClass.prototype._hideLayer, comment: SRC.tiledHideLayerComment },
    ];
    static type: NonPrimitiveType;
    private width = 0;
    private height = 0;
    private tileWidth = 0;
    private tileHeight = 0;
    private customProperties = new Map<string, string>();
    private layers = new Map<string, TileLayer>();
    private objects = new Map<string, ScratchMapObjectClass[]>();
    private tiles = new Map<number, Tile>();
    private stage?: ScratchStageClass;

    _cj$_constructor_$TiledMap$string(t: Thread, callback: CallbackParameter, path: string) {
        this._cj$_constructor_$TiledMap$string$Stage(t, callback, path, undefined);
    }
    _cj$_constructor_$TiledMap$string$Stage(t: Thread, callback: CallbackParameter, path: string, stage?: ScratchStageClass) {
        this.stage = stage;
        const previous = t.state;
        t.state = ThreadState.waiting;
        (async () => {
            await ScratchWorkspaceAssets.ready();
            // A data-only map may be the first library object of the program.
            if (ScratchWorkspaceAssets.getText(path) === undefined) {
                const workspace = t.scheduler.interpreter.getMain?.()?.getCurrentWorkspace();
                if (workspace) await ScratchWorkspaceAssets.load(workspace);
            }
            await this.load(path);
        })().then(() => {
            t.state = previous; t.s.push(this); callback?.();
        }).catch(error => {
            t.state = previous;
            t.throwRuntimeExceptionOnLastExecutedStep(new RuntimeExceptionClass(`Cannot read Tiled map '${path}': ${error}`));
        });
    }
    private async xml(path: string): Promise<Element> {
        let text = ScratchWorkspaceAssets.getText(path);
        if (text === undefined) {
            const response = await fetch(resolveAssetUrl(path));
            if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
            text = await response.text();
        }
        const document = new DOMParser().parseFromString(text, "application/xml");
        if (document.querySelector("parsererror")) throw new Error(`Invalid XML in ${path}`);
        return document.documentElement;
    }
    async load(path: string) {
        const map = await this.xml(path);
        if (map.tagName !== "map") throw new Error("Expected a TMX map");
        const orientation = map.getAttribute("orientation");
        if (orientation && orientation !== "orthogonal") throw new Error("Scratch for Java draws orthogonal maps only.");
        if (map.getAttribute("infinite") === "1" || map.querySelector("chunk")) throw new Error("Infinite maps are not supported; use a finite map.");
        this.width = number(map, "width"); this.height = number(map, "height");
        this.tileWidth = number(map, "tilewidth"); this.tileHeight = number(map, "tileheight");
        this.customProperties = properties(map);
        this.layers.clear(); this.objects.clear(); this.tiles.clear();
        for (const entry of children(map, "tileset")) {
            const first = number(entry, "firstgid");
            const source = entry.getAttribute("source");
            const file = source ? tiledPath(path, source) : path;
            const tileset = source ? await this.xml(file) : entry;
            const image = child(tileset, "image");
            if (!image) throw new Error("Scratch for Java needs a tileset made from one image.");
            const width = number(tileset, "tilewidth"), height = number(tileset, "tileheight");
            const columns = Math.max(1, number(tileset, "columns"));
            const margin = number(tileset, "margin"), spacing = number(tileset, "spacing");
            for (let i = 0; i < number(tileset, "tilecount"); i++) {
                this.tiles.set(first + i, { width, height, image: tiledPath(file, image.getAttribute("source") ?? ""),
                    x: margin + (i % columns) * (width + spacing), y: margin + Math.floor(i / columns) * (height + spacing), collisions: [] });
            }
            for (const tile of children(tileset, "tile")) {
                const definition = this.tiles.get(first + number(tile, "id"));
                const group = child(tile, "objectgroup");
                if (definition && group) definition.collisions = children(group, "object").map(tiledObject);
            }
        }
        const collect = (element: Element) => {
            for (const node of Array.from(element.children)) {
                const name = node.getAttribute("name") ?? "";
                if (node.tagName === "group") collect(node);
                if (node.tagName === "objectgroup") this.objects.set(name, children(node, "object").map(tiledObject));
                if (node.tagName === "layer") {
                    const width = number(node, "width"), height = number(node, "height");
                    const data = child(node, "data");
                    if (!data) throw new Error(`Missing data in layer '${name}'`);
                    let ids: number[];
                    const encoding = data.getAttribute("encoding");
                    if (encoding === "csv") ids = (data.textContent ?? "").trim().split(/\s*,\s*/).filter(Boolean).map(Number);
                    else if (encoding === "base64") {
                        let bytes = Uint8Array.from(atob((data.textContent ?? "").replace(/\s/g, "")), c => c.charCodeAt(0));
                        const compression = data.getAttribute("compression");
                        if (compression === "gzip" || compression === "zlib") bytes = inflate(bytes);
                        else if (compression) throw new Error(`Unsupported Tiled compression '${compression}'`);
                        if (bytes.length % 4) throw new Error(`Invalid base64 tile data in '${name}'`);
                        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                        ids = Array.from({ length: bytes.length / 4 }, (_, i) => view.getUint32(i * 4, true));
                    } else if (!encoding) ids = children(data, "tile").map(tile => number(tile, "gid"));
                    else throw new Error(`Unsupported Tiled encoding '${encoding}'`);
                    if (ids.length !== width * height || ids.some(id => !Number.isInteger(id) || id < 0 || id > 0xffffffff)) {
                        throw new Error(`Invalid tile count or ID in layer '${name}'`);
                    }
                    this.layers.set(name, { width, height, data: ids });
                }
            }
        };
        collect(map);
    }
    _getWidth() { return this.width; }
    _getHeight() { return this.height; }
    _getTileWidth() { return this.tileWidth; }
    _getTileHeight() { return this.tileHeight; }
    _getProperty(name: string): string {
        const value = this.customProperties.get(name);
        if (value === undefined) throw new RuntimeExceptionClass(`Map property '${name}' does not exist.`);
        return value;
    }
    _getPropertyDefault(name: string, fallback: string): string { return this.customProperties.get(name) ?? fallback; }
    _getPropertyInt(name: string): number {
        const value = this._getProperty(name);
        if (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < -2147483648 || Number(value) > 2147483647) {
            throw new RuntimeExceptionClass(`Not an integer: '${value}'`);
        }
        return Number(value);
    }
    _getPropertyFloat(name: string): number {
        const value = this._getProperty(name), result = Number(value);
        if (Number.isNaN(result) && value !== "NaN") throw new RuntimeExceptionClass(`Not a number: '${value}'`);
        return Math.fround(result);
    }
    _getPropertyBoolean(name: string): boolean { return this._getProperty(name).toLowerCase() === "true"; }
    private layer(name: string): TileLayer {
        const layer = this.layers.get(name);
        if (!layer) throw new RuntimeExceptionClass(`The map has no tile layer '${name}'. Tile layers: ${[...this.layers.keys()].join(", ")}`);
        return layer;
    }
    private raw(name: string, column: number, row: number): number {
        const layer = this.layer(name);
        return column < 0 || row < 0 || column >= layer.width || row >= layer.height ? 0 : layer.data[row * layer.width + column];
    }
    _getTileId(name: string, column: number, row: number): number { return this.raw(name, column, row) & GID_MASK; }
    _getTileCollisionShapes(id: number): ScratchShapeClass[] {
        return (this.tiles.get(id)?.collisions ?? []).map(object => object._getShape()._rotate(object.rotation, 0, 0)._translate(object.x, object.y)._scale(1, -1));
    }
    _getCellCollisionShapes(name: string, column: number, row: number): ScratchShapeClass[] {
        const raw = this.raw(name, column, row), id = raw & GID_MASK;
        const tile = this.tiles.get(id);
        if (!tile) return [];
        return this._getTileCollisionShapes(id).map(shape => {
            shape = shape._scale(1, -1)._translate(-tile.width / 2, -tile.height / 2);
            if (raw & 0x20000000) shape = shape._scale(1, -1)._rotate(90, 0, 0);
            return shape._scale(raw & 0x80000000 ? -1 : 1, raw & 0x40000000 ? -1 : 1)
                ._translate(column * this.tileWidth + tile.width / 2, row * this.tileHeight + tile.height / 2)._scale(1, -1);
        });
    }
    _getObjectsFromLayer(name: string): ScratchMapObjectClass[] | null {
        return this.objects.get(name)?.map(source => {
            const copy = Object.assign(new ScratchMapObjectClass(), source);
            copy.y = -source.y; copy.shape = source._getShape();
            copy.customProperties = new Map(source.customProperties);
            return copy;
        }) ?? null;
    }

    /** The one of the given classes an object's type names, by its simple or its full name. */
    private spriteClass(name: string, types: ClassClass[]): JavaClass | undefined {
        if (!name?.trim()) return undefined;
        for (const c of types) {
            const type = c?.type;
            if (!(type instanceof JavaClass) || !type.runtimeClass
                || (type.runtimeClass !== ScratchSpriteClass && !(type.runtimeClass.prototype instanceof ScratchSpriteClass))) continue;
            if (type.identifier === name || type.getAbsoluteName() === name) return type;
        }
        return undefined;
    }

    _mj$spawn$List$string$Class_I(t: Thread, callback: CallbackParameter, name: string, types: ClassClass[]) {
        const stage = this.stage;
        if (!stage) throw new RuntimeExceptionClass("This map has no stage. Use new TiledMap(path, stage) to stamp or spawn.");
        if (!types?.length) throw new RuntimeExceptionClass(
            `Name the sprite classes to make, for example map.spawn("${name}", Player.class, Wall.class).`);
        const objects = this._getObjectsFromLayer(name);
        if (!objects) throw new RuntimeExceptionClass(`The map has no object layer '${name}'.`);
        const made: ScratchSpriteClass[] = [];
        let index = 0;
        const next = () => {
            while (index < objects.length) {
                const object = objects[index++];
                const type = this.spriteClass(object.type, types);
                if (!type) continue;
                const constructors = type.getOwnMethods().filter(method => method.isConstructor && !method.hasOuterClassParameter);
                const constructor = constructors.find(method => method.parameters.length === 1
                    && method.parameters[0].type.getAbsoluteName() === 'org.openpatch.scratch.tiled.MapObject')
                    ?? constructors.find(method => method.parameters.length === 2 && method.parameters.every(p => p.type.identifier === 'double'))
                    ?? constructors.find(method => method.parameters.length === 0);
                if (!constructor || type.isAbstract()) throw new RuntimeExceptionClass(
                    `Cannot spawn map object ${object.id} as ${type.identifier}. Use a concrete Sprite with a constructor (MapObject object), (double x, double y) or ().`);
                const sprite = new type.runtimeClass!() as ScratchSpriteClass;
                const args = constructor.parameters.length === 1 ? [object] : constructor.parameters.length === 2 ? [object.x, object.y] : [];
                let finished = false, synchronous = true;
                const constructed = () => {
                    sprite._setPosition(object.x, object.y);
                    if ((!object.isPoint && object.width > 0 && object.height > 0) || object.isPolygon) sprite._setHitboxShape(object._getShape());
                    stage._mj$add$void$Sprite(t, () => {
                        made.push(sprite);
                        finished = true;
                        if (!synchronous) next();
                    }, sprite);
                };
                if (constructor.hasImplementationWithNativeCallingConvention) {
                    sprite[constructor.getInternalName('native')](...args);
                    constructed();
                } else {
                    sprite[constructor.getInternalName('java')](t, () => { t.s.pop(); constructed(); }, ...args);
                }
                synchronous = false;
                if (!finished) return;
            }
            // TiledMap's return type stays java.util.List in the desktop NRW variant too.
            t.s.push(new ArrayListClass(made));
            callback?.();
        };
        next();
    }
    /** The stamp containers the 7.0 layers map onto (MAIN shares the background pass here). */
    private static containerOf(layer: LayerEnum): "backgroundStamps" | "foregroundStamps" | "uiStamps" {
        return layer?.name === "FOREGROUND" ? "foregroundStamps"
            : layer?.name === "UI" ? "uiStamps" : "backgroundStamps";
    }

    /** The layers showLayer() is currently drawing, by their stamp container. */
    private shownLayers = new Map<string, "backgroundStamps" | "foregroundStamps" | "uiStamps">();
    private redrawTicker?: () => void;

    /**
     * 7.0's showLayer draws the map layer every frame. The browser stamps it
     * once onto the layer's canvas; eraseAll() detaches that snapshot (it owns
     * nothing), and this loop puts it back on the next frame, so a shown layer
     * survives an eraseAll exactly as the desktop's per-frame drawing does.
     */
    _mj$showLayer$void$string$Layer(t: Thread, callback: CallbackParameter, name: string, layer: LayerEnum) {
        const container = ScratchTiledMapClass.containerOf(layer);
        this.shownLayers.set(name, container);
        this.ensureRedrawTicker();
        this.stamp(t, callback, name, container);
    }

    _hideLayer(name: string) {
        this.shownLayers.delete(name);
        for (const stamp of this.layer(name).stamps ?? []) {
            if (stamp.parent) stamp.parent.removeChild(stamp);
        }
    }

    private ensureRedrawTicker() {
        if (this.redrawTicker || !this.stage?.world?.app?.ticker) return;
        this.redrawTicker = () => {
            const stage = this.stage;
            if (!stage || !stage.scratchLayers) { this.stopRedrawTicker(); return; }
            for (const [name, container] of this.shownLayers) {
                const target = stage.scratchLayers[container];
                for (const stamp of this.layer(name).stamps ?? []) {
                    if (!stamp.destroyed && !stamp.parent) target?.addChild(stamp);
                }
            }
        };
        this.stage.world.app.ticker.add(this.redrawTicker);
    }

    private stopRedrawTicker() {
        if (this.redrawTicker) this.stage?.world?.app?.ticker?.remove(this.redrawTicker);
        this.redrawTicker = undefined;
    }

    private stamp(t: Thread, callback: CallbackParameter, name: string, container: "backgroundStamps" | "foregroundStamps" | "uiStamps") {
        const stage = this.stage;
        if (!stage) throw new RuntimeExceptionClass("This map has no stage. Use new TiledMap(path, stage) to stamp or spawn.");
        const layer = this.layer(name);
        const paths = layer.paths ??= [...new Set(layer.data.map(raw => this.tiles.get(raw & GID_MASK)?.image)
            .filter((p): p is string => !!p))];
        ScratchCostumes.whenLoaded(t, paths, callback, () => {
            const stamps = layer.stamps ??= [];
            const reusable = stamps.find(stamp => !stamp.parent && !stamp.destroyed);
            const target = stage.scratchLayers[container];
            if (reusable) {
                target.addChild(reusable);
                return;
            }
            const stamp = new ScratchTiledStamp();
            for (let i = 0; i < layer.data.length; i++) {
                const raw = layer.data[i], tile = this.tiles.get(raw & GID_MASK);
                if (!tile) continue;
                const image = ScratchCostumes.getTexture(tile.image)!;
                const texture = tiledTexture(image, tile.x, tile.y, tile.width, tile.height);
                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                const horizontal = raw & 0x80000000 ? -1 : 1, vertical = raw & 0x40000000 ? -1 : 1;
                const diagonal = !!(raw & 0x20000000);
                const sx = (tile.width + 1) / tile.width, sy = (tile.height + 1) / tile.height;
                sprite.setFromMatrix(new PIXI.Matrix(diagonal ? 0 : horizontal * sx, diagonal ? vertical * sx : 0,
                    diagonal ? horizontal * sy : 0, diagonal ? 0 : vertical * sy,
                    stage.world.width / 2 + (i % layer.width) * this.tileWidth + tile.width / 2,
                    stage.world.height / 2 + Math.floor(i / layer.width) * this.tileHeight + tile.height / 2));
                stamp.addChild(sprite);
            }
            stamps.push(stamp);
            target.addChild(stamp);
        });
    }
    _mj$stampLayerToForeground$void$string(t: Thread, callback: CallbackParameter, name: string) { this.stamp(t, callback, name, "foregroundStamps"); }
    _mj$stampLayerToBackground$void$string(t: Thread, callback: CallbackParameter, name: string) { this.stamp(t, callback, name, "backgroundStamps"); }
}
