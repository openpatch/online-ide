import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ArrayListClass } from "../../system/collections/ArrayListClass";
import { ClassClass } from "../../system/ClassClass";
import { StringClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ActorClass } from "../ActorClass";
import { IWorld } from "../IWorld";
import { InternalMouseListener, MouseEventKind } from "../MouseManager2D";
import { KeyCodeEnum } from "./KeyCodeEnum";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { ScratchCameraClass } from "./ScratchCameraClass";
import { ScratchColorClass } from "./ScratchColorClass";
import { ScratchCostumes } from "./ScratchCostumes";
import { DEBUG_COLOR, DEBUG_FONT_FAMILY, DEBUG_FONT_SIZE, round2, roundInt } from "./ScratchDebug";
import { loadScratchFont } from "./ScratchFont";
import { applyCameraTransform, createScratchLayers, ScratchLayers } from "./ScratchLayers";
import { ScratchPenClass } from "./ScratchPenClass";
import { IScratchEventReceiver, ScratchRuntimeManager } from "./ScratchRuntimeManager";
import { ScratchSoundBank, ScratchSounds } from "./ScratchSounds";
import { ScratchSpriteClass } from "./ScratchSpriteClass";
import { ScratchTextClass } from "./ScratchTextClass";
import { ScratchTimerClass } from "./ScratchTimerClass";
import { beginScratchProgram, desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";
import { BooleanSupplierInterface } from "./BooleanSupplierInterface";
import { ScratchVector2Class } from "./ScratchVector2Class";

/**
 * The active scene, mirroring org.openpatch.scratch.Stage (core subset).
 *
 * Owns the IDE WorldClass singleton (created lazily/async), resets the program
 * timer, loads the built-in costume atlases, and — via ActorClass — runs its
 * overridable run() every frame. Coordinate system is Scratch's: centre origin,
 * y up (conversion lives in ScratchSpriteClass).
 */
export class ScratchStageClass extends ActorClass implements InternalMouseListener {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Stage extends Actor", comment: "Die Bühne, auf der alle Figuren angezeigt werden" },

        { type: "method", signature: "Stage()", java: ScratchStageClass.prototype._cj$_constructor_$Stage$, comment: "Erzeugt eine Bühne der Größe 480 x 360" },
        { type: "method", signature: "Stage(int width, int height)", java: ScratchStageClass.prototype._cj$_constructor_$Stage$int$int, comment: "Erzeugt eine Bühne mit der angegebenen Breite und Höhe" },

        { type: "method", signature: "void run()", java: ScratchStageClass.prototype._mj$run$void$, comment: "Wird in jedem Frame aufgerufen" },

        // overridable event hooks
        { type: "method", signature: "void whenIReceive(String message)", java: ScratchStageClass.prototype._mj$whenIReceive$void$String, comment: "Wird bei broadcast(message) aufgerufen" },
        { type: "method", signature: "void whenKeyPressed(KeyCode key)", java: ScratchStageClass.prototype._mj$whenKeyPressed$void$KeyCode, comment: "Wird beim Drücken der Taste aufgerufen" },
        { type: "method", signature: "void whenKeyReleased(KeyCode key)", java: ScratchStageClass.prototype._mj$whenKeyReleased$void$KeyCode, comment: "Wird beim Loslassen der Taste aufgerufen" },
        { type: "method", signature: "void whenMouseClicked(MouseCode button)", java: ScratchStageClass.prototype._mj$whenMouseClicked$void$MouseCode, comment: "Wird bei einem Mausklick aufgerufen" },
        { type: "method", signature: "void whenMouseMoved(double x, double y)", java: ScratchStageClass.prototype._mj$whenMouseMoved$void$double$double, comment: "Wird bei jeder Mausbewegung aufgerufen" },
        { type: "method", signature: "void whenMouseWheelMoved(int steps)", java: ScratchStageClass.prototype._mj$whenMouseWheelMoved$void$int, comment: "Wird beim Drehen des Mausrads aufgerufen" },

        { type: "method", signature: "void whenBackdropSwitches(String name)", java: ScratchStageClass.prototype._mj$whenBackdropSwitches$void$String, comment: "Wird beim Wechsel des Hintergrunds aufgerufen" },

        { type: "method", signature: "void broadcast(String message)", native: ScratchStageClass.prototype._broadcast, comment: "Sendet eine Nachricht an alle whenIReceive-Empfänger" },

        { type: "method", signature: "void add(Sprite sprite)", java: ScratchStageClass.prototype._mj$add$void$Sprite, comment: "Fügt der Bühne eine Figur hinzu" },
        { type: "method", signature: "void add(Pen pen)", native: ScratchStageClass.prototype._addPen, comment: "Fügt der Bühne einen Stift hinzu" },
        { type: "method", signature: "void add(Text text)", java: ScratchStageClass.prototype._mj$add$void$Text, comment: "Fügt der Bühne einen Text hinzu" },
        { type: "method", signature: "void remove(Text text)", native: ScratchStageClass.prototype._removeText, comment: "Entfernt den Text von der Bühne" },
        { type: "method", signature: "void remove(Pen pen)", native: ScratchStageClass.prototype._removePen, comment: "Entfernt den Stift von der Bühne" },
        { type: "method", signature: "void remove(Sprite sprite)", native: ScratchStageClass.prototype._remove, comment: "Entfernt die Figur von der Bühne" },
        { type: "method", signature: "void removeAll()", native: ScratchStageClass.prototype._removeAll, comment: "Entfernt alle Figuren von der Bühne" },
        { type: "method", signature: "void remove(Class<? extends Sprite> c)", native: ScratchStageClass.prototype._removeOfClass, comment: "Entfernt alle Figuren dieser Klasse von der Bühne, z.B. remove(Apfel.class)" },
        { type: "method", signature: "List<Sprite> getAll()", native: ScratchStageClass.prototype._getAll, comment: "Gibt alle Figuren auf der Bühne zurück" },
        { type: "method", signature: "<T extends Sprite> List<T> find(Class<T> c)", native: ScratchStageClass.prototype._find, comment: "Gibt alle Figuren dieser Klasse zurück, z.B. find(Apfel.class)" },
        { type: "method", signature: "<T extends Sprite> int count(Class<T> c)", native: ScratchStageClass.prototype._count, comment: "Gibt die Anzahl der Figuren dieser Klasse zurück, z.B. count(Apfel.class)" },

        // backdrops
        { type: "method", signature: "void addBackdrop(string name)", native: ScratchStageClass.prototype._addBackdrop, comment: "Fügt einen der eingebauten Hintergründe hinzu" },
        { type: "method", signature: "void addBackdrop(string name, string imagePath)", native: ScratchStageClass.prototype._addBackdrop2, comment: "Fügt einen Hintergrund unter eigenem Namen hinzu" },
        { type: "method", signature: "void addBackdrop(string name, string imagePath, boolean stretch)", native: ScratchStageClass.prototype._addBackdrop3, comment: "Fügt einen Hintergrund hinzu; bei stretch == true wird er auf Bühnengröße gedehnt" },
        { type: "method", signature: "void switchBackdrop(string name)", native: ScratchStageClass.prototype._switchBackdrop, comment: "Wechselt zum Hintergrund mit dem angegebenen Namen" },
        { type: "method", signature: "void nextBackdrop()", native: ScratchStageClass.prototype._nextBackdrop, comment: "Wechselt zum nächsten Hintergrund" },
        { type: "method", signature: "void previousBackdrop()", native: ScratchStageClass.prototype._previousBackdrop, comment: "Wechselt zum vorherigen Hintergrund" },
        { type: "method", signature: "void randomBackdrop()", native: ScratchStageClass.prototype._randomBackdrop, comment: "Wechselt zu einem zufälligen Hintergrund" },
        { type: "method", signature: "string getCurrentBackdropName()", native: ScratchStageClass.prototype._getCurrentBackdropName, comment: "Gibt den Namen des aktuellen Hintergrunds zurück" },
        { type: "method", signature: "int getCurrentBackdropIndex()", native: ScratchStageClass.prototype._getCurrentBackdropIndex, comment: "Gibt die Nummer des aktuellen Hintergrunds zurück" },

        // sound
        { type: "method", signature: "void addSound(string name)", native: ScratchStageClass.prototype._addSound, comment: "Fügt einen der eingebauten Klänge hinzu" },
        { type: "method", signature: "void addSound(string name, string soundPath)", native: ScratchStageClass.prototype._addSound2, comment: "Fügt einen Klang unter eigenem Namen hinzu" },
        { type: "method", signature: "void playSound(string name)", native: ScratchStageClass.prototype._playSound, comment: "Spielt einen zuvor hinzugefügten Klang ab" },
        { type: "method", signature: "void stopSound(string name)", native: ScratchStageClass.prototype._stopSound, comment: "Stoppt den Klang mit dem angegebenen Namen" },
        { type: "method", signature: "void stopAllSounds()", native: ScratchStageClass.prototype._stopAllSounds, comment: "Stoppt alle Klänge der Bühne" },
        { type: "method", signature: "boolean isSoundPlaying(string name)", native: ScratchStageClass.prototype._isSoundPlaying, comment: "Gibt genau dann true zurück, wenn der Klang gerade abgespielt wird" },
        { type: "method", signature: "void setVolume(double percent)", native: ScratchStageClass.prototype._setVolume, comment: "Setzt die Lautstärke in Prozent" },
        { type: "method", signature: "void changeVolume(double step)", native: ScratchStageClass.prototype._changeVolume, comment: "Ändert die Lautstärke um den angegebenen Wert" },
        { type: "method", signature: "double getVolume()", native: ScratchStageClass.prototype._getVolume, comment: "Gibt die Lautstärke in Prozent zurück" },

        // background colour
        { type: "method", signature: "void setColor(double h)", native: ScratchStageClass.prototype._setColorHue, comment: "Setzt die Hintergrundfarbe über den Farbton (0 bis 255)" },
        { type: "method", signature: "void setColor(double r, double g, double b)", native: ScratchStageClass.prototype._setColorRGB, comment: "Setzt die Hintergrundfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)" },
        { type: "method", signature: "void setColor(Color c)", native: ScratchStageClass.prototype._setColorObj, comment: "Setzt die Hintergrundfarbe" },
        { type: "method", signature: "Color getColor()", native: ScratchStageClass.prototype._getColor, comment: "Gibt die Hintergrundfarbe zurück" },
        { type: "method", signature: "void changeColor(double h)", native: ScratchStageClass.prototype._changeColor, comment: "Ändert den Farbton des Hintergrunds um den angegebenen Wert" },

        { type: "method", signature: "Camera getCamera()", native: ScratchStageClass.prototype._getCamera, comment: "Gibt die Kamera der Bühne zurück" },

        // backdrop tint and transparency
        { type: "method", signature: "void setTint(double r, double g, double b)", native: ScratchStageClass.prototype._setTintRGB, comment: "Färbt den Hintergrund ein (Anteile jeweils 0 bis 255)" },
        { type: "method", signature: "void setTint(double h)", native: ScratchStageClass.prototype._setTintHue, comment: "Färbt den Hintergrund mit dem angegebenen Farbton ein (0 bis 255)" },
        { type: "method", signature: "void changeTint(double step)", native: ScratchStageClass.prototype._changeTint, comment: "Ändert den Farbton der Einfärbung um den angegebenen Wert" },
        { type: "method", signature: "void setTransparency(double transparency)", native: ScratchStageClass.prototype._setTransparency, comment: "Setzt die Transparenz des Hintergrunds in Prozent" },
        { type: "method", signature: "void changeTransparency(double step)", native: ScratchStageClass.prototype._changeTransparency, comment: "Ändert die Transparenz des Hintergrunds" },

        // debugging and program control
        { type: "method", signature: "void setDebug(boolean debug)", native: ScratchStageClass.prototype._setDebug, comment: "Schaltet die Ausgabe von debug() ein oder aus" },
        { type: "method", signature: "boolean isDebug()", native: ScratchStageClass.prototype._isDebug, comment: "Gibt genau dann true zurück, wenn die Fehlersuche eingeschaltet ist" },
        { type: "method", signature: "void debug(Object... values)", native: ScratchStageClass.prototype._debug, comment: "Gibt Werte zur Fehlersuche aus, wenn setDebug(true) gesetzt ist" },
        { type: "method", signature: "void waitUntil(BooleanSupplier condition)", java: ScratchStageClass.prototype._mj$waitUntil$void$BooleanSupplier, comment: "Wartet, bis die Bedingung erfüllt ist" },
        { type: "method", signature: "void exit()", native: ScratchStageClass.prototype._exit, comment: "Beendet das Programm" },
        { type: "method", signature: "void setCursor(string path)", native: ScratchStageClass.prototype._setCursor, comment: "Setzt das Mauszeigerbild" },
        { type: "method", signature: "void setCursor(string path, int x, int y)", native: ScratchStageClass.prototype._setCursor3, comment: "Setzt das Mauszeigerbild mit eigenem Aktivpunkt" },

        // desktop-only extensions
        { type: "method", signature: "Pixels getPixels()", native: ScratchStageClass.prototype._getPixels, comment: "Nur in der Desktop-Version: Zugriff auf einzelne Bildpunkte" },
        { type: "method", signature: "Shaders getShaders()", native: ScratchStageClass.prototype._getShaders, comment: "Nur in der Desktop-Version: Shader der Bühne" },
        { type: "method", signature: "Sorting getSorting()", native: ScratchStageClass.prototype._getSorting, comment: "Nur in der Desktop-Version: Sortierreihenfolge der Figuren" },
        { type: "method", signature: "int getWidth()", native: ScratchStageClass.prototype._getWidth, comment: "Gibt die Breite der Bühne in Pixeln zurück" },
        { type: "method", signature: "int getHeight()", native: ScratchStageClass.prototype._getHeight, comment: "Gibt die Höhe der Bühne in Pixeln zurück" },

        { type: "method", signature: "boolean isKeyPressed(KeyCode key)", native: ScratchStageClass.prototype._isKeyPressed, comment: "Gibt genau dann true zurück, wenn die Taste gerade gedrückt ist" },
        { type: "method", signature: "double getMouseX()", native: ScratchStageClass.prototype._getMouseX, comment: "Gibt die x-Position des Mauszeigers zurück" },
        { type: "method", signature: "double getMouseY()", native: ScratchStageClass.prototype._getMouseY, comment: "Gibt die y-Position des Mauszeigers zurück" },
        { type: "method", signature: "Vector2 getMouse()", native: ScratchStageClass.prototype._getMouse, comment: "Gibt die Position des Mauszeigers zurück" },
        { type: "method", signature: "boolean isMouseDown()", native: ScratchStageClass.prototype._isMouseDown, comment: "Gibt genau dann true zurück, wenn eine Maustaste gedrückt ist" },

        { type: "method", signature: "Timer getTimer()", native: ScratchStageClass.prototype._getTimer, comment: "Gibt den Standard-Timer der Bühne zurück" },
        { type: "method", signature: "Timer getTimer(string name)", native: ScratchStageClass.prototype._getNamedTimer, comment: "Gibt den Timer mit dem angegebenen Namen zurück und legt ihn bei Bedarf an" },
        { type: "method", signature: "double getDeltaTime()", native: ScratchStageClass.prototype._getDeltaTime, comment: "Gibt die Dauer des letzten Frames in Sekunden zurück" },
        { type: "method", signature: "double getFrameRate()", native: ScratchStageClass.prototype._getFrameRate, comment: "Gibt die aktuelle Bildrate zurück" },

        { type: "method", signature: "void eraseAll()", native: ScratchStageClass.prototype._eraseAll, comment: "Löscht alles, was mit Stiften gezeichnet wurde" },
        { type: "method", signature: "void display(string text)", native: ScratchStageClass.prototype._display, comment: "Zeigt einen Text in der oberen linken Ecke der Bühne an" },
        { type: "method", signature: "void display(string text, int millis)", native: ScratchStageClass.prototype._displayFor, comment: "Zeigt einen Text für die angegebene Zeit in Millisekunden an" },

        { type: "method", signature: "void wait(int millis)", java: ScratchStageClass.prototype._mj$wait$void$int, comment: "Pausiert das Programm für die angegebene Zeit in Millisekunden" },

        { type: "method", signature: "void ask(string question)", native: ScratchStageClass.prototype._ask, comment: "Stellt eine Frage; die Antwort wird über getAnswer() abgeholt" },
        { type: "method", signature: "string getAnswer()", native: ScratchStageClass.prototype._getAnswer, comment: "Gibt die zuletzt eingegebene Antwort zurück, sonst eine leere Zeichenkette" },
        { type: "method", signature: "boolean isAsking()", native: ScratchStageClass.prototype._isAsking, comment: "Gibt genau dann true zurück, wenn noch auf eine Antwort gewartet wird" },

        { type: "method", signature: "int pickRandom(int from, int to)", native: ScratchStageClass.prototype._pickRandom, comment: "Gibt eine Zufallszahl zwischen from und to zurück (beide eingeschlossen)" },
    ];

    static type: NonPrimitiveType;

    world!: IWorld;
    sprites: ScratchSpriteClass[] = [];
    runtime!: ScratchRuntimeManager;

    /** Read by sprites and pens via scratchLayerOf(); see ScratchLayers.ts. */
    scratchLayers?: ScratchLayers;

    camera: ScratchCameraClass = new ScratchCameraClass();

    private backdrops: { name: string; texture: PIXI.Texture; stretch: boolean }[] = [];
    private currentBackdrop: number = -1;
    private soundBank: ScratchSoundBank = new ScratchSoundBank();
    private timers: Map<string, ScratchTimerClass> = new Map();

    _cj$_constructor_$Stage$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Stage$int$int(t, callback, 480, 360);
    }

    _cj$_constructor_$Stage$int$int(t: Thread, callback: CallbackParameter, width: number, height: number) {
        const interpreter = t.scheduler.interpreter;
        interpreter.storeObject("ScratchStage", this);
        ScratchTimerClass.resetProgramStart();
        beginScratchProgram(interpreter);

        const finish = (world: IWorld) => {
            this.world = world;
            this.scratchLayers = createScratchLayers(world.app.stage);
            world._setBackgroundColor("#ffffff");
            world.mouseManager.internalMouseListeners.push(this);
            this.runtime = ScratchRuntimeManager.forInterpreter(interpreter, world);

            const oldState = t.state;
            t.state = ThreadState.waiting;
            Promise.all([ScratchCostumes.load(), ScratchSounds.load(), loadScratchFont()]).then(() => {
                t.state = oldState;
                t.s.push(this);
                if (callback) callback();
            });
        };

        const existing = interpreter.retrieveObject("WorldClass") as IWorld;
        if (!existing) {
            new t.classes["World"]()._cj$_constructor_$World$int$int(t, () => {
                finish(t.s.pop());
            }, width, height);
        } else {
            (existing as any).changeResolution?.(interpreter, width, height);
            finish(existing);
        }
    }

    // ---- per-frame ----
    _mj$act$void$(t: Thread, callback: CallbackParameter): void {
        this._applyCamera();
        if (this.debugEnabled) this.renderDebugOverlay();
        this._mj$run$void$(t, callback);
    }

    /** Push the camera's position/zoom onto the container that holds the world. */
    _applyCamera() {
        applyCameraTransform(this.scratchLayers, this.world.width, this.world.height,
            this.camera.x, this.camera.y, this.camera.zoom);
    }
    _mj$run$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }

    // ---- overridable event hooks (empty defaults) ----
    _mj$whenIReceive$void$String(_t: Thread, callback: CallbackParameter, _message: StringClass): void { if (callback) callback(); }
    _mj$whenBackdropSwitches$void$String(_t: Thread, callback: CallbackParameter, _name: StringClass): void { if (callback) callback(); }
    _mj$whenKeyPressed$void$KeyCode(_t: Thread, callback: CallbackParameter, _key: KeyCodeEnum): void { if (callback) callback(); }
    _mj$whenKeyReleased$void$KeyCode(_t: Thread, callback: CallbackParameter, _key: KeyCodeEnum): void { if (callback) callback(); }
    _mj$whenMouseClicked$void$MouseCode(_t: Thread, callback: CallbackParameter, _code: MouseCodeEnum): void { if (callback) callback(); }
    _mj$whenMouseMoved$void$double$double(_t: Thread, callback: CallbackParameter, _x: number, _y: number): void { if (callback) callback(); }
    _mj$whenMouseWheelMoved$void$int(_t: Thread, callback: CallbackParameter, _steps: number): void { if (callback) callback(); }

    // Called by the compiler after the constructor completes; register overridden hooks.
    _registerListeners(t: Thread): void {
        super._registerListeners(t);
        this.runtime.register(this as IScratchEventReceiver, {
            iReceive: this._mj$whenIReceive$void$String !== ScratchStageClass.prototype._mj$whenIReceive$void$String,
            keyPressed: this._mj$whenKeyPressed$void$KeyCode !== ScratchStageClass.prototype._mj$whenKeyPressed$void$KeyCode,
            keyReleased: this._mj$whenKeyReleased$void$KeyCode !== ScratchStageClass.prototype._mj$whenKeyReleased$void$KeyCode,
            mouseClicked: this._mj$whenMouseClicked$void$MouseCode !== ScratchStageClass.prototype._mj$whenMouseClicked$void$MouseCode,
            backdropSwitches: this._mj$whenBackdropSwitches$void$String !== ScratchStageClass.prototype._mj$whenBackdropSwitches$void$String,
            mouseMoved: this._mj$whenMouseMoved$void$double$double !== ScratchStageClass.prototype._mj$whenMouseMoved$void$double$double,
            mouseWheelMoved: this._mj$whenMouseWheelMoved$void$int !== ScratchStageClass.prototype._mj$whenMouseWheelMoved$void$int,
        });
    }

    /** Declared as `String message`, so the argument arrives boxed as a StringClass. */
    _broadcast(message: StringClass) { this.runtime.broadcast(message); }

    // ---- sprites ----
    /**
     * Upstream runs whenAddedToStage inside add(), so anything the program does
     * to the sprite on the next line already sees the costume. Running it on the
     * caller's thread keeps that order: the callback is only invoked once the
     * hook has finished, so `add(s); s.stamp();` behaves as written.
     */
    _mj$add$void$Sprite(t: Thread, callback: CallbackParameter, sprite: ScratchSpriteClass) {
        if (!sprite || this.sprites.indexOf(sprite) >= 0) {
            if (callback) callback();
            return;
        }
        this.sprites.push(sprite);
        const hook = (sprite as any)._mj$whenAddedToStage$void$;
        if (!hook) {
            if (callback) callback();
            return;
        }
        hook.call(sprite, t, callback);
    }

    /** A stage-owned Pen simply needs a world to draw into. */
    _addPen(pen: ScratchPenClass) { if (pen) pen.attachToWorld(this.world); }

    /** Texts get the same treatment: their hooks run before add() returns. */
    _mj$add$void$Text(t: Thread, callback: CallbackParameter, text: ScratchTextClass) {
        if (!text) {
            if (callback) callback();
            return;
        }
        text.world = this.world;
        text._mj$addedToStage$void$Stage(t, callback, this);
    }
    _removeText(text: ScratchTextClass) { text?._remove(); }
    _removePen(pen: ScratchPenClass) { pen?._eraseAll(); }
    _remove(sprite: ScratchSpriteClass) {
        const i = this.sprites.indexOf(sprite);
        if (i >= 0) this.sprites.splice(i, 1);
        sprite?.destroy();
    }
    _removeAll() {
        for (const s of this.sprites.slice()) s.destroy();
        this.sprites.length = 0;
    }

    /**
     * A Java class literal arrives as a ClassClass, whose `type` carries the
     * generated JS constructor — a plain instanceof therefore matches subclasses
     * too, the same semantics as Class.isInstance().
     */
    private spritesOfClass(c: ClassClass): ScratchSpriteClass[] {
        const klass = c?.type?.runtimeClass;
        if (!klass) return [];
        return this.sprites.filter(s => !s.isDestroyed && s instanceof (klass as any));
    }

    _removeOfClass(c: ClassClass) {
        for (const s of this.spritesOfClass(c)) this._remove(s);
    }
    _getAll(): ArrayListClass { return new ArrayListClass(this.sprites.slice()); }
    _find(c: ClassClass): ArrayListClass { return new ArrayListClass(this.spritesOfClass(c)); }
    _count(c: ClassClass): number { return this.spritesOfClass(c).length; }

    // ---- backdrops ----
    /**
     * Backdrops are drawn full-stage behind everything else. `stretch` scales the
     * image to the stage size; otherwise it is centred at its natural size.
     */
    private backdropSprite?: PIXI.Sprite;

    _addBackdrop(name: string) { this._addBackdrop3(name, name, false); }
    _addBackdrop2(name: string, imagePath: string) { this._addBackdrop3(name, imagePath, false); }
    _addBackdrop3(name: string, imagePath: string, stretch: boolean) {
        if (this.backdrops.some(b => b.name === name)) return;
        const texture = ScratchCostumes.getTexture(imagePath);
        if (!texture) {
            console.warn(`Scratch: unknown backdrop image '${imagePath}'`);
            return;
        }
        this.backdrops.push({ name, texture, stretch });
        if (this.currentBackdrop < 0) this._applyBackdropIndex(this.backdrops.length - 1);
    }

    private _applyBackdropIndex(index: number) {
        if (index < 0 || index >= this.backdrops.length) return;
        this.currentBackdrop = index;
        const bd = this.backdrops[index];

        if (this.backdropSprite && !this.backdropSprite.destroyed) this.backdropSprite.destroy();
        const sprite = new PIXI.Sprite(bd.texture);
        sprite.anchor.set(0.5, 0.5);
        sprite.position.set(this.world.width / 2, this.world.height / 2);
        if (bd.stretch) {
            sprite.width = this.world.width;
            sprite.height = this.world.height;
        }
        // the backdrop layer sits below the pen and the background stamps
        (this.scratchLayers?.backdrop ?? this.world.app.stage).addChild(sprite);
        this.backdropSprite = sprite;
        this.fireBackdropSwitch(bd.name);
    }

    /** Notify every stage/sprite that overrides whenBackdropSwitches. */
    private fireBackdropSwitch(name: string) {
        this.runtime?.backdropSwitch(name);
    }

    _switchBackdrop(name: string) {
        const i = this.backdrops.findIndex(b => b.name === name);
        if (i < 0) {
            const available = this.backdrops.length ? this.backdrops.map(b => `'${b.name}'`).join(", ") : "none added";
            console.warn(`Scratch: backdrop '${name}' not found. Available backdrops: ${available}`);
            return;
        }
        this._applyBackdropIndex(i);
    }
    _nextBackdrop() { if (this.backdrops.length) this._applyBackdropIndex((this.currentBackdrop + 1) % this.backdrops.length); }
    _previousBackdrop() { if (this.backdrops.length) this._applyBackdropIndex((this.currentBackdrop - 1 + this.backdrops.length) % this.backdrops.length); }
    _randomBackdrop() { if (this.backdrops.length) this._applyBackdropIndex(this._pickRandom(0, this.backdrops.length - 1)); }
    // declared as lowercase `string`, so this must return a raw JS string —
    // returning a StringClass here would print as "[object Object]"
    _getCurrentBackdropName(): string {
        return this.currentBackdrop >= 0 ? this.backdrops[this.currentBackdrop].name : "";
    }
    _getCurrentBackdropIndex(): number { return this.currentBackdrop; }

    // ---- sound ----
    _addSound(name: string) { this.soundBank.add(name, name); }
    _addSound2(name: string, path: string) { this.soundBank.add(name, path); }
    _playSound(name: string) { this.soundBank.play(name); }
    _stopSound(name: string) { this.soundBank.stop(name); }
    _stopAllSounds() { this.soundBank.stopAll(); }
    _isSoundPlaying(name: string): boolean { return this.soundBank.isPlaying(name); }
    _setVolume(percent: number) { this.soundBank.setVolume(percent); }
    _changeVolume(step: number) { this.soundBank.setVolume(this.soundBank.getVolume() + step); }
    _getVolume(): number { return this.soundBank.getVolume(); }

    // ---- background colour ----
    private bgColor: ScratchColorClass = ScratchColorClass.fromRGB(255, 255, 255);

    private applyBgColor() {
        this.world._setBackgroundColor(this.bgColor._get() & 0xffffff);
    }
    _setColorHue(h: number) { this.bgColor = ScratchColorClass.fromHue(h); this.applyBgColor(); }
    _setColorRGB(r: number, g: number, b: number) { this.bgColor = ScratchColorClass.fromRGB(r, g, b); this.applyBgColor(); }
    _setColorObj(c: ScratchColorClass) { if (c) { this.bgColor = c; this.applyBgColor(); } }
    _getColor(): ScratchColorClass { return this.bgColor; }
    _changeColor(h: number) { this.bgColor._changeColor(h); this.applyBgColor(); }

    // ---- timers ----
    _getTimer(): ScratchTimerClass { return this._getNamedTimer("default"); }
    _getNamedTimer(name: string): ScratchTimerClass {
        let timer = this.timers.get(name);
        if (!timer) { timer = new ScratchTimerClass(); this.timers.set(name, timer); }
        return timer;
    }
    _getDeltaTime(): number {
        const fps = this._getFrameRate();
        return fps > 0 ? 1 / fps : 0;
    }
    _getFrameRate(): number {
        return (this.world as any).app?.ticker?.FPS ?? 30;
    }

    // ---- misc ----
    _eraseAll() { ScratchPenClass.eraseAllLayers(this.world); }

    _display(text: string) { this.displayText(text, undefined); }
    _displayFor(text: string, millis: number) { this.displayText(text, millis); }

    private displayContainer?: PIXI.Container;
    private displayTimeout?: any;

    private displayText(text: string, millis?: number) {
        if (this.displayTimeout) { clearTimeout(this.displayTimeout); this.displayTimeout = undefined; }
        if (this.displayContainer) { this.displayContainer.destroy({ children: true }); this.displayContainer = undefined; }
        if (!text || text.length === 0) return;

        const style = new PIXI.TextStyle({
            fontFamily: "UbuntuMono, monospace", fontSize: 18, fill: 0x000000,
            wordWrap: true, wordWrapWidth: this.world.width - 24,
        });
        const label = new PIXI.Text({ text, style });
        const pad = 8;
        const g = new PIXI.Graphics();
        g.roundRect(0, 0, label.width + pad * 2, label.height + pad * 2, 6)
            .fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 1, color: 0x333333 });
        label.position.set(pad, pad);
        const box = new PIXI.Container();
        box.addChild(g, label);
        box.position.set(8, 8);
        this.world.app.stage.addChild(box);
        this.displayContainer = box;
        if (millis !== undefined) this.displayTimeout = setTimeout(() => this.displayText("", undefined), millis);
    }

    // ---- ask / answer ----
    // Non-blocking, exactly like upstream: ask() puts the question up and returns
    // immediately; run() polls isAsking()/getAnswer().
    private askQuestion?: string;
    private answer: string = "";

    _ask(question: string) {
        this.askQuestion = question ?? "";
        this.answer = "";
        const inputManager = (this.world as any).interpreter?.inputManager;
        if (!inputManager) { this.askQuestion = undefined; return; }
        inputManager.readInput(
            this.askQuestion, undefined,
            (value: string) => ({ convertedValue: value, errorMessage: undefined }),
            (value: any) => {
                this.answer = value === undefined || value === null ? "" : String(value);
                this.askQuestion = undefined;
            },
        );
    }
    _getAnswer(): string { return this.answer; }
    _isAsking(): boolean { return this.askQuestion !== undefined; }

    _mj$wait$void$int(t: Thread, _callback: CallbackParameter, millis: number) {
        if (millis <= 0) return;
        t.scheduler.suspendThread(t);
        t.state = ThreadState.timedWaiting;
        setTimeout(() => t.scheduler.restoreThread(t), millis);
    }

    /**
     * Poll `condition` until it is true, pausing between checks so the rest of
     * the program keeps running — upstream loops with wait(16) for the same reason.
     */
    _mj$waitUntil$void$BooleanSupplier(t: Thread, callback: CallbackParameter, condition: BooleanSupplierInterface) {
        if (!condition) { if (callback) callback(); return; }

        const check = () => {
            condition._mj$getAsBoolean$boolean$(t, () => {
                if (t.s.pop()) {
                    if (callback) callback();
                    return;
                }
                t.scheduler.suspendThread(t);
                t.state = ThreadState.timedWaiting;
                setTimeout(() => {
                    t.scheduler.restoreThread(t);
                    check();
                }, 16);
            });
        };
        check();
    }

    // ---- backdrop tint and transparency ----
    private backdropTint?: ScratchColorClass;
    private applyBackdropTint() {
        if (this.backdropSprite && !this.backdropSprite.destroyed) {
            this.backdropSprite.tint = this.backdropTint ? (this.backdropTint._get() & 0xffffff) : 0xffffff;
        }
    }
    _setTintRGB(r: number, g: number, b: number) { this.backdropTint = ScratchColorClass.fromRGB(r, g, b); this.applyBackdropTint(); }
    _setTintHue(h: number) { this.backdropTint = ScratchColorClass.fromHue(h); this.applyBackdropTint(); }
    _changeTint(step: number) {
        if (!this.backdropTint) this.backdropTint = ScratchColorClass.fromRGB(255, 255, 255);
        this.backdropTint._changeColor(step);
        this.applyBackdropTint();
    }
    _setTransparency(transparency: number) {
        this.backdropTransparency = Math.max(0, Math.min(100, transparency));
        if (this.backdropSprite && !this.backdropSprite.destroyed) {
            this.backdropSprite.alpha = 1 - this.backdropTransparency / 100;
        }
    }
    _changeTransparency(step: number) { this._setTransparency(this.backdropTransparency + step); }
    private backdropTransparency: number = 0;

    // ---- debugging and program control ----
    private debugEnabled: boolean = false;
    private debugGraphics?: PIXI.Graphics;
    private debugScreenGraphics?: PIXI.Graphics;
    /** Reused so the overlay does not rebuild a PIXI.Text every frame — that
     *  is expensive enough to distort the frame rate it is meant to report. */
    private debugLabels: PIXI.Text[] = [];
    private debugLabelsUsed: number = 0;

    _setDebug(debug: boolean) {
        this.debugEnabled = debug;
        if (!debug) this.clearDebugOverlay();
    }

    private clearDebugOverlay() {
        this.debugGraphics?.clear();
        this.debugScreenGraphics?.clear();
        for (const label of this.debugLabels) label.visible = false;
        this.debugLabelsUsed = 0;
    }

    /** Grab the next pooled label, creating one only when the pool runs out. */
    private debugLabel(text: string, x: number, y: number, centred: boolean, screenSpace: boolean) {
        let label = this.debugLabels[this.debugLabelsUsed];
        if (!label) {
            label = new PIXI.Text({
                text, style: new PIXI.TextStyle({
                    fontFamily: DEBUG_FONT_FAMILY, fontSize: DEBUG_FONT_SIZE, fill: DEBUG_COLOR,
                }),
            });
            this.debugLabels.push(label);
        }
        this.debugLabelsUsed++;
        if (label.text !== text) label.text = text;
        label.visible = true;
        label.anchor.set(centred ? 0.5 : 0, centred ? 0.5 : 0);
        label.position.set(x, y);
        const target = screenSpace ? this.scratchLayers?.debugScreen : this.scratchLayers?.debugWorld;
        if (target && label.parent !== target) target.addChild(label);
    }

    /**
     * The debug overlay, mirroring what org.openpatch.scratch.Stage draws when
     * debug is on: each sprite's hitbox, direction and position, a crosshair on
     * the mouse with its coordinates, the frame rate and the camera state.
     */
    private renderDebugOverlay() {
        const layers = this.scratchLayers;
        if (!layers) return;

        if (!this.debugGraphics || this.debugGraphics.destroyed) {
            this.debugGraphics = new PIXI.Graphics();
            layers.debugWorld.addChild(this.debugGraphics);
        }
        if (!this.debugScreenGraphics || this.debugScreenGraphics.destroyed) {
            this.debugScreenGraphics = new PIXI.Graphics();
            layers.debugScreen.addChild(this.debugScreenGraphics);
        }

        this.debugGraphics.clear();
        this.debugScreenGraphics.clear();
        for (const label of this.debugLabels) label.visible = false;
        this.debugLabelsUsed = 0;

        const W = this.world.width, H = this.world.height;

        // per sprite: UI sprites are measured in screen space, the rest move with the camera
        for (const sprite of this.sprites) {
            if (sprite.isDestroyed) continue;
            const ui = sprite.isUI();
            const g = ui ? this.debugScreenGraphics : this.debugGraphics;
            sprite.drawDebug(g, (text, x, y) => this.debugLabel(text, x, y, true, ui));
        }

        // crosshair on the mouse, in screen space
        const mouseX = this._getMouseX(), mouseY = this._getMouseY();
        const screenX = W / 2 + this.camera._toGlobalX(mouseX);
        const screenY = H / 2 - this.camera._toGlobalY(mouseY);
        this.debugScreenGraphics
            .moveTo(screenX, 0).lineTo(screenX, H)
            .moveTo(0, screenY).lineTo(W, screenY)
            .stroke({ width: 1, color: DEBUG_COLOR });
        this.debugLabel("(" + round2(mouseX) + ", " + round2(mouseY) + ")", screenX, screenY, false, true);

        this.debugLabel("FPS: " + roundInt(this._getFrameRate()), 20, 20, false, true);
        this.debugLabel("Camera: (" + round2(this.camera.x) + ", " + round2(this.camera.y) + ") "
            + roundInt(this.camera.zoom), 20, 40, false, true);
    }
    _isDebug(): boolean { return this.debugEnabled; }
    _debug(values: any[]) {
        if (!this.debugEnabled) return;
        const parts = (values ?? []).map(v => (v instanceof StringClass ? v.value : String(v)));
        const text = `[${this.constructor.name}] ${parts.join(" ")}`;
        const printManager = (this.world as any)?.interpreter?.printManager;
        if (printManager) printManager.print(text, true, 0x808080);
        else console.log(text);
    }

    _exit() {
        const interpreter = (this.world as any)?.interpreter;
        if (interpreter) interpreter.stop(false);
    }

    _setCursor(path: string) { this._setCursor3(path, 0, 0); }

    /**
     * Costumes live in a shared atlas, so the requested image is rendered out to
     * its own canvas first — a CSS cursor pointing at the atlas would show the
     * whole sheet.
     */
    _setCursor3(path: string, x: number, y: number) {
        const canvas = (this.world.app as any)?.canvas as HTMLCanvasElement | undefined;
        if (!canvas) return;
        const texture = ScratchCostumes.getTexture(path);
        if (!texture) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + path);
        const extracted = this.world.app.renderer.extract.canvas(texture) as HTMLCanvasElement;
        if (!extracted?.toDataURL) {
            desktopOnly("Stage.setCursor()");
            return;
        }
        canvas.style.cursor = `url(${extracted.toDataURL()}) ${Math.round(x)} ${Math.round(y)}, auto`;
    }

    // ---- desktop-only extensions ----
    _getPixels() { return desktopOnlyValue("Stage.getPixels()", undefined, "Der Bildpuffer ist im Browser nicht zugänglich. / The pixel buffer is not reachable in the browser."); }
    _getShaders() { return desktopOnlyValue("Stage.getShaders()", undefined, "Shader brauchen OpenGL. / Shaders need OpenGL."); }
    _getSorting() { return desktopOnlyValue("Stage.getSorting()", undefined); }

    // ---- dimensions ----
    _getCamera(): ScratchCameraClass { return this.camera; }
    _getWidth(): number { return Math.round(this.world.width); }
    _getHeight(): number { return Math.round(this.world.height); }

    // ---- input ----
    _isKeyPressed(key: KeyCodeEnum): boolean {
        const km = (this.world as any).interpreter?.keyboardManager;
        if (!km || !key) return false;
        return key.browserKeys.some(k => km.isPressed(k));
    }
    _getMouseX(): number { return ScratchSpriteClass.mouseLogicalX(this.world); }
    _getMouseY(): number { return ScratchSpriteClass.mouseLogicalY(this.world); }
    _getMouse(): ScratchVector2Class { return new ScratchVector2Class(this._getMouseX(), this._getMouseY()); }
    _isMouseDown(): boolean { return ScratchSpriteClass.mouseDown; }

    _pickRandom(from: number, to: number): number {
        if (from > to) [from, to] = [to, from];
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

    // ---- InternalMouseListener ----
    onMouseEvent(kind: MouseEventKind, x: number, y: number): void {
        ScratchSpriteClass.mouseScreenX = x;
        ScratchSpriteClass.mouseScreenY = y;
        if (kind === "mousedown") ScratchSpriteClass.mouseDown = true;
        else if (kind === "mouseup") ScratchSpriteClass.mouseDown = false;
    }
}
