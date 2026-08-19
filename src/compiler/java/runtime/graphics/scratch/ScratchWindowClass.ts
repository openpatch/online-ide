import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { IWorld } from "../IWorld";
import { ScratchStageClass } from "./ScratchStageClass";
import { setActiveScratchStage, transitionToScratchStage } from "./ScratchStages";
import { currentScratchStage, desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";
import { TextureSampling, TextureSamplingEnum } from "./TextureSamplingEnum";
import { SRC } from "./ScratchLibraryComments";

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
        { type: "method", signature: "double getDeltaTime()", native: ScratchWindowClass.prototype._getDeltaTime, comment: SRC.windowGetDeltaTimeComment },

        { type: "method", signature: "Stage getStage()", native: ScratchWindowClass.prototype._getStage, comment: SRC.windowGetStageComment },
        { type: "method", signature: "void setStage(Stage stage)", native: ScratchWindowClass.prototype._setStage, comment: SRC.windowSetStageComment },
        { type: "method", signature: "void transitionToStage(Stage stage, int duration)", native: ScratchWindowClass.prototype._transitionToStage, comment: SRC.windowTransitionToStageComment },

        { type: "method", signature: "void setDebug(boolean debug)", native: ScratchWindowClass.prototype._setDebug, comment: SRC.windowSetDebugComment },
        { type: "method", signature: "boolean isDebug()", native: ScratchWindowClass.prototype._isDebug, comment: SRC.windowIsDebugComment },
        { type: "method", signature: "void debug(Object... values)", native: ScratchWindowClass.prototype._debug, comment: SRC.windowDebugComment },

        { type: "method", signature: "void exit()", native: ScratchWindowClass.prototype._exit, comment: SRC.windowExitComment },
        { type: "method", signature: "void whenExits()", java: ScratchWindowClass.prototype._mj$whenExits$void$, comment: SRC.windowWhenExitsComment },

        { type: "method", signature: "string getLibraryVersion()", native: ScratchWindowClass.prototype._getLibraryVersion, comment: SRC.windowGetLibraryVersionComment },
        { type: "method", signature: "string getLibraryTitle()", native: ScratchWindowClass.prototype._getLibraryTitle, comment: SRC.windowGetLibraryTitleComment },

        // desktop-only
        { type: "method", signature: "static void useFullScreen()", native: ScratchWindowClass.useFullScreen, comment: SRC.windowUseFullScreenComment },
        { type: "method", signature: "static void useTextureSampling(TextureSampling sampling)", native: ScratchWindowClass.useTextureSampling, comment: SRC.windowUseTextureSamplingComment },
        { type: "method", signature: "static TextureSampling getTextureSampling()", native: ScratchWindowClass.getTextureSampling, comment: SRC.windowGetTextureSamplingComment },
        { type: "method", signature: "static void useSplashLogo(string path)", native: ScratchWindowClass.useSplashLogo, comment: SRC.windowUseSplashLogoComment },
        { type: "method", signature: "static string getSplashLogo()", native: ScratchWindowClass.getSplashLogo, comment: SRC.windowGetSplashLogoComment },
    ];

    static type: NonPrimitiveType;

    /** Upstream is a singleton, and programs reach it through getInstance(). */
    private static instance?: ScratchWindowClass;
    private static splashLogo: string = "";
    private static textureSampling: TextureSampling = TextureSampling.LINEAR;

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

        // A stage built before the window already opened one. Upstream refuses a
        // second window outright; here the program simply keeps the one it has,
        // because resizing it now would leave every sprite the stage has already
        // placed sitting in the wrong spot.
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
    _getDeltaTime(): number { return this.currentStage()?._getDeltaTime() ?? 0; }

    _getStage(): ScratchStageClass | undefined { return this.currentStage(); }

    /** Show `stage` instead of whatever is on screen now. */
    _setStage(stage: ScratchStageClass) { setActiveScratchStage(stage); }

    /** Fade to black, swap stages, fade back. */
    _transitionToStage(stage: ScratchStageClass, duration: number) {
        transitionToScratchStage(stage, duration);
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

    _getLibraryVersion(): string { return "scratch-for-java (Online-IDE-Portierung)"; }
    _getLibraryTitle(): string { return "Scratch for Java"; }

    static useFullScreen() {
        desktopOnly("Window.useFullScreen()",
            "Nutze den Vollbild-Knopf der Ausgabe. / Use the output panel's fullscreen button.");
    }
    static useTextureSampling(sampling: TextureSamplingEnum) {
        ScratchWindowClass.textureSampling = (sampling?.ordinal ?? TextureSampling.LINEAR) as TextureSampling;
        desktopOnly("Window.useTextureSampling()");
    }
    static getTextureSampling(): TextureSamplingEnum {
        return TextureSamplingEnum.values[ScratchWindowClass.textureSampling];
    }
    static useSplashLogo(path: string) {
        ScratchWindowClass.splashLogo = path;
        desktopOnly("Window.useSplashLogo()");
    }
    static getSplashLogo(): string { return desktopOnlyValue("Window.getSplashLogo()", ScratchWindowClass.splashLogo); }
}
