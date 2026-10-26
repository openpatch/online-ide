import { ScratchSoundPlaybackClass } from "./ScratchSoundPlaybackClass";
import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { KeyDownListener } from "../../../../common/interpreter/KeyboardManager";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ClassClass } from "../../system/ClassClass";
import { StringClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ActorClass } from "../ActorClass";
import { IWorld } from "../IWorld";
import { ComparatorInterface } from "../../system/collections/ComparatorInterface";
import { InternalMouseListener, MouseEventKind } from "../MouseManager2D";
import { KeyCodeEnum } from "./KeyCodeEnum";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { ScratchCameraClass } from "./ScratchCameraClass";
import { ScratchColorClass } from "./ScratchColorClass";
import { ScratchCostumes, assetNameFromPath } from "./ScratchCostumes";
import { DEBUG_COLOR, DEBUG_FONT_FAMILY, DEBUG_FONT_SIZE, round2, roundInt } from "./ScratchDebug";
import { loadScratchFont, roundToScratchPixelGrid, scratchDefaultFontFamily } from "./ScratchFont";
import { applyCameraTransform, createScratchLayers, ScratchLayers } from "./ScratchLayers";
import { scratchSpriteList } from "./ScratchLists";
import { ScratchPenClass } from "./ScratchPenClass";
import { IScratchEventReceiver, ScratchRuntimeManager } from "./ScratchRuntimeManager";
import { ScratchSoundBank } from "./ScratchSounds";
import { isLibraryInstance, ScratchSpriteClass } from "./ScratchSpriteClass";
import { ScratchTextClass } from "./ScratchTextClass";
import { createColorEffectFilter } from "./ScratchEffects";
import { ScratchTimerClass } from "./ScratchTimerClass";
import {
    beginScratchStages, IScratchStageLike, isScratchStageActive,
    scratchStagesRunning,
} from "./ScratchStages";
import { ScratchShadersClass } from "./ScratchShaders";
import { beginScratchProgram, desktopOnly, desktopOnlyValue } from "./ScratchUnsupported";
import { resetPixelArtOnEveryRun } from "./ScratchPixelArt";
import { setAssetBase } from "./ScratchAssetUrls";
import { BooleanSupplierInterface } from "./BooleanSupplierInterface";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { SRC } from "./ScratchLibraryComments";
import { ScratchWorkspaceAssets } from "./ScratchWorkspaceAssets";
import { scratchGameClock } from './ScratchGameClock';
import { ScratchMonitors } from './ScratchMonitors';
import { SupplierInterface } from './SupplierInterface';
import { clearScratchStampLayer } from './ScratchTiledRendering';

/** Processing's default frame rate, which upstream never changes. */
const SCRATCH_FRAMES_PER_SECOND = 60;

/** Upstream's Text starts at 14pt, which is what display() is drawn in. */
const DISPLAY_FONT_SIZE = 14;

/** Scratch's ask card measures, upstream's AskDraw (scratch-gui's question box). */
const ASK_MARGIN = 8;
const ASK_PADDING = 16;
const ASK_GAP = 8;
const ASK_FIELD = 32;
const ASK_INSET = 12;
const ASK_BUTTON = 24;
const ASK_BUTTON_INSET = 4;
/** The ink of the ask card's question, answer and caret, scratch-gui's blue-grey. */
const ASK_TEXT_COLOR = 0x575e75;
/** The blue of the ask card's check button, scratch-gui's. */
const ASK_BUTTON_COLOR = 0x4c97ff;
/** Upstream's Text default stroke, the light grey frame of the display band. */
const DISPLAY_STROKE_COLOR = 0xc9c9c9;
/** The ask card's caret is on this long, then off this long, upstream's tick / 30 % 2. */
const CARET_BLINK_MILLIS = 500;

/**
 * A scene, mirroring org.openpatch.scratch.Stage (core subset).
 *
 * The first stage a program builds owns the IDE WorldClass singleton (created
 * lazily/async), resets the program timer and loads the built-in costume
 * atlases. Further stages share that world and wait off screen until
 * Window.setStage()/transitionToStage() brings them up; only the active stage
 * draws, runs its overridable run() every frame — via ActorClass — and receives
 * input. Coordinate system is Scratch's: centre origin, y up (conversion lives
 * in ScratchSpriteClass).
 */
export class ScratchStageClass extends ActorClass implements InternalMouseListener, IScratchStageLike {
    readonly usesScratchGameClock = true;
    readonly variableMonitors = new ScratchMonitors();
    _mj$showVariable$void$string$Supplier(t: Thread, callback: CallbackParameter, name: string, supplier: SupplierInterface) {
        this.variableMonitors.show(t, name, supplier);
        if (callback) callback();
    }
    _hideVariable(name: string) { this.variableMonitors.hide(name); }
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Stage extends Actor", comment: SRC.stageClassComment },

        { type: "method", signature: "Stage()", java: ScratchStageClass.prototype._cj$_constructor_$Stage$, comment: SRC.stageConstructorComment },
        { type: "method", signature: "void showVariable(string name, Supplier<Object> value)", java: ScratchStageClass.prototype._mj$showVariable$void$string$Supplier },
        { type: "method", signature: "void hideVariable(string name)", native: ScratchStageClass.prototype._hideVariable },

        { type: "method", signature: "void run()", java: ScratchStageClass.prototype._mj$run$void$, comment: SRC.stageRunComment },

        // overridable event hooks
        { type: "method", signature: "void whenIReceive(String message)", java: ScratchStageClass.prototype._mj$whenIReceive$void$String, comment: SRC.stageWhenIReceiveComment },
        { type: "method", signature: "void whenKeyPressed(KeyCode key)", java: ScratchStageClass.prototype._mj$whenKeyPressed$void$KeyCode, comment: SRC.stageWhenKeyPressedComment },
        { type: "method", signature: "void whenKeyReleased(KeyCode key)", java: ScratchStageClass.prototype._mj$whenKeyReleased$void$KeyCode, comment: SRC.stageWhenKeyReleasedComment },
        { type: "method", signature: "void whenMouseClicked(MouseCode button)", java: ScratchStageClass.prototype._mj$whenMouseClicked$void$MouseCode, comment: SRC.stageWhenMouseClickedComment },
        { type: "method", signature: "void whenMouseWheelMoved(double steps)", java: ScratchStageClass.prototype._mj$whenMouseWheelMoved$void$double, comment: SRC.stageWhenMouseWheelMovedComment },

        { type: "method", signature: "void whenBackdropSwitches(String name)", java: ScratchStageClass.prototype._mj$whenBackdropSwitches$void$String, comment: SRC.stageWhenBackdropSwitchesComment },

        { type: "method", signature: "void broadcast(String message)", java: ScratchStageClass.prototype._mj$broadcast$void$String, comment: SRC.stageBroadcastComment },

        { type: "method", signature: "void add(Sprite sprite)", java: ScratchStageClass.prototype._mj$add$void$Sprite, comment: SRC.stageAddComment },
        { type: "method", signature: "void add(Pen pen)", native: ScratchStageClass.prototype._addPen, comment: SRC.stageAdd2Comment },
        { type: "method", signature: "void add(Text text)", java: ScratchStageClass.prototype._mj$add$void$Text, comment: SRC.stageAdd3Comment },
        { type: "method", signature: "void remove(Text text)", native: ScratchStageClass.prototype._removeText, comment: SRC.stageRemoveComment },
        { type: "method", signature: "void remove(Pen pen)", native: ScratchStageClass.prototype._removePen, comment: SRC.stageRemove2Comment },
        { type: "method", signature: "void remove(Sprite sprite)", java: ScratchStageClass.prototype._mj$remove$void$Sprite, comment: SRC.stageRemove3Comment },
        { type: "method", signature: "void removeAll()", java: ScratchStageClass.prototype._mj$removeAll$void$, comment: SRC.stageRemoveAllComment },
        { type: "method", signature: "void remove(Class<? extends Sprite> c)", java: ScratchStageClass.prototype._mj$remove$void$Class, comment: SRC.stageRemove4Comment },
        { type: "method", signature: "List<Sprite> getAll()", java: ScratchStageClass.prototype._mj$getAll$List$, comment: SRC.stageGetAllComment },
        { type: "method", signature: "<T extends Sprite> List<T> find(Class<T> c)", java: ScratchStageClass.prototype._mj$find$List$Class, comment: SRC.stageFindComment },
        { type: "method", signature: "<T extends Sprite> int count(Class<T> c)", native: ScratchStageClass.prototype._count, comment: SRC.stageCountComment },

        // backdrops
        { type: "method", signature: "void addBackdrop(string imagePath)", java: ScratchStageClass.prototype._mj$addBackdrop$void$string, comment: SRC.stageAddBackdropComment },
        { type: "method", signature: "void addBackdrop(string name, string imagePath)", java: ScratchStageClass.prototype._mj$addBackdrop$void$string$string, comment: SRC.stageAddBackdrop2Comment },
        { type: "method", signature: "void addBackdrop(string name, string imagePath, boolean stretch)", java: ScratchStageClass.prototype._mj$addBackdrop$void$string$string$boolean, comment: SRC.stageAddBackdrop3Comment },
        { type: "method", signature: "void switchBackdrop(string name)", native: ScratchStageClass.prototype._switchBackdrop, comment: SRC.stageSwitchBackdropComment },
        { type: "method", signature: "void nextBackdrop()", native: ScratchStageClass.prototype._nextBackdrop, comment: SRC.stageNextBackdropComment },
        { type: "method", signature: "void previousBackdrop()", native: ScratchStageClass.prototype._previousBackdrop, comment: SRC.stagePreviousBackdropComment },
        { type: "method", signature: "void randomBackdrop()", native: ScratchStageClass.prototype._randomBackdrop, comment: SRC.stageRandomBackdropComment },
        { type: "method", signature: "string getCurrentBackdropName()", native: ScratchStageClass.prototype._getCurrentBackdropName, comment: SRC.stageGetCurrentBackdropNameComment },
        { type: "method", signature: "int getCurrentBackdropIndex()", native: ScratchStageClass.prototype._getCurrentBackdropIndex, comment: SRC.stageGetCurrentBackdropIndexComment },

        // sound
        { type: "method", signature: "void addSound(string soundPath)", native: ScratchStageClass.prototype._addSound, comment: SRC.stageAddSoundComment },
        { type: "method", signature: "void addSound(string name, string soundPath)", native: ScratchStageClass.prototype._addSound2, comment: SRC.stageAddSound2Comment },
        { type: "method", signature: "void playSound(string name)", native: ScratchStageClass.prototype._playSound, comment: SRC.stagePlaySoundComment },
        { type: "method", signature: "SoundPlayback playSoundCopy(string name, double volume)", native: ScratchStageClass.prototype._playSoundCopy },
        { type: "method", signature: "void stopSound(string name)", native: ScratchStageClass.prototype._stopSound, comment: SRC.stageStopSoundComment },
        { type: "method", signature: "void stopAllSounds()", native: ScratchStageClass.prototype._stopAllSounds, comment: SRC.stageStopAllSoundsComment },
        { type: "method", signature: "boolean isSoundPlaying(string name)", native: ScratchStageClass.prototype._isSoundPlaying, comment: SRC.stageIsSoundPlayingComment },
        { type: "method", signature: "void setVolume(double percent)", native: ScratchStageClass.prototype._setVolume, comment: SRC.stageSetVolumeComment },
        { type: "method", signature: "void changeVolume(double step)", native: ScratchStageClass.prototype._changeVolume, comment: SRC.stageChangeVolumeComment },
        { type: "method", signature: "double getVolume()", native: ScratchStageClass.prototype._getVolume, comment: SRC.stageGetVolumeComment },

        // background colour
        { type: "method", signature: "void setColor(Color color)", native: ScratchStageClass.prototype._setColorObj, comment: SRC.stageSetColorComment },
        { type: "method", signature: "void setColor(double r, double g, double b)", native: ScratchStageClass.prototype._setColorRGB, comment: SRC.stageSetColor2Comment },
        { type: "method", signature: "Color getColor()", native: ScratchStageClass.prototype._getColor, comment: SRC.stageGetColorComment },
        { type: "method", signature: "void setColorEffect(double effect)", native: ScratchStageClass.prototype._setColorEffect, comment: SRC.stageSetColorEffectComment },
        { type: "method", signature: "void changeColorEffect(double by)", native: ScratchStageClass.prototype._changeColorEffect, comment: SRC.stageChangeColorEffectComment },
        { type: "method", signature: "double getColorEffect()", native: ScratchStageClass.prototype._getColorEffect, comment: SRC.stageGetColorEffectComment },

        { type: "method", signature: "Camera getCamera()", native: ScratchStageClass.prototype._getCamera, comment: SRC.stageGetCameraComment },

        // backdrop tint and transparency
        { type: "method", signature: "void setTint(Color c)", native: ScratchStageClass.prototype._setTintObj, comment: SRC.stageSetTintComment },
        { type: "method", signature: "void setTransparency(double transparency)", native: ScratchStageClass.prototype._setTransparency, comment: SRC.stageSetTransparencyComment },
        { type: "method", signature: "void changeTransparency(double step)", native: ScratchStageClass.prototype._changeTransparency, comment: SRC.stageChangeTransparencyComment },
        { type: "method", signature: "double getTransparency()", native: ScratchStageClass.prototype._getTransparency, comment: SRC.stageGetTransparencyComment },

        // debugging and program control
        { type: "method", signature: "void debug(Object... values)", native: ScratchStageClass.prototype._debug, comment: SRC.stageDebugComment },
        { type: "method", signature: "void waitUntil(BooleanSupplier condition)", java: ScratchStageClass.prototype._mj$waitUntil$void$BooleanSupplier, comment: SRC.stageWaitUntilComment },
        { type: "method", signature: "void setCursor(string path)", native: ScratchStageClass.prototype._setCursor, comment: SRC.stageSetCursorComment },
        { type: "method", signature: "void setCursor(string path, int x, int y)", native: ScratchStageClass.prototype._setCursor3, comment: SRC.stageSetCursor2Comment },

        // desktop-only extensions
        { type: "method", signature: "Shaders getShaders()", native: ScratchStageClass.prototype._getShaders, comment: SRC.stageGetShadersComment },
        { type: "method", signature: "void sortByY()", native: ScratchStageClass.prototype._sortByY, comment: SRC.stageSortByYComment },
        { type: "method", signature: "void sortBy(Comparator<? super Sprite> comparator)", java: ScratchStageClass.prototype._mj$sortBy$void$Comparator, comment: SRC.stageSortByComment },
        { type: "method", signature: "void stopSorting()", native: ScratchStageClass.prototype._stopSorting, comment: SRC.stageStopSortingComment },
        { type: "method", signature: "int getWidth()", native: ScratchStageClass.prototype._getWidth, comment: SRC.stageGetWidthComment },
        { type: "method", signature: "int getHeight()", native: ScratchStageClass.prototype._getHeight, comment: SRC.stageGetHeightComment },

        { type: "method", signature: "boolean isKeyPressed(KeyCode key)", native: ScratchStageClass.prototype._isKeyPressed, comment: SRC.stageIsKeyPressedComment },
        { type: "method", signature: "double getMouseX()", native: ScratchStageClass.prototype._getMouseX, comment: SRC.stageGetMouseXComment },
        { type: "method", signature: "double getMouseY()", native: ScratchStageClass.prototype._getMouseY, comment: SRC.stageGetMouseYComment },
        { type: "method", signature: "Vector2 getMouse()", native: ScratchStageClass.prototype._getMouse, comment: SRC.stageGetMouseComment },
        { type: "method", signature: "boolean isMouseDown()", native: ScratchStageClass.prototype._isMouseDown, comment: SRC.stageIsMouseDownComment },

        { type: "method", signature: "Timer getTimer()", native: ScratchStageClass.prototype._getTimer, comment: SRC.stageGetTimerComment },


        { type: "method", signature: "void eraseAll()", native: ScratchStageClass.prototype._eraseAll, comment: SRC.stageEraseAllComment },
        { type: "method", signature: "void display(string text)", native: ScratchStageClass.prototype._display, comment: SRC.stageDisplayComment },
        { type: "method", signature: "void display(string text, double seconds)", native: ScratchStageClass.prototype._displayFor, comment: SRC.stageDisplay2Comment },

        { type: "method", signature: "void waitSeconds(double seconds)", java: ScratchStageClass.prototype._mj$waitSeconds$void$double, comment: SRC.stageWaitComment },

        { type: "method", signature: "void ask(string question)", native: ScratchStageClass.prototype._ask, comment: SRC.stageAskComment },
        { type: "method", signature: "string getAnswer()", native: ScratchStageClass.prototype._getAnswer, comment: SRC.stageGetAnswerComment },
        { type: "method", signature: "boolean isAsking()", native: ScratchStageClass.prototype._isAsking, comment: SRC.stageIsAskingComment },

        { type: "method", signature: "int pickRandom(int from, int to)", native: ScratchStageClass.prototype._pickRandom, comment: SRC.stagePickRandomComment },
    ];

    static type: NonPrimitiveType;

    world!: IWorld;
    sprites: ScratchSpriteClass[] = [];
    private pens = new Set<ScratchPenClass>();
    private texts = new Set<ScratchTextClass>();
    runtime!: ScratchRuntimeManager;

    /** Read by sprites and pens via scratchLayerOf(); see ScratchLayers.ts. */
    scratchLayers?: ScratchLayers;

    camera: ScratchCameraClass = new ScratchCameraClass();
    /** 7.0's sortByY: sprites drawn in the order of their lower edge. */
    sortByYEnabled: boolean = false;
    /** The comparator sortBy() was last called with; undefined unless its order is active. */
    private sortComparator?: ComparatorInterface;
    /** The comparator re-sort in flight: one interpreter thread walking a merge sort. */
    private sortJob?: { thread: Thread; sprites: ScratchSpriteClass[] };

    private backdrops: { name: string; texture: PIXI.Texture; stretch: boolean }[] = [];
    private currentBackdrop: number = -1;
    private soundBank: ScratchSoundBank = new ScratchSoundBank();
    private timers: Map<string, ScratchTimerClass> = new Map();

    /**
     * A stage is as big as the window it is shown in, so the window comes
     * first, as upstream: `new Window(480, 360)`, then `setStage(new MyStage())`.
     */
    _cj$_constructor_$Stage$(t: Thread, callback: CallbackParameter) {
        const interpreter = t.scheduler.interpreter;
        const existing = interpreter.retrieveObject("WorldClass") as IWorld;
        if (!existing) {
            throw new RuntimeExceptionClass(
                "Erst das Fenster, dann die Bühne: Window myWindow = new Window(480, 360); "
                + "myWindow.setStage(new MyStage()); / Create the Window before the first Stage: "
                + "Window myWindow = new Window(480, 360); myWindow.setStage(new MyStage());");
        }

        const finish = (world: IWorld) => {
            this.world = world;
            // beginScratchStages tells the first stage of a run from a later one:
            // the World is new for every run, and the stages of the previous run
            // go with it
            const firstStageOfRun = beginScratchStages(world);
            if (firstStageOfRun) {
                beginScratchProgram(interpreter);
                resetPixelArtOnEveryRun(interpreter);
                // relative image and sound paths start from the project folder
                setAssetBase(interpreter.getMain?.()?.getAssetBaseUrl?.());
                // the program's own pictures, sounds and fonts, found by the
                // paths it would read them from on the desktop
                // (an interpreter without an IDE around it, as in the tests, has none)
                ScratchWorkspaceAssets.load(interpreter.getMain?.()?.getCurrentWorkspace());
                // Upstream runs at Processing's default of 60 frames a second,
                // and run() moves things per frame; at the World's usual 30 a
                // sprite doing move(2) crossed the stage at half the speed.
                // The World is built anew for every run, so other programs keep
                // their 30.
                const ticker = world.app?.ticker;
                if (ticker) ticker.maxFPS = SCRATCH_FRAMES_PER_SECOND;
            }
            this.scratchLayers = createScratchLayers(world.app.stage);
            this.scratchLayers.root.visible = false;
            this.scratchLayers.root.removeFromParent();
            this.runtime = ScratchRuntimeManager.forInterpreter(interpreter, world);
            // off screen until Window.setStage() or transitionToStage() shows it

            const oldState = t.state;
            t.state = ThreadState.waiting;
            // Sounds need no loading step: their URLs come from the bundler, and the
            // OGG files are fetched when a sound is first played.
            Promise.all([ScratchCostumes.load(), loadScratchFont(), ScratchWorkspaceAssets.ready()]).then(() => {
                // The clock starts where the program does, which is here and not
                // where the loading began: the thread is parked until the
                // spritesheets are there, and a clock started before that wait
                // counts it, so Timer.millis() is already that old in the program's
                // first frame. How much depends on what the browser had cached -
                // nothing on a cold load, which is where it was measured at 7s.
                if (firstStageOfRun) ScratchTimerClass.resetProgramStart();
                interpreter.storeObject('ScratchGameClock', scratchGameClock());
                t.state = oldState;
                t.s.push(this);
                this.registerIfNobodyElseWill(t, callback);
                if (callback) callback();
            });
        };

        finish(existing);
    }

    // ---- being the stage on screen ----
    isActive(): boolean { return isScratchStageActive(this); }

    /**
     * Come on screen. Everything the stages share — the window's background
     * colour, the camera transform, which stage global lookups resolve to — has
     * to be (re-)established here, because the other stage just had it set to
     * its own values.
     */
    _activate(): void {
        if (!this.world) return;
        if (this.scratchLayers) {
            this.world.app.stage.addChild(this.scratchLayers.root);
            this.scratchLayers.root.visible = true;
        }
        const listeners = this.world.mouseManager.internalMouseListeners;
        if (!listeners.includes(this)) listeners.push(this);
        for (const sprite of this.sprites) if (sprite.stage === this) sprite.syncWorldRegistration(true);
        this.applyBgColor();
        this._applyCamera();
        // a question that was open when the stage went off screen keeps blinking
        if (this.askQuestion !== undefined) this.scheduleCaretBlink();
    }

    _deactivate(): void {
        if (this.scratchLayers) {
            this.scratchLayers.root.visible = false;
            this.scratchLayers.root.removeFromParent();
        }
        const listeners = this.world?.mouseManager.internalMouseListeners;
        const index = listeners?.indexOf(this) ?? -1;
        if (index >= 0) listeners!.splice(index, 1);
        for (const sprite of this.sprites) if (sprite.stage === this) sprite.syncWorldRegistration(false);
        if (this.debugEnabled) this.clearDebugOverlay();
        this.cancelCaretBlink();
    }

    // ---- per-frame ----
    /**
     * Only the stage on screen steps. Upstream reaches exactly one stage's render
     * loop per frame, and holds even that one still while a transition fades the
     * outgoing picture away.
     *
     * <p>run() must not be reached before the subclass constructor has finished.
     * The stage goes on screen from the base constructor — that is where upstream
     * puts the first stage of a program too — so between that moment and the end
     * of `new MyStage()` there is a stage on screen whose fields the program has
     * not assigned yet, and a run() touching one of them fails with a
     * NullPointerException. It showed up on the second run of a program, once the
     * costumes were in the cache and the constructor no longer waited for them.
     * listenersRegistered says the constructor is through: the compiler calls
     * _registerListeners once it is (TermCodeGenerator.invokeConstructor), and
     * where there is no subclass the base constructor does it itself.
     */
    _mj$act$void$(t: Thread, callback: CallbackParameter): void {
        if (!this.listenersRegistered || !this.isActive() || !scratchStagesRunning()) {
            if (callback) callback();
            return;
        }
        this._mj$run$void$(t, callback);
    }

    /**
     * Called from the PIXI ticker after the program's threads have had their
     * slice of the frame and before the renderer paints it (see startPreRender
     * in ScratchStages). Both of these describe where things are *now*, so they
     * have to be worked out here: done from act(), which runs at the start of
     * the frame, the camera and the debug overlay were a frame behind whatever
     * the program moved in between.
     *
     * The sort order is NOT worked out here: a batch of ticks re-applies it
     * (see ScratchGameClock.runFrame), the way the desktop re-sorts in tick(),
     * so it follows the game speed and holds still while paused.
     */
    _preRender(): void {
        if (!this.isActive() || !this.world?.app) return;
        ScratchMonitors.refresh(this);
        ScratchTextClass.refreshAttached(this.world);
        this._applyCamera();
        if (this.debugEnabled) this.renderDebugOverlay();
    }

    /**
     * Sorting.byY() and Sorting.by(comparator): the layer order the stage was
     * last told to use, back to front. PIXI keeps the children of the sprites
     * layer in the order they were added; with sortableChildren it draws them by
     * zIndex instead, and falls back to that order again once sorting is
     * switched off. Re-applied once per batch of ticks (ScratchGameClock.runFrame),
     * because every batch something may have moved; while paused the order
     * holds still, as on the desktop.
     */
    _applySorting() {
        const layer = this.scratchLayers?.sprites;
        if (!layer || layer.destroyed) return;
        if (this.sortComparator && !this.sortByYEnabled) {
            layer.sortableChildren = true;
            this.applyComparatorOrder();
            return;
        }
        if (!this.sortByYEnabled) {
            if (layer.sortableChildren) layer.sortableChildren = false;
            return;
        }
        layer.sortableChildren = true;
        for (const sprite of this.sprites) {
            if (sprite.isDestroyed || sprite.isUI()) continue;
            sprite._setDrawDepth(-(sprite._getY() - sprite._getSpriteHeight() / 2));
        }
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
    _mj$whenMouseWheelMoved$void$double(_t: Thread, callback: CallbackParameter, _steps: number): void { if (callback) callback(); }

    private listenersRegistered = false;

    /**
     * Registers this stage for act() and for the Scratch events, unless the
     * compiler is going to do it.
     *
     * <p>TermCodeGenerator.invokeConstructor only arranges that call for classes
     * the program itself declares — `!klassType.isLibraryType`. A program that
     * writes `new Stage(600, 240)` rather than subclassing therefore never
     * acted: the camera transform was never re-applied and setDebug(true) drew
     * nothing, because the debug overlay is painted once per frame from act().
     * It cannot be done in the constructor for a subclass, because act() must
     * not reach an object whose own constructor has not finished; but where no
     * callback came in there is no subclass constructor left to wait for -
     * unless the object is of a class the program declares, whose constructor
     * calls super() without a callback too (see ScratchSpriteClass).
     */
    private registerIfNobodyElseWill(t: Thread, callback: CallbackParameter) {
        if (!callback && isLibraryInstance(this)) this._registerListeners(t);
    }

    // Called by the compiler after the constructor completes; register overridden hooks.
    _registerListeners(t: Thread): void {
        if (this.listenersRegistered) return;
        this.listenersRegistered = true;
        super._registerListeners(t);
        this.runtime.register(this as IScratchEventReceiver, {
            iReceive: this._mj$whenIReceive$void$String !== ScratchStageClass.prototype._mj$whenIReceive$void$String,
            keyPressed: this._mj$whenKeyPressed$void$KeyCode !== ScratchStageClass.prototype._mj$whenKeyPressed$void$KeyCode,
            keyReleased: this._mj$whenKeyReleased$void$KeyCode !== ScratchStageClass.prototype._mj$whenKeyReleased$void$KeyCode,
            mouseClicked: this._mj$whenMouseClicked$void$MouseCode !== ScratchStageClass.prototype._mj$whenMouseClicked$void$MouseCode,
            backdropSwitches: this._mj$whenBackdropSwitches$void$String !== ScratchStageClass.prototype._mj$whenBackdropSwitches$void$String,
            mouseMoved: this._mj$whenMouseMoved$void$double$double !== ScratchStageClass.prototype._mj$whenMouseMoved$void$double$double,
            mouseWheelMoved: this._mj$whenMouseWheelMoved$void$double !== ScratchStageClass.prototype._mj$whenMouseWheelMoved$void$double,
            // Every object is registered for the gamepad events; the dispatch
            // only reaches those that implement a GamepadListener hook.
            gamepad: true,
        });
    }

    /** The stage an event receiver belongs to; for a stage, itself. */
    _scratchStage(): object { return this; }

    /**
     * Declared as `String message`, so the argument arrives boxed as a StringClass.
     * Upstream walks its own sprite list, so the message stays on this stage.
     */
    _broadcast(message: StringClass) { this.runtime.broadcast(message, this); }
    _mj$broadcast$void$String(t: Thread, callback: CallbackParameter, message: StringClass) {
        this.runtime.broadcastInThread(t, callback, message, this);
    }

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
        // a sprite built before this stage was on screen drew itself into
        // whichever stage was, so it has to be moved over now
        sprite.attachToStage(this);
        sprite._registerListeners(t);
        const hook = (sprite as any)._mj$whenAddedToStage$void$;
        if (!hook) {
            if (callback) callback();
            return;
        }
        hook.call(sprite, t, callback);
    }

    /** A stage-owned Pen simply needs a world to draw into. */
    _addPen(pen: ScratchPenClass) {
        if (!pen) return;
        this.pens.add(pen);
        pen.stage = this;
        pen.attachToWorld(this.world);
    }

    /** Texts get the same treatment: their hooks run before add() returns. */
    _mj$add$void$Text(t: Thread, callback: CallbackParameter, text: ScratchTextClass) {
        if (!text) {
            if (callback) callback();
            return;
        }
        this.texts.add(text);
        text.world = this.world;
        text.attachToStage(this);
        text._mj$addedToStage$void$Stage(t, callback, this);
    }
    _removeText(text: ScratchTextClass) {
        if (!text) return;
        this.texts.delete(text);
        text._remove();
        if (text.stage === this) text.stage = undefined;
    }
    _removePen(pen: ScratchPenClass) {
        this.pens.delete(pen);
        pen?._removedFromStage(this);
        if (pen) pen.stage = undefined;
    }
    _remove(sprite: ScratchSpriteClass) {
        if (sprite?.stage === this) sprite._remove();
    }
    /** As upstream: the sprites, then the texts, then the pens. */
    _removeAll() {
        for (const s of this.sprites.slice()) this._remove(s);
        this.removeTextsAndPens();
    }

    private removeTextsAndPens() {
        for (const text of [...this.texts]) this._removeText(text);
        for (const pen of [...this.pens]) this._removePen(pen);
    }

    _mj$remove$void$Sprite(t: Thread, callback: CallbackParameter, sprite: ScratchSpriteClass) {
        if (sprite?.stage === this) sprite._mj$remove$void$(t, callback);
        else callback?.();
    }

    private removeSprites(t: Thread, callback: CallbackParameter, sprites: ScratchSpriteClass[]) {
        let index = 0;
        const next = () => {
            const sprite = sprites[index++];
            if (sprite) this._mj$remove$void$Sprite(t, next, sprite);
            else callback?.();
        };
        next();
    }

    _mj$removeAll$void$(t: Thread, callback: CallbackParameter) {
        this.removeSprites(t, () => { this.removeTextsAndPens(); callback?.(); }, [...this.sprites]);
    }

    _mj$remove$void$Class(t: Thread, callback: CallbackParameter, c: ClassClass) {
        this.removeSprites(t, callback, this.spritesOfClass(c));
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
    // java.util.List or, next to the NRW classes, the nrw List; see scratchSpriteList
    _mj$getAll$List$(t: Thread, callback: CallbackParameter) {
        t.s.push(scratchSpriteList(t, this.sprites.slice()));
        if (callback) callback();
    }
    _mj$find$List$Class(t: Thread, callback: CallbackParameter, c: ClassClass) {
        t.s.push(scratchSpriteList(t, this.spritesOfClass(c)));
        if (callback) callback();
    }
    _count(c: ClassClass): number { return this.spritesOfClass(c).length; }

    // ---- backdrops ----
    /**
     * Backdrops are drawn full-stage behind everything else. `stretch` scales the
     * image to the stage size; otherwise it is centred at its natural size.
     */
    private backdropSprite?: PIXI.Sprite;

    _mj$addBackdrop$void$string(t: Thread, callback: CallbackParameter, imagePath: string) {
        this.loadBackdrop(t, assetNameFromPath(imagePath), imagePath, false, callback);
    }

    _mj$addBackdrop$void$string$string(t: Thread, callback: CallbackParameter, name: string, imagePath: string) {
        this.loadBackdrop(t, name, imagePath, false, callback);
    }

    _mj$addBackdrop$void$string$string$boolean(t: Thread, callback: CallbackParameter, name: string, imagePath: string, stretch: boolean) {
        this.loadBackdrop(t, name, imagePath, stretch, callback);
    }

    private loadBackdrop(t: Thread, name: string, imagePath: string, stretch: boolean, callback: CallbackParameter) {
        if (this.backdrops.some(b => b.name === name)) {
            if (callback) callback();
            return;
        }
        const oldState = t.state;
        t.state = ThreadState.waiting;
        ScratchCostumes.loadTexture(imagePath).then(texture => {
            this.backdrops.push({ name, texture, stretch });
            if (this.currentBackdrop < 0) this._applyBackdropIndex(this.backdrops.length - 1);
            t.state = oldState;
            if (callback) callback();
        }).catch(reason => {
            t.state = oldState;
            t.throwRuntimeExceptionOnLastExecutedStep(new RuntimeExceptionClass(
                `Bild konnte nicht geladen werden / could not load image '${imagePath}': ${reason}`
            ));
        });
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
        // the sprite is brand new, so whatever was set on this backdrop before
        // has to be put back on it
        this.applyBackdropTint();
        this.applyBackdropTransparency();
        this.fireBackdropSwitch(bd.name);
    }

    /** Notify this stage and its sprites, if they override whenBackdropSwitches. */
    private fireBackdropSwitch(name: string) {
        this.runtime?.backdropSwitch(name, this);
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
    _addSound(soundPath: string) { this.soundBank.add(assetNameFromPath(soundPath), soundPath); }
    _addSound2(name: string, path: string) { this.soundBank.add(name, path); }
    _playSoundCopy(name: string, volume: number): ScratchSoundPlaybackClass {
        return ScratchSoundPlaybackClass.start(this.soundBank, name, volume);
    }
    _playSound(name: string) { this.soundBank.play(name); }
    _stopSound(name: string) { this.soundBank.stop(name); }
    _stopAllSounds() { this.soundBank.stopAll(); }
    _isSoundPlaying(name: string): boolean { return this.soundBank.isPlaying(name); }
    _setVolume(percent: number) { this.soundBank.setVolume(percent); }
    _changeVolume(step: number) { this.soundBank.setVolume(this.soundBank.getVolume() + step); }
    _getVolume(): number { return this.soundBank.getVolume(); }

    // ---- background colour ----
    private bgColor: ScratchColorClass = ScratchColorClass.defaultColor();

    private applyBgColor() {
        this.world._setBackgroundColor(this.bgColor._get() & 0xffffff);
        if (this.stageFilters.length > 0) this.applyStageShader();
    }
    _setColorRGB(r: number, g: number, b: number) { this.bgColor = ScratchColorClass.fromRGB(r, g, b); this.applyBgColor(); }
    _setColorObj(c: ScratchColorClass) { if (c) { this.bgColor = c; this.applyBgColor(); } }
    _getColor(): ScratchColorClass { return this.bgColor; }

    /**
     * 7.0's stage colour effect: the hue of everything on the stage (not the
     * UI) turns, 200 being once around, exactly as Scratch's stage effect.
     * Applied as a hue filter on the shaded container, which holds everything
     * but the UI pass.
     */
    private stageColorEffect: number = 0;
    _setColorEffect(effect: number) {
        this.stageColorEffect = effect;
        const shaded = this.scratchLayers?.shaded;
        if (!shaded || shaded.destroyed) return;
        shaded.filters = effect === 0 ? [] : [createColorEffectFilter(effect)];
    }
    _changeColorEffect(by: number) { this._setColorEffect(this.stageColorEffect + by); }
    _getColorEffect(): number { return this.stageColorEffect; }

    // ---- timers ----
    private timer?: ScratchTimerClass;
    _getTimer(): ScratchTimerClass { return this.timer ??= new ScratchTimerClass(); }
    _getFrameRate(): number {
        return (this.world as any).app?.ticker?.FPS ?? 30;
    }

    // ---- misc ----
    _eraseAll() {
        for (const pen of ScratchPenClass.livePens(this.world)) pen._eraseOwnGraphics();
        // Painted marks outlive their Pen, as pixels do on the desktop. Erase
        // those too when an unowned pen has already been collected.
        for (const marks of this.scratchLayers?.pen.children ?? []) {
            if (marks instanceof PIXI.Graphics) marks.clear();
        }
        for (const name of ["backgroundStamps", "foregroundStamps", "uiStamps"] as const) {
            clearScratchStampLayer(this.scratchLayers?.[name]);
        }
    }

    _display(text: string) { this.displayText(text, undefined); }
    _displayFor(text: string, seconds: number) { this.displayText(text, seconds * 1000); }

    /**
     * Upstream's Stage.tick, after the run()s: timed texts count the tick,
     * the stage's own first, then the sprites' bubbles, then the display band.
     */
    _tickTimedTexts() {
        for (const text of [...this.texts]) text.tickTimer();
        for (const sprite of [...this.sprites]) sprite.tickSpeech();
        if (this.displayTicksLeft > 0 && --this.displayTicksLeft === 0) this.displayText("", undefined);
    }

    private displayContainer?: PIXI.Container;
    /** ticks of the stage the display band stays, -1 for good (upstream: its Text's ticksLeft) */
    private displayTicksLeft = -1;
    private displayHeight: number = 0;

    /**
     * The band along the bottom of the stage that display() writes into.
     *
     * <p>Upstream this is a Text in the BOX style, in the UI layer, as wide as
     * the stage minus its 8px margins: rounded all around, white on a light
     * grey frame, its bottom edge 8px above the window's bottom edge — and 4px
     * above the ask card while one is up. It used to sit on the bottom edge
     * itself and be rounded on its top two corners only.
     */
    private displayText(text: string, millis?: number) {
        this.displayTicksLeft = -1;
        if (this.displayContainer) { this.displayContainer.destroy({ children: true }); this.displayContainer = undefined; }
        this.displayContainer = this.makeBottomBand(text);
        this.positionDisplayBand();
        if (millis !== undefined) this.displayTicksLeft = Math.max(1, Math.round(millis * 60 / 1000));
    }

    /**
     * Where the display band sits: its bottom edge 8px above the window's
     * bottom edge, and while an ask card is up 4px above that card — upstream's
     * draw() does `bottom += askBox.height() + 4`. The band and the card are
     * rebuilt independently, so both paths come through here.
     */
    private positionDisplayBand() {
        if (!this.displayContainer || this.displayContainer.destroyed) return;
        const aboveAsk = this.askHeight > 0 ? this.askHeight + 4 : 0;
        this.displayContainer.position.set(
            ASK_MARGIN, this.world.height - ASK_MARGIN - aboveAsk - this.displayHeight);
    }

    /**
     * Build the display band and put it on the stage, or nothing for empty text.
     *
     * <p>Upstream this is a Text in the BOX style, in the UI layer, as wide as
     * the stage minus its 8px margins, with the Text defaults for its colours:
     * black on white, framed in 2px of (201,201,201), its corners rounded by 8
     * — the corners of Scratch's ask box. Where it sits is
     * positionDisplayBand()'s business, because that depends on whether an ask
     * card is up.
     */
    private makeBottomBand(text: string): PIXI.Container | undefined {
        if (!text || text.length === 0) return undefined;

        const pad = 8; // upstream's Text.PADDING, between the frame and the words
        const width = this.world.width - ASK_MARGIN * 2;
        // In pixel-art mode the band is drawn in Jersey 10 at a size rounded to
        // whole pixels of it, like every text there.
        const fontSize = roundToScratchPixelGrid(DISPLAY_FONT_SIZE);
        const style = new PIXI.TextStyle({
            fontFamily: scratchDefaultFontFamily(),
            fontSize,
            // upstream's Text defaults: black on white, in a light grey frame
            fill: 0x000000,
            lineHeight: fontSize + 4,
            wordWrap: true,
            wordWrapWidth: width - pad * 2,
        });
        const label = new PIXI.Text({ text, style });
        const height = label.height + pad * 2;

        const g = new PIXI.Graphics();
        g.roundRect(0, 0, width, height, 8)
            .fill(0xffffff)
            .stroke({ width: 2, color: DISPLAY_STROKE_COLOR });

        label.position.set(pad, pad);
        const box = new PIXI.Container();
        box.addChild(g, label);
        this.displayHeight = height;
        // last child of the stage's own root, so it is on top of the stage but
        // still disappears with it
        (this.scratchLayers?.root ?? this.world.app.stage).addChild(box);
        return box;
    }

    // ---- ask / answer ----
    // Non-blocking, exactly like upstream: ask() puts the question up and returns
    // immediately; run() polls isAsking()/getAnswer().
    //
    // The question goes into Scratch's ask card at the bottom of the stage and
    // is typed into there, which is where Scratch and the desktop library both
    // put it. It used to be handed to the IDE's console instead: the learner
    // had to look below the stage for a question the tutorial said was on it,
    // and the console's input field stopped the act loop while it was open, so
    // nothing the program drew after the first answer ever appeared.
    private askQuestion?: string;
    private answer: string = "";
    private askInput: string = "";
    private askContainer?: PIXI.Container;
    private askHeight: number = 0;
    private askKeyListener?: KeyDownListener;
    /** The sprite that asked, whose bubble shows the question; none when the stage asked. */
    private askingSprite?: ScratchSpriteClass;
    /** Whether the caret in the answer field is drawn this rebuild. */
    private caretOn: boolean = true;
    private caretTimer?: () => void;

    _ask(question: string) {
        this.askingSprite = undefined;
        this.startAsking(question);
    }

    /** A sprite asking: upstream's Stage.askForSprite(), reached from Sprite.ask(). */
    _askForSprite(sprite: ScratchSpriteClass, question: string) {
        this.askingSprite = sprite;
        this.startAsking(question);
    }

    /** What ask() and _askForSprite() share, upstream's startAsking(). */
    private startAsking(question: string) {
        this.askQuestion = question ?? "";
        this.answer = "";
        this.askInput = "";
        this.listenForAnswer();
        this.showAskBox();
        if (this.askQuestion !== undefined) this.scheduleCaretBlink();
    }

    _getAnswer(): string { return this.answer; }
    _isAsking(): boolean { return this.askQuestion !== undefined; }

    /** Puts the ask card up, or takes it down when the question is over. */
    private showAskBox() {
        if (this.askContainer && !this.askContainer.destroyed) this.askContainer.destroy({ children: true });
        this.askHeight = 0;
        this.askContainer = this.askQuestion === undefined
            ? undefined
            : this.makeAskCard();
        // the display band sits 4px above the card while it is up
        this.positionDisplayBand();
    }

    /**
     * Scratch's ask card, upstream's AskDraw as drawAsk() paints it: a white
     * card standing on the bottom edge 8px in from the window's sides — a dark
     * roundRect just visible round the white one inside it, which is how
     * upstream paints border and shadow in one — with the question above the
     * answer field when the stage itself asked (a sprite's question is in its
     * bubble), the field showing the end of a long answer, and the round check
     * button at its right end.
     */
    private makeAskCard(): PIXI.Container {
        const width = this.world.width - ASK_MARGIN * 2;
        // In pixel-art mode the card's words are drawn in Jersey 10 at a size
        // rounded to whole pixels of it, like every text there.
        const fontSize = roundToScratchPixelGrid(DISPLAY_FONT_SIZE);
        const lineHeight = fontSize + 4;
        const styleOf = (wrapAt: number | undefined) => new PIXI.TextStyle({
            fontFamily: scratchDefaultFontFamily(),
            fontSize,
            fill: ASK_TEXT_COLOR,
            lineHeight,
            ...(wrapAt !== undefined ? { wordWrap: true, wordWrapWidth: wrapAt } : {}),
        });

        // The question only shows when the stage itself asked; a sprite's
        // question is in its bubble, as Sprite.ask() on the desktop says it.
        let question: PIXI.Text | undefined;
        let questionHeight = 0;
        if (this.askingSprite === undefined && this.askQuestion && this.askQuestion.length > 0) {
            question = new PIXI.Text({ text: this.askQuestion, style: styleOf(width - ASK_PADDING * 2) });
            questionHeight = question.height;
        }
        const height = 2 * ASK_PADDING + ASK_FIELD + (questionHeight > 0 ? questionHeight + ASK_GAP : 0);
        this.askHeight = height;

        // the field, measured in card coordinates: PADDING in from each side,
        // PADDING up from the bottom of the card
        const fieldX = ASK_PADDING;
        const fieldY = height - ASK_PADDING - ASK_FIELD;
        const fieldWidth = width - ASK_PADDING * 2;

        const g = new PIXI.Graphics();
        g.roundRect(0, 0, width, height, 8).fill({ color: 0x000000, alpha: 0x26 / 255 });
        g.roundRect(2, 2, width - 4, height - 4, 6).fill(0xffffff);
        // the answer field: a pill, the dark roundRect again inside its white one
        g.roundRect(fieldX, fieldY, fieldWidth, ASK_FIELD, ASK_FIELD / 2)
            .fill({ color: 0x000000, alpha: 0x26 / 255 });
        g.roundRect(fieldX + 1, fieldY + 1, fieldWidth - 2, ASK_FIELD - 2, ASK_FIELD / 2 - 1).fill(0xffffff);

        // The answer shows the end of what has been typed, as far as it fits
        // into the room left of the check button: upstream strips one code
        // point at a time from the front until it fits.
        const answerStyle = styleOf(undefined);
        const room = fieldWidth - ASK_INSET - ASK_BUTTON - ASK_BUTTON_INSET * 2;
        let shown = this.askInput;
        while (shown.length > 0 && PIXI.CanvasTextMetrics.measureText(shown, answerStyle).width > room) {
            shown = [...shown].slice(1).join("");
        }
        const answer = new PIXI.Text({ text: shown, style: answerStyle });
        // the answer sits at the left of the field, vertically centred in it
        answer.position.set(fieldX + ASK_INSET, fieldY + (ASK_FIELD - answer.height) / 2);

        // the check button: a blue circle at the right end of the field, with
        // the white tick of scratch-gui's ✓ (the joint below the centre, the
        // long arm up to the right) and a dot where the two strokes meet
        const buttonX = fieldX + fieldWidth - ASK_BUTTON_INSET - ASK_BUTTON / 2;
        const buttonY = fieldY + ASK_FIELD / 2;
        const button = new PIXI.Graphics();
        button.circle(buttonX, buttonY, ASK_BUTTON / 2).fill(ASK_BUTTON_COLOR);
        button.moveTo(buttonX - 5, buttonY).lineTo(buttonX - 1.5, buttonY + 3.5)
            .stroke({ width: 2.5, color: 0xffffff });
        button.moveTo(buttonX - 1.5, buttonY + 3.5).lineTo(buttonX + 5, buttonY - 3.5)
            .stroke({ width: 2.5, color: 0xffffff });
        button.circle(buttonX - 1.5, buttonY + 3.5, 1.25).fill(0xffffff);
        // the check button finishes the question, exactly as Enter does
        button.eventMode = "static";
        button.cursor = "pointer";
        button.on("pointerdown", () => this.typeIntoAnswer("Enter"));

        // the blinking caret: a 1px line of the ink colour, right of the answer
        if (this.caretOn) {
            const caretY = fieldY + (ASK_FIELD - lineHeight) / 2;
            g.roundRect(fieldX + ASK_INSET + answer.width + 1, caretY, 1, lineHeight, 0).fill(ASK_TEXT_COLOR);
        }

        const card = new PIXI.Container();
        card.addChild(g, button);
        if (question) {
            question.position.set(ASK_PADDING, ASK_PADDING);
            card.addChild(question);
        }
        card.addChild(answer);
        // the card stands on the bottom edge, ASK_MARGIN in from the window's
        // sides, like the display band that goes above it
        card.position.set(ASK_MARGIN, this.world.height - ASK_MARGIN - height);
        (this.scratchLayers?.root ?? this.world.app.stage).addChild(card);
        return card;
    }

    /**
     * Blinks the caret while a question is open: every half second of game time
     * the card is rebuilt with the caret toggled, upstream's tick / 30 % 2. The
     * chain stops itself when the question is over or the stage is off screen;
     * a new question or the stage coming back starts it again.
     */
    private scheduleCaretBlink() {
        if (this.caretTimer) return;
        this.caretOn = true;
        const blink = () => {
            this.caretTimer = undefined;
            if (this.askQuestion === undefined || !this.isActive()) return;
            this.caretOn = !this.caretOn;
            this.showAskBox();
            this.caretTimer = scratchGameClock().schedule(blink, CARET_BLINK_MILLIS);
        };
        this.caretTimer = scratchGameClock().schedule(blink, CARET_BLINK_MILLIS);
    }

    private cancelCaretBlink() {
        if (this.caretTimer) { this.caretTimer(); this.caretTimer = undefined; }
    }

    private listenForAnswer() {
        if (this.askKeyListener) return;
        const km = (this.world as any).interpreter?.keyboardManager;
        if (!km) { this.askQuestion = undefined; return; }
        this.askKeyListener = (key: string) => this.typeIntoAnswer(key);
        km.addKeyDownListener(this.askKeyListener);
        this.focusStage();
    }

    /**
     * Put the keyboard on the stage, so the answer can be typed straight away.
     *
     * <p>The keyboard manager listens on <html>, and the editor swallows the
     * keys it gets — so with the caret still in the editor, which is where it is
     * when a program has just been started, every keystroke went to the code
     * instead of to the question.
     */
    private focusStage() {
        const canvas: HTMLCanvasElement | undefined = (this.world as any).app?.canvas;
        if (!canvas) return;
        canvas.tabIndex = -1;
        canvas.style.outline = "none";
        canvas.focus({ preventScroll: true });
    }

    private stopListeningForAnswer() {
        const km = (this.world as any).interpreter?.keyboardManager;
        if (km && this.askKeyListener) km.removeKeyDownListener(this.askKeyListener);
        this.askKeyListener = undefined;
    }

    /**
     * Handles one keypress while a question is waiting for an answer.
     *
     * <p>A browser reports a printable key as the character itself and everything
     * else — "Shift", "ArrowLeft", "F5" — under a name of its own, so a key of
     * length one is exactly upstream's `key >= ' ' && key != 65535` test.
     */
    private typeIntoAnswer(key: string) {
        // the keyboard manager outlives one stage, so a stage that went off
        // screen with a question still up must not eat the new stage's keys
        if (this.askQuestion === undefined || !this.isActive()) return;
        if (key === "Enter") {
            this.finishAsking();
            return;
        }
        if (key === "Backspace") {
            this.askInput = this.askInput.slice(0, -1);
            this.showAskBox();
            return;
        }
        if (key.length === 1) {
            this.askInput += key;
            this.showAskBox();
        }
    }

    /**
     * Enter and the check button both land here, as upstream's submitAnswer():
     * the answer is kept, and a sprite's question bubble goes with the
     * question, which is over.
     */
    private finishAsking() {
        this.answer = this.askInput;
        this.askQuestion = undefined;
        this.askInput = "";
        this.cancelCaretBlink();
        if (this.askingSprite) {
            this.askingSprite._say(""); // the question's bubble goes with the question
            this.askingSprite = undefined;
        }
        this.stopListeningForAnswer();
        this.showAskBox();
    }

    _mj$waitSeconds$void$double(t: Thread, _callback: CallbackParameter, seconds: number) {
        const millis = seconds * 1000;
        if (millis <= 0) return;
        t.scheduler.suspendThread(t);
        t.state = ThreadState.timedWaiting;
        // Upstream (Stage.waitSeconds): called in run() or an event - on the
        // game thread - the whole game waits for real time, as it does for any
        // slow code. Here those are the act thread and the event threads, and
        // holding the game clock stops every tick until the wait is over.
        if (ScratchStageClass.onGameThread(t)) {
            const release = scratchGameClock().hold();
            setTimeout(() => { release(); t.scheduler.restoreThread(t); }, millis);
            return;
        }
        // While a transition fades out or builds the next stage, no stage runs,
        // so the game clock stands still and a game-time deadline would never
        // fire. Upstream's supplier runs on the game thread, whose waitSeconds
        // is a real sleep: a constructor that waits while the screen stays
        // black holds real time, or the transition deadlocks.
        if (!scratchStagesRunning()) {
            setTimeout(() => t.scheduler.restoreThread(t), millis);
            return;
        }
        // Game time, like the desktop's waitSeconds: it waits until the game
        // clock has advanced that far, so the wait follows the game speed,
        // holds while the game is paused and needs Window.step() ticks to pass.
        // The clock runs the deadlines once per tick (see advance()).
        scratchGameClock().schedule(() => t.scheduler.restoreThread(t), millis);
    }

    /** Whether `t` runs a tick or an event, where upstream's game thread would. */
    private static onGameThread(t: Thread): boolean {
        return t.name === "act method-thread" || t.name?.startsWith("scratch ") === true;
    }

    /**
     * Poll `condition` until it is true, pausing between checks so the rest of
     * the program keeps running — upstream busy-polls with real-time sleeps,
     * and so does this: the condition is not game time (upstream calls it with
     * Thread.sleep(1); 16 ms keep the interpreter from busy-looping).
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
    // Both belong to the stage rather than to one backdrop, as they do in
    // Scratch, so switching backdrop does not undo them.
    private backdropTint?: ScratchColorClass;
    /** Scratch's ghost effect: 0 shows the backdrop, 100 hides it. */
    private backdropTransparency: number = 0;

    private applyBackdropTint() {
        if (this.backdropSprite && !this.backdropSprite.destroyed) {
            this.backdropSprite.tint = this.backdropTint ? (this.backdropTint._get() & 0xffffff) : 0xffffff;
        }
    }
    private applyBackdropTransparency() {
        if (this.backdropSprite && !this.backdropSprite.destroyed) {
            this.backdropSprite.alpha = 1 - this.backdropTransparency / 100;
        }
    }
    _setTintObj(c: ScratchColorClass) {
        this.backdropTint = c ?? ScratchColorClass.defaultColor();
        this.applyBackdropTint();
    }
    _getTransparency(): number { return this.backdropTransparency; }
    _setTransparency(ghost: number) {
        this.backdropTransparency = Math.max(0, Math.min(100, ghost));
        this.applyBackdropTransparency();
    }
    _changeTransparency(step: number) {
        this._setTransparency(this.backdropTransparency + step);
    }

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
        const screenX = W / 2 + this.camera._toScreenX(mouseX);
        const screenY = H / 2 - this.camera._toScreenY(mouseY);
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
    /** Created on first use; the active shaders filter everything but the UI, in turn. */
    private shaders: ScratchShadersClass | undefined;
    private stageFilters: PIXI.Filter[] = [];

    _getShaders(): ScratchShadersClass {
        if (!this.shaders) {
            this.shaders = ScratchShadersClass.of("stage", filters => {
                this.stageFilters = filters;
                this.applyStageShader();
            });
        }
        return this.shaders;
    }

    /**
     * Filter the stage the way upstream's shader buffer is: the whole stage,
     * also where nothing is drawn, on the stage's colour.
     */
    private applyStageShader() {
        const layers = this.scratchLayers;
        if (!layers || layers.shaded.destroyed) return;
        const filtered = this.stageFilters.length > 0;
        layers.shaded.filters = this.stageFilters.slice();
        layers.shaded.filterArea = filtered ? new PIXI.Rectangle(0, 0, this.world.width, this.world.height) : undefined as any;
        const colour = layers.stageColour as PIXI.Graphics;
        colour.clear();
        if (filtered) {
            colour.rect(0, 0, this.world.width, this.world.height).fill(this.bgColor._get() & 0xffffff);
        }
        colour.visible = filtered;
    }
    /**
     * Sorting.by(comparator): the sprites are drawn in the order the comparator
     * gives, back to front — the one it calls smallest first, as with every
     * java.util.Comparator.
     *
     * <p>Browser deviation from the desktop: upstream stores the comparator and
     * re-sorts its layers with it synchronously every tick, and runs the sprites
     * in that order, too. A student comparator is interpreted code here, and
     * interpreted code only runs on a thread — so the re-sort walks a merge sort
     * over a snapshot of the sprites on a thread of its own, fed by the
     * scheduler, and only the *draw* order follows the comparator: the run order
     * stays the ActorManager's. A batch of ticks re-applies the sort (upstream
     * re-sorts in tick()), so the pass follows the game speed and holds still
     * while paused; the stable merge sort gives the same order for the same
     * positions, so nothing flickers from frame to frame.
     */
    _mj$sortBy$void$Comparator(_t: Thread, callback: CallbackParameter, comparator: ComparatorInterface) {
        this.sortComparator = comparator;
        // last call wins, as on the desktop, where sortByY() and sortBy()
        // both write the same field
        this.sortByYEnabled = false;
        this.cancelSortJob();
        if (callback) callback();
    }

    _sortByY() {
        this.sortByYEnabled = true;
        this.sortComparator = undefined;
        this.cancelSortJob();
    }
    _stopSorting() {
        this.sortByYEnabled = false;
        this.sortComparator = undefined;
        this.cancelSortJob();
    }

    private cancelSortJob() {
        if (!this.sortJob) return;
        // the scheduler drops a terminated thread, so a merge step waiting on
        // it is never answered and the pass simply ends
        this.sortJob.thread.state = ThreadState.terminated;
        this.sortJob = undefined;
    }

    /**
     * One pass of the comparator's order. A pass that is still running keeps the
     * depths it has applied so far; one whose thread is no longer alive — the
     * comparator threw, say — is dropped, and this frame starts a new pass.
     */
    private applyComparatorOrder() {
        if (this.sortJob) {
            const state = this.sortJob.thread.state;
            if (state === ThreadState.running || state === ThreadState.waiting) return;
            this.sortJob = undefined;
        }
        const sprites = this.sprites.filter(s => !s.isDestroyed && !s.isUI());
        if (sprites.length >= 2) {
            const comparator = this.sortComparator!;
            const thread = this.world.interpreter.scheduler.createThread("scratch sortBy");
            this.sortJob = { thread, sprites };
            ScratchStageClass.mergeSort(thread, () => {
                // the smallest sprite of the pass sits at index 0 and is drawn
                // first — a lower zIndex is further back in PIXI
                this.applyDrawDepths(sprites);
                this.sortJob = undefined;
            }, comparator, sprites, 0, sprites.length);
            // the scheduler only steps a running thread; the merge sort rides
            // on it from here on
            thread.state = ThreadState.running;
        } else {
            this.applyDrawDepths(sprites);
        }
    }

    /** Sprites destroyed while a pass was running keep the depth they had. */
    private applyDrawDepths(sprites: ScratchSpriteClass[]) {
        sprites.forEach((sprite, index) => {
            if (!sprite.isDestroyed) sprite._setDrawDepth(index);
        });
    }

    /**
     * A stable top-down merge sort driven by comparator callbacks, so a
     * comparator that is interpreted code — a student's lambda — can answer one
     * comparison per scheduler step, the way ArrayList.sort() walks its
     * quicksort. Not quicksort, on purpose: a per-batch re-sort mostly sees
     * sprites that compare equal or barely moved, where quicksort's last-element
     * pivot degrades to O(n²), and quicksort is not stable while the desktop's
     * List.sort is.
     */
    private static mergeSort(t: Thread, callback: CallbackParameter, comparator: ComparatorInterface,
        elements: ScratchSpriteClass[], fromIndex: number, toIndex: number) {
        if (toIndex - fromIndex <= 1) {
            if (callback) callback();
            return;
        }
        const middleIndex = (fromIndex + toIndex) >> 1;
        ScratchStageClass.mergeSort(t, () => {
            ScratchStageClass.mergeSort(t, () => {
                ScratchStageClass.merge(t, callback, comparator, elements, fromIndex, middleIndex, toIndex);
            }, comparator, elements, middleIndex, toIndex);
        }, comparator, elements, fromIndex, middleIndex);
    }

    private static merge(t: Thread, callback: CallbackParameter, comparator: ComparatorInterface,
        elements: ScratchSpriteClass[], fromIndex: number, middleIndex: number, toIndex: number) {
        const merged: ScratchSpriteClass[] = [];
        let left = fromIndex, right = middleIndex;
        const next = () => {
            // Moves that need no comparison — the run that is left over and the
            // copy-back at the end — run in this loop rather than recursing, so
            // a long run does not deepen the JS stack.
            for (;;) {
                if (left >= middleIndex && right >= toIndex) {
                    for (let index = 0; index < merged.length; index++) {
                        elements[fromIndex + index] = merged[index];
                    }
                    if (callback) callback();
                    return;
                }
                if (left >= middleIndex) { merged.push(elements[right++]); continue; }
                if (right >= toIndex) { merged.push(elements[left++]); continue; }
                comparator._mj$compare$int$T$T(t, () => {
                    // <= 0 takes the left one first, which is what keeps
                    // sprites that compare equal in the order they were in
                    if (t.s.pop() <= 0) merged.push(elements[left++]);
                    else merged.push(elements[right++]);
                    next();
                }, elements[left], elements[right]);
                return;
            }
        };
        next();
    }

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
