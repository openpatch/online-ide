import * as PIXI from 'pixi.js';
import { Interpreter } from "../../../../common/interpreter/Interpreter";
import { KeyDownListener } from "../../../../common/interpreter/KeyboardManager";
import { SchedulerState } from "../../../../common/interpreter/SchedulerState";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";

/**
 * Runtime of the library "Zeichnen mit Java" (packages zeichnen, turtle and farbmanagment).
 *
 * On the desktop every Zeichenflaeche is a JFrame whose paint method asks each
 * of its objects to draw itself with an AWT Graphics. Here all Zeichenflaechen
 * share the one World canvas of the IDE, each owning a layer of it. A repaint
 * clears its layer and calls zeichneDich() of every object again, on a thread of
 * its own, because zeichneDich may be a method of the program.
 *
 * Without graphics (the unit tests) the layers record what would be drawn.
 */

export type RGB = { r: number, g: number, b: number };

/** One layer of the canvas: the drawing primitives of java.awt.Graphics. */
export class ZeichnenLayer {

    container?: PIXI.Container;
    graphics?: PIXI.Graphics;
    texts?: PIXI.Container;

    /** What has been drawn since the last clear, when there is no canvas. */
    recorded: string[] = [];

    constructor(world: any) {
        if (world?.app?.stage) {
            this.container = new PIXI.Container();
            this.graphics = new PIXI.Graphics();
            this.texts = new PIXI.Container();
            this.container.addChild(this.graphics, this.texts);
            world.app.stage.addChild(this.container);
        }
    }

    private record(op: string, color: RGB, ...values: (number | string)[]) {
        if (this.graphics) return;
        this.recorded.push(`${op} ${values.join(" ")} ${toHex(color)}`.replace("  ", " "));
    }

    clear(background?: RGB, width: number = 0, height: number = 0) {
        this.recorded = [];
        if (this.graphics) {
            this.graphics.clear();
            for (let text of this.texts!.removeChildren()) text.destroy();
            if (background) this.graphics.rect(0, 0, width, height).fill(toInt(background));
        }
    }

    drawLine(x1: number, y1: number, x2: number, y2: number, color: RGB) {
        this.record("drawLine", color, x1, y1, x2, y2);
        if (!this.graphics) return;
        if (x1 == x2 && y1 == y2) {
            this.graphics.rect(x1, y1, 1, 1).fill(toInt(color));
            return;
        }
        this.graphics.moveTo(x1 + 0.5, y1 + 0.5).lineTo(x2 + 0.5, y2 + 0.5).stroke({ width: 1, color: toInt(color) });
    }

    drawRect(x: number, y: number, w: number, h: number, color: RGB) {
        this.record("drawRect", color, x, y, w, h);
        if (!this.graphics || w < 0 || h < 0) return;
        this.graphics.rect(x + 0.5, y + 0.5, w, h).stroke({ width: 1, color: toInt(color) });
    }

    fillRect(x: number, y: number, w: number, h: number, color: RGB) {
        this.record("fillRect", color, x, y, w, h);
        if (!this.graphics || w <= 0 || h <= 0) return;
        this.graphics.rect(x, y, w, h).fill(toInt(color));
    }

    drawOval(x: number, y: number, w: number, h: number, color: RGB) {
        this.record("drawOval", color, x, y, w, h);
        if (!this.graphics || w < 0 || h < 0) return;
        this.graphics.ellipse(x + w / 2 + 0.5, y + h / 2 + 0.5, w / 2, h / 2).stroke({ width: 1, color: toInt(color) });
    }

    fillOval(x: number, y: number, w: number, h: number, color: RGB) {
        this.record("fillOval", color, x, y, w, h);
        if (!this.graphics || w <= 0 || h <= 0) return;
        this.graphics.ellipse(x + w / 2, y + h / 2, w / 2, h / 2).fill(toInt(color));
    }

    drawPolyline(xs: number[], ys: number[], n: number, color: RGB, closed: boolean = false) {
        n = Math.min(n, xs.length, ys.length);
        this.record(closed ? "drawPolygon" : "drawPolyline", color, ...pointList(xs, ys, n));
        if (!this.graphics || n < 1) return;
        this.graphics.moveTo(xs[0] + 0.5, ys[0] + 0.5);
        for (let i = 1; i < n; i++) this.graphics.lineTo(xs[i] + 0.5, ys[i] + 0.5);
        if (closed) this.graphics.closePath();
        this.graphics.stroke({ width: 1, color: toInt(color) });
    }

    fillPolygon(xs: number[], ys: number[], n: number, color: RGB) {
        n = Math.min(n, xs.length, ys.length);
        this.record("fillPolygon", color, ...pointList(xs, ys, n));
        if (!this.graphics || n < 3) return;
        let points: number[] = [];
        for (let i = 0; i < n; i++) points.push(xs[i], ys[i]);
        this.graphics.poly(points, true).fill(toInt(color));
    }

    drawArc(x: number, y: number, w: number, h: number, startAngle: number, arcAngle: number, color: RGB, filled: boolean) {
        this.record(filled ? "fillArc" : "drawArc", color, x, y, w, h, startAngle, arcAngle);
        if (!this.graphics || w <= 0 || h <= 0 || arcAngle == 0) return;
        // AWT angles are counterclockwise, 0° pointing to 3 o'clock, on an ellipse
        let cx = x + w / 2, cy = y + h / 2;
        let steps = Math.max(4, Math.ceil(Math.abs(arcAngle) / 5));
        let points: number[] = filled ? [cx, cy] : [];
        for (let i = 0; i <= steps; i++) {
            let a = (startAngle + arcAngle * i / steps) / 180 * Math.PI;
            points.push(cx + Math.cos(a) * w / 2, cy - Math.sin(a) * h / 2);
        }
        if (filled) {
            this.graphics.poly(points, true).fill(toInt(color));
        } else {
            this.graphics.moveTo(points[0] + 0.5, points[1] + 0.5);
            for (let i = 2; i < points.length; i += 2) this.graphics.lineTo(points[i] + 0.5, points[i + 1] + 0.5);
            this.graphics.stroke({ width: 1, color: toInt(color) });
        }
    }

    drawString(text: string, x: number, y: number, color: RGB) {
        this.record("drawString", color, JSON.stringify(text), x, y);
        if (!this.texts) return;
        let pixiText = new PIXI.Text({ text: text, style: { fontFamily: 'Arial, sans-serif', fontSize: 12, fill: toInt(color) } });
        // AWT places the baseline at y
        pixiText.x = x;
        pixiText.y = y - 12;
        this.texts.addChild(pixiText);
    }

    destroy() {
        this.container?.destroy({ children: true });
        this.container = undefined;
        this.graphics = undefined;
        this.texts = undefined;
    }
}

function pointList(xs: number[], ys: number[], n: number): string[] {
    let list: string[] = [];
    for (let i = 0; i < n; i++) list.push(`(${xs[i]}|${ys[i]})`);
    return list;
}

export function toInt(c: RGB): number {
    return (c.r << 16) + (c.g << 8) + c.b;
}

function toHex(c: RGB): string {
    return "#" + toInt(c).toString(16).padStart(6, "0");
}

/** What the runtime needs of a Zeichenflaeche or Turtleflaeche. */
export interface ZeichnenSurface {
    width: number;
    height: number;
    layer?: ZeichnenLayer;
    /** clears the layer and draws all objects anew; may call methods of the program */
    paint(t: Thread, callback: () => void): void;
    /** true if an object on the surface draws itself with methods of the program */
    needsContinuousRepaint(): boolean;
    /** Timerflaeche: called with the interval of its timer */
    onTimer?(t: Thread, callback: () => void): void;
    /** Tastenflaeche: called with the character of a typed key */
    onKeyTyped?(t: Thread, callback: () => void, key: string): void;
}

/**
 * Calls the possibly asynchronous function for every item, one after the other.
 * Library methods call back synchronously, methods of the program after their
 * steps have run on the thread; the loop handles both without growing the stack.
 */
export function forEachInOrder<T>(items: T[], f: (item: T, next: () => void) => void, done: () => void) {
    let index = 0;
    let running = false;
    let calledBackSynchronously = false;
    const step = () => {
        if (running) {
            calledBackSynchronously = true;
            return;
        }
        running = true;
        while (index < items.length) {
            calledBackSynchronously = false;
            f(items[index++], step);
            if (!calledBackSynchronously) {
                running = false;
                return;     // continues when the program's method calls back
            }
        }
        running = false;
        done();
    };
    step();
}

export class ZeichnenRuntime {

    static readonly storeKey = "ZeichnenRuntime";

    surfaces: ZeichnenSurface[] = [];
    world?: any;
    private worldPending: (() => void)[] | undefined;

    dirty: boolean = false;
    private painting: boolean = false;
    private finalPaintDone: boolean = false;

    private timers: Map<ZeichnenSurface, { id: any, busy: boolean }> = new Map();
    private keyListener?: KeyDownListener;
    private tickerFunction?: () => void;
    private resetCallbacks: (() => void)[] = [];

    static get(interpreter: Interpreter): ZeichnenRuntime {
        let runtime = interpreter.retrieveObject(ZeichnenRuntime.storeKey) as ZeichnenRuntime;
        if (!runtime) {
            runtime = new ZeichnenRuntime(interpreter);
            interpreter.storeObject(ZeichnenRuntime.storeKey, runtime);
        }
        return runtime;
    }

    static of(t: Thread): ZeichnenRuntime {
        return ZeichnenRuntime.get(t.scheduler.interpreter);
    }

    constructor(public interpreter: Interpreter) {
        const onStop = () => {
            interpreter.eventManager.off(onStop);
            this.stopTimersAndListeners();
        };
        const onReset = () => {
            interpreter.eventManager.off(onReset);
            interpreter.eventManager.off(onStop);
            this.stopTimersAndListeners();
            for (let surface of this.surfaces) surface.layer?.destroy();
            this.surfaces = [];
            for (let cb of this.resetCallbacks) cb();
            this.resetCallbacks = [];
            interpreter.deleteObject(ZeichnenRuntime.storeKey);
        };
        interpreter.eventManager.on("stop", onStop);
        interpreter.eventManager.on("resetRuntime", onReset);
    }

    /** called when the program's runtime is thrown away */
    onReset(callback: () => void) {
        this.resetCallbacks.push(callback);
    }

    private stopTimersAndListeners() {
        for (let timer of this.timers.values()) clearInterval(timer.id);
        this.timers.clear();
        if (this.keyListener) {
            this.interpreter.keyboardManager?.removeKeyDownListener(this.keyListener);
            this.keyListener = undefined;
        }
        if (this.tickerFunction && this.world?.app?.ticker) {
            this.world.app.ticker.remove(this.tickerFunction);
        }
        this.tickerFunction = undefined;
    }

    hasGraphics(): boolean {
        return !!this.interpreter.graphicsManager?.graphicsDiv;
    }

    /**
     * Adds the surface and gives it a layer on the canvas; creates the World
     * first if there is none. Calls back once the layer is there.
     */
    addSurface(t: Thread, surface: ZeichnenSurface, callback: () => void) {
        this.surfaces.push(surface);
        this.ensureWorld(t, surface.width, surface.height, () => {
            surface.layer = new ZeichnenLayer(this.world);
            this.markDirty();
            callback();
        });
    }

    private ensureWorld(t: Thread, width: number, height: number, callback: () => void) {
        if (!this.hasGraphics()) {
            callback();
            return;
        }

        if (this.worldPending) {
            this.worldPending.push(callback);
            return;
        }

        let world = this.interpreter.retrieveObject("WorldClass");
        if (world && world.app) {
            this.useWorld(world);
            if (width > world.width || height > world.height) {
                world.changeResolution(this.interpreter, Math.max(width, world.width), Math.max(height, world.height));
            }
            callback();
            return;
        }

        this.worldPending = [callback];
        new t.classes["World"]()._cj$_constructor_$World$int$int(t, () => {
            let newWorld = t.s.pop();
            this.useWorld(newWorld);
            newWorld._setBackgroundColor?.(0xffffff);
            let pending = this.worldPending!;
            this.worldPending = undefined;
            for (let cb of pending) cb();
        }, width, height);
    }

    private useWorld(world: any) {
        if (this.world === world) return;
        this.world = world;
        this.tickerFunction = () => this.onTick();
        world.app?.ticker?.add(this.tickerFunction);
    }

    markDirty() {
        this.dirty = true;
        this.finalPaintDone = false;
    }

    private needsContinuousRepaint(): boolean {
        return this.surfaces.some(s => s.needsContinuousRepaint());
    }

    private onTick() {
        if (this.interpreter.scheduler.state != SchedulerState.running) return;
        if (this.painting) return;
        if (this.dirty || this.needsContinuousRepaint()) this.startPaintThread();
    }

    /**
     * Repaints every surface on a thread of its own. Returns true if the thread
     * still runs, i.e. a method of the program draws.
     */
    startPaintThread(): boolean {
        let t = this.interpreter.scheduler.createThread("Zeichenfläche: paint");
        this.painting = true;
        t.callbackAfterTerminated = () => { this.painting = false; };
        this.paintAll(t, () => { this.painting = false; });
        if (this.painting) {
            t.startIfNotEmptyOrDestroy();
            if (t.state == ThreadState.running) return true;
            this.painting = false;
            return false;
        }
        this.interpreter.scheduler.removeThread(t);
        return false;
    }

    paintAll(t: Thread, callback: () => void) {
        this.dirty = false;
        forEachInOrder(this.surfaces.slice(), (surface, next) => surface.paint(t, next), callback);
    }

    /**
     * Asked by the scheduler when no thread runs any more: a Timerflaeche keeps
     * the program alive like the Swing timer keeps the JVM alive, and what has
     * changed since the last repaint is painted once more before the end.
     */
    keepsProgramAlive(): boolean {
        if (this.timers.size > 0) return true;
        if (this.painting) return true;
        if (!this.finalPaintDone && (this.dirty || this.needsContinuousRepaint())) {
            this.finalPaintDone = true;
            return this.startPaintThread();
        }
        return false;
    }

    // ---- Timerflaeche ----

    startTimer(surface: ZeichnenSurface, milliseconds: number) {
        this.stopTimer(surface);
        let timer = { id: undefined as any, busy: false };
        timer.id = setInterval(() => {
            if (this.interpreter.scheduler.state != SchedulerState.running || timer.busy || !surface.onTimer) return;
            let t = this.interpreter.scheduler.createThread("Timerflaeche: agiere");
            timer.busy = true;
            t.callbackAfterTerminated = () => { timer.busy = false; };
            surface.onTimer(t, () => { timer.busy = false; });
            if (timer.busy) t.startIfNotEmptyOrDestroy();
            else this.interpreter.scheduler.removeThread(t);
        }, Math.max(1, milliseconds));
        this.timers.set(surface, timer);
    }

    stopTimer(surface: ZeichnenSurface) {
        let timer = this.timers.get(surface);
        if (timer) clearInterval(timer.id);
        this.timers.delete(surface);
    }

    // ---- Tastenflaeche ----

    listenToKeys() {
        if (this.keyListener || !this.interpreter.keyboardManager) return;
        this.keyListener = (key: string, _shift: boolean, ctrl: boolean, alt: boolean) => {
            let c = ZeichnenRuntime.keyChar(key, ctrl || alt);
            if (c === undefined) return;
            if (this.interpreter.scheduler.state != SchedulerState.running) return;
            let receivers = this.surfaces.filter(s => s.onKeyTyped);
            if (receivers.length == 0) return;
            let t = this.interpreter.scheduler.createThread("Tastenflaeche: keyTyped");
            let pending = true;
            forEachInOrder(receivers, (s, next) => s.onKeyTyped!(t, next, c!), () => { pending = false; });
            if (pending) t.startIfNotEmptyOrDestroy();
            else this.interpreter.scheduler.removeThread(t);
        };
        this.interpreter.keyboardManager.addKeyDownListener(this.keyListener);
    }

    /** The char AWT's keyTyped would report for the browser key, undefined for keys without one. */
    static keyChar(key: string, withCtrlOrAlt: boolean): string | undefined {
        if (withCtrlOrAlt) return undefined;
        if ([...key].length == 1) return key;
        switch (key) {
            case "Enter": return "\n";
            case "Tab": return "\t";
            case "Backspace": return "\b";
            case "Escape": return "\u001b";
            case "Delete": return "\u007f";
        }
        return undefined;
    }
}
