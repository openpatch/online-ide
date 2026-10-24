import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { ScratchStageClass } from "./ScratchStageClass";
import { scratchStageTransitioning, setActiveScratchStage, transitionToScratchStage, TransitionKind } from "./ScratchStages";
import { currentScratchStage, desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";
import { isPixelArt, setPixelArt } from "./ScratchPixelArt";
import { SRC } from "./ScratchLibraryComments";
import { scratchBrowserVersion } from './ScratchCompatibility';
import { scratchGameClock } from './ScratchGameClock';
import { SupplierInterface } from './SupplierInterface';
import { Program } from '../../../../common/interpreter/Program';
import { ThreadState } from '../../../../common/interpreter/ThreadState';
import { NullPointerExceptionClass } from '../../system/javalang/NullPointerExceptionClass';

/**
 * The application window, mirroring org.openpatch.scratch.Window.
 *
 * In the browser the output panel owns the canvas, so a Window here is not a
 * real OS window — but it is still what decides how large the picture is, the
 * way upstream's constructors build the Applet. Everything about switching
 * stages works too: setStage() and transitionToStage() put another stage on
 * screen, and getStage() answers with the one showing.
 *
 * What genuinely has no browser equivalent — fullscreen, the splash logo and
 * texture sampling — reports itself through the desktop-only notice instead of
 * failing.
 */
export class ScratchWindowClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Window extends Object", comment: SRC.windowClassComment },

        { type: "method", signature: "Window()", java: ScratchWindowClass.prototype._cj$_constructor_$Window$, comment: SRC.windowConstructorComment },
        { type: "method", signature: "Window(string assets)", java: ScratchWindowClass.prototype._cj$_constructor_$Window$string, comment: SRC.windowConstructor2Comment },
        { type: "method", signature: "Window(int width, int height)", java: ScratchWindowClass.prototype._cj$_constructor_$Window$int$int, comment: SRC.windowConstructor3Comment },
        { type: "method", signature: "Window(int width, int height, string assets)", java: ScratchWindowClass.prototype._cj$_constructor_$Window$int$int$string, comment: SRC.windowConstructor4Comment },

        { type: "method", signature: "static Window getInstance()", native: ScratchWindowClass.getInstance, comment: SRC.windowGetInstanceComment },

        { type: "method", signature: "int getWidth()", native: ScratchWindowClass.prototype._getWidth, comment: SRC.windowGetWidthComment },
        { type: "method", signature: "int getHeight()", native: ScratchWindowClass.prototype._getHeight, comment: SRC.windowGetHeightComment },
        { type: "method", signature: "void pause()", native: ScratchWindowClass.prototype._pause },
        { type: "method", signature: "void resume()", native: ScratchWindowClass.prototype._resume },
        { type: "method", signature: "boolean isPaused()", native: ScratchWindowClass.prototype._isPaused },
        { type: "method", signature: "void step()", native: ScratchWindowClass.prototype._step },
        { type: "method", signature: "void setGameSpeed(double speed)", native: ScratchWindowClass.prototype._setGameSpeed },
        { type: "method", signature: "double getGameSpeed()", native: ScratchWindowClass.prototype._getGameSpeed },

        { type: "method", signature: "Stage getStage()", native: ScratchWindowClass.prototype._getStage, comment: SRC.windowGetStageComment },
        { type: "method", signature: "void setStage(Stage stage)", native: ScratchWindowClass.prototype._setStage, comment: SRC.windowSetStageComment },
        { type: "method", signature: "void transitionToStage(Stage stage, double seconds)", native: ScratchWindowClass.prototype._transitionToStage, comment: SRC.windowTransitionToStageComment },
        { type: "method", signature: "void transitionToStage(Supplier<? extends Stage> stage, double seconds)", java: ScratchWindowClass.prototype._transitionToStageSupplier, comment: SRC.windowTransitionToStageSupplierComment },
        { type: "method", signature: "void transitionToStage(Supplier<? extends Stage> stage, Transition transition, double seconds)", java: ScratchWindowClass.prototype._transitionToStageSupplierTransition, comment: SRC.windowTransitionToStageSupplierComment },
        { type: "method", signature: "boolean isTransitioning()", native: ScratchWindowClass.prototype._isTransitioning, comment: SRC.windowIsTransitioningComment },

        { type: "method", signature: "void setDebug(boolean debug)", native: ScratchWindowClass.prototype._setDebug, comment: SRC.windowSetDebugComment },
        { type: "method", signature: "boolean isDebug()", native: ScratchWindowClass.prototype._isDebug, comment: SRC.windowIsDebugComment },
        { type: "method", signature: "void debug(Object... values)", native: ScratchWindowClass.prototype._debug, comment: SRC.windowDebugComment },

        { type: "method", signature: "void exit()", native: ScratchWindowClass.prototype._exit, comment: SRC.windowExitComment },
        { type: "method", signature: "void whenExits()", java: ScratchWindowClass.prototype._mj$whenExits$void$, comment: SRC.windowWhenExitsComment },

        { type: "method", signature: "string getLibraryVersion()", native: ScratchWindowClass.prototype._getLibraryVersion, comment: SRC.windowGetLibraryVersionComment },
        { type: "method", signature: "string getLibraryTitle()", native: ScratchWindowClass.prototype._getLibraryTitle, comment: SRC.windowGetLibraryTitleComment },

        // desktop-only
        { type: "method", signature: "static void useFullScreen()", native: ScratchWindowClass.useFullScreen, comment: SRC.windowUseFullScreenComment },
        { type: "method", signature: "static void usePixelArt()", native: ScratchWindowClass.usePixelArt, comment: SRC.windowUsePixelArtComment },
        { type: "method", signature: "static boolean isPixelArt()", native: ScratchWindowClass.isPixelArtStatic, comment: SRC.windowIsPixelArtComment },
        { type: "method", signature: "static void useSmoothPixelArt()", native: ScratchWindowClass.useSmoothPixelArt, comment: SRC.windowUseSmoothPixelArtComment },
        { type: "method", signature: "static boolean isSmoothPixelArt()", native: ScratchWindowClass.isSmoothPixelArtStatic, comment: SRC.windowIsSmoothPixelArtComment },
        { type: "method", signature: "static void useFrameSmoothing(double seconds)", native: ScratchWindowClass.useFrameSmoothing, comment: SRC.windowUseFrameSmoothingComment },
        { type: "method", signature: "static double getFrameSmoothing()", native: ScratchWindowClass.getFrameSmoothing, comment: SRC.windowGetFrameSmoothingComment },
        { type: "method", signature: "static void useSplashLogo(string path)", native: ScratchWindowClass.useSplashLogo, comment: SRC.windowUseSplashLogoComment },
    ];

    static type: NonPrimitiveType;

    /** Upstream is a singleton, and programs reach it through getInstance(). */
    private static instance?: ScratchWindowClass;
    private static splashLogo: string = "";

    private requestedWidth: number = 480;
    private requestedHeight: number = 360;
    private debugEnabled: boolean = false;

    // Upstream every constructor ends up in `new Applet(width, height, …)`, the
    // no-argument one with 480x360 — building a window is what gives the program
    // its picture and its size. So the constructors here build the World, and the
    // first Stage then finds it and shares it, exactly as upstream's Stage only
    // creates a window when there is none yet.
    _cj$_constructor_$Window$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Window$int$int(t, callback, 480, 360);
    }

    /** The assets folder has no browser equivalent; Stage ignores it the same way. */
    _cj$_constructor_$Window$string(t: Thread, callback: CallbackParameter, _assets: string) {
        this._cj$_constructor_$Window$int$int(t, callback, 480, 360);
    }

    _cj$_constructor_$Window$int$int$string(
        t: Thread, callback: CallbackParameter, width: number, height: number, _assets: string,
    ) {
        this._cj$_constructor_$Window$int$int(t, callback, width, height);
    }

    _cj$_constructor_$Window$int$int(t: Thread, callback: CallbackParameter, width: number, height: number) {
        this.requestedWidth = width;
        this.requestedHeight = height;
        ScratchWindowClass.instance = this;

        const interpreter = t.scheduler.interpreter;
        const done = () => {
            t.s.push(this);
            if (callback) callback();
        };

        // A second window in the same run. Upstream refuses it outright; here
        // the program simply keeps the one it has, because resizing it now
        // would leave every sprite already placed sitting in the wrong spot.
        if (interpreter.retrieveObject("WorldClass") as IWorld) {
            done();
            return;
        }

        new t.classes["World"]()._cj$_constructor_$World$int$int(t, () => {
            t.s.pop();      // the World its constructor pushed; the program wants the Window
            done();
        }, width, height);
    }

    static getInstance(): ScratchWindowClass {
        if (!ScratchWindowClass.instance) ScratchWindowClass.instance = new ScratchWindowClass();
        return ScratchWindowClass.instance;
    }

    /** The stage that is actually on screen. */
    private currentStage(): ScratchStageClass | undefined {
        return currentScratchStage<ScratchStageClass>();
    }

    _getWidth(): number { return this.currentStage()?._getWidth() ?? this.requestedWidth; }
    _getHeight(): number { return this.currentStage()?._getHeight() ?? this.requestedHeight; }
    _getDeltaTime(): number { return scratchGameClock().stepSeconds; }
    _pause() { scratchGameClock().pause(); }
    _resume() { scratchGameClock().resume(); }
    _isPaused() { return scratchGameClock().paused; }
    _step() { scratchGameClock().step(); }
    _setGameSpeed(speed: number) { scratchGameClock().setSpeed(speed); }
    _getGameSpeed() { return scratchGameClock().speed; }

    _getStage(): ScratchStageClass | undefined { return this.currentStage(); }

    /** Show `stage` instead of whatever is on screen now. */
    _setStage(stage: ScratchStageClass) { setActiveScratchStage(stage); }

    /** Fade to black, swap stages, fade back. */
    _transitionToStage(stage: ScratchStageClass, seconds: number) {
        transitionToScratchStage(stage, seconds * 1000);
    }

    _isTransitioning(): boolean { return ScratchWindowClass.isTransitioning(); }

    _transitionToStageSupplier(t: Thread, callback: CallbackParameter, supplier: SupplierInterface, seconds: number) {
        this._transitionToStageSupplierTransition(t, callback, supplier, undefined, seconds);
    }

    /** TransitionEnum names map straight onto the built-in kinds. */
    private static kindOf(transition: any): TransitionKind {
        const name = transition?.name;
        return typeof name === "string"
            && ["fade", "crossfade", "slide-left", "slide-right", "slide-up", "slide-down"].includes(name)
            ? name as TransitionKind
            : "fade";   // fromShader and the default render the built-in fade
    }

    /**
     * The browser renders one built-in transition; a Transition chosen by the
     * program (including fromShader) is accepted and reported, but which
     * built-in is drawn does not change yet.
     */
    _transitionToStageSupplierTransition(t: Thread, callback: CallbackParameter,
        supplier: SupplierInterface, transition: any, seconds: number) {
        const kind = ScratchWindowClass.kindOf(transition);
        if (!supplier) throw new NullPointerExceptionClass('Stage supplier must not be null');
        const module = t.currentProgramState.program.module;
        transitionToScratchStage((ready, failed) => {
            const program = new Program(module, undefined, 'stage transition supplier');
            module.programsToCompileToFunctions.splice(module.programsToCompileToFunctions.indexOf(program), 1);
            program.addCompiledSteps([
                thread => {
                    thread.beginTryBlock({ catchBlockInfos: [{ exceptionTypes: { Throwable: true }, catchBlockBeginsWithStepIndex: 2 }], stackSize: 0 });
                    supplier._mj$get$T$(thread, undefined);
                    return 1;
                },
                (thread, stack) => {
                    const stage = stack.pop();
                    if (!stage) throw new NullPointerExceptionClass('Stage supplier returned null');
                    thread.endCatchTryBlock();
                    ready(stage);
                    thread.return(undefined);
                    return -1;
                },
                thread => {
                    const error = thread.getExceptionAndTrimStack(true);
                    failed();
                    throw error;
                },
            ]);
            const thread = t.scheduler.createThread('stage transition supplier');
            thread.pushProgram(program);
            thread.state = ThreadState.running;
            return () => { thread.state = ThreadState.terminated; };
        }, seconds * 1000, kind);
        callback?.();
    }

    /** While a transition is fading, transitionToStage() requests are ignored. */
    static isTransitioning(): boolean {
        return scratchStageTransitioning();
    }

    // Upstream keeps one debug flag on the Applet that Window and Stage share,
    // so the stage is the single source of truth here too.
    _setDebug(debug: boolean) {
        this.debugEnabled = debug;
        this.currentStage()?._setDebug(debug);
    }
    _isDebug(): boolean { return this.currentStage()?._isDebug() ?? this.debugEnabled; }
    _debug(values: any[]) {
        if (!this.debugEnabled) return;
        const parts = (values ?? []).map(v => (v instanceof StringClass ? v.value : String(v)));
        console.log("[Window] " + parts.join(" "));
    }

    _exit() { this.currentStage()?._exit(); }
    _mj$whenExits$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }

    _getLibraryVersion(): string { return scratchBrowserVersion; }
    _getLibraryTitle(): string { return "Scratch for Java"; }

    static useFullScreen() {
        desktopOnly("Window.useFullScreen()",
            "Nutze den Vollbild-Knopf der Ausgabe. / Use the output panel's fullscreen button.");
    }
    /** Nearest-neighbour filtering keeps scaled-up pixel art sharp. */
    static usePixelArt() { setPixelArt(true); }
    static isPixelArtStatic(): boolean { return isPixelArt(); }
    static useSmoothPixelArt() { setPixelArt(false); }
    static isSmoothPixelArtStatic(): boolean { return !isPixelArt(); }

    /**
     * 7.0's frame smoothing: how long the renderer blends frames, in seconds.
     * The browser's canvas redraws per requestAnimationFrame and does not
     * re-blend previous frames, so the value is stored and reported as asked
     * but does not change what is drawn.
     */
    private static frameSmoothing = 0;
    static useFrameSmoothing(seconds: number) { ScratchWindowClass.frameSmoothing = Math.max(0, seconds); }
    static getFrameSmoothing(): number { return ScratchWindowClass.frameSmoothing; }
    static useSplashLogo(path: string) {
        ScratchWindowClass.splashLogo = path;
        desktopOnly("Window.useSplashLogo()");
    }
    static getSplashLogo(): string { return desktopOnlyValue("Window.getSplashLogo()", ScratchWindowClass.splashLogo); }
}
