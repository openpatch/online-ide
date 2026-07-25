import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { ScratchStageClass } from "./ScratchStageClass";
import { currentScratchStage, desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";
import { TextureSampling, TextureSamplingEnum } from "./TextureSamplingEnum";

/**
 * The application window, mirroring org.openpatch.scratch.Window.
 *
 * In the browser the stage owns the canvas, so a Window here is a thin handle
 * on the running stage rather than a real OS window: `new Window(480, 360)`
 * followed by `setStage(new MyStage())` works because constructing the Stage is
 * already what puts it on screen.
 *
 * What genuinely has no browser equivalent — fullscreen, the splash logo,
 * texture sampling, and swapping between several named stages — reports itself
 * through the desktop-only notice instead of failing.
 */
export class ScratchWindowClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Window extends Object", comment: "Das Programmfenster" },

        { type: "method", signature: "Window()", native: ScratchWindowClass.prototype._c0, comment: "Erzeugt ein Fenster in Standardgröße" },
        { type: "method", signature: "Window(string assets)", native: ScratchWindowClass.prototype._c1, comment: "Erzeugt ein Fenster mit eigenem Asset-Ordner" },
        { type: "method", signature: "Window(int width, int height)", native: ScratchWindowClass.prototype._c2, comment: "Erzeugt ein Fenster mit der angegebenen Größe" },
        { type: "method", signature: "Window(int width, int height, string assets)", native: ScratchWindowClass.prototype._c3, comment: "Erzeugt ein Fenster mit Größe und eigenem Asset-Ordner" },

        { type: "method", signature: "static Window getInstance()", native: ScratchWindowClass.getInstance, comment: "Gibt das Fenster des laufenden Programms zurück" },

        { type: "method", signature: "int getWidth()", native: ScratchWindowClass.prototype._getWidth, comment: "Gibt die Breite des Fensters in Pixeln zurück" },
        { type: "method", signature: "int getHeight()", native: ScratchWindowClass.prototype._getHeight, comment: "Gibt die Höhe des Fensters in Pixeln zurück" },
        { type: "method", signature: "double getDeltaTime()", native: ScratchWindowClass.prototype._getDeltaTime, comment: "Gibt die Dauer des letzten Frames in Sekunden zurück" },

        { type: "method", signature: "Stage getStage()", native: ScratchWindowClass.prototype._getStage, comment: "Gibt die aktuelle Bühne zurück" },
        { type: "method", signature: "void setStage(Stage stage)", native: ScratchWindowClass.prototype._setStage, comment: "Zeigt die angegebene Bühne an" },
        { type: "method", signature: "void addStage(string name, Stage stage)", native: ScratchWindowClass.prototype._addStage, comment: "Merkt sich eine Bühne unter einem Namen" },
        { type: "method", signature: "void switchStage(string name)", native: ScratchWindowClass.prototype._switchStage, comment: "Nur in der Desktop-Version: wechselt zur Bühne mit dem Namen" },
        { type: "method", signature: "void removeStage(string name)", native: ScratchWindowClass.prototype._removeStage, comment: "Entfernt die gemerkte Bühne mit dem Namen" },
        { type: "method", signature: "void transitionToStage(Stage stage, int duration)", native: ScratchWindowClass.prototype._transitionToStage, comment: "Nur in der Desktop-Version: blendet zur angegebenen Bühne über" },

        { type: "method", signature: "void setDebug(boolean debug)", native: ScratchWindowClass.prototype._setDebug, comment: "Schaltet die Ausgabe von debug() ein oder aus" },
        { type: "method", signature: "boolean isDebug()", native: ScratchWindowClass.prototype._isDebug, comment: "Gibt genau dann true zurück, wenn die Fehlersuche eingeschaltet ist" },
        { type: "method", signature: "void debug(Object... values)", native: ScratchWindowClass.prototype._debug, comment: "Gibt Werte zur Fehlersuche aus, wenn setDebug(true) gesetzt ist" },

        { type: "method", signature: "void exit()", native: ScratchWindowClass.prototype._exit, comment: "Beendet das Programm" },
        { type: "method", signature: "void whenExits()", java: ScratchWindowClass.prototype._mj$whenExits$void$, comment: "Wird beim Beenden des Programms aufgerufen" },

        { type: "method", signature: "string getLibraryVersion()", native: ScratchWindowClass.prototype._getLibraryVersion, comment: "Gibt die Version der Bibliothek zurück" },
        { type: "method", signature: "string getLibraryTitle()", native: ScratchWindowClass.prototype._getLibraryTitle, comment: "Gibt den Namen der Bibliothek zurück" },

        // desktop-only
        { type: "method", signature: "static void useFullScreen()", native: ScratchWindowClass.useFullScreen, comment: "Nur in der Desktop-Version: startet im Vollbild" },
        { type: "method", signature: "static void useTextureSampling(TextureSampling sampling)", native: ScratchWindowClass.useTextureSampling, comment: "Nur in der Desktop-Version: legt die Bildglättung fest" },
        { type: "method", signature: "static TextureSampling getTextureSampling()", native: ScratchWindowClass.getTextureSampling, comment: "Gibt das eingestellte Glättungsverfahren zurück" },
        { type: "method", signature: "static void useSplashLogo(string path)", native: ScratchWindowClass.useSplashLogo, comment: "Nur in der Desktop-Version: zeigt beim Start ein Logo" },
        { type: "method", signature: "static string getSplashLogo()", native: ScratchWindowClass.getSplashLogo, comment: "Gibt den Pfad des Startlogos zurück" },
    ];

    static type: NonPrimitiveType;

    /** Upstream is a singleton, and programs reach it through getInstance(). */
    private static instance?: ScratchWindowClass;
    private static splashLogo: string = "";
    private static textureSampling: TextureSampling = TextureSampling.LINEAR;

    private requestedWidth: number = 480;
    private requestedHeight: number = 360;
    private namedStages: Map<string, ScratchStageClass> = new Map();
    private debugEnabled: boolean = false;

    _c0() { return this._c3(480, 360, ""); }
    _c1(assets: string) { return this._c3(480, 360, assets); }
    _c2(width: number, height: number) { return this._c3(width, height, ""); }
    _c3(width: number, height: number, _assets: string) {
        this.requestedWidth = width;
        this.requestedHeight = height;
        ScratchWindowClass.instance = this;
        return this;
    }

    static getInstance(): ScratchWindowClass {
        if (!ScratchWindowClass.instance) ScratchWindowClass.instance = new ScratchWindowClass();
        return ScratchWindowClass.instance;
    }

    /** The stage that is actually on screen, which is the one that was built last. */
    private currentStage(): ScratchStageClass | undefined {
        return currentScratchStage<ScratchStageClass>();
    }

    _getWidth(): number { return this.currentStage()?._getWidth() ?? this.requestedWidth; }
    _getHeight(): number { return this.currentStage()?._getHeight() ?? this.requestedHeight; }
    _getDeltaTime(): number { return this.currentStage()?._getDeltaTime() ?? 0; }

    _getStage(): ScratchStageClass | undefined { return this.currentStage(); }

    /**
     * Constructing a Stage already shows it, so there is nothing left to do —
     * this only keeps `new Window(...); setStage(new MyStage())` working.
     */
    _setStage(_stage: ScratchStageClass) { }

    _addStage(name: string, stage: ScratchStageClass) { if (name) this.namedStages.set(name, stage); }
    _removeStage(name: string) { this.namedStages.delete(name); }

    _switchStage(_name: string) {
        desktopOnly("Window.switchStage()",
            "Es kann immer nur eine Bühne geben. / Only one stage can exist at a time.");
    }

    _transitionToStage(_stage: ScratchStageClass, _duration: number) {
        desktopOnly("Window.transitionToStage()",
            "Es kann immer nur eine Bühne geben. / Only one stage can exist at a time.");
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
