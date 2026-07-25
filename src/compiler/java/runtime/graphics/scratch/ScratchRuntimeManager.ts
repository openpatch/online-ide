import { Interpreter } from "../../../../common/interpreter/Interpreter";
import { KeyPressedListener, KeyUpListener } from "../../../../common/interpreter/KeyboardManager";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { StringClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { InternalMouseListener, MouseEventKind } from "../MouseManager2D";
import { KeyCodeEnum } from "./KeyCodeEnum";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { isScratchStageActive } from "./ScratchStages";

/**
 * Any Stage/Sprite can receive Scratch events. These are the interpreter-aware
 * (overridable) hook methods dispatched by ScratchRuntimeManager.
 */
export interface IScratchEventReceiver {
    _mj$whenIReceive$void$String?: (t: Thread, cb: any, message: StringClass) => void;
    _mj$whenBackdropSwitches$void$String?: (t: Thread, cb: any, name: StringClass) => void;
    _mj$whenKeyPressed$void$KeyCode?: (t: Thread, cb: any, key: KeyCodeEnum) => void;
    _mj$whenKeyReleased$void$KeyCode?: (t: Thread, cb: any, key: KeyCodeEnum) => void;
    _mj$whenClicked$void$?: (t: Thread, cb: any) => void;
    _mj$whenMouseClicked$void$MouseCode?: (t: Thread, cb: any, code: MouseCodeEnum) => void;
    _mj$whenMouseMoved$void$double$double?: (t: Thread, cb: any, x: number, y: number) => void;
    _mj$whenMouseWheelMoved$void$int?: (t: Thread, cb: any, steps: number) => void;
    _mj$whenAddedToStage$void$?: (t: Thread, cb: any) => void;
    _mj$whenRemovedFromStage$void$?: (t: Thread, cb: any) => void;
    _containsPoint?: (x: number, y: number) => boolean;
    /**
     * The stage this receiver belongs to, if any. Input only reaches the stage on
     * screen, and a broadcast only the sprites of the stage it was sent from —
     * upstream reaches both through the stage, so a stage waiting off screen and
     * everything on it hears nothing.
     */
    _scratchStage?: () => object | undefined;
}

type ListenerKind = "iReceive" | "keyPressed" | "keyReleased" | "clicked" | "mouseClicked" | "backdropSwitches" | "mouseMoved" | "mouseWheelMoved";

/**
 * Per-world dispatcher for Scratch events (broadcasts, keyboard, mouse clicks),
 * mirroring how GNGEventlistenerManager bridges browser events into interpreted
 * Java. Created by the Stage; sprites/stages register themselves via register().
 */
export class ScratchRuntimeManager implements InternalMouseListener {
    private lists: Record<ListenerKind, IScratchEventReceiver[]> = {
        iReceive: [], keyPressed: [], keyReleased: [], clicked: [], mouseClicked: [], backdropSwitches: [],
        mouseMoved: [], mouseWheelMoved: [],
    };

    private keyPressedListener: KeyPressedListener = (key) => this.onKeyPressed(key);
    private keyUpListener: KeyUpListener = (key) => this.onKeyReleased(key);

    lastMouseButton: number = 0;

    constructor(private interpreter: Interpreter, readonly world: IWorld) {
        const km = interpreter.keyboardManager;
        if (km) {
            km.addKeyPressedListener(this.keyPressedListener);
            km.addKeyUpListener(this.keyUpListener);
        }
        world.mouseManager.internalMouseListeners.push(this);

        // MouseManager2D has no wheel event, so listen on the canvas ourselves.
        const canvas = (world.app as any)?.canvas;
        if (canvas) canvas.addEventListener("wheel", this.wheelListener, { passive: true });
    }

    /**
     * `steps` follows Processing's MouseEvent.getCount(), which upstream passes
     * straight through: positive when the wheel is rolled down (toward the user).
     */
    private wheelListener = (e: WheelEvent) => {
        const list = this.lists.mouseWheelMoved.filter(o => this.receivesInput(o));
        if (list.length === 0 || e.deltaY === 0) return;
        const steps = e.deltaY > 0 ? 1 : -1;
        const t = this.interpreter.scheduler.createThread("scratch whenMouseWheelMoved");
        for (const obj of list) obj._mj$whenMouseWheelMoved$void$int!(t, undefined, steps);
        t.state = ThreadState.running;
    };

    /**
     * The dispatcher for a program run. The interpreter outlives a single run, so
     * a manager that still holds the previous run's world — and its listener
     * lists, full of sprites that no longer exist — is thrown away here.
     */
    static forInterpreter(interpreter: Interpreter, world: IWorld): ScratchRuntimeManager {
        let mgr = interpreter.retrieveObject("ScratchRuntimeManager") as ScratchRuntimeManager;
        if (mgr && mgr.world !== world) {
            mgr.destroy();
            mgr = undefined as any;
        }
        if (!mgr) {
            mgr = new ScratchRuntimeManager(interpreter, world);
            interpreter.storeObject("ScratchRuntimeManager", mgr);
        }
        return mgr;
    }

    /**
     * Keyboard and mouse events go to the stage on screen and to what is on it.
     * A receiver with no stage — a sprite that was built but never added — still
     * hears them, so that half-finished programs behave as they always did.
     */
    private receivesInput(obj: IScratchEventReceiver): boolean {
        const owner = obj._scratchStage?.();
        return owner === undefined || isScratchStageActive(owner as any);
    }

    /** A broadcast stays on the stage it was sent from. */
    private belongsTo(obj: IScratchEventReceiver, sender: object | undefined): boolean {
        if (sender === undefined) return true;
        const owner = obj._scratchStage?.();
        return owner === undefined || owner === sender;
    }

    /** Register an object for exactly the hooks it overrides. */
    register(obj: IScratchEventReceiver, overrides: Partial<Record<ListenerKind, boolean>>) {
        for (const kind of Object.keys(overrides) as ListenerKind[]) {
            if (overrides[kind] && this.lists[kind].indexOf(obj) < 0) this.lists[kind].push(obj);
        }
    }

    unregister(obj: IScratchEventReceiver) {
        for (const kind of Object.keys(this.lists) as ListenerKind[]) {
            const i = this.lists[kind].indexOf(obj);
            if (i >= 0) this.lists[kind].splice(i, 1);
        }
    }

    // ---- broadcasts ----
    /**
     * `message` may arrive as a raw JS string (internal callers) or already boxed
     * as a StringClass (when it came through a Java `String` parameter). Boxing a
     * StringClass again would yield a StringClass whose value is an object, which
     * prints as "[object Object]" — so normalise first.
     */
    broadcast(message: string | StringClass, sender?: object) {
        const list = this.lists.iReceive.filter(o => this.belongsTo(o, sender));
        if (list.length === 0) return;
        const t = this.interpreter.scheduler.createThread("scratch whenIReceive");
        const msg = message instanceof StringClass ? message : new StringClass(String(message));
        for (const obj of list) obj._mj$whenIReceive$void$String!(t, undefined, msg);
        t.state = ThreadState.running;
    }

    /** Notify every receiver on `sender` that overrides whenBackdropSwitches(String). */
    backdropSwitch(name: string, sender?: object) {
        const list = this.lists.backdropSwitches.filter(o => this.belongsTo(o, sender));
        if (list.length === 0) return;
        const t = this.interpreter.scheduler.createThread("scratch whenBackdropSwitches");
        const msg = new StringClass(name);
        for (const obj of list) obj._mj$whenBackdropSwitches$void$String!(t, undefined, msg);
        t.state = ThreadState.running;
    }

    // ---- keyboard ----
    /**
     * Several KeyCodes can share one browser key — a browser KeyboardEvent.key of
     * "arrowleft" matches both LEFT and KP_LEFT, "5" matches DIGIT_5 and NUMPAD_5.
     * Dispatching all of them would call whenKeyPressed twice for one keystroke, so
     * only the first (non-numpad) match in declaration order is delivered.
     */
    private keyCodeFor(browserKey: string): KeyCodeEnum | undefined {
        const k = browserKey.toLowerCase();
        return KeyCodeEnum.values.find(kc => kc.browserKeys.indexOf(k) >= 0);
    }

    onKeyPressed(browserKey: string) {
        const list = this.lists.keyPressed.filter(o => this.receivesInput(o));
        if (list.length === 0) return;
        const code = this.keyCodeFor(browserKey);
        if (!code) return;
        const t = this.interpreter.scheduler.createThread("scratch whenKeyPressed");
        for (const obj of list) obj._mj$whenKeyPressed$void$KeyCode!(t, undefined, code);
        t.state = ThreadState.running;
    }

    onKeyReleased(browserKey: string) {
        const list = this.lists.keyReleased.filter(o => this.receivesInput(o));
        if (list.length === 0) return;
        const code = this.keyCodeFor(browserKey);
        if (!code) return;
        const t = this.interpreter.scheduler.createThread("scratch whenKeyReleased");
        for (const obj of list) obj._mj$whenKeyReleased$void$KeyCode!(t, undefined, code);
        t.state = ThreadState.running;
    }

    // ---- mouse ----
    onMouseEvent(kind: MouseEventKind, x: number, y: number): void {
        if (kind === "mousemove") { this.fireMouseMoved(x, y); return; }
        if (kind !== "mouseup") return;
        const clicked = this.lists.clicked.filter(o => this.receivesInput(o));
        const mouseClicked = this.lists.mouseClicked.filter(o => this.receivesInput(o));
        if (clicked.length === 0 && mouseClicked.length === 0) return;

        const t = this.interpreter.scheduler.createThread("scratch click");
        const code = MouseCodeEnum.values.find(m => m.button === this.lastMouseButton) || MouseCodeEnum.values[0];
        for (const obj of mouseClicked) obj._mj$whenMouseClicked$void$MouseCode!(t, undefined, code);
        for (const obj of clicked) {
            if (!obj._containsPoint || obj._containsPoint(x, y)) obj._mj$whenClicked$void$!(t, undefined);
        }
        t.state = ThreadState.running;
    }

    /** whenMouseMoved receives Scratch coordinates (centre origin, y up). */
    private fireMouseMoved(screenX: number, screenY: number) {
        const list = this.lists.mouseMoved.filter(o => this.receivesInput(o));
        if (list.length === 0) return;
        const x = screenX - this.world.width / 2;
        const y = this.world.height / 2 - screenY;
        const t = this.interpreter.scheduler.createThread("scratch whenMouseMoved");
        for (const obj of list) obj._mj$whenMouseMoved$void$double$double!(t, undefined, x, y);
        t.state = ThreadState.running;
    }

    // NOTE: there is no fireAddedToStage here. Stage.add() calls the hook on the
    // caller's own thread so it finishes before add() returns, the way upstream
    // does it — running it on a separate thread meant the next line of the
    // program saw a sprite that had no costume yet.

    /**
     * Fire whenRemovedFromStage. Runs before the sprite is destroyed, so the
     * hook can still read the sprite's position and costume.
     */
    fireRemovedFromStage(obj: IScratchEventReceiver) {
        if (!obj._mj$whenRemovedFromStage$void$) return;
        const t = this.interpreter.scheduler.createThread("scratch whenRemovedFromStage");
        obj._mj$whenRemovedFromStage$void$(t, undefined);
        t.state = ThreadState.running;
    }

    destroy() {
        const km = this.interpreter.keyboardManager;
        if (km) {
            km.removeKeyPressedListener(this.keyPressedListener);
            km.removeKeyUpListener(this.keyUpListener);
        }
        const canvas = (this.world.app as any)?.canvas;
        if (canvas) canvas.removeEventListener("wheel", this.wheelListener);
    }
}
