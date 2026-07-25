import * as PIXI from "pixi.js";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ArrayListClass } from "../../system/collections/ArrayListClass";
import { ClassClass } from "../../system/ClassClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { ShapeClass } from "../ShapeClass";
import { KeyCodeEnum } from "./KeyCodeEnum";
import { Layer, LayerEnum } from "./LayerEnum";
import { ScratchLayerName, scratchLayerOf, spriteLayerOf } from "./ScratchLayers";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { RotationStyle, RotationStyleEnum } from "./RotationStyleEnum";
import { ScratchColorClass } from "./ScratchColorClass";
import { ScratchCostumes } from "./ScratchCostumes";
import { DEBUG_COLOR, round2 } from "./ScratchDebug";
import { ScratchHitboxClass } from "./ScratchHitboxClass";
import { ScratchPenClass } from "./ScratchPenClass";
import { IScratchEventReceiver, ScratchRuntimeManager } from "./ScratchRuntimeManager";
import { ScratchSoundBank } from "./ScratchSounds";
import { ScratchShapeClass } from "./ScratchShapeClasses";
import { ScratchTextClass } from "./ScratchTextClass";
import { ScratchTimerClass } from "./ScratchTimerClass";
import { desktopOnlyValue } from "./ScratchUnsupported";
import { ScratchVector2Class } from "./ScratchVector2Class";

type Costume = { name: string; texture: PIXI.Texture };

/**
 * What a sprite needs from its stage. Typed structurally rather than importing
 * ScratchStageClass, which imports this module in turn.
 */
type ScratchStageLike = {
    _broadcast(message: StringClass): void;
    _ask(question: string): void;
    _getAnswer(): string;
    _isAsking(): boolean;
    _pickRandom(from: number, to: number): number;
    _getDeltaTime(): number;
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
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Sprite extends Actor", comment: "Figur mit Kostümen, die sich auf der Bühne bewegen kann" },

        { type: "method", signature: "Sprite()", java: ScratchSpriteClass.prototype._cj$_constructor_$Sprite$, comment: "Erzeugt eine neue Figur" },
        { type: "method", signature: "Sprite(string name, string imagePath)", java: ScratchSpriteClass.prototype._cj$_constructor_$Sprite$string$string, comment: "Erzeugt eine Figur mit einem ersten Kostüm" },
        { type: "method", signature: "Sprite(Sprite s)", java: ScratchSpriteClass.prototype._cj$_constructor_$Sprite$Sprite, comment: "Erzeugt eine Kopie der angegebenen Figur" },

        // per-frame hook (Scratch: runs every frame)
        { type: "method", signature: "void run()", java: ScratchSpriteClass.prototype._mj$run$void$, comment: "Wird in jedem Frame aufgerufen" },

        // overridable event hooks
        { type: "method", signature: "void whenAddedToStage()", java: ScratchSpriteClass.prototype._mj$whenAddedToStage$void$, comment: "Wird aufgerufen, wenn die Figur der Bühne hinzugefügt wird" },
        { type: "method", signature: "void whenRemovedFromStage()", java: ScratchSpriteClass.prototype._mj$whenRemovedFromStage$void$, comment: "Wird aufgerufen, wenn die Figur von der Bühne entfernt wird" },
        { type: "method", signature: "void whenClicked()", java: ScratchSpriteClass.prototype._mj$whenClicked$void$, comment: "Wird aufgerufen, wenn die Figur angeklickt wird" },
        { type: "method", signature: "void whenKeyPressed(KeyCode key)", java: ScratchSpriteClass.prototype._mj$whenKeyPressed$void$KeyCode, comment: "Wird beim Drücken einer Taste aufgerufen" },
        { type: "method", signature: "void whenKeyReleased(KeyCode key)", java: ScratchSpriteClass.prototype._mj$whenKeyReleased$void$KeyCode, comment: "Wird beim Loslassen einer Taste aufgerufen" },
        { type: "method", signature: "void whenMouseClicked(MouseCode button)", java: ScratchSpriteClass.prototype._mj$whenMouseClicked$void$MouseCode, comment: "Wird bei einem Mausklick aufgerufen, egal wo" },
        { type: "method", signature: "void whenMouseMoved(double x, double y)", java: ScratchSpriteClass.prototype._mj$whenMouseMoved$void$double$double, comment: "Wird bei jeder Mausbewegung aufgerufen; x und y sind Bühnenkoordinaten" },
        { type: "method", signature: "void whenIReceive(String message)", java: ScratchSpriteClass.prototype._mj$whenIReceive$void$String, comment: "Wird aufgerufen, wenn die Bühne eine Nachricht sendet" },
        { type: "method", signature: "void whenBackdropSwitches(String name)", java: ScratchSpriteClass.prototype._mj$whenBackdropSwitches$void$String, comment: "Wird aufgerufen, wenn der Hintergrund gewechselt wird" },

        // speech
        { type: "method", signature: "void say(string text)", native: ScratchSpriteClass.prototype._say, comment: "Zeigt eine Sprechblase an" },
        { type: "method", signature: "void say(string text, int millis)", native: ScratchSpriteClass.prototype._sayFor, comment: "Zeigt eine Sprechblase für die angegebene Zeit in Millisekunden" },
        { type: "method", signature: "void think(string text)", native: ScratchSpriteClass.prototype._think, comment: "Zeigt eine Denkblase an" },
        { type: "method", signature: "void think(string text, int millis)", native: ScratchSpriteClass.prototype._thinkFor, comment: "Zeigt eine Denkblase für die angegebene Zeit in Millisekunden" },

        // costumes
        { type: "method", signature: "void addCostume(string name)", native: ScratchSpriteClass.prototype._addCostume, comment: "Fügt eines der eingebauten Kostüme hinzu" },
        { type: "method", signature: "void addCostume(string name, string imagePath)", native: ScratchSpriteClass.prototype._addCostume2, comment: "Fügt ein Kostüm unter eigenem Namen hinzu" },
        { type: "method", signature: "void addCostume(string name, string spriteSheetPath, int x, int y, int width, int height)", native: ScratchSpriteClass.prototype._addCostumeFromSheet, comment: "Schneidet ein Kostüm aus einem Bild aus" },
        { type: "method", signature: "void addCostumes(string prefix, string spriteSheet, int tileWidth, int tileHeight)", native: ScratchSpriteClass.prototype._addCostumes, comment: "Zerschneidet ein Bild in gleich große Kacheln und fügt sie als Kostüme hinzu" },
        { type: "method", signature: "void switchCostume(string name)", native: ScratchSpriteClass.prototype._switchCostumeByName, comment: "Wechselt zum Kostüm mit dem Namen" },
        { type: "method", signature: "void switchCostume(int index)", native: ScratchSpriteClass.prototype._switchCostumeByIndex, comment: "Wechselt zum Kostüm mit der angegebenen Nummer" },
        { type: "method", signature: "void nextCostume()", native: ScratchSpriteClass.prototype._nextCostume, comment: "Wechselt zum nächsten Kostüm" },
        { type: "method", signature: "void previousCostume()", native: ScratchSpriteClass.prototype._previousCostume, comment: "Wechselt zum vorherigen Kostüm" },
        { type: "method", signature: "string getCurrentCostumeName()", native: ScratchSpriteClass.prototype._getCurrentCostumeName, comment: "Gibt den Namen des aktuellen Kostüms zurück" },
        { type: "method", signature: "int getCurrentCostumeIndex()", native: ScratchSpriteClass.prototype._getCurrentCostumeIndex, comment: "Gibt die Nummer des aktuellen Kostüms zurück" },

        // sound
        { type: "method", signature: "void addSound(string name)", native: ScratchSpriteClass.prototype._addSound, comment: "Fügt einen der eingebauten Klänge hinzu" },
        { type: "method", signature: "void addSound(string name, string soundPath)", native: ScratchSpriteClass.prototype._addSound2, comment: "Fügt einen Klang unter eigenem Namen hinzu" },
        { type: "method", signature: "void playSound(string name)", native: ScratchSpriteClass.prototype._playSound, comment: "Spielt einen zuvor hinzugefügten Klang ab" },
        { type: "method", signature: "void stopSound(string name)", native: ScratchSpriteClass.prototype._stopSound, comment: "Stoppt den Klang mit dem angegebenen Namen" },
        { type: "method", signature: "void stopAllSounds()", native: ScratchSpriteClass.prototype._stopAllSounds, comment: "Stoppt alle Klänge dieser Figur" },
        { type: "method", signature: "boolean isSoundPlaying(string name)", native: ScratchSpriteClass.prototype._isSoundPlaying, comment: "Gibt genau dann true zurück, wenn der Klang gerade abgespielt wird" },
        { type: "method", signature: "void setVolume(double percent)", native: ScratchSpriteClass.prototype._setVolume, comment: "Setzt die Lautstärke aller Klänge dieser Figur in Prozent" },
        { type: "method", signature: "void changeVolume(double step)", native: ScratchSpriteClass.prototype._changeVolume, comment: "Ändert die Lautstärke um den angegebenen Wert" },
        { type: "method", signature: "double getVolume()", native: ScratchSpriteClass.prototype._getVolume, comment: "Gibt die Lautstärke in Prozent zurück" },

        // movement
        { type: "method", signature: "void move(double steps)", native: ScratchSpriteClass.prototype._move2, comment: "Bewegt die Figur um die angegebene Schrittzahl in ihre Blickrichtung" },
        { type: "method", signature: "void move(Vector2 v)", native: ScratchSpriteClass.prototype._moveV, comment: "Verschiebt die Figur um den Vektor" },
        { type: "method", signature: "void setPosition(double x, double y)", native: ScratchSpriteClass.prototype._setPosition, comment: "Setzt die Figur an die angegebene Position (Mitte der Bühne ist 0/0)" },
        { type: "method", signature: "void setPosition(Vector2 v)", native: ScratchSpriteClass.prototype._setPositionV, comment: "Setzt die Figur an die angegebene Position (Mitte der Bühne ist 0/0)" },
        { type: "method", signature: "void changePosition(double x, double y)", native: ScratchSpriteClass.prototype._changePosition, comment: "Verschiebt die Figur um die angegebenen Werte" },
        { type: "method", signature: "void changePosition(Vector2 v)", native: ScratchSpriteClass.prototype._changePositionV, comment: "Verschiebt die Figur um den angegebenen Vektor" },
        { type: "method", signature: "Vector2 getPosition()", native: ScratchSpriteClass.prototype._getPosition, comment: "Gibt die Position der Figur zurück" },
        { type: "method", signature: "void glide(double seconds, double x, double y)", native: ScratchSpriteClass.prototype._glide, comment: "Gleitet in der angegebenen Zeit zur Zielposition" },
        { type: "method", signature: "boolean isGliding()", native: ScratchSpriteClass.prototype._isGliding, comment: "Gibt genau dann true zurück, wenn die Figur gerade gleitet" },
        { type: "method", signature: "void goToMousePointer()", native: ScratchSpriteClass.prototype._goToMousePointer, comment: "Setzt die Figur an die Position des Mauszeigers" },
        { type: "method", signature: "double getX()", native: ScratchSpriteClass.prototype._getX, comment: "Gibt die x-Position zurück (Mitte der Bühne ist 0)" },
        { type: "method", signature: "double getY()", native: ScratchSpriteClass.prototype._getY, comment: "Gibt die y-Position zurück (Mitte der Bühne ist 0, nach oben positiv)" },
        { type: "method", signature: "void setX(double x)", native: ScratchSpriteClass.prototype._setX2, comment: "Setzt die x-Position" },
        { type: "method", signature: "void setY(double y)", native: ScratchSpriteClass.prototype._setY2, comment: "Setzt die y-Position" },
        { type: "method", signature: "void changeX(double x)", native: ScratchSpriteClass.prototype._changeX, comment: "Ändert die x-Position um den angegebenen Wert" },
        { type: "method", signature: "void changeY(double y)", native: ScratchSpriteClass.prototype._changeY, comment: "Ändert die y-Position um den angegebenen Wert" },
        { type: "method", signature: "void goToRandomPosition()", native: ScratchSpriteClass.prototype._goToRandomPosition, comment: "Setzt die Figur an eine zufällige Position auf der Bühne" },
        { type: "method", signature: "void ifOnEdgeBounce()", native: ScratchSpriteClass.prototype._ifOnEdgeBounce, comment: "Lässt die Figur am Bühnenrand abprallen" },

        // rotation
        { type: "method", signature: "void turnRight(double degrees)", native: ScratchSpriteClass.prototype._turnRight, comment: "Dreht die Figur um die angegebene Gradzahl nach rechts" },
        { type: "method", signature: "void turnLeft(double degrees)", native: ScratchSpriteClass.prototype._turnLeft, comment: "Dreht die Figur um die angegebene Gradzahl nach links" },
        { type: "method", signature: "void setDirection(double degrees)", native: ScratchSpriteClass.prototype._setDirection, comment: "Setzt die Blickrichtung in Grad (90 = rechts, 0 = oben)" },
        { type: "method", signature: "void setDirection(Vector2 v)", native: ScratchSpriteClass.prototype._setDirectionV, comment: "Setzt die Blickrichtung auf die Richtung des Vektors" },
        { type: "method", signature: "void goToSprite(Sprite sprite)", native: ScratchSpriteClass.prototype._goToSprite, comment: "Setzt die Figur auf die Position einer anderen Figur" },
        { type: "method", signature: "void pointInDirection(double degrees)", native: ScratchSpriteClass.prototype._setDirection, comment: "Setzt die Blickrichtung in Grad (90 = rechts, 0 = oben)" },
        { type: "method", signature: "void pointInDirection(Vector2 v)", native: ScratchSpriteClass.prototype._pointInDirectionV, comment: "Richtet die Figur entlang des angegebenen Vektors aus" },
        { type: "method", signature: "void pointTowardsMousePointer()", native: ScratchSpriteClass.prototype._pointTowardsMousePointer, comment: "Richtet die Figur zum Mauszeiger aus" },
        { type: "method", signature: "void pointTowardsSprite(Sprite other)", native: ScratchSpriteClass.prototype._pointTowardsSprite, comment: "Richtet die Figur zu einer anderen Figur aus" },
        { type: "method", signature: "double getDirection()", native: ScratchSpriteClass.prototype._getDirection, comment: "Gibt die Blickrichtung in Grad zurück (90 = rechts, 0 = oben)" },
        { type: "method", signature: "void setRotationStyle(RotationStyle style)", native: ScratchSpriteClass.prototype._setRotationStyle, comment: "Legt fest, wie sich die Figur beim Drehen verhält" },

        // appearance
        { type: "method", signature: "void show()", native: ScratchSpriteClass.prototype._show, comment: "Macht die Figur sichtbar" },
        { type: "method", signature: "void hide()", native: ScratchSpriteClass.prototype._hide, comment: "Macht die Figur unsichtbar" },
        { type: "method", signature: "boolean isVisible()", native: ScratchSpriteClass.prototype._isVisibleScratch, comment: "Gibt genau dann true zurück, wenn die Figur sichtbar ist" },
        { type: "method", signature: "void setSize(double percentage)", native: ScratchSpriteClass.prototype._setSize, comment: "Setzt die Größe in Prozent (100 = Originalgröße)" },
        { type: "method", signature: "void changeSize(double amount)", native: ScratchSpriteClass.prototype._changeSize, comment: "Ändert die Größe um den angegebenen Wert in Prozent" },
        { type: "method", signature: "double getSize()", native: ScratchSpriteClass.prototype._getSize, comment: "Gibt die Größe in Prozent zurück" },
        { type: "method", signature: "void setTransparency(double percentage)", native: ScratchSpriteClass.prototype._setTransparency, comment: "Setzt die Transparenz in Prozent (0 = deckend, 100 = unsichtbar)" },
        { type: "method", signature: "void changeTransparency(double step)", native: ScratchSpriteClass.prototype._changeTransparency, comment: "Ändert die Transparenz um den angegebenen Wert" },
        { type: "method", signature: "double getTransparency()", native: ScratchSpriteClass.prototype._getTransparency, comment: "Gibt die Transparenz in Prozent zurück" },
        { type: "method", signature: "double getWidth()", native: ScratchSpriteClass.prototype._getSpriteWidth, comment: "Gibt die Breite der Figur in Pixeln zurück" },
        { type: "method", signature: "double getHeight()", native: ScratchSpriteClass.prototype._getSpriteHeight, comment: "Gibt die Höhe der Figur in Pixeln zurück" },
        { type: "method", signature: "void setTint(Color c)", native: ScratchSpriteClass.prototype._setTintObj, comment: "Färbt die Figur mit der angegebenen Farbe ein" },
        { type: "method", signature: "void setTint(double h)", native: ScratchSpriteClass.prototype._setTintHue, comment: "Färbt die Figur mit dem angegebenen Farbton ein (0 bis 255)" },
        { type: "method", signature: "void setTint(double r, double g, double b)", native: ScratchSpriteClass.prototype._setTintRGB, comment: "Färbt die Figur mit der angegebenen Farbe ein (Anteile jeweils 0 bis 255)" },
        { type: "method", signature: "void changeTint(double step)", native: ScratchSpriteClass.prototype._changeTint, comment: "Ändert den Farbton der Einfärbung um den angegebenen Wert" },
        { type: "method", signature: "Color getTint()", native: ScratchSpriteClass.prototype._getTint, comment: "Gibt die Farbe der Einfärbung zurück" },

        // layering
        { type: "method", signature: "void goToFrontLayer()", native: ScratchSpriteClass.prototype._goToFrontLayer, comment: "Bringt die Figur ganz nach vorne" },
        { type: "method", signature: "void goToBackLayer()", native: ScratchSpriteClass.prototype._goToBackLayer, comment: "Schiebt die Figur ganz nach hinten" },
        { type: "method", signature: "void goLayersForwards(int number)", native: ScratchSpriteClass.prototype._goLayersForwards, comment: "Bringt die Figur um die angegebene Anzahl Ebenen nach vorne" },
        { type: "method", signature: "void goLayersBackwards(int number)", native: ScratchSpriteClass.prototype._goLayersBackwards, comment: "Schiebt die Figur um die angegebene Anzahl Ebenen nach hinten" },

        // sensing
        { type: "method", signature: "boolean isTouchingSprite(Sprite other)", native: ScratchSpriteClass.prototype._isTouchingSprite, comment: "Gibt genau dann true zurück, wenn sich die Figuren berühren" },
        { type: "method", signature: "boolean isTouchingSprite(Class<? extends Sprite> c)", native: ScratchSpriteClass.prototype._isTouchingSpriteOfClass, comment: "Gibt genau dann true zurück, wenn die Figur eine Figur dieser Klasse berührt, z.B. isTouchingSprite(Apfel.class)" },
        { type: "method", signature: "<T extends Sprite> T getTouchingSprite(Class<T> c)", native: ScratchSpriteClass.prototype._getTouchingSprite, comment: "Gibt die erste berührte Figur dieser Klasse zurück, sonst null" },
        { type: "method", signature: "<T extends Sprite> List<T> getTouchingSprites(Class<T> c)", native: ScratchSpriteClass.prototype._getTouchingSprites, comment: "Gibt alle berührten Figuren dieser Klasse zurück" },
        { type: "method", signature: "boolean isTouchingEdge()", native: ScratchSpriteClass.prototype._isTouchingEdge, comment: "Gibt genau dann true zurück, wenn die Figur den Bühnenrand berührt" },
        { type: "method", signature: "boolean isTouchingMousePointer()", native: ScratchSpriteClass.prototype._isTouchingMousePointer, comment: "Gibt genau dann true zurück, wenn der Mauszeiger auf der Figur liegt" },
        { type: "method", signature: "boolean isKeyPressed(KeyCode key)", native: ScratchSpriteClass.prototype._isKeyPressed, comment: "Gibt genau dann true zurück, wenn die Taste gerade gedrückt ist" },
        { type: "method", signature: "double getMouseX()", native: ScratchSpriteClass.prototype._getMouseX, comment: "Gibt die x-Position des Mauszeigers zurück" },
        { type: "method", signature: "double getMouseY()", native: ScratchSpriteClass.prototype._getMouseY, comment: "Gibt die y-Position des Mauszeigers zurück" },
        { type: "method", signature: "Vector2 getMouse()", native: ScratchSpriteClass.prototype._getMouse, comment: "Gibt die Position des Mauszeigers zurück" },
        { type: "method", signature: "boolean isMouseDown()", native: ScratchSpriteClass.prototype._isMouseDown, comment: "Gibt genau dann true zurück, wenn eine Maustaste gedrückt ist" },
        { type: "method", signature: "double distanceToSprite(Sprite other)", native: ScratchSpriteClass.prototype._distanceToSprite, comment: "Gibt den Abstand zu einer anderen Figur zurück" },
        { type: "method", signature: "double distanceToMousePointer()", native: ScratchSpriteClass.prototype._distanceToMousePointer, comment: "Gibt den Abstand zum Mauszeiger zurück" },

        // things the sprite asks its stage for
        { type: "method", signature: "Stage getStage()", native: ScratchSpriteClass.prototype._getStage, comment: "Gibt die Bühne zurück, auf der die Figur steht" },
        { type: "method", signature: "void broadcast(String message)", native: ScratchSpriteClass.prototype._broadcast, comment: "Sendet eine Nachricht an alle Figuren und die Bühne" },
        { type: "method", signature: "void ask(string question)", native: ScratchSpriteClass.prototype._ask, comment: "Stellt eine Frage; die Antwort wird über getAnswer() abgeholt" },
        { type: "method", signature: "string getAnswer()", native: ScratchSpriteClass.prototype._getAnswer, comment: "Gibt die zuletzt eingegebene Antwort zurück, sonst eine leere Zeichenkette" },
        { type: "method", signature: "boolean isAsking()", native: ScratchSpriteClass.prototype._isAsking, comment: "Gibt genau dann true zurück, wenn noch auf eine Antwort gewartet wird" },
        { type: "method", signature: "int pickRandom(int from, int to)", native: ScratchSpriteClass.prototype._pickRandom, comment: "Gibt eine Zufallszahl zwischen from und to zurück (beide eingeschlossen)" },
        { type: "method", signature: "double getDeltaTime()", native: ScratchSpriteClass.prototype._getDeltaTime, comment: "Gibt die Dauer des letzten Frames in Sekunden zurück" },
        { type: "method", signature: "Text getText()", native: ScratchSpriteClass.prototype._getText, comment: "Gibt den Text zurück, der über der Figur angezeigt wird" },
        { type: "method", signature: "void debug(Object... values)", native: ScratchSpriteClass.prototype._debug, comment: "Gibt Werte zur Fehlersuche aus" },

        { type: "method", signature: "Timer getTimer()", native: ScratchSpriteClass.prototype._getTimer, comment: "Gibt den Standard-Timer dieser Figur zurück" },
        { type: "method", signature: "Timer getTimer(string name)", native: ScratchSpriteClass.prototype._getNamedTimer, comment: "Gibt den Timer mit dem angegebenen Namen zurück und legt ihn bei Bedarf an" },

        { type: "method", signature: "void setHitbox(double... points)", native: ScratchSpriteClass.prototype._setHitbox, comment: "Setzt die Trefferfläche aus x/y-Paaren; (0/0) ist die Mitte der Figur" },
        { type: "method", signature: "void setHitbox(Shape shape)", native: ScratchSpriteClass.prototype._setHitboxShape, comment: "Setzt die Trefferfläche auf die angegebene Form; (0/0) ist die Mitte der Figur" },
        { type: "method", signature: "Hitbox getHitbox()", native: ScratchSpriteClass.prototype._getHitbox, comment: "Gibt die Trefferfläche der Figur zurück" },
        { type: "method", signature: "void enableHitbox()", native: ScratchSpriteClass.prototype._enableHitbox, comment: "Schaltet die Berührungserkennung wieder ein" },
        { type: "method", signature: "void disableHitbox()", native: ScratchSpriteClass.prototype._disableHitbox, comment: "Schaltet die Berührungserkennung aus" },
        { type: "method", signature: "void stamp()", native: ScratchSpriteClass.prototype._stamp, comment: "Druckt ein unbewegliches Abbild der Figur auf die Bühne" },
        { type: "method", signature: "void stamp(Layer layer)", native: ScratchSpriteClass.prototype._stampOnLayer, comment: "Druckt ein unbewegliches Abbild der Figur auf die angegebene Ebene" },

        { type: "method", signature: "Pen getPen()", native: ScratchSpriteClass.prototype._getPen, comment: "Gibt den Stift dieser Figur zurück; mit ihm kann sie eine Spur zeichnen" },

        { type: "method", signature: "void remove()", native: ScratchSpriteClass.prototype._remove, comment: "Entfernt die Figur von der Bühne" },

        { type: "method", signature: "Sprite clone()", java: ScratchSpriteClass.prototype._mj$copy$Shape$, comment: "Erzeugt eine Kopie der Figur" },
        { type: "method", signature: "Shaders getShaders()", native: ScratchSpriteClass.prototype._getShaders, comment: "Nur in der Desktop-Version: Shader dieser Figur" },
    ];

    static type: NonPrimitiveType;

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

    _cj$_constructor_$Sprite$(t: Thread, callback: CallbackParameter) {
        this._cj$_constructor_$Shape$(t, () => {
            // Shape's constructor pushed `this` and set up this.world
            this.container = new PIXI.Container();
            // UI sprites go into the layer the camera does not move
            (spriteLayerOf(this.world, this.isUI()) ?? this.world.app.stage).addChild(this.container);
            this.centerXInitial = 0;
            this.centerYInitial = 0;
            this.penObj = new ScratchPenClass();
            this.penObj.sprite = this;      // so pen.stamp() knows what to print
            this.penObj.attachToWorld(this.world as any);
            this.penObj.px = this.sx;
            this.penObj.py = this.sy;
            this.addToDefaultGroupAndSetDefaultVisibility();
            this.applyState();
            if (callback) callback();
        });
    }

    /** Upstream's `new Sprite(name, path)` — the costume is there right away. */
    _cj$_constructor_$Sprite$string$string(t: Thread, callback: CallbackParameter, name: string, imagePath: string) {
        this._cj$_constructor_$Sprite$(t, () => {
            t.s.pop();
            this._addCostume2(name, imagePath);
            t.s.push(this);
            if (callback) callback();
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
                if (other.currentCostume >= 0) this._applyCostumeIndex(other.currentCostume);
                this.applyState();
            }
            t.s.push(this);
            if (callback) callback();
        });
    }

    _getPen(): ScratchPenClass {
        if (!this.penObj) {
            this.penObj = new ScratchPenClass();
            this.penObj.sprite = this;      // so pen.stamp() knows what to print
            this.penObj.attachToWorld(this.world as any);
            this.penObj.px = this.sx;
            this.penObj.py = this.sy;
        }
        return this.penObj;
    }

    // ---- per-frame ----
    _mj$act$void$(t: Thread, callback: CallbackParameter): void {
        this.stepGlide();
        this._mj$run$void$(t, callback);
    }
    _mj$run$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }

    // ---- overridable event hooks (empty defaults) ----
    _mj$whenAddedToStage$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenRemovedFromStage$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenClicked$void$(_t: Thread, callback: CallbackParameter): void { if (callback) callback(); }
    _mj$whenKeyPressed$void$KeyCode(_t: Thread, callback: CallbackParameter, _key: KeyCodeEnum): void { if (callback) callback(); }
    _mj$whenKeyReleased$void$KeyCode(_t: Thread, callback: CallbackParameter, _key: KeyCodeEnum): void { if (callback) callback(); }
    _mj$whenMouseClicked$void$MouseCode(_t: Thread, callback: CallbackParameter, _code: MouseCodeEnum): void { if (callback) callback(); }
    _mj$whenMouseMoved$void$double$double(_t: Thread, callback: CallbackParameter, _x: number, _y: number): void { if (callback) callback(); }
    _mj$whenIReceive$void$String(_t: Thread, callback: CallbackParameter, _message: StringClass): void { if (callback) callback(); }
    _mj$whenBackdropSwitches$void$String(_t: Thread, callback: CallbackParameter, _name: StringClass): void { if (callback) callback(); }

    _registerListeners(t: Thread): void {
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
        });
    }

    // ---- speech / thought bubbles ----
    private speechBubble?: PIXI.Container;
    private speechTimeout?: any;

    /**
     * Speech and thought bubbles, matching org.openpatch.scratch.Text#drawBubble:
     * UbuntuMono 14, white fill, light grey border, grey text, 16px corners, and
     * 8px padding. A speech bubble gets a triangular tail at its bottom left, a
     * thought bubble three shrinking circles. The numbers below are upstream's.
     */
    private showSpeech(text: string, think: boolean) {
        this.clearSpeech();
        if (!text || text.length === 0) return;

        const style = new PIXI.TextStyle({
            fontFamily: "UbuntuMono, monospace",
            fontSize: ScratchSpriteClass.BUBBLE_FONT_SIZE,
            fill: 0x787878,                                  // Color(120, 120, 120)
            // `leading` is the gap BETWEEN lines, which is what Processing's
            // textLeading(textSize + 4) means; lineHeight would instead centre
            // every line in an 18px box and push the first one down
            leading: 4,
            wordWrap: true,
            wordWrapWidth: ScratchSpriteClass.SPEAK_BUBBLE_MAX_LIMIT,
        });
        const label = new PIXI.Text({ text, style });

        const lines = Math.max(1, text.split("\n").length, Math.round(label.height / (ScratchSpriteClass.BUBBLE_FONT_SIZE + 4)));
        const bw = Math.max(label.width, ScratchSpriteClass.SPEAK_BUBBLE_MIN_LIMIT) + 16;
        const bh = (ScratchSpriteClass.BUBBLE_FONT_SIZE + 4) * lines + 16;

        const g = new PIXI.Graphics();
        g.roundRect(0, 0, bw, bh, 16).fill(0xffffff).stroke({ width: 1, color: 0xdadada });
        if (think) {
            // circle(x, y, d) upstream takes a diameter, so these are radii
            g.circle(20, bh, 5).fill(0xffffff).stroke({ width: 1, color: 0xdadada });
            g.circle(7, bh + 7, 3).fill(0xffffff).stroke({ width: 1, color: 0xdadada });
            g.circle(0, bh + 10, 2).fill(0xffffff).stroke({ width: 1, color: 0xdadada });
        } else {
            g.moveTo(10, bh + 20).lineTo(10, bh).lineTo(30, bh).fill(0xffffff);
            // hides the seam where the tail meets the border, as upstream does
            g.moveTo(12, bh).lineTo(26, bh).stroke({ width: 3, color: 0xffffff });
        }

        // 8,8 upstream; PIXI puts the glyph box a few pixels lower than
        // Processing does, so the y is nudged to make the two renders line up
        label.position.set(8, 4);
        const bubble = new PIXI.Container();
        bubble.addChild(g);
        bubble.addChild(label);
        // the bubble belongs with its sprite, so the camera moves it too
        (spriteLayerOf(this.world, this.isUI()) ?? this.world.app.stage).addChild(bubble);
        this.speechBubble = bubble;
        this.speechBubbleHeight = bh;
        this.positionSpeech();
    }

    /**
     * Anchor the bubble the way upstream's drawBubble does: its bottom-left
     * corner sits at (spriteX + width*0.9/2, spriteY + height*1.1/2) in stage
     * coordinates, i.e. just off the sprite's top-right shoulder.
     *
     * The sprite's own state is used rather than container.getBounds(), because
     * PIXI bounds are only valid once a frame has been rendered — a say() in the
     * Stage constructor would otherwise pin every bubble to the top-left corner.
     */
    private positionSpeech() {
        if (!this.speechBubble || !this.container || this.container.destroyed) return;
        const W = this.world.width, H = this.world.height;
        const size = this.currentTextureSize();
        const spriteWidth = size.w * Math.abs(this.scaleMagnitudeX());
        const spriteHeight = size.h * Math.abs(this.scaleMagnitudeY());

        const anchorX = this.sx + spriteWidth * 0.9 / 2;
        const anchorY = this.sy + spriteHeight * 1.1 / 2;
        this.speechBubble.position.set(
            W / 2 + anchorX,
            H / 2 - anchorY - this.speechBubbleHeight);
    }

    private clearSpeech() {
        if (this.speechTimeout) { clearTimeout(this.speechTimeout); this.speechTimeout = undefined; }
        if (this.speechBubble) { this.speechBubble.destroy({ children: true }); this.speechBubble = undefined; }
    }

    _say(text: string) { this.showSpeech(text, false); }
    _think(text: string) { this.showSpeech(text, true); }
    _sayFor(text: string, millis: number) { this.showSpeech(text, false); this.speechTimeout = setTimeout(() => this.clearSpeech(), millis); }
    _thinkFor(text: string, millis: number) { this.showSpeech(text, true); this.speechTimeout = setTimeout(() => this.clearSpeech(), millis); }

    // ---- coordinate conversion + transform ----
    // scaleMagnitudeX/Y give the (positive) scale of the costume container.
    // A normal sprite scales uniformly by size%; UISprite overrides these to size
    // its costume in pixels. The LEFT_RIGHT flip and rotation are applied on top.
    protected scaleMagnitudeX(): number { return this.size / 100; }
    protected scaleMagnitudeY(): number { return this.size / 100; }

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
        // pen follows the sprite (draws a segment when the pen is down)
        this.penObj?._setPosition(this.sx, this.sy);
    }

    // ---- things the stage owns ----
    /** The running stage, or undefined before one exists. */
    private stage(): ScratchStageLike | undefined {
        return (this.world as any)?.interpreter?.retrieveObject("ScratchStage") as ScratchStageLike | undefined;
    }

    _getStage(): ScratchStageLike | undefined { return this.stage(); }
    _broadcast(message: StringClass) { this.stage()?._broadcast(message); }
    _ask(question: string) { this.stage()?._ask(question); }
    _getAnswer(): string { return this.stage()?._getAnswer() ?? ""; }
    _isAsking(): boolean { return this.stage()?._isAsking() ?? false; }
    _pickRandom(from: number, to: number): number { return this.stage()?._pickRandom(from, to) ?? from; }
    _getDeltaTime(): number { return this.stage()?._getDeltaTime() ?? 0; }
    _debug(values: any[]) { this.stage()?._debug(values); }

    /**
     * The Text drawn with the sprite. Upstream say()/think() write into this
     * object; here the bubbles are drawn directly, so this is a separate Text
     * that follows the sprite and is yours to position and style.
     */
    _getText(): ScratchTextClass {
        if (!this.spriteText) {
            this.spriteText = new ScratchTextClass();
            this.spriteText.world = this.world as any;
            this.spriteText._setPosition(this.sx, this.sy);
        }
        return this.spriteText;
    }

    _getShaders(): ObjectClass | undefined {
        return desktopOnlyValue("Sprite.getShaders()", undefined,
            "Shader brauchen OpenGL. / Shaders need OpenGL.");
    }

    // ---- costumes ----
    _addCostume(name: string) { this._addCostume2(name, name); }

    /** Cut one costume out of a larger image, like upstream's 6-argument form. */
    _addCostumeFromSheet(name: string, spriteSheetPath: string, x: number, y: number, width: number, height: number) {
        if (this.costumes.some(c => c.name === name)) return;
        const texture = ScratchSpriteClass.subTexture(spriteSheetPath, x, y, width, height);
        this.costumes.push({ name, texture });
        if (this.currentCostume < 0) this._applyCostumeIndex(0);
    }

    /**
     * Slice an image into equally sized tiles and add them all. Costume names
     * are the prefix plus the tile's index, matching upstream — including its
     * `x * nx + y` indexing, which is only the row-major order people expect
     * when the sheet is square.
     */
    _addCostumes(prefix: string, spriteSheet: string, tileWidth: number, tileHeight: number) {
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

    /** Build the PIXI display object for a costume. UISprite overrides for nine-slice. */
    protected createCostumeDisplay(texture: PIXI.Texture): PIXI.Container {
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        return sprite;
    }

    protected _applyCostumeIndex(index: number) {
        if (index < 0 || index >= this.costumes.length) return;
        this.currentCostume = index;
        const texture = this.costumes[index].texture;

        const parent = this.container?.parent;
        const sprite = this.createCostumeDisplay(texture);
        // put the new display object exactly where the old one was, so switching
        // costume does not shuffle the sprite to the front of its layer
        if (parent) {
            const index = parent.getChildIndex(this.container);
            parent.addChildAt(sprite, index);
        }
        if (this.container && !this.container.destroyed) this.container.destroy();
        this.container = sprite;

        this.centerXInitial = 0;
        this.centerYInitial = 0;
        // Only fall back to the costume's rectangle while the sprite still has
        // the default outline. A setHitbox() right after add() lands before
        // whenAddedToStage adds the costume, and must not be undone here.
        const w = texture.width, h = texture.height;
        this.hitPolygonInitial = [
            { x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 },
            { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 },
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
        this.applyState();
        this.flushPendingStamps(texture);
    }

    _switchCostumeByName(name: string) {
        const i = this.costumes.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
        if (i >= 0) this._applyCostumeIndex(i);
    }
    _switchCostumeByIndex(index: number) { this._applyCostumeIndex(index); }
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
    // Interpolated over wall-clock time and advanced once per frame from act().
    private glideFromX = 0; private glideFromY = 0;
    private glideToX = 0; private glideToY = 0;
    private glideMillis = 0;
    private glideStart = -1;   // -1 = not gliding

    _glide(seconds: number, x: number, y: number) {
        if (seconds <= 0) { this._setPosition(x, y); this.glideStart = -1; return; }
        this.glideFromX = this.sx; this.glideFromY = this.sy;
        this.glideToX = x; this.glideToY = y;
        this.glideMillis = seconds * 1000;
        this.glideStart = performance.now();
    }
    _isGliding(): boolean { return this.glideStart >= 0; }

    /** Advance an in-progress glide; called once per frame from act(). */
    private stepGlide() {
        if (this.glideStart < 0) return;
        const elapsed = performance.now() - this.glideStart;
        if (elapsed >= this.glideMillis) {
            this.glideStart = -1;
            this._setPosition(this.glideToX, this.glideToY);
            return;
        }
        const f = elapsed / this.glideMillis;
        this._setPosition(
            this.glideFromX + (this.glideToX - this.glideFromX) * f,
            this.glideFromY + (this.glideToY - this.glideFromY) * f,
        );
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
    _ifOnEdgeBounce() {
        const bounds = this.container.getBounds(true);
        const W = this.world.width, H = this.world.height;
        // world screen space: [0,W]x[0,H]
        let bounced = false;
        if (bounds.left < 0 || bounds.right > W) { this.direction = (180 - this.direction + 360) % 360; bounced = true; }
        if (bounds.top < 0 || bounds.bottom > H) { this.direction = (360 - this.direction) % 360; bounced = true; }
        if (bounced) {
            // nudge back inside
            const nb = this.container.getBounds(true);
            let dx = 0, dy = 0;
            if (nb.left < 0) dx = -nb.left; else if (nb.right > W) dx = W - nb.right;
            if (nb.top < 0) dy = -nb.top; else if (nb.bottom > H) dy = H - nb.bottom;
            this.sx += dx; this.sy -= dy;
            this.applyState();
        }
    }

    // ---- rotation ----
    _turnRight(deg: number) { this._setDirection(this.direction + deg); }
    _turnLeft(deg: number) { this._setDirection(this.direction - deg); }
    _setDirection(deg: number) {
        deg = deg % 360;
        if (deg < 0) deg += 360;
        this.direction = deg;
        this.applyState();
    }
    _getDirection(): number { return this.direction; }
    /** Point along a vector. Scratch direction 90 = +x, 0 = +y, so bearing = 90 - atan2(y,x). */
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
    _moveV(v: ScratchVector2Class) { if (v) this._setPosition(this.sx + v.x, this.sy + v.y); }
    _goToSprite(other: ScratchSpriteClass) { if (other) this._setPosition(other.sx, other.sy); }
    _setRotationStyle(style: RotationStyleEnum) {
        this.rotationStyle = style.ordinal as RotationStyle;
        this.applyState();
    }

    // ---- appearance ----
    _show() { this.container.visible = true; }
    _hide() { this.container.visible = false; }
    _isVisibleScratch(): boolean { return this.container.visible; }
    _setSize(percentage: number) { this.size = percentage; this.applyState(); }
    _changeSize(amount: number) { this._setSize(this.size + amount); }
    _changeTransparency(step: number) { this._setTransparency(this.transparency + step); }
    _getTransparency(): number { return this.transparency; }
    _getSize(): number { return this.size; }
    private transparency: number = 0;
    _setTransparency(percentage: number) {
        this.transparency = Math.max(0, Math.min(100, percentage));
        this.applyTransparency();
    }
    private applyTransparency() {
        if (this.container && !this.container.destroyed) this.container.alpha = 1 - this.transparency / 100;
    }
    _getSpriteWidth(): number { return this.container.getBounds(true).width; }
    _getSpriteHeight(): number { return this.container.getBounds(true).height; }

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
        if (!this.tintColor) this.tintColor = ScratchColorClass.fromRGB(255, 255, 255);
        this.tintColor._changeColor(step);
        this.applyTint();
    }
    _getTint(): ScratchColorClass {
        if (!this.tintColor) this.tintColor = ScratchColorClass.fromRGB(255, 255, 255);
        return this.tintColor;
    }

    // ---- layering ----
    private get siblings(): PIXI.Container | undefined { return this.container?.parent ?? undefined; }
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
    _addSound(name: string) { this.soundBank.add(name, name); }
    _addSound2(name: string, path: string) { this.soundBank.add(name, path); }
    _playSound(name: string) { this.soundBank.play(name); }
    _stopSound(name: string) { this.soundBank.stop(name); }
    _stopAllSounds() { this.soundBank.stopAll(); }
    _isSoundPlaying(name: string): boolean { return this.soundBank.isPlaying(name); }
    _setVolume(percent: number) { this.soundBank.setVolume(percent); }
    _changeVolume(step: number) { this.soundBank.setVolume(this.soundBank.getVolume() + step); }
    _getVolume(): number { return this.soundBank.getVolume(); }

    // ---- timers ----
    private timers: Map<string, ScratchTimerClass> = new Map();
    _getTimer(): ScratchTimerClass { return this._getNamedTimer("default"); }
    _getNamedTimer(name: string): ScratchTimerClass {
        let timer = this.timers.get(name);
        if (!timer) { timer = new ScratchTimerClass(); this.timers.set(name, timer); }
        return timer;
    }

    // ---- sensing ----
    /** UISprites are interface elements and never take part in collisions (as upstream). */
    isUI(): boolean { return false; }

    _isTouchingSprite(other: ScratchSpriteClass): boolean {
        if (!other || !other.container) return false;
        if (this.isUI() || other.isUI()) return false;
        if (!this.hitboxEnabled || !other.hitboxEnabled) return false;
        return this._collidesWith(other);
    }
    _isTouchingEdge(): boolean {
        const b = this.container.getBounds(true);
        const W = this.world.width, H = this.world.height;
        return b.left <= 0 || b.right >= W || b.top <= 0 || b.bottom >= H;
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
        const stage = (this.world as any)?.interpreter?.retrieveObject("ScratchStage") as { sprites: ScratchSpriteClass[] };
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
    _getTouchingSprites(c: ClassClass): ArrayListClass {
        return new ArrayListClass(this.spritesOfClass(c).filter(s => this._isTouchingSprite(s)));
    }

    _isTouchingMousePointer(): boolean {
        return this._containsPoint(ScratchSpriteClass.mouseScreenX, ScratchSpriteClass.mouseScreenY);
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
        this.hitPolygonInitial = this.customHitboxPoints.map(p => ({
            x: p.x - size.w / 2,
            y: p.y - size.h / 2,
        }));
        this.hitPolygonDirty = true;
    }

    /**
     * The current collision outline. Built fresh from the sprite's transformed
     * hit polygon, so it reflects where the sprite is right now.
     */
    _getHitbox(): ScratchHitboxClass {
        // marking it dirty only schedules the work, so force it through here
        this.setWorldTransformAndHitPolygonDirty();
        this.transformHitPolygon();
        const polygon = this.hitPolygonTransformed?.length ? this.hitPolygonTransformed : (this.hitPolygonInitial ?? []);
        return new ScratchHitboxClass(polygon.map(p => ({ x: p.x, y: p.y })));
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
            : where === Layer.UI ? "ui" : "foregroundStamps";

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
        stamp.anchor.set(0.5, 0.5);
        stamp.setFromMatrix(matrix);
        stamp.alpha = alpha;
        stamp.tint = tint;
        (scratchLayerOf(this.world, layerName) ?? this.world.app.stage).addChild(stamp);
    }

    private flushPendingStamps(texture: PIXI.Texture) {
        if (this.pendingStamps.length === 0) return;
        const queued = this.pendingStamps;
        this.pendingStamps = [];
        for (const s of queued) this.printStamp(texture, s.layerName, s.matrix, s.alpha, s.tint);
    }

    _remove() {
        // let the sprite react while it is still intact
        this.runtime?.fireRemovedFromStage(this as IScratchEventReceiver);
        this.clearSpeech();
        this.spriteText?._remove();
        // Take the sprite out of the stage's list too, so it stops being iterated
        // by the per-frame loop and the class-based sensing methods.
        const stage = (this.world as any)?.interpreter?.retrieveObject("ScratchStage") as { sprites: ScratchSpriteClass[] } | undefined;
        if (stage) {
            const i = stage.sprites.indexOf(this);
            if (i >= 0) stage.sprites.splice(i, 1);
        }
        this.destroy();
    }

    _mj$copy$Shape$(t: Thread, callback: CallbackParameter) {
        // minimal copy: shares costume list
        const copy = new ScratchSpriteClass();
        copy._cj$_constructor_$Sprite$(t, () => {
            copy.costumes = this.costumes.slice();
            copy.sx = this.sx; copy.sy = this.sy; copy.direction = this.direction;
            copy.size = this.size; copy.rotationStyle = this.rotationStyle;
            if (this.currentCostume >= 0) copy._applyCostumeIndex(this.currentCostume);
            t.s.push(copy);
            if (callback) callback();
        });
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

    private static cameraOf(world: any): { x: number, y: number, zoom: number } | undefined {
        const stage = world?.interpreter?.retrieveObject("ScratchStage") as { camera?: { x: number, y: number, zoom: number } } | undefined;
        return stage?.camera;
    }
}
