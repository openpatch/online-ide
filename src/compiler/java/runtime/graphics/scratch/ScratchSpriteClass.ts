import { ScratchSoundPlaybackClass } from "./ScratchSoundPlaybackClass";
import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ClassClass } from "../../system/ClassClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { ShapeClass } from "../ShapeClass";
import { KeyCodeEnum } from "./KeyCodeEnum";
import { Layer, LayerEnum } from "./LayerEnum";
import { ScratchLayerName, ScratchLayers, scratchLayerOf, spriteLayerOf, spriteLayerOfLayer } from "./ScratchLayers";
import { activeScratchStage, isScratchStageActive, scratchStagesRunning } from "./ScratchStages";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { RotationStyle, RotationStyleEnum } from "./RotationStyleEnum";
import { ScratchColorClass } from "./ScratchColorClass";
import { ScratchCostumes, assetNameFromPath } from "./ScratchCostumes";
import { colorKey, isTouchingColor } from "./ScratchColorSensing";
import { ScratchShadersClass } from "./ScratchShaders";
import { DEBUG_COLOR, round2 } from "./ScratchDebug";
import { scratchSpriteList } from "./ScratchLists";
import { ScratchPenClass } from "./ScratchPenClass";
import { IScratchEventReceiver, ScratchRuntimeManager } from "./ScratchRuntimeManager";
import { ScratchSoundBank } from "./ScratchSounds";
import { ScratchBoundsClass } from "./ScratchBoundsClass";
import { createColorEffectFilter } from "./ScratchEffects";
import { roundToScratchPixelGrid, scratchDefaultFontFamily } from "./ScratchFont";
import { ScratchShapeClass } from "./ScratchShapeClasses";
import { ScratchTextClass } from "./ScratchTextClass";
import { TextStyle } from "./TextStyleEnum";
import { TextAlign } from "./TextAlignEnum";
import { ScratchTimerClass } from "./ScratchTimerClass";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { SRC } from "./ScratchLibraryComments";
import { scratchGameClock } from './ScratchGameClock';
import { ScratchMonitors } from './ScratchMonitors';
import { SupplierInterface } from './SupplierInterface';

type Costume = { name: string; texture: PIXI.Texture };

/**
 * What a sprite needs from its stage. Typed structurally rather than importing
 * ScratchStageClass, which imports this module in turn.
 */
type ScratchStageLike = {
    scratchLayers?: ScratchLayers;
    _broadcast(message: StringClass): void;
    _mj$broadcast$void$String(t: Thread, callback: CallbackParameter, message: StringClass): void;
    _ask(question: string): void;
    _askForSprite(sprite: ScratchSpriteClass, question: string): void;
    _getAnswer(): string;
    _isAsking(): boolean;
    _pickRandom(from: number, to: number): number;
    _debug(values: any[]): void;
    sprites: ScratchSpriteClass[];
};

/**
 * Interactive costumed object, mirroring org.openpatch.scratch.Sprite (core subset).
 *
 * Logical state (position/direction) uses the Scratch coordinate system: origin at
 * the stage centre, y pointing UP, direction 90 = right / 0 = up. This is converted
 * to the IDE world's top-left/y-down pixel space in applyState().
 */
export class ScratchSpriteClass extends ShapeClass {
    readonly usesScratchGameClock = true;
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Sprite extends Actor", comment: SRC.spriteClassComment },

        { type: "field", signature: "static double DIRECTION_UP" },
        { type: "field", signature: "static double DIRECTION_RIGHT" },
        { type: "field", signature: "static double DIRECTION_DOWN" },
        { type: "field", signature: "static double DIRECTION_LEFT" },

        { type: "method", signature: "Sprite()", java: ScratchSpriteClass.prototype._cj$_constructor_$Sprite$, comment: SRC.spriteConstructorComment },
        { type: "method", signature: "Sprite(string name, string imagePath)", java: ScratchSpriteClass.prototype._cj$_constructor_$Sprite$string$string, comment: SRC.spriteConstructor2Comment },

        // per-frame hook (Scratch: runs every frame)
        { type: "method", signature: "void run()", java: ScratchSpriteClass.prototype._mj$run$void$, comment: SRC.spriteRunComment },

        // overridable event hooks
        { type: "method", signature: "void whenAddedToStage()", java: ScratchSpriteClass.prototype._mj$whenAddedToStage$void$, comment: SRC.spriteWhenAddedToStageComment },
        { type: "method", signature: "void whenRemovedFromStage()", java: ScratchSpriteClass.prototype._mj$whenRemovedFromStage$void$, comment: SRC.spriteWhenRemovedFromStageComment },
        { type: "method", signature: "void whenClicked()", java: ScratchSpriteClass.prototype._mj$whenClicked$void$, comment: SRC.spriteWhenClickedComment },
        { type: "method", signature: "void whenKeyPressed(KeyCode key)", java: ScratchSpriteClass.prototype._mj$whenKeyPressed$void$KeyCode, comment: SRC.spriteWhenKeyPressedComment },
        { type: "method", signature: "void whenKeyReleased(KeyCode key)", java: ScratchSpriteClass.prototype._mj$whenKeyReleased$void$KeyCode, comment: SRC.spriteWhenKeyReleasedComment },
        { type: "method", signature: "void whenMouseClicked(MouseCode button)", java: ScratchSpriteClass.prototype._mj$whenMouseClicked$void$MouseCode, comment: SRC.spriteWhenMouseClickedComment },
        { type: "method", signature: "void whenMouseMoved(double x, double y)", java: ScratchSpriteClass.prototype._mj$whenMouseMoved$void$double$double, comment: SRC.spriteWhenMouseMovedComment },
        { type: "method", signature: "void whenIReceive(String message)", java: ScratchSpriteClass.prototype._mj$whenIReceive$void$String, comment: SRC.spriteWhenIReceiveComment },
        { type: "method", signature: "void whenBackdropSwitches(String name)", java: ScratchSpriteClass.prototype._mj$whenBackdropSwitches$void$String, comment: SRC.spriteWhenBackdropSwitchesComment },

        // speech
        { type: "method", signature: "void say(string text)", native: ScratchSpriteClass.prototype._say, comment: SRC.spriteSayComment },
        { type: "method", signature: "void say(string text, double seconds)", native: ScratchSpriteClass.prototype._sayFor, comment: SRC.spriteSay2Comment },
        { type: "method", signature: "void think(string text)", native: ScratchSpriteClass.prototype._think, comment: SRC.spriteThinkComment },
        { type: "method", signature: "void think(string text, double seconds)", native: ScratchSpriteClass.prototype._thinkFor, comment: SRC.spriteThink2Comment },

        // costumes
        { type: "method", signature: "void addCostume(string imagePath)", java: ScratchSpriteClass.prototype._mj$addCostume$void$string, comment: SRC.spriteAddCostumeComment },
        { type: "method", signature: "void addCostume(string name, string imagePath)", java: ScratchSpriteClass.prototype._mj$addCostume$void$string$string, comment: SRC.spriteAddCostume2Comment },
        { type: "method", signature: "void addCostume(string name, string spriteSheetPath, int x, int y, int width, int height)", java: ScratchSpriteClass.prototype._mj$addCostume$void$string$string$int$int$int$int, comment: SRC.spriteAddCostume3Comment },
        { type: "method", signature: "void addCostumes(string prefix, string spriteSheet, int tileWidth, int tileHeight)", java: ScratchSpriteClass.prototype._mj$addCostumes$void$string$string$int$int, comment: SRC.spriteAddCostumesComment },
        { type: "method", signature: "void switchCostume(string name)", native: ScratchSpriteClass.prototype._switchCostumeByName, comment: SRC.spriteSwitchCostumeComment },
        { type: "method", signature: "void switchCostume(double index)", native: ScratchSpriteClass.prototype._switchCostumeByIndex, comment: SRC.spriteSwitchCostume2Comment },
        { type: "method", signature: "void nextCostume()", native: ScratchSpriteClass.prototype._nextCostume, comment: SRC.spriteNextCostumeComment },
        { type: "method", signature: "void previousCostume()", native: ScratchSpriteClass.prototype._previousCostume, comment: SRC.spritePreviousCostumeComment },
        { type: "method", signature: "string getCurrentCostumeName()", native: ScratchSpriteClass.prototype._getCurrentCostumeName, comment: SRC.spriteGetCurrentCostumeNameComment },
        { type: "method", signature: "int getCurrentCostumeIndex()", native: ScratchSpriteClass.prototype._getCurrentCostumeIndex, comment: SRC.spriteGetCurrentCostumeIndexComment },

        // animations (7.0: on every sprite, durations in seconds)
        { type: "method", signature: "void addAnimation(string name, string pattern, int frames)", java: ScratchSpriteClass.prototype._mj$addAnimation$void$string$string$int, comment: SRC.spriteAddAnimationComment },
        { type: "method", signature: "void addAnimation(string name, string pattern, int from, int to)", java: ScratchSpriteClass.prototype._mj$addAnimation$void$string$string$int$int, comment: SRC.spriteAddAnimation2Comment },
        { type: "method", signature: "void addAnimation(string name, string spriteSheetPath, int frameWidth, int frameHeight, int... frames)", java: ScratchSpriteClass.prototype._mj$addAnimation$void$string$string$int$int$int$Arr, comment: SRC.spriteAddAnimation3Comment },
        { type: "method", signature: "void playAnimation(string name)", native: ScratchSpriteClass.prototype._playAnimation, comment: SRC.spritePlayAnimationComment },
        { type: "method", signature: "void playAnimation(string name, boolean once)", native: ScratchSpriteClass.prototype._playAnimationOnce, comment: SRC.spritePlayAnimation2Comment },
        { type: "method", signature: "void resetAnimation()", native: ScratchSpriteClass.prototype._resetAnimation, comment: SRC.spriteResetAnimationComment },
        { type: "method", signature: "void setAnimationFrame(int frame)", native: ScratchSpriteClass.prototype._setAnimationFrame, comment: SRC.spriteSetAnimationFrameComment },
        { type: "method", signature: "void setAnimationInterval(double seconds)", native: ScratchSpriteClass.prototype._setAnimationInterval, comment: SRC.spriteSetAnimationIntervalComment },
        { type: "method", signature: "double getAnimationInterval()", native: ScratchSpriteClass.prototype._getAnimationInterval, comment: SRC.spriteGetAnimationIntervalComment },
        { type: "method", signature: "int getAnimationFrame()", native: ScratchSpriteClass.prototype._getAnimationFrame, comment: SRC.spriteGetAnimationFrameComment },
        { type: "method", signature: "boolean isAnimationPlayed()", native: ScratchSpriteClass.prototype._isAnimationPlayed, comment: SRC.spriteIsAnimationPlayedComment },

        // sound
        { type: "method", signature: "void addSound(string soundPath)", native: ScratchSpriteClass.prototype._addSound, comment: SRC.spriteAddSoundComment },
        { type: "method", signature: "void addSound(string name, string soundPath)", native: ScratchSpriteClass.prototype._addSound2, comment: SRC.spriteAddSound2Comment },
        { type: "method", signature: "void playSound(string name)", native: ScratchSpriteClass.prototype._playSound, comment: SRC.spritePlaySoundComment },
        { type: "method", signature: "SoundPlayback playSoundCopy(string name, double volume)", native: ScratchSpriteClass.prototype._playSoundCopy },
        { type: "method", signature: "void stopSound(string name)", native: ScratchSpriteClass.prototype._stopSound, comment: SRC.spriteStopSoundComment },
        { type: "method", signature: "void stopAllSounds()", native: ScratchSpriteClass.prototype._stopAllSounds, comment: SRC.spriteStopAllSoundsComment },
        { type: "method", signature: "boolean isSoundPlaying(string name)", native: ScratchSpriteClass.prototype._isSoundPlaying, comment: SRC.spriteIsSoundPlayingComment },
        { type: "method", signature: "void setVolume(double percent)", native: ScratchSpriteClass.prototype._setVolume, comment: SRC.spriteSetVolumeComment },
        { type: "method", signature: "void changeVolume(double step)", native: ScratchSpriteClass.prototype._changeVolume, comment: SRC.spriteChangeVolumeComment },
        { type: "method", signature: "double getVolume()", native: ScratchSpriteClass.prototype._getVolume, comment: SRC.spriteGetVolumeComment },

        // movement
        { type: "method", signature: "void move(double steps)", native: ScratchSpriteClass.prototype._move2, comment: SRC.spriteMoveComment },
        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchSpriteClass.prototype._setPosition, comment: SRC.spriteSetPositionComment },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchSpriteClass.prototype._setPositionV, comment: SRC.spriteSetPosition2Comment },
        { type: "method", signature: "void changePosition(double x, double y)", native: ScratchSpriteClass.prototype._changePosition, comment: SRC.spriteChangePositionComment },
        { type: "method", signature: "void changePosition(Vector2 v)", native: ScratchSpriteClass.prototype._changePositionV, comment: SRC.spriteChangePosition2Comment },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchSpriteClass.prototype._getPosition, comment: SRC.spriteGetPositionComment },
        { type: "method", signature: "void glide(double seconds, double x, double y)", native: ScratchSpriteClass.prototype._glide, comment: SRC.spriteGlideComment },
        { type: "method", signature: "boolean isGliding()", native: ScratchSpriteClass.prototype._isGliding, comment: SRC.spriteIsGlidingComment },
        { type: "method", signature: "void goToMousePointer()", native: ScratchSpriteClass.prototype._goToMousePointer, comment: SRC.spriteGoToMousePointerComment },
        { type: "method", signature: "double getX()", native: ScratchSpriteClass.prototype._getX, comment: SRC.spriteGetXComment },
        { type: "method", signature: "double getY()", native: ScratchSpriteClass.prototype._getY, comment: SRC.spriteGetYComment },
        { type: "method", signature: "void setX(double x)", native: ScratchSpriteClass.prototype._setX2, comment: SRC.spriteSetXComment },
        { type: "method", signature: "void setY(double y)", native: ScratchSpriteClass.prototype._setY2, comment: SRC.spriteSetYComment },
        { type: "method", signature: "void changeX(double x)", native: ScratchSpriteClass.prototype._changeX, comment: SRC.spriteChangeXComment },
        { type: "method", signature: "void changeY(double y)", native: ScratchSpriteClass.prototype._changeY, comment: SRC.spriteChangeYComment },
        { type: "method", signature: "void goToRandomPosition()", native: ScratchSpriteClass.prototype._goToRandomPosition, comment: SRC.spriteGoToRandomPositionComment },
        { type: "method", signature: "void ifOnEdgeBounce()", native: ScratchSpriteClass.prototype._ifOnEdgeBounce, comment: SRC.spriteIfOnEdgeBounceComment },

        // rotation
        { type: "method", signature: "void turnRight(double degrees)", native: ScratchSpriteClass.prototype._turnRight, comment: SRC.spriteTurnRightComment },
        { type: "method", signature: "void turnLeft(double degrees)", native: ScratchSpriteClass.prototype._turnLeft, comment: SRC.spriteTurnLeftComment },
        { type: "method", signature: "void setDirection(double degrees)", native: ScratchSpriteClass.prototype._setDirection, comment: SRC.spriteSetDirectionComment },
        { type: "method", signature: "void goToSprite(Sprite sprite)", native: ScratchSpriteClass.prototype._goToSprite, comment: SRC.spriteGoToSpriteComment },
        { type: "method", signature: "void pointTowards(Vector2 position)", native: ScratchSpriteClass.prototype._pointTowardsVector, comment: SRC.spritePointTowardsComment },
        { type: "method", signature: "void pointTowardsMousePointer()", native: ScratchSpriteClass.prototype._pointTowardsMousePointer, comment: SRC.spritePointTowardsMousePointerComment },
        { type: "method", signature: "void pointTowards(Sprite other)", native: ScratchSpriteClass.prototype._pointTowardsSprite, comment: SRC.spritePointTowards2Comment },
        { type: "method", signature: "double getDirection()", native: ScratchSpriteClass.prototype._getDirection, comment: SRC.spriteGetDirectionComment },
        { type: "method", signature: "void setRotationStyle(RotationStyle style)", native: ScratchSpriteClass.prototype._setRotationStyle, comment: SRC.spriteSetRotationStyleComment },
        { type: "method", signature: "RotationStyle getRotationStyle()", native: ScratchSpriteClass.prototype._getRotationStyle, comment: SRC.spriteGetRotationStyleComment },
        { type: "method", signature: "void setRotationCenter(double x, double y)", native: ScratchSpriteClass.prototype._setRotationCenter, comment: SRC.spriteSetRotationCenterComment },

        // appearance
        { type: "method", signature: "void show()", native: ScratchSpriteClass.prototype._show, comment: SRC.spriteShowComment },
        { type: "method", signature: "void hide()", native: ScratchSpriteClass.prototype._hide, comment: SRC.spriteHideComment },
        { type: "method", signature: "boolean isVisible()", native: ScratchSpriteClass.prototype._isVisibleScratch, comment: SRC.spriteIsVisibleComment },
        { type: "method", signature: "void setSize(double percentage)", native: ScratchSpriteClass.prototype._setSize, comment: SRC.spriteSetSizeComment },
        { type: "method", signature: "void changeSize(double amount)", native: ScratchSpriteClass.prototype._changeSize, comment: SRC.spriteChangeSizeComment },
        { type: "method", signature: "double getSize()", native: ScratchSpriteClass.prototype._getSize, comment: SRC.spriteGetSizeComment },
        { type: "method", signature: "void setTransparency(double percentage)", native: ScratchSpriteClass.prototype._setTransparency, comment: SRC.spriteSetTransparencyComment },
        { type: "method", signature: "void changeTransparency(double step)", native: ScratchSpriteClass.prototype._changeTransparency, comment: SRC.spriteChangeTransparencyComment },
        { type: "method", signature: "double getTransparency()", native: ScratchSpriteClass.prototype._getTransparency, comment: SRC.spriteGetTransparencyComment },
        { type: "method", signature: "double getWidth()", native: ScratchSpriteClass.prototype._getSpriteWidth, comment: SRC.spriteGetWidthComment },
        { type: "method", signature: "double getHeight()", native: ScratchSpriteClass.prototype._getSpriteHeight, comment: SRC.spriteGetHeightComment },
        { type: "method", signature: "void setWidth(double width)", native: ScratchSpriteClass.prototype._setWidth, comment: SRC.spriteSetWidthComment },
        { type: "method", signature: "void setHeight(double height)", native: ScratchSpriteClass.prototype._setHeight, comment: SRC.spriteSetHeightComment },
        { type: "method", signature: "void changeWidth(double by)", native: ScratchSpriteClass.prototype._changeWidth, comment: SRC.spriteChangeWidthComment },
        { type: "method", signature: "void changeHeight(double by)", native: ScratchSpriteClass.prototype._changeHeight, comment: SRC.spriteChangeHeightComment },
        { type: "method", signature: "void setNineSlice(int top, int right, int bottom, int left)", native: ScratchSpriteClass.prototype._setNineSlice, comment: SRC.spriteSetNineSliceComment },
        { type: "method", signature: "void disableNineSlice()", native: ScratchSpriteClass.prototype._disableNineSlice, comment: SRC.spriteDisableNineSliceComment },
        { type: "method", signature: "void setColorEffect(double effect)", native: ScratchSpriteClass.prototype._setColorEffect, comment: SRC.spriteSetColorEffectComment },
        { type: "method", signature: "void changeColorEffect(double by)", native: ScratchSpriteClass.prototype._changeColorEffect, comment: SRC.spriteChangeColorEffectComment },
        { type: "method", signature: "double getColorEffect()", native: ScratchSpriteClass.prototype._getColorEffect, comment: SRC.spriteGetColorEffectComment },
        { type: "method", signature: "void setTint(Color c)", native: ScratchSpriteClass.prototype._setTintObj, comment: SRC.spriteSetTintComment },
        { type: "method", signature: "void setTint(double r, double g, double b)", native: ScratchSpriteClass.prototype._setTintRGB, comment: SRC.spriteSetTint3Comment },
        { type: "method", signature: "Color getTint()", native: ScratchSpriteClass.prototype._getTint, comment: SRC.spriteGetTintComment },

        // layering
        { type: "method", signature: "void setLayer(Layer layer)", native: ScratchSpriteClass.prototype._setLayer, comment: SRC.spriteSetLayerComment },
        { type: "method", signature: "Layer getLayer()", native: ScratchSpriteClass.prototype._getLayer, comment: SRC.spriteGetLayerComment },
        { type: "method", signature: "void goToFrontLayer()", native: ScratchSpriteClass.prototype._goToFrontLayer, comment: SRC.spriteGoToFrontLayerComment },
        { type: "method", signature: "void goToBackLayer()", native: ScratchSpriteClass.prototype._goToBackLayer, comment: SRC.spriteGoToBackLayerComment },
        { type: "method", signature: "void goLayersForwards(int number)", native: ScratchSpriteClass.prototype._goLayersForwards, comment: SRC.spriteGoLayersForwardsComment },
        { type: "method", signature: "void goLayersBackwards(int number)", native: ScratchSpriteClass.prototype._goLayersBackwards, comment: SRC.spriteGoLayersBackwardsComment },

        // sensing
        { type: "method", signature: "boolean isTouchingSprite(Sprite other)", native: ScratchSpriteClass.prototype._isTouchingSprite, comment: SRC.spriteIsTouchingSpriteComment },
        { type: "method", signature: "boolean isTouchingSprite(Class<? extends Sprite> c)", native: ScratchSpriteClass.prototype._isTouchingSpriteOfClass, comment: SRC.spriteIsTouchingSprite2Comment },
        { type: "method", signature: "<T extends Sprite> T getTouchingSprite(Class<T> c)", native: ScratchSpriteClass.prototype._getTouchingSprite, comment: SRC.spriteGetTouchingSpriteComment },
        { type: "method", signature: "<T extends Sprite> List<T> getTouchingSprites(Class<T> c)", java: ScratchSpriteClass.prototype._mj$getTouchingSprites$List$Class, comment: SRC.spriteGetTouchingSpritesComment },
        { type: "method", signature: "boolean isTouchingColor(Color color)", native: ScratchSpriteClass.prototype._isTouchingColor, comment: SRC.spriteIsTouchingColorComment },
        { type: "method", signature: "boolean isTouchingColor(double r, double g, double b)", native: ScratchSpriteClass.prototype._isTouchingColorRGB, comment: SRC.spriteIsTouchingColor2Comment },
        { type: "method", signature: "boolean isColorTouchingColor(Color color, Color other)", native: ScratchSpriteClass.prototype._isColorTouchingColor, comment: SRC.spriteIsColorTouchingColorComment },
        { type: "method", signature: "boolean isTouchingEdge()", native: ScratchSpriteClass.prototype._isTouchingEdge, comment: SRC.spriteIsTouchingEdgeComment },
        { type: "method", signature: "boolean isTouchingMousePointer()", native: ScratchSpriteClass.prototype._isTouchingMousePointer, comment: SRC.spriteIsTouchingMousePointerComment },
        { type: "method", signature: "boolean isKeyPressed(KeyCode key)", native: ScratchSpriteClass.prototype._isKeyPressed, comment: SRC.spriteIsKeyPressedComment },
        { type: "method", signature: "double getMouseX()", native: ScratchSpriteClass.prototype._getMouseX, comment: SRC.spriteGetMouseXComment },
        { type: "method", signature: "double getMouseY()", native: ScratchSpriteClass.prototype._getMouseY, comment: SRC.spriteGetMouseYComment },
        { type: "method", signature: "Vector2 getMouse()", native: ScratchSpriteClass.prototype._getMouse, comment: SRC.spriteGetMouseComment },
        { type: "method", signature: "boolean isMouseDown()", native: ScratchSpriteClass.prototype._isMouseDown, comment: SRC.spriteIsMouseDownComment },
        { type: "method", signature: "double distanceToSprite(Sprite other)", native: ScratchSpriteClass.prototype._distanceToSprite, comment: SRC.spriteDistanceToSpriteComment },
        { type: "method", signature: "double distanceToMousePointer()", native: ScratchSpriteClass.prototype._distanceToMousePointer, comment: SRC.spriteDistanceToMousePointerComment },

        // things the sprite asks its stage for
        { type: "method", signature: "Stage getStage()", native: ScratchSpriteClass.prototype._getStage, comment: SRC.spriteGetStageComment },
        { type: "method", signature: "void broadcast(String message)", java: ScratchSpriteClass.prototype._mj$broadcast$void$String, comment: SRC.spriteBroadcastComment },
        { type: "method", signature: "void ask(string question)", native: ScratchSpriteClass.prototype._ask, comment: SRC.spriteAskComment },
        { type: "method", signature: "string getAnswer()", native: ScratchSpriteClass.prototype._getAnswer, comment: SRC.spriteGetAnswerComment },
        { type: "method", signature: "boolean isAsking()", native: ScratchSpriteClass.prototype._isAsking, comment: SRC.spriteIsAskingComment },
        { type: "method", signature: "int pickRandom(int from, int to)", native: ScratchSpriteClass.prototype._pickRandom, comment: SRC.spritePickRandomComment },
        { type: "method", signature: "Text getText()", native: ScratchSpriteClass.prototype._getText, comment: SRC.spriteGetTextComment },
        { type: "method", signature: "void debug(Object... values)", native: ScratchSpriteClass.prototype._debug, comment: SRC.spriteDebugComment },

        { type: "method", signature: "Timer getTimer()", native: ScratchSpriteClass.prototype._getTimer, comment: SRC.spriteGetTimerComment },

        { type: "method", signature: "void setHitbox(Shape shape)", native: ScratchSpriteClass.prototype._setHitboxShape, comment: SRC.spriteSetHitbox2Comment },
        { type: "method", signature: "Shape getHitbox()", native: ScratchSpriteClass.prototype._getHitboxShape, comment: SRC.spriteGetHitboxComment },
        { type: "method", signature: "void enableHitbox()", native: ScratchSpriteClass.prototype._enableHitbox, comment: SRC.spriteEnableHitboxComment },
        { type: "method", signature: "void disableHitbox()", native: ScratchSpriteClass.prototype._disableHitbox, comment: SRC.spriteDisableHitboxComment },
        { type: "method", signature: "void stamp()", native: ScratchSpriteClass.prototype._stamp, comment: SRC.spriteStampComment },
        { type: "method", signature: "void stamp(Layer layer)", native: ScratchSpriteClass.prototype._stampOnLayer, comment: SRC.spriteStamp2Comment },

        { type: "method", signature: "Pen getPen()", native: ScratchSpriteClass.prototype._getPen, comment: SRC.spriteGetPenComment },

        { type: "method", signature: "void remove()", java: ScratchSpriteClass.prototype._mj$remove$void$, comment: SRC.spriteRemoveComment },
        { type: "method", signature: "boolean isClone()", native: ScratchSpriteClass.prototype._isClone },
        { type: "method", signature: "void deleteThisClone()", java: ScratchSpriteClass.prototype._mj$deleteThisClone$void$ },
        { type: "method", signature: "void whenStartsAsClone()", java: ScratchSpriteClass.prototype._mj$whenStartsAsClone$void$ },
        { type: "method", signature: "void showVariable(string name, Supplier<Object> value)", java: ScratchSpriteClass.prototype._mj$showVariable$void$string$Supplier },
        { type: "method", signature: "void hideVariable(string name)", native: ScratchSpriteClass.prototype._hideVariable },

        { type: "method", signature: "<T extends Sprite> T createClone()", java: ScratchSpriteClass.prototype._mj$createClone$Sprite$, comment: SRC.spriteCreateCloneComment },
        { type: "method", signature: "Shaders getShaders()", native: ScratchSpriteClass.prototype._getShaders, comment: SRC.spriteGetShadersComment },
        { type: "method", signature: "String toString()", java: ScratchSpriteClass.prototype._mj$toString$Sprite$ },
    ];

    static type: NonPrimitiveType;

    static readonly DIRECTION_UP = 0;
    static readonly DIRECTION_RIGHT = 90;
    static readonly DIRECTION_DOWN = 180;
    static readonly DIRECTION_LEFT = -90;

    // logical Scratch state
    sx: number = 0;               // centre-origin x, right = +
    sy: number = 0;               // centre-origin y, UP = +
    direction: number = 90;       // 90 = right, 0 = up
    size: number = 100;           // percent
    rotationStyle: RotationStyle = RotationStyle.ALL_AROUND;

    costumes: Costume[] = [];
    currentCostume: number = -1;

    penObj?: ScratchPenClass;
    /** Created on demand by getText(); not used by say()/think(). */
    spriteText?: ScratchTextClass;
    /** Upstream's Text bubble constants, so both renders agree. */
    static readonly BUBBLE_FONT_SIZE = 14;
    static readonly SPEAK_BUBBLE_MAX_LIMIT = 330;
    static readonly SPEAK_BUBBLE_MIN_LIMIT = 80;
    private speechBubbleHeight: number = 0;
    /** Stamps taken before the sprite had a costume; see _stampOnLayer. */
    private pendingStamps: { layerName: ScratchLayerName, matrix: PIXI.Matrix, alpha: number, tint: number }[] = [];
    /** disableHitbox() takes the sprite out of all collision checks. */
    hitboxEnabled: boolean = true;
    /** Raw setHitbox() points, relative to the costume's top-left corner. */
    private customHitboxPoints?: { x: number, y: number }[];
    /** Set once the sprite has registered its event hooks. */
    runtime?: ScratchRuntimeManager;
    private cloned = false;
    private removing = false;
    variableMonitors = new ScratchMonitors();
    /**
     * 7.0's createClone(): the copy sits directly behind the original, as in
     * Scratch (6.x put it in front of everything).
     */
    _mj$createClone$Sprite$(t: Thread, callback: CallbackParameter): void {
        this._mj$copy$Shape$(t, () => {
            const clone = t.s[t.s.length - 1] as ScratchSpriteClass | undefined;
            if (clone?.container?.parent && this.container?.parent
                && clone.container.parent === this.container.parent && clone !== this) {
                const parent = this.container.parent;
                parent.setChildIndex(clone.container, Math.max(0, parent.getChildIndex(this.container)));
            }
            if (callback) callback();
        });
    }

    _mj$showVariable$void$string$Supplier(t: Thread, callback: CallbackParameter, name: string, supplier: SupplierInterface) {
        const owner = (this.constructor as any).type?.identifier ?? this.constructor.name;
        this.variableMonitors.show(t, name, supplier, `${owner}: ${name}`);
        if (callback) callback();
    }
    _hideVariable(name: string) { this.variableMonitors.hide(name); }

    _cj$_constructor_$Sprite$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Shape$(t, () => {
            // Shape's constructor pushed `this` and set up this.world
            this.container = new PIXI.Container();
            // UI sprites go into the layer the camera does not move
            (spriteLayerOfLayer(this, this.spriteLayer) ?? this.world.app.stage).addChild(this.container);
            this.centerXInitial = 0;
            this.centerYInitial = 0;
            this.penObj = new ScratchPenClass();
            this.penObj.sprite = this;      // so pen.stamp() knows what to print
            this.penObj.attachToWorld(this.world as any);
            this.penObj.px = this.sx;
            this.penObj.py = this.sy;
            this.addToDefaultGroupAndSetDefaultVisibility();
            this.applyState();
            this.registerIfNobodyElseWill(t, callback);
            if (callback) callback();
        });
    }

    /** Upstream's `new Sprite(name, path)` — the costume is there right away. */
    _cj$_constructor_$Sprite$string$string(t: Thread, callback: CallbackParameter, name: string, imagePath: string) {
        this._cj$_constructor_$Sprite$(t, () => {
            t.s.pop();
            this.loadCostume(t, name, imagePath, () => {
                t.s.push(this);
                this.registerIfNobodyElseWill(t, callback);
                if (callback) callback();
            });
        });
    }

    /** Upstream's copy constructor. */
    _cj$_constructor_$Sprite$Sprite(t: Thread, callback: CallbackParameter, other: ScratchSpriteClass) {
        this._cj$_constructor_$Sprite$(t, () => {
            t.s.pop();
            if (other) {
                this.costumes = other.costumes.slice();
                this.sx = other.sx; this.sy = other.sy;
                this.direction = other.direction;
                this.size = other.size;
                this.rotationStyle = other.rotationStyle;
                this.spriteLayer = other.spriteLayer;
                this.hitboxEnabled = other.hitboxEnabled;
                this.customHitboxPoints = other.customHitboxPoints?.slice();
                this.rotationCenter = other.rotationCenter;
                if (other.currentCostume >= 0) this._applyCostumeIndex(other.currentCostume);
                // as upstream's copy constructor: hidden stays hidden, and the
                // pen keeps its colour, size and whether it is down
                if (other.container && !other.container.destroyed) this.container.visible = other.container.visible;
                // a clone is drawn with the same shaders, as upstream's copy is
                if (other.shaders) this.shaders = other.shaders.copyFor(filters => this.applyShader(filters[0]));
                if (other.penObj) {
                    // from where the clone is, not from where its pen was made
                    const pen = this._getPen();
                    pen.px = this.sx;
                    pen.py = this.sy;
                    pen._copyStateFrom(other.penObj);
                }
                this.applyState();
            }
            t.s.push(this);
            this.registerIfNobodyElseWill(t, callback);
            if (callback) callback();
        });
    }

    _getPen(): ScratchPenClass {
        if (!this.penObj) {
            this.penObj = new ScratchPenClass();
            this.penObj.sprite = this;      // so pen.stamp() knows what to print
            this.penObj.stage = this.stage; // and draws on the sprite's own stage
            this.penObj.attachToWorld(this.world as any);
            this.penObj.px = this.sx;
            this.penObj.py = this.sy;
        }
        return this.penObj;
    }

    // ---- per-frame ----
    /**
     * Sprites step with the stage they are on: a sprite waiting on a stage that
     * is off screen holds still, as it does upstream, where only the stage the
     * applet is showing has its sprites updated.
     */
    _mj$act$void$(t: Thread, callback: CallbackParameter): void {
        if (this.stage && !isScratchStageActive(this.stage as any)) {
            if (callback) callback();
            return;
        }
        if (!scratchStagesRunning()) {
            if (callback) callback();
            return;
        }
        this._mj$run$void$(t, callback);
    }
    _mj$run$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }

    // ---- overridable event hooks (empty defaults) ----
    _mj$whenAddedToStage$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenRemovedFromStage$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenStartsAsClone$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenClicked$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenKeyPressed$void$KeyCode(_t: Thread, callback: CallbackParameter, _key: KeyCodeEnum): void { if (callback) callback(); }
    _mj$whenKeyReleased$void$KeyCode(_t: Thread, callback: CallbackParameter, _key: KeyCodeEnum): void { if (callback) callback(); }
    _mj$whenMouseClicked$void$MouseCode(_t: Thread, callback: CallbackParameter, _code: MouseCodeEnum): void { if (callback) callback(); }
    _mj$whenMouseMoved$void$double$double(_t: Thread, callback: CallbackParameter, _x: number, _y: number): void { if (callback) callback(); }
    _mj$whenIReceive$void$String(_t: Thread, callback: CallbackParameter, _message: StringClass): void { if (callback) callback(); }
    _mj$whenBackdropSwitches$void$String(_t: Thread, callback: CallbackParameter, _name: StringClass): void { if (callback) callback(); }

    private listenersRegistered = false;

    /**
     * Registers this sprite for act() and for the Scratch events, unless the
     * compiler is going to do it.
     *
     * <p>TermCodeGenerator.invokeConstructor only arranges that call for classes
     * the program itself declares — `!klassType.isLibraryType`. A program that
     * writes `new Sprite("player", "slimeGreen")` rather than subclassing
     * therefore never acted at all, and glide() sat still. It cannot be done in
     * the constructor for a subclass, because act() must not reach an object
     * whose own constructor has not finished; but where no callback came in
     * there is no subclass constructor left to wait for.
     *
     * <p>A missing callback alone does not say that, though: a subclass
     * constructor calls super() without one as well. Registering then would let
     * act() call run() while the subclass constructor is still waiting for its
     * costume - before it has set the fields run() uses. So it is left to the
     * compiler whenever the object is of a class the program declares.
     */
    protected registerIfNobodyElseWill(t: Thread, callback: CallbackParameter) {
        if (!callback && isLibraryInstance(this)) this._registerListeners(t);
    }

    _registerListeners(t: Thread): void {
        if (this.listenersRegistered) return;
        this.listenersRegistered = true;
        super._registerListeners(t);
        const interpreter = (this.world as any).interpreter;
        if (!interpreter) return;
        const runtime = ScratchRuntimeManager.forInterpreter(interpreter, this.world as any);
        this.runtime = runtime;
        const proto = ScratchSpriteClass.prototype;
        runtime.register(this as unknown as IScratchEventReceiver, {
            iReceive: this._mj$whenIReceive$void$String !== proto._mj$whenIReceive$void$String,
            keyPressed: this._mj$whenKeyPressed$void$KeyCode !== proto._mj$whenKeyPressed$void$KeyCode,
            keyReleased: this._mj$whenKeyReleased$void$KeyCode !== proto._mj$whenKeyReleased$void$KeyCode,
            clicked: this._mj$whenClicked$void$ !== proto._mj$whenClicked$void$,
            mouseClicked: this._mj$whenMouseClicked$void$MouseCode !== proto._mj$whenMouseClicked$void$MouseCode,
            backdropSwitches: this._mj$whenBackdropSwitches$void$String !== proto._mj$whenBackdropSwitches$void$String,
            mouseMoved: this._mj$whenMouseMoved$void$double$double !== proto._mj$whenMouseMoved$void$double$double,
            // Every object is registered for the gamepad events; the dispatch
            // only reaches those that implement a GamepadListener hook.
            gamepad: true,
        });
    }

    // ---- speech / thought bubbles ----
    private speechBubble?: PIXI.Container;
    private speechTail?: PIXI.Graphics;
    private speechBubbleWidth: number = 0;
    private speechThink: boolean = false;
    /** ticks of its stage a timed bubble stays (upstream: its Text's ticksLeft), -1 for good */
    private speechTicksLeft = -1;

    /**
     * Speech and thought bubbles, matching org.openpatch.scratch.Text as a
     * sprite's SPEAK/THINK text: the default font at 14 - UbuntuMono, or
     * Jersey 10 in pixel-art mode, with sizes rounded to whole pixels of it -
     * white fill, light grey border, black text (upstream's Text defaults),
     * 16px corners, and 8px padding. A speech bubble gets a triangular tail at
     * its bottom left, a thought bubble three shrinking circles. The lines are
     * laid out by the shared v7 layout (ScratchTextClass.layoutText): broken
     * like upstream's LineBreaker at BUBBLE_MAX_WIDTH minus the padding, one
     * baseline a line step apart, from the font file's own metrics. The
     * numbers below are upstream's.
     */
    private showSpeech(text: string, think: boolean) {
        this.clearSpeech();
        this.spokenText = text ?? "";
        this.spokenThink = think;
        this.spriteText?.mirrorSpeech(this.spokenText, think ? TextStyle.THINK : TextStyle.SPEAK);
        if (!text || text.length === 0) return;

        const fontSize = roundToScratchPixelGrid(ScratchSpriteClass.BUBBLE_FONT_SIZE);
        const family = scratchDefaultFontFamily();
        // No leading, no wrap style: the layout below breaks the lines and
        // places every baseline itself.
        const style = new PIXI.TextStyle({
            fontFamily: family,
            fontSize,
            fill: 0x000000,                                  // Color(0, 0, 0), upstream's Text default
        });
        // upstream's Text.layout() for a sprite's bubble: BUBBLE_MAX_WIDTH,
        // and the words inside it wrap at that minus the padding
        const layout = ScratchTextClass.layoutText(text, family, style, fontSize,
            ScratchSpriteClass.SPEAK_BUBBLE_MAX_LIMIT - 16);
        // a bubble is at least BUBBLE_MIN_LIMIT wide - the minimum REPLACES the
        // words' width plus the padding (upstream's Text.toDraw) - and stands
        // on its bottom edge at the position
        const bw = Math.max(ScratchSpriteClass.SPEAK_BUBBLE_MIN_LIMIT, layout.width + 16);
        const bh = layout.height + 16;

        const g = new PIXI.Graphics();
        g.roundRect(0, 0, bw, bh, 16).fill(0xffffff).stroke({ width: 1, color: 0xc9c9c9 });
        // the tail or the circles are drawn per side in positionSpeech: the
        // bubble grows right of the sprite, or left when there is no room,
        // and the tail hangs off whichever corner points back at it

        // The words sit inside the padding, centred within the box - which is
        // wider than the words when the minimum width applies (upstream's
        // Renderer.drawLayout): the first line's baseline an ascent below
        // the bubble's top (upstream's TextLayout.Line.baseline), the further
        // ones a line step below it.
        const words = new PIXI.Container();
        ScratchTextClass.addLines(words, layout, style, TextAlign.CENTER, 8, 8 + layout.ascent, bw - 16);
        const bubble = new PIXI.Container();
        bubble.addChild(g);
        bubble.addChild(words);
        const tail = new PIXI.Graphics();
        bubble.addChild(tail);
        // the bubble belongs with its sprite, so the camera moves it too
        (spriteLayerOfLayer(this, this.spriteLayer) ?? this.world.app.stage).addChild(bubble);
        this.speechBubble = bubble;
        this.speechBubbleWidth = bw;
        this.speechBubbleHeight = bh;
        this.speechThink = think;
        this.speechTail = tail;
        this.positionSpeech();
    }

    /**
     * Anchor the bubble the way upstream's Text.toDraw does: its bottom corner
     * sits on the top corner of the sprite's hitbox, so that the tail points
     * back at the sprite however big its costume canvas is. The bubble grows
     * right of the sprite, or left when the camera's window has no room on
     * the right (see positionSpeech).
     *
     * The sprite's own state is used rather than the transformed hit polygon,
     * because that is derived from the PIXI world transform, which is only valid
     * once a frame has been rendered — a say() in the Stage constructor would
     * otherwise pin every bubble to the top-left corner. This repeats upstream's
     * getHitbox() arithmetic instead: the painted part of the costume, scaled,
     * and turned with the sprite when it turns at all.
     */
    private positionSpeech() {
        if (!this.speechBubble || !this.container || this.container.destroyed) return;
        const W = this.world.width, H = this.world.height;
        const size = this.currentTextureSize();
        const scaleX = Math.abs(this.scaleMagnitudeX());
        const scaleY = Math.abs(this.scaleMagnitudeY());

        // the painted part of the costume, around the costume's centre, in
        // stage pixels and with y pointing down as the hitbox has it
        const texture = this.currentCostume >= 0 ? this.costumes[this.currentCostume].texture : undefined;
        const content = texture
            ? ScratchCostumes.contentBounds(texture, this.world?.app?.renderer)
            : { x: 0, y: 0, width: size.w, height: size.h };
        // a LEFT_RIGHT sprite facing left shows its costume mirrored, as applyState does
        const mirrored = this.rotationStyle === RotationStyle.LEFT_RIGHT
            && this.direction > 180 && this.direction < 360;
        // mirrored about the rotation center, which then sits as far from the
        // right edge as it did from the left
        const center = this.rotationCenterOf(size.w, size.h);
        const contentX = mirrored ? size.w - content.x - content.width : content.x;
        const centerX = mirrored ? size.w - center.x : center.x;
        const left = (contentX - centerX) * scaleX;
        const top = (content.y - center.y) * scaleY;
        const right = left + content.width * scaleX;
        const bottom = top + content.height * scaleY;

        // LEFT_RIGHT and DONT keep the costume upright, exactly as getHitbox does
        const degrees = this.rotationStyle === RotationStyle.ALL_AROUND ? this.direction - 90 : 0;
        const radians = degrees * Math.PI / 180;
        const cos = Math.cos(radians), sin = Math.sin(radians);
        let anchorRight = -Infinity, anchorLeft = Infinity, anchorTop = Infinity;
        for (const [cx, cy] of [[left, top], [right, top], [right, bottom], [left, bottom]]) {
            const x = cx * cos - cy * sin;
            const y = cx * sin + cy * cos;
            if (x > anchorRight) anchorRight = x;
            if (x < anchorLeft) anchorLeft = x;
            if (y < anchorTop) anchorTop = y;
        }

        // Upstream's Text.toDraw: the bubble grows to the right of the sprite,
        // or to its left when there is no room, and the tail starts from the
        // sprite's edge on that side. The room is the camera's window in stage
        // coordinates - a UI sprite's bubble is not moved by the camera, so its
        // window is the whole stage. Neither side having room keeps the bubble
        // on the stage, and the top stays below the window's top edge.
        const bw = this.speechBubbleWidth, bh = this.speechBubbleHeight;
        const ui = this.isUI();
        const camera = (this.stage as any)?.camera;
        const camX = ui || !camera ? 0 : camera.x;
        const camY = ui || !camera ? 0 : camera.y;
        const halfW = (ui || !camera ? W : W / (camera.zoom / 100)) / 2;
        const halfH = (ui || !camera ? H : H / (camera.zoom / 100)) / 2;
        const hasOutline = !!texture && content.width > 0 && content.height > 0;
        let bubbleLeft = this.sx + anchorRight;          // stage coordinates, y up
        let flip = false;
        if (bubbleLeft + bw > camX + halfW && hasOutline) {
            bubbleLeft = this.sx + anchorLeft - bw;
            flip = true;
        }
        bubbleLeft = Math.max(camX - halfW, Math.min(bubbleLeft, camX + halfW - bw));
        // the box's top edge: the bottom sits on the outline's top
        let bubbleTop = this.sy - anchorTop + bh;
        bubbleTop = Math.min(bubbleTop, camY + halfH);

        this.drawSpeechTail(flip);
        this.speechBubble.position.set(W / 2 + bubbleLeft, H / 2 - bubbleTop);
    }

    /**
     * The tail of a speaking bubble, or the circles of a thinking one, at the
     * corner that points back at the sprite: the bubble's left edge when it
     * grows right, its right edge when it grows left (upstream's tailX with
     * its dir, see Renderer's SPEECH and THOUGHT cases).
     */
    private drawSpeechTail(mirrored: boolean) {
        const tail = this.speechTail;
        if (!tail) return;
        const bw = this.speechBubbleWidth, bh = this.speechBubbleHeight;
        const at = mirrored ? bw : 0;     // the sprite's edge, as an x in the bubble
        const dir = mirrored ? -1 : 1;
        tail.clear();
        if (this.speechThink) {
            // circle(x, y, d) upstream takes a diameter, so these are radii
            tail.circle(at + dir * 20, bh, 5).fill(0xffffff).stroke({ width: 1, color: 0xc9c9c9 });
            tail.circle(at + dir * 7, bh + 7, 3).fill(0xffffff).stroke({ width: 1, color: 0xc9c9c9 });
            tail.circle(at, bh + 10, 2).fill(0xffffff).stroke({ width: 1, color: 0xc9c9c9 });
        } else {
            // Outlined like the bubble it hangs off. Filled only, it was a
            // white triangle on a white stage and the bubble looked tail-less.
            tail.moveTo(at + dir * 10, bh + 20).lineTo(at + dir * 10, bh).lineTo(at + dir * 30, bh).closePath()
                .fill(0xffffff).stroke({ width: 1, color: 0xc9c9c9 });
            // hides the seam where the tail meets the border, as upstream does
            tail.moveTo(at + dir * 12, bh).lineTo(at + dir * 26, bh).stroke({ width: 3, color: 0xffffff });
        }
    }

    private clearSpeech() {
        this.speechTicksLeft = -1;
        if (this.speechBubble) { this.speechBubble.destroy({ children: true }); this.speechBubble = undefined; }
        this.speechTail = undefined;
    }

    _say(text: string) { this.showSpeech(text, false); }
    _think(text: string) { this.showSpeech(text, true); }
    _sayFor(text: string, seconds: number) { this.showSpeech(text, false); this.speechTicksLeft = Math.max(1, Math.round(seconds * 60)); }
    _thinkFor(text: string, seconds: number) { this.showSpeech(text, true); this.speechTicksLeft = Math.max(1, Math.round(seconds * 60)); }

    /** Once per tick of its stage, after the run()s: a timed bubble goes, its words stay with getText(). */
    tickSpeech() {
        if (this.speechTicksLeft > 0 && --this.speechTicksLeft === 0) this.clearSpeech();
        this.spriteText?.tickTimer();
    }

    // ---- coordinate conversion + transform ----
    // scaleMagnitudeX/Y give the (positive) scale of the costume container.
    // A normal sprite scales uniformly by size%; UISprite overrides these to size
    // its costume in pixels. The LEFT_RIGHT flip and rotation are applied on top.
    /** 7.0's setWidth / setHeight: drawn this many stage pixels wide or high, 0 to follow size */
    private ownWidth = 0;
    private ownHeight = 0;
    protected scaleMagnitudeX(): number {
        const w = this.costumes[this.currentCostume]?.texture.width ?? 0;
        return this.ownWidth > 0 && w > 0 ? this.ownWidth / w : this.size / 100;
    }
    protected scaleMagnitudeY(): number {
        const h = this.costumes[this.currentCostume]?.texture.height ?? 0;
        return this.ownHeight > 0 && h > 0 ? this.ownHeight / h : this.size / 100;
    }

    protected applyState() {
        if (!this.container || this.container.destroyed) return;
        const W = this.world.width, H = this.world.height;
        const screenX = W / 2 + this.sx;
        const screenY = H / 2 - this.sy;
        const scaleX = this.scaleMagnitudeX();
        const scaleY = this.scaleMagnitudeY();

        let sxScale = scaleX, syScale = scaleY, rotDeg = 0;
        if (this.rotationStyle === RotationStyle.ALL_AROUND) {
            rotDeg = this.direction - 90;
        } else if (this.rotationStyle === RotationStyle.LEFT_RIGHT) {
            if (this.direction > 180 && this.direction < 360) sxScale = -scaleX; // facing left
        }

        const m = new PIXI.Matrix();
        m.scale(sxScale, syScale);
        m.rotate(rotDeg * Math.PI / 180);
        m.translate(screenX, screenY);
        this.container.setFromMatrix(m);
        this.container.updateLocalTransform();
        //@ts-ignore
        this.container._didLocalTransformChangeId = this.container._didChangeId;

        this.angle = rotDeg;
        this.scaleFactor = scaleX;
        this.directionRad = rotDeg * Math.PI / 180;
        this.setWorldTransformAndHitPolygonDirty();
        this.positionSpeech();
        this.applyNineSlice();
        // pen follows the sprite (draws a segment when the pen is down)
        this.penObj?._setPosition(this.sx, this.sy);
    }

    // ---- things the stage owns ----
    /**
     * The stage this sprite was added to. Undefined until then, which is what
     * upstream's getStage() returns as null.
     */
    stage?: ScratchStageLike;

    /**
     * Called by Stage.add(): take on that stage and move everything the sprite
     * draws into its layers. A sprite built while another stage was on screen put
     * its costume, bubbles and pen there, because that is all it could know about.
     */
    attachToStage(stage: ScratchStageLike) {
        if (this.stage === stage) return;
        this.stage = stage;
        if (this.penObj) { this.penObj.stage = stage; this.penObj.attachToWorld(this.world as any); }
        this.syncWorldRegistration(!stage.scratchLayers || isScratchStageActive(stage as any));
        const layer = spriteLayerOfLayer(this, this.spriteLayer);
        if (layer && this.container && !this.container.destroyed) layer.addChild(this.container);
        if (this.speechBubble && !this.speechBubble.destroyed) layer?.addChild(this.speechBubble);
        this.spriteText?.attachToStage(stage as object);
        this.removing = false;
    }

    /** Hidden stages own their sprites without leaving roots in the World. */
    syncWorldRegistration(registered: boolean): void {
        const shapes = this.world?.shapesWhichBelongToNoGroup;
        if (registered) {
            if (shapes && !shapes.includes(this)) shapes.push(this);
        } else {
            for (const list of [shapes, this.world?.shapesNotAffectedByWorldTransforms]) {
                const index = list?.indexOf(this) ?? -1;
                if (index >= 0) list!.splice(index, 1);
            }
        }
    }

    /** The stage that answers for this sprite: its own, or the one on screen. */
    private ownerStage(): ScratchStageLike | undefined {
        return this.stage ?? activeScratchStage<ScratchStageLike>();
    }

    /** Which stage's events reach this sprite; see ScratchRuntimeManager. */
    _scratchStage(): object | undefined { return this.stage as object | undefined; }

    _getStage(): ScratchStageLike | undefined { return this.stage; }
    _broadcast(message: StringClass) { this.ownerStage()?._broadcast(message); }
    _mj$broadcast$void$String(t: Thread, callback: CallbackParameter, message: StringClass) {
        const stage = this.ownerStage();
        if (stage) stage._mj$broadcast$void$String(t, callback, message);
        else callback?.();
    }
    _ask(question: string) {
        // Upstream's Sprite.ask() says the question in a bubble before the
        // stage's box opens; the bubble goes with the question when it is
        // answered (submitAnswer() says "" to the sprite).
        const stage = this.ownerStage();
        if (!stage) return;
        this._say(question);
        stage._askForSprite(this, question);
    }
    _getAnswer(): string { return this.ownerStage()?._getAnswer() ?? ""; }
    _isAsking(): boolean { return this.ownerStage()?._isAsking() ?? false; }
    _pickRandom(from: number, to: number): number { return this.ownerStage()?._pickRandom(from, to) ?? from; }
    _debug(values: any[]) { this.ownerStage()?._debug(values); }

    /**
     * The Text drawn with the sprite. Upstream say()/think() write into this
     * object; here the bubbles are drawn directly, so this is a separate Text
     * that follows the sprite and is yours to position and style.
     */
    /** what the sprite last said or thought: upstream's getText() is its bubble */
    private spokenText?: string;
    private spokenThink = false;

    _getText(): ScratchTextClass {
        if (!this.spriteText) {
            this.spriteText = new ScratchTextClass();
            this.spriteText.world = this.world as any;
            this.spriteText._setPosition(this.sx, this.sy);
            if (this.spokenText !== undefined) {
                this.spriteText.mirrorSpeech(this.spokenText, this.spokenThink ? TextStyle.THINK : TextStyle.SPEAK);
            }
        }
        return this.spriteText;
    }

    /** Created on first use; the first active shader is this sprite's filter, as upstream. */
    private shaders: ScratchShadersClass | undefined;

    _getShaders(): ScratchShadersClass {
        if (!this.shaders) {
            this.shaders = ScratchShadersClass.of("sprite", filters => this.applyShader(filters[0]));
        }
        return this.shaders;
    }

    private shaderFilter?: PIXI.Filter;
    private colorEffectFilter?: PIXI.Filter;
    private colorEffect: number = 0;

    private applyShader(filter: PIXI.Filter | undefined) {
        this.shaderFilter = filter;
        this.refreshFilters();
    }

    private refreshFilters() {
        if (!this.container || this.container.destroyed) return;
        const filters: PIXI.Filter[] = [];
        if (this.colorEffect !== 0) {
            // Scratch's colour effect, the desktop's own shader maths
            this.colorEffectFilter = createColorEffectFilter(this.colorEffect);
            filters.push(this.colorEffectFilter);
        }
        if (this.shaderFilter) filters.push(this.shaderFilter);
        this.container.filters = filters;
    }

    _setColorEffect(effect: number) { this.colorEffect = effect; this.refreshFilters(); }
    _changeColorEffect(by: number) { this._setColorEffect(this.colorEffect + by); }
    _getColorEffect(): number { return this.colorEffect; }

    // ---- costumes ----
    _mj$addCostume$void$string(t: Thread, callback: CallbackParameter, imagePath: string) {
        this.loadCostume(t, assetNameFromPath(imagePath), imagePath, callback);
    }

    _mj$addCostume$void$string$string(t: Thread, callback: CallbackParameter, name: string, imagePath: string) {
        this.loadCostume(t, name, imagePath, callback);
    }

    private loadCostume(t: Thread, name: string, imagePath: string, callback: CallbackParameter) {
        if (this.costumes.some(c => c.name === name)) {
            if (callback) callback();
            return;
        }
        const oldState = t.state;
        t.state = ThreadState.waiting;
        ScratchCostumes.loadTexture(imagePath).then(texture => {
            this.costumes.push({ name, texture });
            if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
            t.state = oldState;
            if (callback) callback();
        }).catch(reason => {
            t.state = oldState;
            t.throwRuntimeExceptionOnLastExecutedStep(new RuntimeExceptionClass(
                `Bild konnte nicht geladen werden / could not load image '${imagePath}': ${reason}`
            ));
        });
    }

    /**
     * Cut one costume out of a larger image, like upstream's 6-argument form. The
     * image may also be a URL; it is loaded first.
     */
    _mj$addCostume$void$string$string$int$int$int$int(t: Thread, callback: CallbackParameter,
        name: string, spriteSheetPath: string, x: number, y: number, width: number, height: number) {
        ScratchCostumes.whenLoaded(t, [spriteSheetPath], callback,
            () => this._addCostumeFromSheet(name, spriteSheetPath, x, y, width, height));
    }

    private _addCostumeFromSheet(name: string, spriteSheetPath: string, x: number, y: number, width: number, height: number) {
        if (this.costumes.some(c => c.name === name)) return;
        const texture = ScratchSpriteClass.subTexture(spriteSheetPath, x, y, width, height);
        this.costumes.push({ name, texture });
        if (this.currentCostume < 0) this._applyCostumeIndex(0);
    }

    /**
     * Slice an image into equally sized tiles and add them all. Costume names
     * are the prefix plus the tile's index, matching upstream — including its
     * `x * nx + y` indexing, which is only the row-major order people expect
     * when the sheet is square. The image may also be a URL; it is loaded first.
     */
    _mj$addCostumes$void$string$string$int$int(t: Thread, callback: CallbackParameter,
        prefix: string, spriteSheet: string, tileWidth: number, tileHeight: number) {
        ScratchCostumes.whenLoaded(t, [spriteSheet], callback,
            () => this._addCostumes(prefix, spriteSheet, tileWidth, tileHeight));
    }

    private _addCostumes(prefix: string, spriteSheet: string, tileWidth: number, tileHeight: number) {
        const base = ScratchCostumes.getTexture(spriteSheet);
        if (!base) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + spriteSheet);
        const nx = Math.floor(base.width / tileWidth);
        const ny = Math.floor(base.height / tileHeight);
        for (let y = 0; y < ny; y++) {
            for (let x = 0; x < nx; x++) {
                const index = x * nx + y;
                const texture = ScratchSpriteClass.subTexture(spriteSheet, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
                this.costumes.push({ name: prefix + index, texture });
            }
        }
        if (this.currentCostume < 0 && this.costumes.length > 0) this._applyCostumeIndex(0);
    }

    /** Cut a rectangle out of an atlas texture, relative to its own frame. */
    private static subTexture(imagePath: string, x: number, y: number, width: number, height: number): PIXI.Texture {
        const base = ScratchCostumes.getTexture(imagePath);
        if (!base) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + imagePath);
        const frame = new PIXI.Rectangle(base.frame.x + x, base.frame.y + y, width, height);
        return new PIXI.Texture({ source: base.source, frame });
    }

    /**
     * Add a costume under `name`, taking the image from `imagePath` — a built-in
     * costume name (mirroring the desktop library's Image.ofNameOrPath). Adding a
     * costume whose name already exists does nothing, as upstream.
     */
    _addCostume2(name: string, imagePath: string) {
        if (this.costumes.some(c => c.name === name)) return;
        const texture = ScratchCostumes.getTexture(imagePath);
        if (!texture) throw new RuntimeExceptionClass("Unbekanntes Kostüm / unknown costume: " + imagePath);
        this.costumes.push({ name, texture });
        if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
    }

    /** Natural (unscaled) size of the current costume, for pixel-based sizing. */
    protected currentTextureSize(): { w: number, h: number } {
        if (this.currentCostume < 0) return { w: 0, h: 0 };
        const t = this.costumes[this.currentCostume].texture;
        return { w: t.width, h: t.height };
    }

    /** Throw away the display object of the costume worn so far. */
    protected destroyCostumeDisplay(display: PIXI.Container) {
        display.destroy();
    }

    /** Build the PIXI display object for a costume: a nine-slice in a container while it counts. */
    protected createCostumeDisplay(texture: PIXI.Texture): PIXI.Container {
        const center = this.rotationCenterOf(texture.width, texture.height);
        if (this.nineSliceOn()) {
            // in the container's units, which are the costume's pixels
            const holder = new PIXI.Container();
            const nine = new PIXI.NineSliceSprite({ texture });
            nine.position.set(-center.x, -center.y);
            holder.addChild(nine);
            this.nineDisplay = nine;
            return holder;
        }
        this.nineDisplay = undefined;
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(center.x / texture.width, center.y / texture.height);
        return sprite;
    }

    /**
     * Upstream's rotation center: the point of the costume that sits at the
     * sprite's position and that it turns and mirrors around, in the
     * costume's pixels from its top left corner. Unset, it is the middle.
     */
    protected rotationCenter: { x: number, y: number } | undefined;

    protected rotationCenterOf(w: number, h: number): { x: number, y: number } {
        return this.rotationCenter ?? { x: w / 2, y: h / 2 };
    }

    _setRotationCenter(x: number, y: number) {
        this.rotationCenter = { x, y };
        // the anchor, the outline and the bubble all hang off it
        if (this.currentCostume >= 0) this._applyCostumeIndex(this.currentCostume);
    }

    protected _applyCostumeIndex(index: number) {
        if (index < 0 || index >= this.costumes.length) return;
        this.currentCostume = index;
        const texture = this.costumes[index].texture;

        const parent = this.container?.parent;
        const sprite = this.createCostumeDisplay(texture);
        // a hidden sprite stays hidden in its next costume
        if (this.container && !this.container.destroyed) sprite.visible = this.container.visible;
        // put the new display object exactly where the old one was, so switching
        // costume does not shuffle the sprite to the front of its layer
        if (parent) {
            const index = parent.getChildIndex(this.container);
            parent.addChildAt(sprite, index);
        }
        if (this.container && !this.container.destroyed) this.destroyCostumeDisplay(this.container);
        this.container = sprite;

        this.centerXInitial = 0;
        this.centerYInitial = 0;
        // Only fall back to the costume's rectangle while the sprite still has
        // the default outline. A setHitbox() right after add() lands before
        // whenAddedToStage adds the costume, and must not be undone here.
        //
        // The rectangle is the painted part of the costume, not the whole
        // canvas it was drawn into - the same thing upstream's getHitbox() does
        // with Image#getContentBounds. A costume is often much emptier than it
        // is big, and colliding with that empty space looks like a bug.
        const w = texture.width, h = texture.height;
        const content = ScratchCostumes.contentBounds(texture, this.world?.app?.renderer);
        const center = this.rotationCenterOf(w, h);
        const left = content.x - center.x;
        const top = content.y - center.y;
        const right = left + content.width;
        const bottom = top + content.height;
        this.hitPolygonInitial = [
            { x: left, y: top }, { x: right, y: top },
            { x: right, y: bottom }, { x: left, y: bottom },
        ];
        this.hitPolygonDirty = true;
        // a custom outline set before the costume arrived wins, and its offset
        // depends on this costume's size, so re-derive it here
        this.applyCustomHitbox();
        // the display object is brand new, so tint and transparency set earlier
        // have to be put back on it — whenAddedToStage runs on its own thread,
        // so a setTint() right after add() lands before the costume exists
        this.applyTint();
        this.applyTransparency();
        // and so does the shader: the filter belonged to the old display object
        if (this.shaders) this.applyShader(this.shaders._getCurrent()?.filter);
        this.applyState();
        this.flushPendingStamps(texture);
    }

    _switchCostumeByName(name: string) {
        const i = this.costumes.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
        if (i >= 0) this._applyCostumeIndex(i);
    }
    /**
     * Declared with a double index, as upstream is, so that a costume counter
     * held in a double still selects a costume. Upstream truncates and wraps.
     */
    _switchCostumeByIndex(index: number) {
        if (!this.costumes.length) return;
        this._applyCostumeIndex(Math.trunc(index) % this.costumes.length);
    }
    _nextCostume() { if (this.costumes.length) this._applyCostumeIndex((this.currentCostume + 1) % this.costumes.length); }
    _previousCostume() { if (this.costumes.length) this._applyCostumeIndex((this.currentCostume - 1 + this.costumes.length) % this.costumes.length); }
    // declared as lowercase `string`, so this must return a raw JS string —
    // returning a StringClass here would print as "[object Object]"
    _getCurrentCostumeName(): string { return this.currentCostume >= 0 ? this.costumes[this.currentCostume].name : ""; }
    _getCurrentCostumeIndex(): number { return this.currentCostume; }

    // ---- movement ----
    _move2(steps: number) {
        const a = (this.direction - 90) * Math.PI / 180;
        this.sx += steps * Math.cos(a);
        this.sy += steps * -Math.sin(a);
        this.applyState();
    }
    _setPosition(x: number, y: number) { this.sx = x; this.sy = y; this.applyState(); }
    _setPositionV(v: ScratchVector2Class) { if (v) this._setPosition(v.x, v.y); }
    _changePosition(x: number, y: number) { this.sx += x; this.sy += y; this.applyState(); }
    _changePositionV(v: ScratchVector2Class) { if (v) this._changePosition(v.x, v.y); }
    _getPosition(): ScratchVector2Class { return new ScratchVector2Class(this.sx, this.sy); }

    // ---- glide ----
    // As upstream: a glide takes round(seconds * 60) ticks, at least one, and
    // moves one tick's worth before each run() of the sprite's stage.
    private glideFromX = 0; private glideFromY = 0;
    private glideToX = 0; private glideToY = 0;
    private glideTicks = 0;
    private glideTick = -1;   // -1 = not gliding

    _glide(seconds: number, x: number, y: number) {
        this.glideFromX = this.sx; this.glideFromY = this.sy;
        this.glideToX = x; this.glideToY = y;
        this.glideTicks = Math.max(1, Math.round(seconds * 60));
        this.glideTick = 0;
    }
    _isGliding(): boolean { return this.glideTick >= 0; }

    /** One tick of the glide; the clock calls it for every sprite before the stage's run(). */
    advanceGlide() {
        if (this.glideTick < 0) return;
        this.glideTick++;
        const t = Math.min(1, this.glideTick / this.glideTicks);
        this._setPosition(
            this.glideFromX + (this.glideToX - this.glideFromX) * t,
            this.glideFromY + (this.glideToY - this.glideFromY) * t,
        );
        if (t >= 1) this.glideTick = -1;
    }

    _goToMousePointer() { this._setPosition(this._getMouseX(), this._getMouseY()); }
    _getX(): number { return this.sx; }
    _getY(): number { return this.sy; }
    _setX2(x: number) { this.sx = x; this.applyState(); }
    _setY2(y: number) { this.sy = y; this.applyState(); }
    _changeX(x: number) { this.sx += x; this.applyState(); }
    _changeY(y: number) { this.sy += y; this.applyState(); }
    _goToRandomPosition() {
        const W = this.world.width, H = this.world.height;
        this.sx = Math.round((Math.random() - 0.5) * W);
        this.sy = Math.round((Math.random() - 0.5) * H);
        this.applyState();
    }
    /**
     * How far the sprite's hitbox reaches over each of the stage's four borders,
     * in the stage coordinates upstream's Bounds uses: origin in the middle,
     * y pointing down. Zero on a side the sprite is still inside of.
     *
     * The hitbox is asked for rather than the display object's PIXI bounds:
     * container.getBounds() measures the whole costume canvas — transparent
     * padding included — and, because it walks up the parent chain, it is also
     * moved and scaled by the camera. Neither is true of a collision outline,
     * which is why upstream works in hitbox space here as well.
     */
    private edgeOverlap(): { left: number, right: number, top: number, bottom: number } {
        const bounds = this._getHitbox()._getBounds();
        const halfWidth = this.world.width / 2, halfHeight = this.world.height / 2;
        return {
            left: Math.max(0, -halfWidth - bounds.bx),
            right: Math.max(0, bounds.bx + bounds.bwidth - halfWidth),
            top: Math.max(0, -halfHeight - bounds.by),
            bottom: Math.max(0, bounds.by + bounds.bheight - halfHeight),
        };
    }

    /**
     * Turn away from any stage border the sprite pokes over, mirroring
     * org.openpatch.scratch.Sprite#ifOnEdgeBounce.
     *
     * A border reflects the component of the heading that runs across it: the
     * left and right borders flip the x component, which for a Scratch bearing
     * (90 = right, 0 = up) is `-direction`; the top and bottom ones flip the y
     * component, which is `-direction - 180`. The sprite is then pushed back in
     * by exactly how far its hitbox stuck out, so a hitbox that does not sit in
     * the middle of the costume still ends up flush with the border.
     */
    _ifOnEdgeBounce() {
        // upstream leaves the same three cases alone: a sprite without a
        // collision outline, a UI sprite, and one not on a stage yet
        if (!this.hitboxEnabled || this.isUI() || !this.stage) return;

        // measured once, as upstream does, so that a sprite wider than the
        // stage bounces off both opposite borders and keeps its heading
        const over = this.edgeOverlap();

        if (over.left > 0) {
            this._setDirection(-this.direction);
            this._setX2(this.sx + over.left);
        }
        if (over.right > 0) {
            this._setDirection(-this.direction);
            this._setX2(this.sx - over.right);
        }
        if (over.top > 0) {
            this._setDirection(-this.direction - 180);
            this._setY2(this.sy - over.top);
        }
        if (over.bottom > 0) {
            this._setDirection(-this.direction - 180);
            this._setY2(this.sy + over.bottom);
        }
    }

    // ---- rotation ----
    _turnRight(deg: number) { this._setDirection(this.direction + deg); }
    _turnLeft(deg: number) { this._setDirection(this.direction - deg); }
    _setDirection(deg: number) {
        deg = deg % 360;
        if (deg < 0) deg += 360;
        // -360 % 360 is -0 here and 0.0 upstream, where the branch above runs
        // first. ifOnEdgeBounce() reaches it every time a sprite bounces off the
        // bottom border, and getDirection() would go on reading -0.0 from then on.
        this.direction = deg === 0 ? 0 : deg;
        this.applyState();
    }
    _getDirection(): number { return this.direction; }
    /** Point along a vector. Scratch direction 90 = +x, 0 = +y, so bearing = 90 - atan2(y,x). */
    _getRotationStyle(): RotationStyleEnum { return RotationStyleEnum.values[this.rotationStyle]; }

    _pointTowardsVector(v: ScratchVector2Class) { this._pointInDirectionV(v); }

    _pointInDirectionV(v: ScratchVector2Class) {
        if (!v) return;
        this._setDirection(90 - Math.atan2(v.y, v.x) * 180 / Math.PI);
    }
    _pointTowardsMousePointer() {
        this._pointInDirectionV(new ScratchVector2Class(this._getMouseX() - this.sx, this._getMouseY() - this.sy));
    }
    _pointTowardsSprite(other: ScratchSpriteClass) {
        if (!other) return;
        this._pointInDirectionV(new ScratchVector2Class(other.sx - this.sx, other.sy - this.sy));
    }
    _setDirectionV(v: ScratchVector2Class) { this._pointInDirectionV(v); }
    /** As upstream: turn to the vector's angle, then move by its length. */
    _moveV(v: ScratchVector2Class) {
        if (!v) return;
        this._setDirection(v._angle());
        this._move2(v._length());
    }
    _goToSprite(other: ScratchSpriteClass) { if (other) this._setPosition(other.sx, other.sy); }
    _setRotationStyle(style: RotationStyleEnum) {
        this.rotationStyle = style.ordinal as RotationStyle;
        this.applyState();
    }

    // ---- appearance ----
    _show() { this.container.visible = true; }
    _hide() { this.container.visible = false; }
    _isVisibleScratch(): boolean { return this.container.visible; }
    _setSize(percentage: number) { this.size = Math.max(0, percentage); this.applyState(); }
    _changeSize(amount: number) { this._setSize(this.size + amount); }
    _changeTransparency(step: number) { this._setTransparency(this.transparency + step); }
    _getTransparency(): number { return this.transparency; }
    _getSize(): number { return this.size; }
    /** Scratch's ghost effect: 0 shows the sprite, 100 hides it. */
    private transparency: number = 0;
    _setTransparency(ghost: number) {
        this.transparency = Math.max(0, Math.min(100, ghost));
        this.applyTransparency();
    }
    private applyTransparency() {
        if (this.container && !this.container.destroyed) {
            this.container.alpha = 1 - this.transparency / 100;
        }
    }
    /**
     * The current costume's size, as upstream's Sprite.getWidth() reports it:
     * the costume's pixels scaled by setSize(), never the rotated bounding box.
     */
    _getSpriteWidth(): number { return this.costumeSize().width; }
    _getSpriteHeight(): number { return this.costumeSize().height; }
    private costumeSize(): { width: number, height: number } {
        const costume = this.costumes[this.currentCostume];
        if (!costume) {
            // upstream casts the pen size to an int here, as it does everywhere
            const pen = Math.trunc(this.penObj?._getSize() ?? 1);
            return { width: pen, height: pen };
        }
        const scale = this.size / 100;
        // 7.0: widths and heights are doubles (35 % of 128 pixels is 44.8)
        return {
            width: this.ownWidth > 0 ? this.ownWidth : costume.texture.width * scale,
            height: this.ownHeight > 0 ? this.ownHeight : costume.texture.height * scale,
        };
    }

    /**
     * As upstream: draw the sprite this wide, whatever its costume's width and
     * size; 0 follows the costume and size again. The size stays as it was.
     */
    _setWidth(width: number) { this.ownWidth = Math.max(0, width); this.applyState(); }
    _setHeight(height: number) { this.ownHeight = Math.max(0, height); this.applyState(); }
    _changeWidth(by: number) { this._setWidth(this._getSpriteWidth() + by); }
    _changeHeight(by: number) { this._setHeight(this._getSpriteHeight() + by); }

    /**
     * The 7.0 nine-slice margins. As upstream they count while the sprite is
     * drawn at its own width or height: the corners keep their size, scaled
     * with the sprite's size, and the edges and the middle stretch.
     *
     * The costume display keeps the transform that stretches the sprite to its
     * own size, which the hitbox follows too. While the nine-slice counts, that
     * display is a plain container around a NineSliceSprite, scaled back so
     * that only the sprite's size reaches the corners (see createCostumeDisplay).
     * Colour sensing does not see such a sprite.
     */
    private nineSlice?: { left: number, top: number, right: number, bottom: number };
    private nineDisplay?: PIXI.NineSliceSprite;
    // Parameter order follows the desktop library (top, right, bottom, left);
    // the stored object keeps its own order.
    _setNineSlice(top: number, right: number, bottom: number, left: number) {
        this.nineSlice = { left, top, right, bottom };
        this.applyNineSlice();
    }
    _disableNineSlice() { this.nineSlice = undefined; this.applyNineSlice(); }

    private nineSliceOn(): boolean {
        return !!this.nineSlice && (this.ownWidth > 0 || this.ownHeight > 0) && this.currentCostume >= 0;
    }

    private applyNineSlice() {
        const shown = !!this.nineDisplay && !this.nineDisplay.destroyed && this.nineDisplay.parent === this.container;
        if (this.nineSliceOn() !== shown) {
            // the other kind of costume display; applyState comes back here
            if (this.currentCostume >= 0) this._applyCostumeIndex(this.currentCostume);
            return;
        }
        if (!shown) return;
        const nine = this.nineDisplay!;
        const texture = this.costumes[this.currentCostume].texture;
        const slice = this.nineSlice!;
        nine.leftWidth = slice.left;
        nine.topHeight = slice.top;
        nine.rightWidth = slice.right;
        nine.bottomHeight = slice.bottom;
        // the corners get only the size; the rest of the stretch is the nine-slice's own
        const k = Math.max(this.size / 100, 1e-6);
        const sx = this.scaleMagnitudeX(), sy = this.scaleMagnitudeY();
        nine.width = sx * texture.width / k;
        nine.height = sy * texture.height / k;
        nine.scale.set(k / sx, k / sy);
    }

    // ---- animations (7.0: on every sprite) ----
    /** animation name -> the costume names making up its frames */
    private animations: Map<string, string[]> = new Map();
    private animationInterval = 0.12;      // seconds
    private animationFrame = 0;
    private animationPlayed = false;        // a once-animation has reached its end
    private animationName?: string;
    private animationLastStep = 0;

    /**
     * Upstream builds each frame's file name with String.format(pattern, i + 1),
     * so the pattern uses a printf placeholder — "bunny1_walk%d" gives
     * bunny1_walk1, bunny1_walk2, ... Numbered from 1 by the frames form, or
     * from the given first to the given last number.
     */
    /** upstream's String.format(pattern, number): %d and %0Nd; without them the pattern as it is */
    private formatFrame(pattern: string, frameNumber: number): string {
        if (pattern.indexOf("%") < 0) return pattern;
        return pattern.replace(/%(0(\d+))?d/, (_m, _pad, width) =>
            width ? String(frameNumber).padStart(parseInt(width), "0") : String(frameNumber));
    }

    _mj$addAnimation$void$string$string$int(t: Thread, callback: CallbackParameter,
        name: string, pattern: string, frames: number) {
        const paths: string[] = [];
        for (let i = 1; i <= frames; i++) paths.push(this.formatFrame(pattern, i));
        ScratchCostumes.whenLoaded(t, paths, callback, () => this._addAnimationPaths(name, pattern, paths));
    }

    _mj$addAnimation$void$string$string$int$int(t: Thread, callback: CallbackParameter,
        name: string, pattern: string, from: number, to: number) {
        // as upstream: from the first number to the last, also counting down
        const paths: string[] = [];
        const step = to >= from ? 1 : -1;
        for (let i = 0; i <= Math.abs(to - from); i++) paths.push(this.formatFrame(pattern, from + i * step));
        ScratchCostumes.whenLoaded(t, paths, callback, () => this._addAnimationPaths(name, pattern, paths));
    }

    /**
     * The sheet form: frameWidth x frameHeight cells out of the sprite sheet,
     * named by their number, counted row by row from 0 (7.0's only sheet shape).
     */
    _mj$addAnimation$void$string$string$int$int$int$Arr(t: Thread, callback: CallbackParameter,
        name: string, sheetPath: string, frameWidth: number, frameHeight: number, frames: number[]) {
        ScratchCostumes.whenLoaded(t, [sheetPath], callback,
            () => this._addAnimationSheet(name, sheetPath, frameWidth, frameHeight, frames ?? []));
    }

    private _addAnimationPaths(name: string, _pattern: string, paths: string[]) {
        const frameNames: string[] = [];
        for (let i = 0; i < paths.length; i++) {
            // upstream names an animation's costumes name#0, name#1, ...
            const costumeName = name + "#" + i;
            this._addCostumeFromName(costumeName, paths[i]);
            frameNames.push(costumeName);
        }
        this.animations.set(name, frameNames);
    }

    private _addAnimationSheet(name: string, sheetPath: string, frameWidth: number, frameHeight: number,
        frameNumbers: number[]) {
        const base = ScratchCostumes.getTexture(sheetPath);
        if (!base) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + sheetPath);
        const perRow = Math.max(1, Math.floor(base.frame.width / frameWidth));
        const frameNames: string[] = [];
        for (let i = 0; i < frameNumbers.length; i++) {
            const n = frameNumbers[i];
            const row = Math.floor(n / perRow);
            const col = n % perRow;
            const rect = new PIXI.Rectangle(
                base.frame.x + col * frameWidth,
                base.frame.y + row * frameHeight,
                frameWidth, frameHeight,
            );
            const texture = new PIXI.Texture({ source: base.source, frame: rect });
            const costumeName = name + "#" + i;
            if (!this.costumes.some(c => c.name === costumeName)) {
                this.costumes.push({ name: costumeName, texture });
                if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
            }
            frameNames.push(costumeName);
        }
        this.animations.set(name, frameNames);
    }

    /** addCostume(name, path) without failing when the costume already exists. */
    private _addCostumeFromName(costumeName: string, imagePath: string) {
        if (this.costumes.some(c => c.name === costumeName)) return;
        const texture = ScratchCostumes.getTexture(imagePath);
        if (!texture) throw new RuntimeExceptionClass("Unbekanntes Bild / unknown image: " + imagePath);
        this.costumes.push({ name: costumeName, texture });
        if (this.currentCostume < 0) this._applyCostumeIndex(this.costumes.length - 1);
    }

    _playAnimation(name: string) { this._playAnimationOnce(name, false); }

    /**
     * Mirrors 7.0 exactly: switching to another animation resets frame and step
     * clock; the frame advances once per interval; once stops at the last frame.
     */
    _playAnimationOnce(name: string, once: boolean) {
        const frames = this.animations.get(name);
        if (!frames || frames.length === 0) {
            console.warn(`Scratch: animation '${name}' not found. Use addAnimation() first.`);
            return;
        }
        const now = ScratchTimerClass._now();
        if (name !== this.animationName) {
            this.animationName = name;
            this.animationFrame = 0;
            this.animationPlayed = false;
            this.animationLastStep = now;
        } else if (now - this.animationLastStep >= this.animationInterval - 1e-9 && !this.animationPlayed) {
            this.animationLastStep = now;
            if (this.animationFrame + 1 < frames.length) this.animationFrame++;
            else if (once) this.animationPlayed = true;
            else this.animationFrame = 0;
        }
        this._switchCostumeByName(frames[this.animationFrame]);
    }

    _resetAnimation() { this.animationName = undefined; this.animationFrame = 0; this.animationPlayed = false; }
    _setAnimationFrame(frame: number) {
        const frames = this.animationName == null ? undefined : this.animations.get(this.animationName);
        this.animationFrame = frames == null ? Math.max(0, frame) : ((frame % frames.length) + frames.length) % frames.length;
        if (frames) this._switchCostumeByName(frames[this.animationFrame]);
    }
    _setAnimationInterval(seconds: number) { this.animationInterval = Math.max(0, seconds); }
    _getAnimationInterval(): number { return this.animationInterval; }
    _getAnimationFrame(): number { return this.animationFrame; }
    _isAnimationPlayed(): boolean { return this.animationPlayed; }

    // ---- tint ----
    // named tintColor: ShapeClass already has a tint() method
    private tintColor?: ScratchColorClass;
    private applyTint() {
        // not ShapeClass.tint(): it skips the assignment when container.tint is
        // falsy, which is the case for a plain Container that has no tint at all
        if (this.container && !this.container.destroyed) {
            (this.container as any).tint = this.tintColor ? (this.tintColor._get() & 0xffffff) : 0xffffff;
        }
    }
    _setTintObj(c: ScratchColorClass) { this.tintColor = c; this.applyTint(); }
    _setTintHue(h: number) { this.tintColor = ScratchColorClass.fromHue(h); this.applyTint(); }
    _setTintRGB(r: number, g: number, b: number) { this.tintColor = ScratchColorClass.fromRGB(r, g, b); this.applyTint(); }
    _changeTint(step: number) {
        if (!this.tintColor) this.tintColor = ScratchColorClass.defaultColor();
        this.tintColor._changeColor(step);
        this.applyTint();
    }
    /** As upstream: null while there is no tint. */
    _getTint(): ScratchColorClass | null {
        return this.tintColor ?? null;
    }

    // ---- layering ----
    private get siblings(): PIXI.Container | undefined { return this.container?.parent ?? undefined; }
    /**
     * The key the stage sorts by when Sorting.byY() is on (see ScratchStageClass._applySorting).
     * A speech bubble lives in the same layer and must stay in front of every sprite.
     */
    _setDrawDepth(depth: number) {
        if (this.container && !this.container.destroyed) this.container.zIndex = depth;
        if (this.speechBubble && !this.speechBubble.destroyed) this.speechBubble.zIndex = Number.MAX_SAFE_INTEGER;
    }

    _goToFrontLayer() { const p = this.siblings; if (p) p.setChildIndex(this.container, p.children.length - 1); }
    _goToBackLayer() { const p = this.siblings; if (p) p.setChildIndex(this.container, 0); }
    private moveLayers(delta: number) {
        const p = this.siblings;
        if (!p) return;
        const index = p.getChildIndex(this.container);
        p.setChildIndex(this.container, Math.max(0, Math.min(p.children.length - 1, index + delta)));
    }
    _goLayersForwards(n: number) { this.moveLayers(n); }
    _goLayersBackwards(n: number) { this.moveLayers(-n); }

    // ---- sound ----
    private soundBank: ScratchSoundBank = new ScratchSoundBank();
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

    // ---- timers ----
    private timer?: ScratchTimerClass;
    _getTimer(): ScratchTimerClass { return this.timer ??= new ScratchTimerClass(); }

    // ---- sensing ----
    /** 7.0 layers: which layer the sprite is on (MAIN by default). */
    private spriteLayer: Layer = Layer.MAIN;

    /** UI sprites are interface elements: the camera does not move them and
     *  nothing collides with them. */
    isUI(): boolean { return this.spriteLayer === Layer.UI; }

    _getLayer(): LayerEnum { return LayerEnum.values[this.spriteLayer]; }

    /** Upstream: the class's simple name and the position, as Java doubles print. */
    _mj$toString$Sprite$(t: Thread, callback: CallbackParameter): void {
        const d = (n: number) => Number.isInteger(n) ? n.toFixed(1) : String(n);
        const name = (this.constructor as any).type?.identifier ?? this.constructor.name;
        t.s.push(new StringClass(`${name} at (${d(this.sx)}, ${d(this.sy)})`));
        if (callback) callback();
    }

    /** Draw-order key for whenClicked's frontmost rule; larger is in front. */
    _frontmostOrder(): number {
        if (!this.container?.parent) return -1;
        const rank = this.spriteLayer === Layer.BACKGROUND ? 0
            : this.spriteLayer === Layer.MAIN ? 1
                : this.spriteLayer === Layer.FOREGROUND ? 2 : 3;
        const idx = this.container.parent.getChildIndex(this.container);
        const z = this.container.parent.sortableChildren ? (this.container.zIndex ?? 0) : 0;
        return rank * 1e12 + z * 1e6 + idx;
    }

    _setLayer(layer: LayerEnum) {
        const target = Layer[layer.name as keyof typeof Layer];
        if (this.spriteLayer === target) return;
        this.spriteLayer = target;
        const container = spriteLayerOfLayer(this, this.spriteLayer);
        if (!container) return;
        if (this.container && !this.container.destroyed) container.addChild(this.container);
        if (this.speechBubble && !this.speechBubble.destroyed) container.addChild(this.speechBubble);
    }

    /**
     * As upstream's Sprite#touches: not itself, on the same stage, on the UI
     * layer both or neither, and a hidden sprite or one whose hitbox is
     * disabled touches nothing.
     */
    _isTouchingSprite(other: ScratchSpriteClass): boolean {
        if (!other || !other.container || other === this || other.stage !== this.stage) return false;
        if (this.isUI() !== other.isUI()) return false;
        if (!this.container?.visible || !other.container.visible) return false;
        if (!this.hitboxEnabled || !other.hitboxEnabled) return false;
        return this._collidesWith(other);
    }

    /**
     * A scratch sprite's bounding box is its collision outline, not what its
     * container happens to render. A Tiled map's wall has a hitbox and no
     * costume at all, and its empty container's bounds are a single point,
     * so the pre-check would wave every collision through as a miss.
     */
    override hasOverlappingBoundingBoxWith(otherShape: ShapeClass, bb?: PIXI.Bounds): boolean {
        if (bb) return super.hasOverlappingBoundingBoxWith(otherShape, bb);
        const mine = this.hitboxWorldBounds();
        const other = otherShape instanceof ScratchSpriteClass
            ? otherShape.hitboxWorldBounds()
            : otherShape.container.getBounds();
        return !(mine.left > other.right || other.left > mine.right
            || mine.top > other.bottom || other.top > mine.bottom);
    }

    /** The world-space bounds of the sprite's collision outline. */
    private collisionBounds?: {
        polygon: { x: number, y: number }[];
        left: number, top: number, right: number, bottom: number;
    };

    private hitboxWorldBounds() {
        this.transformHitPolygon();
        const polygon = this.hitPolygonTransformed?.length ? this.hitPolygonTransformed : this.hitPolygonInitial;
        if (!polygon?.length) return this.container.getBounds();
        if (this.collisionBounds?.polygon === polygon) return this.collisionBounds;
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        for (const point of polygon) {
            left = Math.min(left, point.x);
            right = Math.max(right, point.x);
            top = Math.min(top, point.y);
            bottom = Math.max(bottom, point.y);
        }
        return this.collisionBounds = { polygon, left, top, right, bottom };
    }
    /**
     * Upstream asks the hitbox whether it reaches any of the four border strips
     * the stage keeps just outside its edges, so a sprite counts as touching the
     * edge once its collision outline — not its costume canvas — leaves the
     * stage. edgeOverlap() answers the same question; see ifOnEdgeBounce.
     */
    /** Upstream's isTouchingColor/isColorTouchingColor; see ScratchColorSensing. */
    private touchingColor(mine: number | undefined, target: number): boolean {
        if (this.isUI()) return false;
        const stage: any = this.ownerStage();
        if (!stage?.scratchLayers) return false;
        const background: ScratchColorClass | undefined = stage._getColor?.();
        return isTouchingColor(this.world?.app?.renderer as PIXI.Renderer | undefined, {
            scratchLayers: stage.scratchLayers,
            world: this.world,
            backgroundColor: background ? background._get() & 0xffffff : 0xffffff,
        }, this, mine, target);
    }
    _isTouchingColor(color: ScratchColorClass): boolean {
        if (!color) return false;
        return this.touchingColor(undefined, colorKey(color.r, color.g, color.b));
    }
    _isTouchingColorRGB(r: number, g: number, b: number): boolean {
        return this.touchingColor(undefined, colorKey(r, g, b));
    }
    _isColorTouchingColor(color: ScratchColorClass, other: ScratchColorClass): boolean {
        if (!color || !other) return false;
        return this.touchingColor(colorKey(color.r, color.g, color.b), colorKey(other.r, other.g, other.b));
    }

    /** As upstream: a hitbox on the border counts; a hidden sprite touches nothing. */
    _isTouchingEdge(): boolean {
        if (!this.hitboxEnabled || !this.container?.visible || !this.stage) return false;
        const b = this._getHitbox()._getBounds();
        const halfWidth = this.world.width / 2, halfHeight = this.world.height / 2;
        return b.bx <= -halfWidth || b.by <= -halfHeight
            || b.bx + b.bwidth >= halfWidth || b.by + b.bheight >= halfHeight;
    }
    _isKeyPressed(key: KeyCodeEnum): boolean {
        const km = (this.world as any).interpreter?.keyboardManager;
        if (!km || !key) return false;
        return key.browserKeys.some(k => km.isPressed(k));
    }
    /**
     * The class-based sensing methods mirror upstream's Class<? extends Sprite>
     * overloads. A Java class literal arrives as a ClassClass, whose `type`
     * carries the generated JS constructor, so a plain instanceof covers
     * subclasses too — the same semantics as Class.isInstance().
     */
    private spritesOfClass(c: ClassClass): ScratchSpriteClass[] {
        const stage = this.ownerStage();
        const klass = c?.type?.runtimeClass;
        if (!stage || !klass) return [];
        // A removed sprite's container is a throwing proxy, so exclude destroyed ones.
        return stage.sprites.filter(s => s !== this && !s.isDestroyed && s instanceof (klass as any));
    }

    _isTouchingSpriteOfClass(c: ClassClass): boolean {
        return this.spritesOfClass(c).some(s => s.container.visible && this._isTouchingSprite(s));
    }
    _getTouchingSprite(c: ClassClass): ScratchSpriteClass | null {
        return this.spritesOfClass(c).find(s => s.container.visible && this._isTouchingSprite(s)) ?? null;
    }
    // java.util.List or, next to the NRW classes, the nrw List; see scratchSpriteList
    _mj$getTouchingSprites$List$Class(t: Thread, callback: CallbackParameter, c: ClassClass) {
        t.s.push(scratchSpriteList(t, this.spritesOfClass(c).filter(s => this._isTouchingSprite(s))));
        if (callback) callback();
    }

    _isTouchingMousePointer(): boolean {
        return this._touchesPoint(ScratchSpriteClass.mouseScreenX, ScratchSpriteClass.mouseScreenY);
    }

    /** As upstream's touchHitbox: a hidden sprite, or one without its hitbox, touches no point. */
    _touchesPoint(screenX: number, screenY: number): boolean {
        return !!this.container?.visible && this.hitboxEnabled && this._containsPoint(screenX, screenY);
    }
    _getMouseX(): number { return ScratchSpriteClass.mouseLogicalX(this.world); }
    _getMouseY(): number { return ScratchSpriteClass.mouseLogicalY(this.world); }
    _getMouse(): ScratchVector2Class { return new ScratchVector2Class(this._getMouseX(), this._getMouseY()); }
    _isMouseDown(): boolean { return ScratchSpriteClass.mouseDown; }
    _distanceToSprite(other: ScratchSpriteClass): number {
        if (!other) return 0;
        const dx = other.sx - this.sx, dy = other.sy - this.sy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    _distanceToMousePointer(): number {
        const dx = this._getMouseX() - this.sx, dy = this._getMouseY() - this.sy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Replace the collision outline with the given x/y pairs.
     *
     * Coordinates are measured from the costume's TOP-LEFT corner in unscaled
     * costume pixels, which is how upstream reads them: it translates the shape
     * by (x - spriteWidth/2, -y - spriteHeight/2). Reading them off the costume
     * image is the point — the same numbers a paint program shows.
     */
    _setHitbox(points: number[]) {
        if (!points || points.length < 6 || points.length % 2 !== 0) {
            throw new RuntimeExceptionClass(
                "setHitbox braucht mindestens 3 Punkte als x/y-Paare / setHitbox needs at least 3 points as x/y pairs");
        }
        const polygon: { x: number, y: number }[] = [];
        for (let i = 0; i < points.length; i += 2) {
            polygon.push({ x: points[i], y: points[i + 1] });
        }
        this.customHitboxPoints = polygon;
        this.applyCustomHitbox();
    }

    /** Same convention as setHitbox(double...): relative to the top-left corner. */
    _setHitboxShape(shape: ScratchShapeClass) {
        if (!shape || shape.points.length < 3) {
            throw new RuntimeExceptionClass(
                "setHitbox braucht eine Form mit mindestens 3 Punkten / setHitbox needs a shape with at least 3 points");
        }
        this.customHitboxPoints = shape.points.map(p => ({ x: p.x, y: p.y }));
        this.applyCustomHitbox();
    }

    /**
     * Move the custom outline into the centre-origin space the transform uses.
     * Re-run whenever the costume changes, because the offset depends on the
     * costume's size — and because whenAddedToStage runs on its own thread, the
     * costume usually arrives after setHitbox() was called.
     */
    private applyCustomHitbox() {
        if (!this.customHitboxPoints) return;
        const size = this.currentTextureSize();
        const center = this.rotationCenterOf(size.w, size.h);
        this.hitPolygonInitial = this.customHitboxPoints.map(p => ({
            x: p.x - center.x,
            y: p.y - center.y,
        }));
        this.hitPolygonDirty = true;
    }

    /**
     * The current collision outline. Built fresh from the sprite's transformed
     * hit polygon, so it reflects where the sprite is right now.
     */
    /** The collision outline as a Shape, where the sprite is on the stage now. */
    _getHitboxShape(): ScratchShapeClass | null {
        // as upstream: no costume and no hitbox of its own, no hitbox
        if (!this.costumes[this.currentCostume] && !this.customHitboxPoints) return null;
        // 7.0: stage coordinates, y up, as every other Shape
        return ScratchShapeClass.of(this.hitboxShapePoints().map(p => ({ x: p.x, y: -p.y })));
    }

    private hitboxShapePoints(): { x: number, y: number }[] {
        this.setWorldTransformAndHitPolygonDirty();
        this.transformHitPolygon();
        const polygon = this.hitPolygonTransformed?.length ? this.hitPolygonTransformed : (this.hitPolygonInitial ?? []);
        // world pixels with a top-left origin become stage coordinates with the
        // origin in the middle, y pointing down, as the 6.x Hitbox did
        const cx = (this.world?.width ?? 0) / 2, cy = (this.world?.height ?? 0) / 2;
        return polygon.map(p => ({ x: p.x - cx, y: p.y - cy }));
    }

    /** internal: the outline with y pointing down, for the edge checks */
    _getHitbox(): { _getBounds(): ScratchBoundsClass, points: { x: number, y: number }[] } {
        const points = this.hitboxShapePoints();
        return {
            _getBounds: () => ScratchShapeClass.of(points)._getBounds(),
            points,
        };
    }

    _enableHitbox() { this.hitboxEnabled = true; }
    _disableHitbox() { this.hitboxEnabled = false; }

    /**
     * Debug overlay for one sprite, mirroring org.openpatch.scratch.Sprite#drawDebug:
     * the hitbox outline (unless it is disabled) plus the sprite's direction and
     * position. `label` is called with each line of text and where to centre it.
     */
    drawDebug(g: PIXI.Graphics, label: (text: string, x: number, y: number) => void) {
        if (this.hitboxEnabled) {
            this.setWorldTransformAndHitPolygonDirty();
            this.transformHitPolygon();
            const outline = this.hitPolygonTransformed?.length ? this.hitPolygonTransformed : this.hitPolygonInitial;
            if (outline && outline.length >= 3) {
                g.moveTo(outline[0].x, outline[0].y);
                for (let i = 1; i < outline.length; i++) g.lineTo(outline[i].x, outline[i].y);
                g.closePath();
                g.stroke({ width: 2, color: DEBUG_COLOR });
            }
        }

        if (this.currentCostume < 0 || !this.container?.visible) return;
        const W = this.world.width, H = this.world.height;
        const screenX = W / 2 + this.sx;
        const screenY = H / 2 - this.sy;
        const height = this.currentTextureSize().h * Math.abs(this.scaleMagnitudeY());
        label("Direction: " + round2(this.direction), screenX, screenY - height / 2 - 10);
        label("(" + round2(this.sx) + ", " + round2(this.sy) + ")", screenX, screenY);
    }

    // ---- stamps ----
    _stamp() { this._stampOnLayer(undefined); }
    /** Used by Pen.stamp() when the pen has been sent to the foreground. */
    _stampForeground() { this._stampOnLayer(LayerEnum.values[Layer.FOREGROUND]); }

    /**
     * Draw a static, non-interactive copy of the sprite where it currently is.
     * Like upstream, the no-argument stamp() goes to the BACKGROUND, i.e. behind
     * every sprite; FOREGROUND and UI go on top of them.
     */
    _stampOnLayer(layer?: LayerEnum) {
        const where = (layer?.ordinal ?? Layer.BACKGROUND) as Layer;
        const layerName: ScratchLayerName = where === Layer.BACKGROUND ? "backgroundStamps"
            : where === Layer.UI ? "uiStamps" : "foregroundStamps";

        // A stamp right after add() arrives before whenAddedToStage has run and
        // given the sprite its costume — that hook runs on its own thread here,
        // where upstream calls it synchronously. Remember the transform now and
        // print it as soon as there is something to print.
        if (this.currentCostume < 0) {
            this.pendingStamps.push({
                layerName,
                matrix: this.container.localTransform.clone(),
                alpha: this.container.alpha,
                tint: (this.container as any).tint ?? 0xffffff,
            });
            return;
        }
        this.printStamp(this.costumes[this.currentCostume].texture, layerName,
            this.container.localTransform.clone(), this.container.alpha,
            (this.container as any).tint ?? 0xffffff);
    }

    private printStamp(texture: PIXI.Texture, layerName: ScratchLayerName,
        matrix: PIXI.Matrix, alpha: number, tint: number) {
        const stamp = new PIXI.Sprite(texture);
        const center = this.rotationCenterOf(texture.width, texture.height);
        stamp.anchor.set(center.x / texture.width, center.y / texture.height);
        stamp.setFromMatrix(matrix);
        stamp.alpha = alpha;
        stamp.tint = tint;
        (scratchLayerOf(this, layerName) ?? this.world.app.stage).addChild(stamp);
    }

    private flushPendingStamps(texture: PIXI.Texture) {
        if (this.pendingStamps.length === 0) return;
        const queued = this.pendingStamps;
        this.pendingStamps = [];
        for (const s of queued) this.printStamp(texture, s.layerName, s.matrix, s.alpha, s.tint);
    }

    _mj$remove$void$(t: Thread, callback: CallbackParameter) {
        if (!this.stage || this.isDestroyed || this.removing) { if (callback) callback(); return; }
        this.removing = true;
        this.detachFromStage();
        this._mj$whenRemovedFromStage$void$(t, () => {
            this.removing = false;
            if (callback) callback();
        });
    }

    _isClone(): boolean { return this.cloned; }
    _mj$deleteThisClone$void$(t: Thread, callback: CallbackParameter) {
        if (this.cloned) this._mj$remove$void$(t, callback);
        else if (callback) callback();
    }

    _remove() {
        if (!this.stage || this.isDestroyed) return;
        // let the sprite react while it is still intact
        this.runtime?.fireRemovedFromStage(this as IScratchEventReceiver);
        this.detachFromStage();
    }

    private detachFromStage() {
        this.clearSpeech();
        this.spriteText?._remove();
        // Take the sprite out of the stage's list too, so it stops being iterated
        // by the per-frame loop and the class-based sensing methods.
        const stage = this.stage;
        if (stage) {
            const i = stage.sprites.indexOf(this);
            if (i >= 0) stage.sprites.splice(i, 1);
        }
        this.stage = undefined;
        this.penObj?._removedFromStage(stage as any);
        if (this.penObj) this.penObj.stage = undefined;
        this.container?.removeFromParent();
        this.variableMonitors.detach();
        this.runtime?.unregister(this);
        this.listenersRegistered = false;
        this.world?.interpreter?.actorManager.unregisterActor(this);
        for (const list of [this.world?.shapesWhichBelongToNoGroup, this.world?.shapesNotAffectedByWorldTransforms]) {
            const index = list?.indexOf(this) ?? -1;
            if (index >= 0) list!.splice(index, 1);
        }
    }

    override destroy() {
        if (this.isDestroyed) return;
        this.variableMonitors.clear();
        this.runtime?.unregister(this);
        this.clearSpeech();
        this.spriteText?._remove();
        this.soundBank.stopAll();
        super.destroy();
    }

    _mj$copy$Shape$(t: Thread, callback: CallbackParameter) {
        // Java instance initializers live in interpreted constructors. Neither
        // those nor a student's constructor run when cloning an object.
        const copy = Object.assign(Object.create(Object.getPrototypeOf(this)), this) as ScratchSpriteClass;
        copy.cloneStateFrom(this);
        copy.cloned = true;
        if (this.stage) {
            const stage = this.stage;
            stage.sprites.splice(Math.max(0, stage.sprites.indexOf(this)), 0, copy);
            copy.attachToStage(stage);
            const parent = copy.container.parent;
            if (parent === this.container.parent) parent?.setChildIndex(copy.container, parent.getChildIndex(this.container));
        }
        copy._registerListeners(t);
        t.s.push(copy);
        copy._mj$whenStartsAsClone$void$(t, callback);
    }

    protected cloneStateFrom(original: ScratchSpriteClass) {
        this.stage = undefined;
        this.runtime = undefined;
        // the clone gets its own animation table, as 6.x's AnimatedSprite did
        this.animations = new Map(original.animations);
        this.animationName = undefined;
        this.animationFrame = 0;
        this.animationPlayed = false;
        this.listenersRegistered = false;
        this.removing = false;
        this.isDestroyed = false;
        this.belongsToGroup = undefined;
        this.mouseEventsImplemented = undefined;
        this.mouseLastSeenInsideObject = false;
        this.hitPolygonInitial = original.hitPolygonInitial.map(point => ({ ...point }));
        this.hitPolygonTransformed = original.hitPolygonTransformed.map(point => ({ ...point }));
        this.customHitboxPoints = original.customHitboxPoints?.map(point => ({ ...point }));
        this.rotationCenter = original.rotationCenter ? { ...original.rotationCenter } : undefined;
        this.costumes = original.costumes.map(costume => ({ ...costume }));
        this.container = new PIXI.Container();
        this.pendingStamps = [];
        this.speechBubble = undefined;
        this.nineDisplay = undefined;
        this.speechTicksLeft = -1;
        this.spriteText = undefined;
        this.variableMonitors = new ScratchMonitors();
        this.timer = undefined;
        this.soundBank = original.soundBank.copy();
        this.penObj = new ScratchPenClass();
        this.penObj.sprite = this;
        this.penObj.attachToWorld(this.world as any);
        this.penObj.px = this.sx; this.penObj.py = this.sy;
        if (original.penObj) {
            this.penObj._copyStateFrom(original.penObj);
        }
        this.shaders = original.shaders?.copyFor(filters => this.applyShader(filters[0]));
        // Object's synchronization state belongs to this object alone.
        for (const key of ['runnableOrWaitingThreads', 'threadHoldingLockToThisObject', 'reentranceCounter']) delete this[key];
        this.syncWorldRegistration(!this.stage?.scratchLayers || isScratchStageActive(this.stage as any));
        (spriteLayerOfLayer(this, this.spriteLayer) ?? this.world.app.stage).addChild(this.container);
        if (this.currentCostume >= 0) this._applyCostumeIndex(this.currentCostume);
        this.container.visible = original.container.visible;
        this.container.alpha = original.container.alpha;
        this.container.tint = original.container.tint;
        this.applyState();
    }

    // shared mouse state, updated by ScratchStage's mouse listener
    static mouseScreenX: number = 0;
    static mouseScreenY: number = 0;
    static mouseDown: boolean = false;
    /**
     * Mouse position in stage coordinates. The pointer is reported in screen
     * pixels, so a panned or zoomed camera has to be undone first — the same
     * camera.toLocal* step upstream applies before it stores mouseX/mouseY.
     */
    static mouseLogicalX(world: any): number {
        const raw = ScratchSpriteClass.mouseScreenX - world.width / 2;
        const camera = ScratchSpriteClass.cameraOf(world);
        return camera ? raw / (camera.zoom / 100) + camera.x : raw;
    }

    static mouseLogicalY(world: any): number {
        const raw = world.height / 2 - ScratchSpriteClass.mouseScreenY;
        const camera = ScratchSpriteClass.cameraOf(world);
        return camera ? raw / (camera.zoom / 100) + camera.y : raw;
    }

    private static cameraOf(_world: any): { x: number, y: number, zoom: number } | undefined {
        const stage = activeScratchStage<{ camera?: { x: number, y: number, zoom: number } }>();
        return stage?.camera;
    }
}

/** Whether `object` is of a library class itself rather than of a class the program declares. */
export function isLibraryInstance(object: object): boolean {
    return (object.constructor as any).type?.isLibraryType !== false;
}
