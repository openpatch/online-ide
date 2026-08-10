import { lm } from "../../../../../tools/language/LanguageManager";

/**
 * What the Scratch library's classes and methods say about themselves.
 *
 * The declarations in this folder used to hold their German wording inline,
 * which left no room for a second language. They live here now, the way the rest
 * of the Java runtime keeps its comments in JavaRuntimeLibraryComments.ts: one
 * function per member, resolved when the comment is shown rather than when the
 * declarations are built, so that the language can still be chosen afterwards.
 */
export class SRC {

    // ---- BooleanSupplier ----
    static booleanSupplierClassComment = () => lm({
        "de": "Liefert einen Wahrheitswert, z.B. als Lambda-Ausdruck",
        "en": "Gives a truth value, as a lambda for instance",
    });
    static booleanSupplierGetAsBooleanComment = () => lm({
        "de": "Gibt den Wahrheitswert zurück",
        "en": "Returns the truth value",
    });

    // ---- KeyCode ----
    static keyCodeClassComment = () => lm({
        "de": "Tastaturtasten",
        "en": "The keys of the keyboard",
    });

    // ---- Layer ----
    static layerClassComment = () => lm({
        "de": "Zeichenebene, auf die gedruckt wird",
        "en": "The layer that is printed onto",
    });

    // ---- MouseCode ----
    static mouseCodeClassComment = () => lm({
        "de": "Maustasten (LEFT, RIGHT, CENTER)",
        "en": "The mouse buttons (LEFT, RIGHT, CENTER)",
    });

    // ---- RotationStyle ----
    static rotationStyleClassComment = () => lm({
        "de": "Legt fest, wie sich eine Figur beim Drehen verhält",
        "en": "Chooses what a sprite does when it turns",
    });

    // ---- AnimatedSprite ----
    static animatedSpriteClassComment = () => lm({
        "de": "Figur, die Animationen aus mehreren Einzelbildern abspielen kann",
        "en": "A sprite that can play animations made of several frames",
    });
    static animatedSpriteConstructorComment = () => lm({
        "de": "Erzeugt eine neue animierte Figur",
        "en": "Creates a new animated sprite",
    });
    static animatedSpriteConstructor2Comment = () => lm({
        "de": "Erzeugt eine Kopie der angegebenen animierten Figur",
        "en": "Creates a copy of the given animated sprite",
    });
    static animatedSpriteCloneComment = () => lm({
        "de": "Erzeugt eine Kopie dieser Figur",
        "en": "Creates a copy of this sprite",
    });
    static animatedSpriteToStringComment = () => lm({
        "de": "Gibt die Figur als Zeichenkette zurück",
        "en": "Returns the sprite as a text",
    });
    static animatedSpriteAddAnimationComment = () => lm({
        "de": "Fügt eine Animation hinzu. %d im Muster wird durch 1..frames ersetzt, z.B. bunny1_walk%d",
        "en": "Adds an animation. %d in the pattern is replaced by 1..frames, for example bunny1_walk%d",
    });
    static animatedSpriteAddAnimation2Comment = () => lm({
        "de": "Zerlegt ein Bild in gleich große Einzelbilder und legt daraus eine Animation an",
        "en": "Cuts a picture into equally sized frames and makes an animation of them",
    });
    static animatedSpriteAddAnimation3Comment = () => lm({
        "de": "Wie addAnimation(name, imagePath, frames, width, height), beginnt aber in der angegebenen Zeile",
        "en": "Like addAnimation(name, imagePath, frames, width, height), but starting on the given row",
    });
    static animatedSpriteAddAnimation4Comment = () => lm({
        "de": "Legt eine Animation aus einer Spalte des Bildes an",
        "en": "Creates an animation from one column of the picture",
    });
    static animatedSpriteAddAnimation5Comment = () => lm({
        "de": "Legt eine Animation an; builder liefert zu 1..frames jeweils den Bildpfad",
        "en": "Creates an animation; builder gives the path of each picture for 1..frames",
    });
    static animatedSpritePlayAnimationComment = () => lm({
        "de": "Spielt die Animation in einer Schleife ab",
        "en": "Plays the animation over and over",
    });
    static animatedSpritePlayAnimation2Comment = () => lm({
        "de": "Spielt die Animation ab; bei once == true nur ein einziges Mal",
        "en": "Plays the animation; with once == true only a single time",
    });
    static animatedSpriteResetAnimationComment = () => lm({
        "de": "Setzt die Animation auf das erste Einzelbild zurück",
        "en": "Sets the animation back to its first frame",
    });
    static animatedSpriteSetAnimationIntervalComment = () => lm({
        "de": "Legt fest, wie viele Millisekunden ein Einzelbild angezeigt wird",
        "en": "Chooses how many milliseconds a frame is shown for",
    });
    static animatedSpriteGetAnimationIntervalComment = () => lm({
        "de": "Gibt zurück, wie viele Millisekunden ein Einzelbild angezeigt wird",
        "en": "Returns how many milliseconds a frame is shown for",
    });
    static animatedSpriteGetAnimationFrameComment = () => lm({
        "de": "Gibt die Nummer des aktuellen Einzelbildes zurück",
        "en": "Returns the number of the current frame",
    });
    static animatedSpriteSetAnimationFrameComment = () => lm({
        "de": "Springt zum Einzelbild mit der angegebenen Nummer",
        "en": "Jumps to the frame of the given number",
    });
    static animatedSpriteIsAnimationPlayedComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn eine mit once gestartete Animation durchgelaufen ist",
        "en": "Returns true exactly when an animation started with once has played to its end",
    });

    // ---- Bounds ----
    static boundsClassComment = () => lm({
        "de": "Umschließendes Rechteck",
        "en": "The rectangle around it",
    });
    static boundsConstructorComment = () => lm({
        "de": "Erzeugt ein Rechteck aus Position und Größe",
        "en": "Creates a rectangle from a position and a size",
    });
    static boundsXComment = () => lm({
        "de": "Gibt die linke x-Koordinate zurück",
        "en": "Returns the x-coordinate of the left edge",
    });
    static boundsYComment = () => lm({
        "de": "Gibt die obere y-Koordinate zurück",
        "en": "Returns the y-coordinate of the top edge",
    });
    static boundsWidthComment = () => lm({
        "de": "Gibt die Breite zurück",
        "en": "Returns the width",
    });
    static boundsHeightComment = () => lm({
        "de": "Gibt die Höhe zurück",
        "en": "Returns the height",
    });
    static boundsIntersectsComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn sich beide Rechtecke überlappen",
        "en": "Returns true exactly when the two rectangles overlap",
    });

    // ---- Camera ----
    static cameraClassComment = () => lm({
        "de": "Kamera der Bühne; verschiebt und zoomt die Ansicht",
        "en": "The stage's camera; it moves and zooms the view",
    });
    static cameraConstructorComment = () => lm({
        "de": "Erzeugt eine Kamera in der Mitte mit Zoom 100",
        "en": "Creates a camera in the middle at a zoom of 100",
    });
    static cameraSetPositionComment = () => lm({
        "de": "Setzt die Kamera auf die angegebene Position",
        "en": "Points the camera at the given position",
    });
    static cameraSetPosition2Comment = () => lm({
        "de": "Setzt die Kamera auf die angegebene Position",
        "en": "Points the camera at the given position",
    });
    static cameraGetPositionComment = () => lm({
        "de": "Gibt die Position der Kamera zurück",
        "en": "Returns the position of the camera",
    });
    static cameraToLocalPositionComment = () => lm({
        "de": "Rechnet eine Bildschirmposition in Bühnenkoordinaten um",
        "en": "Turns a place on the screen into a place on the stage",
    });
    static cameraToLocalXComment = () => lm({
        "de": "Rechnet eine x-Bildschirmkoordinate in Bühnenkoordinaten um",
        "en": "Turns an x-coordinate on the screen into one on the stage",
    });
    static cameraToLocalYComment = () => lm({
        "de": "Rechnet eine y-Bildschirmkoordinate in Bühnenkoordinaten um",
        "en": "Turns a y-coordinate on the screen into one on the stage",
    });
    static cameraToGlobalPositionComment = () => lm({
        "de": "Rechnet eine Bühnenposition in Bildschirmkoordinaten um",
        "en": "Turns a place on the stage into a place on the screen",
    });
    static cameraToGlobalXComment = () => lm({
        "de": "Rechnet eine x-Bühnenkoordinate in Bildschirmkoordinaten um",
        "en": "Turns an x-coordinate on the stage into one on the screen",
    });
    static cameraToGlobalYComment = () => lm({
        "de": "Rechnet eine y-Bühnenkoordinate in Bildschirmkoordinaten um",
        "en": "Turns a y-coordinate on the stage into one on the screen",
    });
    static cameraGetXComment = () => lm({
        "de": "Gibt die x-Position der Kamera zurück",
        "en": "Returns the x-position of the camera",
    });
    static cameraSetXComment = () => lm({
        "de": "Setzt die x-Position der Kamera",
        "en": "Sets the x-position of the camera",
    });
    static cameraChangeXComment = () => lm({
        "de": "Verschiebt die Kamera waagerecht",
        "en": "Moves the camera sideways",
    });
    static cameraGetYComment = () => lm({
        "de": "Gibt die y-Position der Kamera zurück",
        "en": "Returns the y-position of the camera",
    });
    static cameraSetYComment = () => lm({
        "de": "Setzt die y-Position der Kamera",
        "en": "Sets the y-position of the camera",
    });
    static cameraChangeYComment = () => lm({
        "de": "Verschiebt die Kamera senkrecht",
        "en": "Moves the camera up or down",
    });
    static cameraSetZoomLimitComment = () => lm({
        "de": "Begrenzt den Zoom auf den Bereich zwischen low und high",
        "en": "Keeps the zoom between low and high",
    });
    static cameraSetZoomComment = () => lm({
        "de": "Setzt den Zoom in Prozent (100 = Normalgröße)",
        "en": "Sets the zoom as a percentage (100 = its own size)",
    });
    static cameraGetZoomComment = () => lm({
        "de": "Gibt den Zoom in Prozent zurück",
        "en": "Returns the zoom as a percentage",
    });
    static cameraResetZoomComment = () => lm({
        "de": "Setzt den Zoom auf 100 zurück",
        "en": "Sets the zoom back to 100",
    });
    static cameraChangeZoomComment = () => lm({
        "de": "Ändert den Zoom um dz Prozent",
        "en": "Changes the zoom by dz percent",
    });

    // ---- Clock ----
    static clockClassComment = () => lm({
        "de": "Datum und Uhrzeit",
        "en": "The date and the time",
    });
    static clockGetYearComment = () => lm({
        "de": "Gibt das aktuelle Jahr zurück",
        "en": "Returns the current year",
    });
    static clockGetMonthComment = () => lm({
        "de": "Gibt den aktuellen Monat zurück (1 = Januar)",
        "en": "Returns the current month (1 = January)",
    });
    static clockGetDayComment = () => lm({
        "de": "Gibt den aktuellen Tag im Monat zurück",
        "en": "Returns the current day of the month",
    });
    static clockGetDayOfWeekComment = () => lm({
        "de": "Gibt den Wochentag zurück (1 = Montag, 7 = Sonntag)",
        "en": "Returns the day of the week (1 = Monday, 7 = Sunday)",
    });
    static clockGetHourComment = () => lm({
        "de": "Gibt die aktuelle Stunde zurück",
        "en": "Returns the current hour",
    });
    static clockGetMinuteComment = () => lm({
        "de": "Gibt die aktuelle Minute zurück",
        "en": "Returns the current minute",
    });
    static clockGetSecondComment = () => lm({
        "de": "Gibt die aktuelle Sekunde zurück",
        "en": "Returns the current second",
    });
    static clockGetMillisecondComment = () => lm({
        "de": "Gibt die aktuelle Millisekunde zurück",
        "en": "Returns the current millisecond",
    });
    static clockGetDaysSince2000Comment = () => lm({
        "de": "Gibt die Anzahl der Tage seit dem 1. Januar 2000 zurück",
        "en": "Returns the number of days since the 1st of January 2000",
    });

    // ---- Color ----
    static colorClassComment = () => lm({
        "de": "Farbe; Rot-, Grün-, Blauanteil bzw. Farbton, Sättigung und Helligkeit jeweils 0 bis 255",
        "en": "A colour; its red, green and blue parts, or its hue, saturation and brightness, each 0 to 255",
    });
    static colorConstructorComment = () => lm({
        "de": "Erzeugt die Farbe Weiß",
        "en": "Creates the colour white",
    });
    static colorConstructor2Comment = () => lm({
        "de": "Erzeugt eine Farbe aus einem Hex-Code, z.B. #ff0000",
        "en": "Creates a colour from a hex code, for example #ff0000",
    });
    static colorConstructor3Comment = () => lm({
        "de": "Erzeugt eine Farbe mit dem angegebenen Farbton (0 bis 255)",
        "en": "Creates a colour with the given hue (0 to 255)",
    });
    static colorConstructor4Comment = () => lm({
        "de": "Erzeugt eine Farbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Creates a colour from its red, green and blue parts (each 0 to 255)",
    });
    static colorConstructor5Comment = () => lm({
        "de": "Erzeugt eine Kopie der übergebenen Farbe",
        "en": "Creates a copy of the given colour",
    });
    static colorGetComment = () => lm({
        "de": "Gibt die Farbe als ganze Zahl zurück",
        "en": "Returns the colour as a whole number",
    });
    static colorGetHSBComment = () => lm({
        "de": "Gibt den Farbton zurück (0 bis 255)",
        "en": "Returns the hue (0 to 255)",
    });
    static colorSetHSBComment = () => lm({
        "de": "Setzt den Farbton (0 bis 255)",
        "en": "Sets the hue (0 to 255)",
    });
    static colorSetHSB2Comment = () => lm({
        "de": "Setzt Farbton, Sättigung und Helligkeit (jeweils 0 bis 255)",
        "en": "Sets the hue, the saturation and the brightness (each 0 to 255)",
    });
    static colorSetRGBComment = () => lm({
        "de": "Setzt Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Sets the red, green and blue parts (each 0 to 255)",
    });
    static colorChangeColorComment = () => lm({
        "de": "Ändert den Farbton um den angegebenen Wert",
        "en": "Changes the hue by the given amount",
    });
    static colorGetRedComment = () => lm({
        "de": "Gibt den Rotanteil zurück (0 bis 255)",
        "en": "Returns the red part (0 to 255)",
    });
    static colorGetGreenComment = () => lm({
        "de": "Gibt den Grünanteil zurück (0 bis 255)",
        "en": "Returns the green part (0 to 255)",
    });
    static colorGetBlueComment = () => lm({
        "de": "Gibt den Blauanteil zurück (0 bis 255)",
        "en": "Returns the blue part (0 to 255)",
    });
    static colorGetHComment = () => lm({
        "de": "Gibt den Farbton zurück (0 bis 255)",
        "en": "Returns the hue (0 to 255)",
    });
    static colorGetSComment = () => lm({
        "de": "Gibt die Sättigung zurück (0 bis 255)",
        "en": "Returns the saturation (0 to 255)",
    });
    static colorGetLComment = () => lm({
        "de": "Gibt die Helligkeit zurück (0 bis 255)",
        "en": "Returns the brightness (0 to 255)",
    });

    // ---- Pixels ----
    static pixelsClassComment = () => lm({
        "de": "Nur in der Desktop-Version: Zugriff auf einzelne Bildpunkte",
        "en": "Only in the desktop version: reaching single pixels",
    });
    static pixelsMainComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static pixelsBackgroundComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static pixelsForegroundComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- Sorting ----
    static sortingClassComment = () => lm({
        "de": "Nur in der Desktop-Version: Sortierreihenfolge der Figuren",
        "en": "Only in the desktop version: the order the sprites are drawn in",
    });
    static sortingByYComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static sortingOffComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static sortingIsOnComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- Shader ----
    static shaderClassComment = () => lm({
        "de": "Nur in der Desktop-Version: ein Shader-Programm",
        "en": "Only in the desktop version: one shader program",
    });
    static shaderConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderGetNameComment = () => lm({
        "de": "Gibt den Namen des Shaders zurück",
        "en": "Returns the name of the shader",
    });
    static shaderSetNameComment = () => lm({
        "de": "Setzt den Namen des Shaders",
        "en": "Sets the name of the shader",
    });
    static shaderSetComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet2Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet3Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet4Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet5Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet6Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet7Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet8Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet9Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shaderSet10Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- Shaders ----
    static shadersClassComment = () => lm({
        "de": "Nur in der Desktop-Version: Sammlung von Shadern",
        "en": "Only in the desktop version: a collection of shaders",
    });
    static shadersConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersAddComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersGetComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersSwitchToComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersSwitchTo2Comment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersNextComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersResetComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersGetCurrentComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersGetCurrentIndexComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static shadersGetCurrentNameComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- Recorder ----
    static recorderClassComment = () => lm({
        "de": "Nur in der Desktop-Version: nimmt die Bühne auf",
        "en": "Only in the desktop version: records the stage",
    });
    static recorderStartComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static recorderStopComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static recorderIsRecordingComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- GifRecorder ----
    static gifRecorderClassComment = () => lm({
        "de": "Nur in der Desktop-Version: nimmt ein GIF auf",
        "en": "Only in the desktop version: records a GIF",
    });
    static gifRecorderConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- FFmpegRecorder ----
    static fFmpegRecorderClassComment = () => lm({
        "de": "Nur in der Desktop-Version: nimmt ein Video auf",
        "en": "Only in the desktop version: records a video",
    });
    static fFmpegRecorderConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- FrameRecorder ----
    static frameRecorderClassComment = () => lm({
        "de": "Nur in der Desktop-Version: speichert Einzelbilder",
        "en": "Only in the desktop version: saves single frames",
    });
    static frameRecorderConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- File ----
    static fileClassComment = () => lm({
        "de": "Nur in der Desktop-Version: liest und schreibt Dateien",
        "en": "Only in the desktop version: reads and writes files",
    });
    static fileConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static fileReadComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static fileWriteComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static fileAppendComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static fileExistsComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static fileDeleteComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- MapObject ----
    static mapObjectClassComment = () => lm({
        "de": "Nur in der Desktop-Version: ein Objekt aus einer Tiled-Karte",
        "en": "Only in the desktop version: an object from a Tiled map",
    });
    static mapObjectGetPropertyIntComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static mapObjectGetPropertyComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static mapObjectGetPropertyFloatComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static mapObjectGetPropertyBooleanComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- TiledMap ----
    static tiledMapClassComment = () => lm({
        "de": "Nur in der Desktop-Version: eine mit Tiled erstellte Karte",
        "en": "Only in the desktop version: a map made with Tiled",
    });
    static tiledMapConstructorComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static tiledMapGetObjectsFromLayerComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static tiledMapStampLayerToForegroundComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });
    static tiledMapStampLayerToBackgroundComment = () => lm({
        "de": "Nur in der Desktop-Version",
        "en": "Only in the desktop version",
    });

    // ---- Property ----
    static propertyClassComment = () => lm({
        "de": "Nur in der Desktop-Version: Eigenschaft eines Tiled-Objekts",
        "en": "Only in the desktop version: a property of a Tiled object",
    });

    // ---- TilesetImage ----
    static tilesetImageClassComment = () => lm({
        "de": "Nur in der Desktop-Version: Bild eines Tiled-Tilesets",
        "en": "Only in the desktop version: the picture of a Tiled tileset",
    });

    // ---- ScratchException ----
    static exceptionClassComment = () => lm({
        "de": "Fehler der Scratch-Bibliothek",
        "en": "An error from the Scratch library",
    });
    static exceptionConstructorComment = () => lm({
        "de": "Erzeugt einen Fehler mit der angegebenen Meldung",
        "en": "Creates an error with the given message",
    });
    static exceptionToStringComment = () => lm({
        "de": "Gibt den Fehler als Zeichenkette zurück",
        "en": "Returns the error as a text",
    });

    // ---- Hitbox ----
    static hitboxClassComment = () => lm({
        "de": "Umriss einer Figur, mit dem Berührungen berechnet werden",
        "en": "The outline of a sprite, from which touching is worked out",
    });
    static hitboxConstructorComment = () => lm({
        "de": "Erzeugt einen Umriss aus x- und y-Koordinaten",
        "en": "Creates a hitbox from x- and y-coordinates",
    });
    static hitboxConstructor2Comment = () => lm({
        "de": "Erzeugt einen Umriss aus einer Form",
        "en": "Creates a hitbox from a shape",
    });
    static hitboxGetShapeComment = () => lm({
        "de": "Gibt den Umriss als Form zurück",
        "en": "Returns the hitbox as a shape",
    });
    static hitboxTranslateAndRotateAndResizeComment = () => lm({
        "de": "Verschiebt, dreht und skaliert den Umriss",
        "en": "Moves, turns and scales the hitbox",
    });
    static hitboxContainsComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Punkt im Umriss liegt",
        "en": "Returns true exactly when the point is inside the hitbox",
    });
    static hitboxGetBoundsComment = () => lm({
        "de": "Gibt das umschließende Rechteck zurück",
        "en": "Returns the rectangle around it",
    });
    static hitboxIntersectsComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn sich beide Umrisse überlappen",
        "en": "Returns true exactly when the two hitboxes overlap",
    });
    static hitboxDrawDebugComment = () => lm({
        "de": "Nur in der Desktop-Version: zeichnet den Umriss",
        "en": "Only in the desktop version: draws the hitbox",
    });
    static hitboxDrawShapeComment = () => lm({
        "de": "Nur in der Desktop-Version: zeichnet den Umriss",
        "en": "Only in the desktop version: draws the hitbox",
    });

    // ---- HtmlColor ----
    static htmlColorClassComment = () => lm({
        "de": "Benannte HTML-Farben",
        "en": "The named HTML colours",
    });
    static htmlColorGetRandomComment = () => lm({
        "de": "Gibt eine zufällige der benannten Farben zurück",
        "en": "Returns one of the named colours at random",
    });

    // ---- Operators ----
    static operatorsClassComment = () => lm({
        "de": "Mathematische Hilfsfunktionen; alle Winkel in Grad",
        "en": "Helpers for arithmetic; every angle in degrees",
    });
    static operatorsLerpComment = () => lm({
        "de": "Interpoliert linear zwischen start und stop; amt liegt zwischen 0 und 1",
        "en": "Picks a number between start and stop; amt lies between 0 and 1",
    });
    static operatorsConstrainComment = () => lm({
        "de": "Begrenzt den Wert auf den Bereich zwischen low und high",
        "en": "Keeps the value between low and high",
    });
    static operatorsConstrain2Comment = () => lm({
        "de": "Begrenzt den Wert auf den Bereich zwischen low und high",
        "en": "Keeps the value between low and high",
    });
    static operatorsMinComment = () => lm({
        "de": "Gibt den kleinsten der übergebenen Werte zurück",
        "en": "Returns the smallest of the given values",
    });
    static operatorsMaxComment = () => lm({
        "de": "Gibt den größten der übergebenen Werte zurück",
        "en": "Returns the largest of the given values",
    });
    static operatorsMin2Comment = () => lm({
        "de": "Gibt den kleinsten der übergebenen Werte zurück",
        "en": "Returns the smallest of the given values",
    });
    static operatorsMax2Comment = () => lm({
        "de": "Gibt den größten der übergebenen Werte zurück",
        "en": "Returns the largest of the given values",
    });
    static operatorsMapComment = () => lm({
        "de": "Rechnet einen Wert aus dem Bereich start1..stop1 in den Bereich start2..stop2 um",
        "en": "Translates a value from the range start1..stop1 into the range start2..stop2",
    });
    static operatorsRoundComment = () => lm({
        "de": "Rundet auf eine ganze Zahl",
        "en": "Rounds to a whole number",
    });
    static operatorsRound2Comment = () => lm({
        "de": "Rundet auf die angegebene Anzahl Nachkommastellen",
        "en": "Rounds to the given number of decimal places",
    });
    static operatorsModComment = () => lm({
        "de": "Gibt den Rest der Division x geteilt durch y zurück",
        "en": "Returns the remainder of x divided by y",
    });
    static operatorsMod2Comment = () => lm({
        "de": "Gibt den Rest der Division x geteilt durch y zurück",
        "en": "Returns the remainder of x divided by y",
    });
    static operatorsAbsOfComment = () => lm({
        "de": "Gibt den Betrag zurück",
        "en": "Returns the value without its sign",
    });
    static operatorsAbsOf2Comment = () => lm({
        "de": "Gibt den Betrag zurück",
        "en": "Returns the value without its sign",
    });
    static operatorsFloorOfComment = () => lm({
        "de": "Rundet ab",
        "en": "Rounds down",
    });
    static operatorsCeilingOfComment = () => lm({
        "de": "Rundet auf",
        "en": "Rounds up",
    });
    static operatorsSqrtOfComment = () => lm({
        "de": "Gibt die Quadratwurzel zurück",
        "en": "Returns the square root",
    });
    static operatorsSinOfComment = () => lm({
        "de": "Sinus des Winkels x, x in Grad",
        "en": "Sine of the angle x, with x in degrees",
    });
    static operatorsCosOfComment = () => lm({
        "de": "Kosinus des Winkels x, x in Grad",
        "en": "Cosine of the angle x, with x in degrees",
    });
    static operatorsTanOfComment = () => lm({
        "de": "Tangens des Winkels x, x in Grad",
        "en": "Tangent of the angle x, with x in degrees",
    });
    static operatorsAsinOfComment = () => lm({
        "de": "Arkussinus von x, Ergebnis in Grad",
        "en": "Arc sine of x, the result in degrees",
    });
    static operatorsAcosOfComment = () => lm({
        "de": "Arkuskosinus von x, Ergebnis in Grad",
        "en": "Arc cosine of x, the result in degrees",
    });
    static operatorsAtanOfComment = () => lm({
        "de": "Arkustangens von x, Ergebnis in Grad",
        "en": "Arc tangent of x, the result in degrees",
    });
    static operatorsLnOfComment = () => lm({
        "de": "Natürlicher Logarithmus von x",
        "en": "Natural logarithm of x",
    });
    static operatorsLogOfComment = () => lm({
        "de": "Zehnerlogarithmus von x",
        "en": "Logarithm of x to base ten",
    });
    static operatorsEToThePowerOfComment = () => lm({
        "de": "Gibt e hoch x zurück",
        "en": "Returns e to the power of x",
    });
    static operatorsTenToThePowerOfComment = () => lm({
        "de": "Gibt 10 hoch x zurück",
        "en": "Returns 10 to the power of x",
    });

    // ---- Pen ----
    static penClassComment = () => lm({
        "de": "Stift, mit dem auf die Bühne gezeichnet werden kann",
        "en": "A pen, with which the stage can be drawn on",
    });
    static penConstructorComment = () => lm({
        "de": "Erzeugt einen neuen Stift",
        "en": "Creates a new pen",
    });
    static penDownComment = () => lm({
        "de": "Senkt den Stift ab, so dass er beim Bewegen zeichnet",
        "en": "Puts the pen down, so that it draws as it moves",
    });
    static penUpComment = () => lm({
        "de": "Hebt den Stift an, so dass er nicht mehr zeichnet",
        "en": "Lifts the pen up, so that it stops drawing",
    });
    static penSetColorComment = () => lm({
        "de": "Setzt die Stiftfarbe",
        "en": "Sets the colour of the pen",
    });
    static penSetColor2Comment = () => lm({
        "de": "Setzt die Stiftfarbe über den Farbton (0 bis 255)",
        "en": "Sets the colour of the pen by its hue (0 to 255)",
    });
    static penSetColor3Comment = () => lm({
        "de": "Setzt die Stiftfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Sets the colour of the pen from its red, green and blue parts (each 0 to 255)",
    });
    static penChangeColorComment = () => lm({
        "de": "Ändert den Farbton des Stifts um den angegebenen Wert",
        "en": "Changes the hue of the pen by the given amount",
    });
    static penSetSizeComment = () => lm({
        "de": "Setzt die Strichstärke",
        "en": "Sets how thick the pen draws",
    });
    static penGetSizeComment = () => lm({
        "de": "Gibt die Strichstärke zurück",
        "en": "Returns how thick the pen draws",
    });
    static penChangeSizeComment = () => lm({
        "de": "Ändert die Strichstärke um den angegebenen Wert",
        "en": "Changes how thick the pen draws by the given amount",
    });
    static penGetColorComment = () => lm({
        "de": "Gibt die Stiftfarbe zurück",
        "en": "Returns the colour of the pen",
    });
    static penSetTransparencyComment = () => lm({
        "de": "Setzt die Deckkraft von 0 (unsichtbar) bis 255 (deckend)",
        "en": "Sets how solid it is, from 0 (invisible) to 255 (solid)",
    });
    static penChangeTransparencyComment = () => lm({
        "de": "Ändert die Deckkraft um den angegebenen Wert",
        "en": "Changes how solid it is by the given amount",
    });
    static penGoToBackgroundComment = () => lm({
        "de": "Zeichnet hinter den Figuren",
        "en": "Draws behind the sprites",
    });
    static penGoToForegroundComment = () => lm({
        "de": "Zeichnet vor den Figuren",
        "en": "Draws in front of the sprites",
    });
    static penIsInBackgroundComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Stift hinter den Figuren zeichnet",
        "en": "Returns true exactly when the pen draws behind the sprites",
    });
    static penGoToRandomPositionComment = () => lm({
        "de": "Setzt den Stift an eine zufällige Position der Bühne",
        "en": "Puts the pen somewhere random on the stage",
    });
    static penGoToMousePointerComment = () => lm({
        "de": "Setzt den Stift auf die Position des Mauszeigers",
        "en": "Puts the pen where the mouse pointer is",
    });
    static penStampComment = () => lm({
        "de": "Druckt ein Abbild der zugehörigen Figur auf die Bühne",
        "en": "Prints a picture of the sprite it belongs to onto the stage",
    });
    static penToStringComment = () => lm({
        "de": "Gibt den Stift als Zeichenkette zurück",
        "en": "Returns the pen as a text",
    });
    static penSetPositionComment = () => lm({
        "de": "Setzt den Stift an die angegebene Position; bei abgesenktem Stift wird eine Linie gezeichnet",
        "en": "Puts the pen at the given position; with the pen down a line is drawn",
    });
    static penSetPosition2Comment = () => lm({
        "de": "Setzt den Stift an die angegebene Position; bei abgesenktem Stift wird eine Linie gezeichnet",
        "en": "Puts the pen at the given position; with the pen down a line is drawn",
    });
    static penEraseAllComment = () => lm({
        "de": "Löscht alles Gezeichnete",
        "en": "Wipes away everything that has been drawn",
    });
    static penAddedToStageComment = () => lm({
        "de": "Wird aufgerufen, wenn der Stift der Bühne hinzugefügt wird",
        "en": "Called when the pen is added to the stage",
    });
    static penRemovedFromStageComment = () => lm({
        "de": "Wird aufgerufen, wenn der Stift von der Bühne entfernt wird",
        "en": "Called when the pen is removed from the stage",
    });

    // ---- Random ----
    static randomClassComment = () => lm({
        "de": "Zufallszahlen und Rauschen (Noise)",
        "en": "Random numbers and noise",
    });
    static randomNoiseComment = () => lm({
        "de": "Gibt den Rauschwert (Open Simplex Noise) an der Stelle x zurück",
        "en": "Returns the noise value (Open Simplex Noise) at x",
    });
    static randomNoise2Comment = () => lm({
        "de": "Gibt den Rauschwert (Open Simplex Noise) an der Stelle (x, y) zurück",
        "en": "Returns the noise value (Open Simplex Noise) at (x, y)",
    });
    static randomNoise3Comment = () => lm({
        "de": "Gibt den Rauschwert (Open Simplex Noise) an der Stelle (x, y, z) zurück",
        "en": "Returns the noise value (Open Simplex Noise) at (x, y, z)",
    });
    static randomNoiseSeedComment = () => lm({
        "de": "Setzt den Startwert für das Rauschen",
        "en": "Sets the seed the noise starts from",
    });
    static randomRandomVector2Comment = () => lm({
        "de": "Gibt einen zufälligen Vektor der Länge 1 zurück",
        "en": "Returns a random vector of length 1",
    });
    static randomRandomXComment = () => lm({
        "de": "Gibt eine zufällige x-Koordinate innerhalb der Bühne zurück",
        "en": "Returns a random x-coordinate inside the stage",
    });
    static randomRandomYComment = () => lm({
        "de": "Gibt eine zufällige y-Koordinate innerhalb der Bühne zurück",
        "en": "Returns a random y-coordinate inside the stage",
    });
    static randomRandomPositionComment = () => lm({
        "de": "Gibt eine zufällige Position auf der Bühne zurück",
        "en": "Returns a random position on the stage",
    });
    static randomRandomComment = () => lm({
        "de": "Gibt eine Zufallszahl zwischen 0 und 1 zurück",
        "en": "Returns a random number between 0 and 1",
    });
    static randomRandom2Comment = () => lm({
        "de": "Gibt eine Zufallszahl zwischen 0 und max zurück",
        "en": "Returns a random number between 0 and max",
    });
    static randomRandom3Comment = () => lm({
        "de": "Gibt eine Zufallszahl zwischen min und max zurück",
        "en": "Returns a random number between min and max",
    });
    static randomRandomIntComment = () => lm({
        "de": "Gibt eine ganze Zufallszahl zwischen 0 und max zurück (beide eingeschlossen)",
        "en": "Returns a random whole number between 0 and max (both included)",
    });
    static randomRandomInt2Comment = () => lm({
        "de": "Gibt eine ganze Zufallszahl zwischen min und max zurück (beide eingeschlossen)",
        "en": "Returns a random whole number between min and max (both included)",
    });
    static randomRandomSeedComment = () => lm({
        "de": "Setzt den Startwert für die Zufallszahlen; danach wiederholt sich dieselbe Folge",
        "en": "Sets the seed the random numbers start from; the same run of numbers follows every time",
    });

    // ---- Shape ----
    static shapeClassComment = () => lm({
        "de": "Geometrische Form, z.B. für eigene Trefferflächen",
        "en": "A shape, for a hitbox of your own for instance",
    });
    static shapeContainsComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Punkt in der Form liegt",
        "en": "Returns true exactly when the point is inside the shape",
    });
    static shapeIntersectsComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn sich beide Formen überlappen",
        "en": "Returns true exactly when the two shapes overlap",
    });
    static shapeScaleComment = () => lm({
        "de": "Gibt die skalierte Form als neue Form zurück",
        "en": "Returns the scaled shape, as a new shape",
    });
    static shapeTranslateComment = () => lm({
        "de": "Gibt die verschobene Form als neue Form zurück",
        "en": "Returns the moved shape, as a new shape",
    });
    static shapeRotateComment = () => lm({
        "de": "Gibt die um theta Grad gedrehte Form als neue Form zurück",
        "en": "Returns the shape turned by theta degrees, as a new shape",
    });
    static shapeGetBoundsComment = () => lm({
        "de": "Gibt das umschließende Rechteck zurück",
        "en": "Returns the rectangle around it",
    });
    static shapeDrawComment = () => lm({
        "de": "Nur in der Desktop-Version: zeichnet die Form",
        "en": "Only in the desktop version: draws the shape",
    });

    // ---- Circle ----
    static circleClassComment = () => lm({
        "de": "Kreis; x und y sind der Mittelpunkt",
        "en": "A circle; x and y are its middle",
    });
    static circleConstructorComment = () => lm({
        "de": "Erzeugt einen Kreis um (x, y) mit dem angegebenen Radius",
        "en": "Creates a circle around (x, y) with the given radius",
    });

    // ---- Rectangle ----
    static rectangleClassComment = () => lm({
        "de": "Rechteck; x und y sind die linke obere Ecke",
        "en": "A rectangle; x and y are its top left corner",
    });
    static rectangleConstructorComment = () => lm({
        "de": "Erzeugt ein Rechteck mit der linken oberen Ecke bei (x, y)",
        "en": "Creates a rectangle whose top left corner is at (x, y)",
    });

    // ---- Ellipse ----
    static ellipseClassComment = () => lm({
        "de": "Ellipse; x und y sind die linke obere Ecke des umschließenden Rechtecks",
        "en": "An ellipse; x and y are the top left corner of the rectangle around it",
    });
    static ellipseConstructorComment = () => lm({
        "de": "Erzeugt eine Ellipse im angegebenen Rechteck",
        "en": "Creates an ellipse inside the given rectangle",
    });

    // ---- Triangle ----
    static triangleClassComment = () => lm({
        "de": "Dreieck aus drei Eckpunkten",
        "en": "A triangle given by its three corners",
    });
    static triangleConstructorComment = () => lm({
        "de": "Erzeugt ein Dreieck aus den drei Eckpunkten",
        "en": "Creates a triangle from its three corners",
    });

    // ---- Polygon ----
    static polygonClassComment = () => lm({
        "de": "Vieleck aus beliebig vielen Punkten",
        "en": "A polygon of as many corners as you like",
    });
    static polygonConstructorComment = () => lm({
        "de": "Erzeugt ein leeres Vieleck; Punkte kommen mit addPoint() dazu",
        "en": "Creates an empty polygon; addPoint() adds the corners",
    });
    static polygonConstructor2Comment = () => lm({
        "de": "Erzeugt ein Vieleck aus x- und y-Koordinaten",
        "en": "Creates a polygon from x- and y-coordinates",
    });
    static polygonAddPointComment = () => lm({
        "de": "Fügt dem Vieleck einen Punkt hinzu",
        "en": "Adds a corner to the polygon",
    });

    // ---- Sprite ----
    static spriteClassComment = () => lm({
        "de": "Figur mit Kostümen, die sich auf der Bühne bewegen kann",
        "en": "A sprite with costumes that can move about the stage",
    });
    static spriteConstructorComment = () => lm({
        "de": "Erzeugt eine neue Figur",
        "en": "Creates a new sprite",
    });
    static spriteConstructor2Comment = () => lm({
        "de": "Erzeugt eine Figur mit einem ersten Kostüm",
        "en": "Creates a sprite with a first costume",
    });
    static spriteConstructor3Comment = () => lm({
        "de": "Erzeugt eine Kopie der angegebenen Figur",
        "en": "Creates a copy of the given sprite",
    });
    static spriteRunComment = () => lm({
        "de": "Wird in jedem Frame aufgerufen",
        "en": "Called once every frame",
    });
    static spriteWhenAddedToStageComment = () => lm({
        "de": "Wird aufgerufen, wenn die Figur der Bühne hinzugefügt wird",
        "en": "Called when the sprite is added to the stage",
    });
    static spriteWhenRemovedFromStageComment = () => lm({
        "de": "Wird aufgerufen, wenn die Figur von der Bühne entfernt wird",
        "en": "Called when the sprite is removed from the stage",
    });
    static spriteWhenClickedComment = () => lm({
        "de": "Wird aufgerufen, wenn die Figur angeklickt wird",
        "en": "Called when the sprite is clicked",
    });
    static spriteWhenKeyPressedComment = () => lm({
        "de": "Wird beim Drücken einer Taste aufgerufen",
        "en": "Called when a key is pressed",
    });
    static spriteWhenKeyReleasedComment = () => lm({
        "de": "Wird beim Loslassen einer Taste aufgerufen",
        "en": "Called when a key is let go of",
    });
    static spriteWhenMouseClickedComment = () => lm({
        "de": "Wird bei einem Mausklick aufgerufen, egal wo",
        "en": "Called on a click of the mouse, wherever it is",
    });
    static spriteWhenMouseMovedComment = () => lm({
        "de": "Wird bei jeder Mausbewegung aufgerufen; x und y sind Bühnenkoordinaten",
        "en": "Called every time the mouse moves; x and y are places on the stage",
    });
    static spriteWhenIReceiveComment = () => lm({
        "de": "Wird aufgerufen, wenn die Bühne eine Nachricht sendet",
        "en": "Called when the stage sends a message",
    });
    static spriteWhenBackdropSwitchesComment = () => lm({
        "de": "Wird aufgerufen, wenn der Hintergrund gewechselt wird",
        "en": "Called when the backdrop is switched",
    });
    static spriteSayComment = () => lm({
        "de": "Zeigt eine Sprechblase an",
        "en": "Shows a speech bubble",
    });
    static spriteSay2Comment = () => lm({
        "de": "Zeigt eine Sprechblase für die angegebene Zeit in Millisekunden",
        "en": "Shows a speech bubble for the given time in milliseconds",
    });
    static spriteThinkComment = () => lm({
        "de": "Zeigt eine Denkblase an",
        "en": "Shows a thought bubble",
    });
    static spriteThink2Comment = () => lm({
        "de": "Zeigt eine Denkblase für die angegebene Zeit in Millisekunden",
        "en": "Shows a thought bubble for the given time in milliseconds",
    });
    static spriteAddCostumeComment = () => lm({
        "de": "Fügt eines der eingebauten Kostüme hinzu",
        "en": "Adds one of the built-in costumes",
    });
    static spriteAddCostume2Comment = () => lm({
        "de": "Fügt ein Kostüm unter eigenem Namen hinzu",
        "en": "Adds a costume under a name of your own",
    });
    static spriteAddCostume3Comment = () => lm({
        "de": "Schneidet ein Kostüm aus einem Bild aus",
        "en": "Cuts a costume out of a picture",
    });
    static spriteAddCostumesComment = () => lm({
        "de": "Zerschneidet ein Bild in gleich große Kacheln und fügt sie als Kostüme hinzu",
        "en": "Cuts a picture into equally sized tiles and adds them as costumes",
    });
    static spriteSwitchCostumeComment = () => lm({
        "de": "Wechselt zum Kostüm mit dem Namen",
        "en": "Switches to the costume of that name",
    });
    static spriteSwitchCostume2Comment = () => lm({
        "de": "Wechselt zum Kostüm mit der angegebenen Nummer",
        "en": "Switches to the costume of the given number",
    });
    static spriteNextCostumeComment = () => lm({
        "de": "Wechselt zum nächsten Kostüm",
        "en": "Switches to the next costume",
    });
    static spritePreviousCostumeComment = () => lm({
        "de": "Wechselt zum vorherigen Kostüm",
        "en": "Switches to the previous costume",
    });
    static spriteGetCurrentCostumeNameComment = () => lm({
        "de": "Gibt den Namen des aktuellen Kostüms zurück",
        "en": "Returns the name of the current costume",
    });
    static spriteGetCurrentCostumeIndexComment = () => lm({
        "de": "Gibt die Nummer des aktuellen Kostüms zurück",
        "en": "Returns the number of the current costume",
    });
    static spriteAddSoundComment = () => lm({
        "de": "Fügt einen der eingebauten Klänge hinzu",
        "en": "Adds one of the built-in sounds",
    });
    static spriteAddSound2Comment = () => lm({
        "de": "Fügt einen Klang unter eigenem Namen hinzu",
        "en": "Adds a sound under a name of your own",
    });
    static spritePlaySoundComment = () => lm({
        "de": "Spielt einen zuvor hinzugefügten Klang ab",
        "en": "Plays a sound that was added earlier",
    });
    static spriteStopSoundComment = () => lm({
        "de": "Stoppt den Klang mit dem angegebenen Namen",
        "en": "Stops the sound of the given name",
    });
    static spriteStopAllSoundsComment = () => lm({
        "de": "Stoppt alle Klänge dieser Figur",
        "en": "Stops every sound of this sprite",
    });
    static spriteIsSoundPlayingComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Klang gerade abgespielt wird",
        "en": "Returns true exactly when the sound is playing",
    });
    static spriteSetVolumeComment = () => lm({
        "de": "Setzt die Lautstärke aller Klänge dieser Figur in Prozent",
        "en": "Sets how loud every sound of this sprite plays, as a percentage",
    });
    static spriteChangeVolumeComment = () => lm({
        "de": "Ändert die Lautstärke um den angegebenen Wert",
        "en": "Changes the volume by the given amount",
    });
    static spriteGetVolumeComment = () => lm({
        "de": "Gibt die Lautstärke in Prozent zurück",
        "en": "Returns the volume as a percentage",
    });
    static spriteMoveComment = () => lm({
        "de": "Bewegt die Figur um die angegebene Schrittzahl in ihre Blickrichtung",
        "en": "Moves the sprite the given number of steps in the direction it faces",
    });
    static spriteMove2Comment = () => lm({
        "de": "Verschiebt die Figur um den Vektor",
        "en": "Moves the sprite by the vector",
    });
    static spriteSetPositionComment = () => lm({
        "de": "Setzt die Figur an die angegebene Position (Mitte der Bühne ist 0/0)",
        "en": "Puts the sprite at the given position (the middle of the stage is 0/0)",
    });
    static spriteSetPosition2Comment = () => lm({
        "de": "Setzt die Figur an die angegebene Position (Mitte der Bühne ist 0/0)",
        "en": "Puts the sprite at the given position (the middle of the stage is 0/0)",
    });
    static spriteChangePositionComment = () => lm({
        "de": "Verschiebt die Figur um die angegebenen Werte",
        "en": "Moves the sprite by the given amounts",
    });
    static spriteChangePosition2Comment = () => lm({
        "de": "Verschiebt die Figur um den angegebenen Vektor",
        "en": "Moves the sprite by the given vector",
    });
    static spriteGetPositionComment = () => lm({
        "de": "Gibt die Position der Figur zurück",
        "en": "Returns the position of the sprite",
    });
    static spriteGlideComment = () => lm({
        "de": "Gleitet in der angegebenen Zeit zur Zielposition",
        "en": "Glides to the given position over the given time",
    });
    static spriteIsGlidingComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Figur gerade gleitet",
        "en": "Returns true exactly when the sprite is gliding",
    });
    static spriteGoToMousePointerComment = () => lm({
        "de": "Setzt die Figur an die Position des Mauszeigers",
        "en": "Puts the sprite where the mouse pointer is",
    });
    static spriteGetXComment = () => lm({
        "de": "Gibt die x-Position zurück (Mitte der Bühne ist 0)",
        "en": "Returns the x-position (the middle of the stage is 0)",
    });
    static spriteGetYComment = () => lm({
        "de": "Gibt die y-Position zurück (Mitte der Bühne ist 0, nach oben positiv)",
        "en": "Returns the y-position (the middle of the stage is 0, upwards is positive)",
    });
    static spriteSetXComment = () => lm({
        "de": "Setzt die x-Position",
        "en": "Sets the x-position",
    });
    static spriteSetYComment = () => lm({
        "de": "Setzt die y-Position",
        "en": "Sets the y-position",
    });
    static spriteChangeXComment = () => lm({
        "de": "Ändert die x-Position um den angegebenen Wert",
        "en": "Changes the x-position by the given amount",
    });
    static spriteChangeYComment = () => lm({
        "de": "Ändert die y-Position um den angegebenen Wert",
        "en": "Changes the y-position by the given amount",
    });
    static spriteGoToRandomPositionComment = () => lm({
        "de": "Setzt die Figur an eine zufällige Position auf der Bühne",
        "en": "Puts the sprite somewhere random on the stage",
    });
    static spriteIfOnEdgeBounceComment = () => lm({
        "de": "Lässt die Figur am Bühnenrand abprallen",
        "en": "Makes the sprite bounce off the edge of the stage",
    });
    static spriteTurnRightComment = () => lm({
        "de": "Dreht die Figur um die angegebene Gradzahl nach rechts",
        "en": "Turns the sprite the given number of degrees to the right",
    });
    static spriteTurnLeftComment = () => lm({
        "de": "Dreht die Figur um die angegebene Gradzahl nach links",
        "en": "Turns the sprite the given number of degrees to the left",
    });
    static spriteSetDirectionComment = () => lm({
        "de": "Setzt die Blickrichtung in Grad (90 = rechts, 0 = oben)",
        "en": "Sets the direction it faces in degrees (90 = right, 0 = up)",
    });
    static spriteSetDirection2Comment = () => lm({
        "de": "Setzt die Blickrichtung auf die Richtung des Vektors",
        "en": "Points it the way the vector points",
    });
    static spriteGoToSpriteComment = () => lm({
        "de": "Setzt die Figur auf die Position einer anderen Figur",
        "en": "Puts the sprite where another sprite is",
    });
    static spritePointInDirectionComment = () => lm({
        "de": "Setzt die Blickrichtung in Grad (90 = rechts, 0 = oben)",
        "en": "Sets the direction it faces in degrees (90 = right, 0 = up)",
    });
    static spritePointInDirection2Comment = () => lm({
        "de": "Richtet die Figur entlang des angegebenen Vektors aus",
        "en": "Points the sprite along the given vector",
    });
    static spritePointTowardsMousePointerComment = () => lm({
        "de": "Richtet die Figur zum Mauszeiger aus",
        "en": "Points the sprite at the mouse pointer",
    });
    static spritePointTowardsSpriteComment = () => lm({
        "de": "Richtet die Figur zu einer anderen Figur aus",
        "en": "Points the sprite at another sprite",
    });
    static spriteGetDirectionComment = () => lm({
        "de": "Gibt die Blickrichtung in Grad zurück (90 = rechts, 0 = oben)",
        "en": "Returns the direction it faces in degrees (90 = right, 0 = up)",
    });
    static spriteSetRotationStyleComment = () => lm({
        "de": "Legt fest, wie sich die Figur beim Drehen verhält",
        "en": "Chooses what the sprite does when it turns",
    });
    static spriteShowComment = () => lm({
        "de": "Macht die Figur sichtbar",
        "en": "Makes the sprite visible",
    });
    static spriteHideComment = () => lm({
        "de": "Macht die Figur unsichtbar",
        "en": "Makes the sprite invisible",
    });
    static spriteIsVisibleComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Figur sichtbar ist",
        "en": "Returns true exactly when the sprite is visible",
    });
    static spriteSetSizeComment = () => lm({
        "de": "Setzt die Größe in Prozent (100 = Originalgröße)",
        "en": "Sets the size as a percentage (100 = its own size)",
    });
    static spriteChangeSizeComment = () => lm({
        "de": "Ändert die Größe um den angegebenen Wert in Prozent",
        "en": "Changes the size by the given number of percent",
    });
    static spriteGetSizeComment = () => lm({
        "de": "Gibt die Größe in Prozent zurück",
        "en": "Returns the size as a percentage",
    });
    static spriteSetTransparencyComment = () => lm({
        "de": "Setzt die Transparenz in Prozent (0 = deckend, 100 = unsichtbar)",
        "en": "Sets how see-through it is, as a percentage (0 = solid, 100 = invisible)",
    });
    static spriteChangeTransparencyComment = () => lm({
        "de": "Ändert die Transparenz um den angegebenen Wert",
        "en": "Changes how see-through it is by the given amount",
    });
    static spriteGetTransparencyComment = () => lm({
        "de": "Gibt die Transparenz in Prozent zurück",
        "en": "Returns how see-through it is, as a percentage",
    });
    static spriteGetWidthComment = () => lm({
        "de": "Gibt die Breite der Figur in Pixeln zurück",
        "en": "Returns the width of the sprite in pixels",
    });
    static spriteGetHeightComment = () => lm({
        "de": "Gibt die Höhe der Figur in Pixeln zurück",
        "en": "Returns the height of the sprite in pixels",
    });
    static spriteSetTintComment = () => lm({
        "de": "Färbt die Figur mit der angegebenen Farbe ein",
        "en": "Tints the sprite with the given colour",
    });
    static spriteSetTint2Comment = () => lm({
        "de": "Färbt die Figur mit dem angegebenen Farbton ein (0 bis 255)",
        "en": "Tints the sprite with the given hue (0 to 255)",
    });
    static spriteSetTint3Comment = () => lm({
        "de": "Färbt die Figur mit der angegebenen Farbe ein (Anteile jeweils 0 bis 255)",
        "en": "Tints the sprite with the given colour (each part 0 to 255)",
    });
    static spriteChangeTintComment = () => lm({
        "de": "Ändert den Farbton der Einfärbung um den angegebenen Wert",
        "en": "Changes the hue of the tint by the given amount",
    });
    static spriteGetTintComment = () => lm({
        "de": "Gibt die Farbe der Einfärbung zurück",
        "en": "Returns the colour of the tint",
    });
    static spriteGoToFrontLayerComment = () => lm({
        "de": "Bringt die Figur ganz nach vorne",
        "en": "Brings the sprite right to the front",
    });
    static spriteGoToBackLayerComment = () => lm({
        "de": "Schiebt die Figur ganz nach hinten",
        "en": "Sends the sprite right to the back",
    });
    static spriteGoLayersForwardsComment = () => lm({
        "de": "Bringt die Figur um die angegebene Anzahl Ebenen nach vorne",
        "en": "Brings the sprite forward by the given number of layers",
    });
    static spriteGoLayersBackwardsComment = () => lm({
        "de": "Schiebt die Figur um die angegebene Anzahl Ebenen nach hinten",
        "en": "Sends the sprite back by the given number of layers",
    });
    static spriteIsTouchingSpriteComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn sich die Figuren berühren",
        "en": "Returns true exactly when the sprites touch",
    });
    static spriteIsTouchingSprite2Comment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Figur eine Figur dieser Klasse berührt, z.B. isTouchingSprite(Apfel.class)",
        "en": "Returns true exactly when the sprite touches a sprite of this class, for example isTouchingSprite(Apple.class)",
    });
    static spriteGetTouchingSpriteComment = () => lm({
        "de": "Gibt die erste berührte Figur dieser Klasse zurück, sonst null",
        "en": "Returns the first touched sprite of this class, or null when there is none",
    });
    static spriteGetTouchingSpritesComment = () => lm({
        "de": "Gibt alle berührten Figuren dieser Klasse zurück",
        "en": "Returns every touched sprite of this class",
    });
    static spriteIsTouchingEdgeComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Figur den Bühnenrand berührt",
        "en": "Returns true exactly when the sprite touches the edge of the stage",
    });
    static spriteIsTouchingMousePointerComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Mauszeiger auf der Figur liegt",
        "en": "Returns true exactly when the mouse pointer is on the sprite",
    });
    static spriteIsKeyPressedComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Taste gerade gedrückt ist",
        "en": "Returns true exactly when the key is being held down",
    });
    static spriteGetMouseXComment = () => lm({
        "de": "Gibt die x-Position des Mauszeigers zurück",
        "en": "Returns the x-position of the mouse pointer",
    });
    static spriteGetMouseYComment = () => lm({
        "de": "Gibt die y-Position des Mauszeigers zurück",
        "en": "Returns the y-position of the mouse pointer",
    });
    static spriteGetMouseComment = () => lm({
        "de": "Gibt die Position des Mauszeigers zurück",
        "en": "Returns the position of the mouse pointer",
    });
    static spriteIsMouseDownComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn eine Maustaste gedrückt ist",
        "en": "Returns true exactly when a mouse button is being held down",
    });
    static spriteDistanceToSpriteComment = () => lm({
        "de": "Gibt den Abstand zu einer anderen Figur zurück",
        "en": "Returns the distance to another sprite",
    });
    static spriteDistanceToMousePointerComment = () => lm({
        "de": "Gibt den Abstand zum Mauszeiger zurück",
        "en": "Returns the distance to the mouse pointer",
    });
    static spriteGetStageComment = () => lm({
        "de": "Gibt die Bühne zurück, auf der die Figur steht",
        "en": "Returns the stage the sprite is on",
    });
    static spriteBroadcastComment = () => lm({
        "de": "Sendet eine Nachricht an alle Figuren und die Bühne",
        "en": "Sends a message to every sprite and to the stage",
    });
    static spriteAskComment = () => lm({
        "de": "Stellt eine Frage; die Antwort wird über getAnswer() abgeholt",
        "en": "Asks a question; getAnswer() fetches what was typed",
    });
    static spriteGetAnswerComment = () => lm({
        "de": "Gibt die zuletzt eingegebene Antwort zurück, sonst eine leere Zeichenkette",
        "en": "Returns the answer last typed in, or an empty text when there is none",
    });
    static spriteIsAskingComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn noch auf eine Antwort gewartet wird",
        "en": "Returns true exactly when an answer is still being waited for",
    });
    static spritePickRandomComment = () => lm({
        "de": "Gibt eine Zufallszahl zwischen from und to zurück (beide eingeschlossen)",
        "en": "Returns a random number between from and to (both included)",
    });
    static spriteGetDeltaTimeComment = () => lm({
        "de": "Gibt die Dauer des letzten Frames in Sekunden zurück",
        "en": "Returns how long the last frame took, in seconds",
    });
    static spriteGetTextComment = () => lm({
        "de": "Gibt den Text zurück, der über der Figur angezeigt wird",
        "en": "Returns the text shown above the sprite",
    });
    static spriteDebugComment = () => lm({
        "de": "Gibt Werte zur Fehlersuche aus",
        "en": "Prints values to help with finding a mistake",
    });
    static spriteGetTimerComment = () => lm({
        "de": "Gibt den Standard-Timer dieser Figur zurück",
        "en": "Returns this sprite's own timer",
    });
    static spriteGetTimer2Comment = () => lm({
        "de": "Gibt den Timer mit dem angegebenen Namen zurück und legt ihn bei Bedarf an",
        "en": "Returns the timer of the given name, making one if there is none",
    });
    static spriteSetHitboxComment = () => lm({
        "de": "Setzt die Trefferfläche aus x/y-Paaren; (0/0) ist die Mitte der Figur",
        "en": "Sets the hitbox from pairs of x and y; (0/0) is the middle of the sprite",
    });
    static spriteSetHitbox2Comment = () => lm({
        "de": "Setzt die Trefferfläche auf die angegebene Form; (0/0) ist die Mitte der Figur",
        "en": "Sets the hitbox to the given shape; (0/0) is the middle of the sprite",
    });
    static spriteGetHitboxComment = () => lm({
        "de": "Gibt die Trefferfläche der Figur zurück",
        "en": "Returns the hitbox of the sprite",
    });
    static spriteEnableHitboxComment = () => lm({
        "de": "Schaltet die Berührungserkennung wieder ein",
        "en": "Turns touching back on",
    });
    static spriteDisableHitboxComment = () => lm({
        "de": "Schaltet die Berührungserkennung aus",
        "en": "Turns touching off",
    });
    static spriteStampComment = () => lm({
        "de": "Druckt ein unbewegliches Abbild der Figur auf die Bühne",
        "en": "Prints a still picture of the sprite onto the stage",
    });
    static spriteStamp2Comment = () => lm({
        "de": "Druckt ein unbewegliches Abbild der Figur auf die angegebene Ebene",
        "en": "Prints a still picture of the sprite onto the given layer",
    });
    static spriteGetPenComment = () => lm({
        "de": "Gibt den Stift dieser Figur zurück; mit ihm kann sie eine Spur zeichnen",
        "en": "Returns this sprite's pen, with which it can draw a trail",
    });
    static spriteRemoveComment = () => lm({
        "de": "Entfernt die Figur von der Bühne",
        "en": "Removes the sprite from the stage",
    });
    static spriteCloneComment = () => lm({
        "de": "Erzeugt eine Kopie der Figur",
        "en": "Creates a copy of the sprite",
    });
    static spriteGetShadersComment = () => lm({
        "de": "Nur in der Desktop-Version: Shader dieser Figur",
        "en": "Only in the desktop version: the shaders of this sprite",
    });

    // ---- Stage ----
    static stageClassComment = () => lm({
        "de": "Die Bühne, auf der alle Figuren angezeigt werden",
        "en": "The stage every sprite is shown on",
    });
    static stageConstructorComment = () => lm({
        "de": "Erzeugt eine Bühne der Größe 480 x 360",
        "en": "Creates a stage 480 by 360 in size",
    });
    static stageConstructor2Comment = () => lm({
        "de": "Erzeugt eine Bühne mit der angegebenen Breite und Höhe",
        "en": "Creates a stage of the given width and height",
    });
    static stageRunComment = () => lm({
        "de": "Wird in jedem Frame aufgerufen",
        "en": "Called once every frame",
    });
    static stageWhenIReceiveComment = () => lm({
        "de": "Wird bei broadcast(message) aufgerufen",
        "en": "Called on broadcast(message)",
    });
    static stageWhenKeyPressedComment = () => lm({
        "de": "Wird beim Drücken der Taste aufgerufen",
        "en": "Called when the key is pressed",
    });
    static stageWhenKeyReleasedComment = () => lm({
        "de": "Wird beim Loslassen der Taste aufgerufen",
        "en": "Called when the key is let go of",
    });
    static stageWhenMouseClickedComment = () => lm({
        "de": "Wird bei einem Mausklick aufgerufen",
        "en": "Called on a click of the mouse",
    });
    static stageWhenMouseMovedComment = () => lm({
        "de": "Wird bei jeder Mausbewegung aufgerufen",
        "en": "Called every time the mouse moves",
    });
    static stageWhenMouseWheelMovedComment = () => lm({
        "de": "Wird beim Drehen des Mausrads aufgerufen",
        "en": "Called when the mouse wheel is turned",
    });
    static stageWhenBackdropSwitchesComment = () => lm({
        "de": "Wird beim Wechsel des Hintergrunds aufgerufen",
        "en": "Called when the backdrop is switched",
    });
    static stageBroadcastComment = () => lm({
        "de": "Sendet eine Nachricht an alle whenIReceive-Empfänger",
        "en": "Sends a message to everything with a whenIReceive",
    });
    static stageAddComment = () => lm({
        "de": "Fügt der Bühne eine Figur hinzu",
        "en": "Adds a sprite to the stage",
    });
    static stageAdd2Comment = () => lm({
        "de": "Fügt der Bühne einen Stift hinzu",
        "en": "Adds a pen to the stage",
    });
    static stageAdd3Comment = () => lm({
        "de": "Fügt der Bühne einen Text hinzu",
        "en": "Adds a text to the stage",
    });
    static stageRemoveComment = () => lm({
        "de": "Entfernt den Text von der Bühne",
        "en": "Removes the text from the stage",
    });
    static stageRemove2Comment = () => lm({
        "de": "Entfernt den Stift von der Bühne",
        "en": "Removes the pen from the stage",
    });
    static stageRemove3Comment = () => lm({
        "de": "Entfernt die Figur von der Bühne",
        "en": "Removes the sprite from the stage",
    });
    static stageRemoveAllComment = () => lm({
        "de": "Entfernt alle Figuren von der Bühne",
        "en": "Removes every sprite from the stage",
    });
    static stageRemove4Comment = () => lm({
        "de": "Entfernt alle Figuren dieser Klasse von der Bühne, z.B. remove(Apfel.class)",
        "en": "Removes every sprite of this class from the stage, for example remove(Apple.class)",
    });
    static stageGetAllComment = () => lm({
        "de": "Gibt alle Figuren auf der Bühne zurück",
        "en": "Returns every sprite on the stage",
    });
    static stageFindComment = () => lm({
        "de": "Gibt alle Figuren dieser Klasse zurück, z.B. find(Apfel.class)",
        "en": "Returns every sprite of this class, for example find(Apple.class)",
    });
    static stageCountComment = () => lm({
        "de": "Gibt die Anzahl der Figuren dieser Klasse zurück, z.B. count(Apfel.class)",
        "en": "Returns how many sprites of this class there are, for example count(Apple.class)",
    });
    static stageAddBackdropComment = () => lm({
        "de": "Fügt einen der eingebauten Hintergründe hinzu",
        "en": "Adds one of the built-in backdrops",
    });
    static stageAddBackdrop2Comment = () => lm({
        "de": "Fügt einen Hintergrund unter eigenem Namen hinzu",
        "en": "Adds a backdrop under a name of your own",
    });
    static stageAddBackdrop3Comment = () => lm({
        "de": "Fügt einen Hintergrund hinzu; bei stretch == true wird er auf Bühnengröße gedehnt",
        "en": "Adds a backdrop; with stretch == true it is stretched to the size of the stage",
    });
    static stageSwitchBackdropComment = () => lm({
        "de": "Wechselt zum Hintergrund mit dem angegebenen Namen",
        "en": "Switches to the backdrop of the given name",
    });
    static stageNextBackdropComment = () => lm({
        "de": "Wechselt zum nächsten Hintergrund",
        "en": "Switches to the next backdrop",
    });
    static stagePreviousBackdropComment = () => lm({
        "de": "Wechselt zum vorherigen Hintergrund",
        "en": "Switches to the previous backdrop",
    });
    static stageRandomBackdropComment = () => lm({
        "de": "Wechselt zu einem zufälligen Hintergrund",
        "en": "Switches to a backdrop at random",
    });
    static stageGetCurrentBackdropNameComment = () => lm({
        "de": "Gibt den Namen des aktuellen Hintergrunds zurück",
        "en": "Returns the name of the current backdrop",
    });
    static stageGetCurrentBackdropIndexComment = () => lm({
        "de": "Gibt die Nummer des aktuellen Hintergrunds zurück",
        "en": "Returns the number of the current backdrop",
    });
    static stageAddSoundComment = () => lm({
        "de": "Fügt einen der eingebauten Klänge hinzu",
        "en": "Adds one of the built-in sounds",
    });
    static stageAddSound2Comment = () => lm({
        "de": "Fügt einen Klang unter eigenem Namen hinzu",
        "en": "Adds a sound under a name of your own",
    });
    static stagePlaySoundComment = () => lm({
        "de": "Spielt einen zuvor hinzugefügten Klang ab",
        "en": "Plays a sound that was added earlier",
    });
    static stageStopSoundComment = () => lm({
        "de": "Stoppt den Klang mit dem angegebenen Namen",
        "en": "Stops the sound of the given name",
    });
    static stageStopAllSoundsComment = () => lm({
        "de": "Stoppt alle Klänge der Bühne",
        "en": "Stops every sound of the stage",
    });
    static stageIsSoundPlayingComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Klang gerade abgespielt wird",
        "en": "Returns true exactly when the sound is playing",
    });
    static stageSetVolumeComment = () => lm({
        "de": "Setzt die Lautstärke in Prozent",
        "en": "Sets the volume as a percentage",
    });
    static stageChangeVolumeComment = () => lm({
        "de": "Ändert die Lautstärke um den angegebenen Wert",
        "en": "Changes the volume by the given amount",
    });
    static stageGetVolumeComment = () => lm({
        "de": "Gibt die Lautstärke in Prozent zurück",
        "en": "Returns the volume as a percentage",
    });
    static stageSetColorComment = () => lm({
        "de": "Setzt die Hintergrundfarbe über den Farbton (0 bis 255)",
        "en": "Sets the background colour by its hue (0 to 255)",
    });
    static stageSetColor2Comment = () => lm({
        "de": "Setzt die Hintergrundfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Sets the background colour from its red, green and blue parts (each 0 to 255)",
    });
    static stageSetColor3Comment = () => lm({
        "de": "Setzt die Hintergrundfarbe",
        "en": "Sets the background colour",
    });
    static stageGetColorComment = () => lm({
        "de": "Gibt die Hintergrundfarbe zurück",
        "en": "Returns the background colour",
    });
    static stageChangeColorComment = () => lm({
        "de": "Ändert den Farbton des Hintergrunds um den angegebenen Wert",
        "en": "Changes the hue of the backdrop by the given amount",
    });
    static stageGetCameraComment = () => lm({
        "de": "Gibt die Kamera der Bühne zurück",
        "en": "Returns the stage's camera",
    });
    static stageSetTintComment = () => lm({
        "de": "Färbt den Hintergrund ein (Anteile jeweils 0 bis 255)",
        "en": "Tints the backdrop (each part 0 to 255)",
    });
    static stageSetTint2Comment = () => lm({
        "de": "Färbt den Hintergrund mit dem angegebenen Farbton ein (0 bis 255)",
        "en": "Tints the backdrop with the given hue (0 to 255)",
    });
    static stageChangeTintComment = () => lm({
        "de": "Ändert den Farbton der Einfärbung um den angegebenen Wert",
        "en": "Changes the hue of the tint by the given amount",
    });
    static stageSetTransparencyComment = () => lm({
        "de": "Setzt die Transparenz des Hintergrunds in Prozent",
        "en": "Sets how see-through the backdrop is, as a percentage",
    });
    static stageChangeTransparencyComment = () => lm({
        "de": "Ändert die Transparenz des Hintergrunds",
        "en": "Changes how see-through the backdrop is",
    });
    static stageSetDebugComment = () => lm({
        "de": "Schaltet die Ausgabe von debug() ein oder aus",
        "en": "Turns what debug() prints on or off",
    });
    static stageIsDebugComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Fehlersuche eingeschaltet ist",
        "en": "Returns true exactly when debug mode is on",
    });
    static stageDebugComment = () => lm({
        "de": "Gibt Werte zur Fehlersuche aus, wenn setDebug(true) gesetzt ist",
        "en": "Prints values to help with finding a mistake, when setDebug(true) is on",
    });
    static stageWaitUntilComment = () => lm({
        "de": "Wartet, bis die Bedingung erfüllt ist",
        "en": "Waits until the condition is true",
    });
    static stageExitComment = () => lm({
        "de": "Beendet das Programm",
        "en": "Ends the program",
    });
    static stageSetCursorComment = () => lm({
        "de": "Setzt das Mauszeigerbild",
        "en": "Sets the picture of the mouse pointer",
    });
    static stageSetCursor2Comment = () => lm({
        "de": "Setzt das Mauszeigerbild mit eigenem Aktivpunkt",
        "en": "Sets the picture of the mouse pointer, with a pointing spot of your own",
    });
    static stageGetPixelsComment = () => lm({
        "de": "Nur in der Desktop-Version: Zugriff auf einzelne Bildpunkte",
        "en": "Only in the desktop version: reaching single pixels",
    });
    static stageGetShadersComment = () => lm({
        "de": "Nur in der Desktop-Version: Shader der Bühne",
        "en": "Only in the desktop version: the shaders of the stage",
    });
    static stageGetSortingComment = () => lm({
        "de": "Nur in der Desktop-Version: Sortierreihenfolge der Figuren",
        "en": "Only in the desktop version: the order the sprites are drawn in",
    });
    static stageGetWidthComment = () => lm({
        "de": "Gibt die Breite der Bühne in Pixeln zurück",
        "en": "Returns the width of the stage in pixels",
    });
    static stageGetHeightComment = () => lm({
        "de": "Gibt die Höhe der Bühne in Pixeln zurück",
        "en": "Returns the height of the stage in pixels",
    });
    static stageIsKeyPressedComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Taste gerade gedrückt ist",
        "en": "Returns true exactly when the key is being held down",
    });
    static stageGetMouseXComment = () => lm({
        "de": "Gibt die x-Position des Mauszeigers zurück",
        "en": "Returns the x-position of the mouse pointer",
    });
    static stageGetMouseYComment = () => lm({
        "de": "Gibt die y-Position des Mauszeigers zurück",
        "en": "Returns the y-position of the mouse pointer",
    });
    static stageGetMouseComment = () => lm({
        "de": "Gibt die Position des Mauszeigers zurück",
        "en": "Returns the position of the mouse pointer",
    });
    static stageIsMouseDownComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn eine Maustaste gedrückt ist",
        "en": "Returns true exactly when a mouse button is being held down",
    });
    static stageGetTimerComment = () => lm({
        "de": "Gibt den Standard-Timer der Bühne zurück",
        "en": "Returns the stage's own timer",
    });
    static stageGetTimer2Comment = () => lm({
        "de": "Gibt den Timer mit dem angegebenen Namen zurück und legt ihn bei Bedarf an",
        "en": "Returns the timer of the given name, making one if there is none",
    });
    static stageGetDeltaTimeComment = () => lm({
        "de": "Gibt die Dauer des letzten Frames in Sekunden zurück",
        "en": "Returns how long the last frame took, in seconds",
    });
    static stageGetFrameRateComment = () => lm({
        "de": "Gibt die aktuelle Bildrate zurück",
        "en": "Returns the current frame rate",
    });
    static stageEraseAllComment = () => lm({
        "de": "Löscht alles, was mit Stiften gezeichnet wurde",
        "en": "Wipes away everything the pens have drawn",
    });
    static stageDisplayComment = () => lm({
        "de": "Zeigt einen Text am unteren Rand der Bühne an",
        "en": "Shows a text along the bottom of the stage",
    });
    static stageDisplay2Comment = () => lm({
        "de": "Zeigt einen Text für die angegebene Zeit in Millisekunden an",
        "en": "Shows a text for the given time in milliseconds",
    });
    static stageWaitComment = () => lm({
        "de": "Pausiert das Programm für die angegebene Zeit in Millisekunden",
        "en": "Holds the program up for the given time in milliseconds",
    });
    static stageAskComment = () => lm({
        "de": "Stellt eine Frage; die Antwort wird über getAnswer() abgeholt",
        "en": "Asks a question; getAnswer() fetches what was typed",
    });
    static stageGetAnswerComment = () => lm({
        "de": "Gibt die zuletzt eingegebene Antwort zurück, sonst eine leere Zeichenkette",
        "en": "Returns the answer last typed in, or an empty text when there is none",
    });
    static stageIsAskingComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn noch auf eine Antwort gewartet wird",
        "en": "Returns true exactly when an answer is still being waited for",
    });
    static stagePickRandomComment = () => lm({
        "de": "Gibt eine Zufallszahl zwischen from und to zurück (beide eingeschlossen)",
        "en": "Returns a random number between from and to (both included)",
    });

    // ---- Text ----
    static textClassComment = () => lm({
        "de": "Text auf der Bühne",
        "en": "Text on the stage",
    });
    static textConstructorComment = () => lm({
        "de": "Erzeugt einen leeren Text in der Mitte der Bühne",
        "en": "Creates an empty text in the middle of the stage",
    });
    static textConstructor2Comment = () => lm({
        "de": "Erzeugt einen Text an der angegebenen Position mit der angegebenen Breite",
        "en": "Creates a text at the given position and of the given width",
    });
    static colorToStringComment = () => lm({
        "de": "Gibt die Farbe als Text aus",
        "en": "Returns the colour as text",
    });
    static colorEqualsComment = () => lm({
        "de": "Prüft, ob es dieselbe Farbe ist",
        "en": "Checks whether this is the same colour",
    });
    static boundsToStringComment = () => lm({
        "de": "Gibt das Rechteck als Text aus",
        "en": "Returns the box as text",
    });
    static stageConstructor3Comment = () => lm({
        "de": "Erzeugt eine Bühne der angegebenen Größe. Der Asset-Pfad wird im Browser ignoriert",
        "en": "Creates a stage of the given size. The assets path is ignored in the browser",
    });
    static textConstructor3Comment = () => lm({
        "de": "Erzeugt einen Text an der angegebenen Position, mit der angegebenen Breite und im angegebenen Stil",
        "en": "Creates a text at the given position, of the given width and in the given style",
    });
    static textGetStyleComment = () => lm({
        "de": "Gibt den Stil zurück, in dem der Text gezeichnet wird",
        "en": "Returns the style the text is drawn in",
    });
    static textShowTextComment = () => lm({
        "de": "Zeigt den Text an",
        "en": "Shows the text",
    });
    static textShowText2Comment = () => lm({
        "de": "Zeigt den Text für die angegebene Zeit in Millisekunden an",
        "en": "Shows the text for the given time in milliseconds",
    });
    static textSetPositionComment = () => lm({
        "de": "Setzt den Text an die angegebene Position (Mitte der Bühne ist 0/0)",
        "en": "Puts the text at the given position (the middle of the stage is 0/0)",
    });
    static textSetPosition2Comment = () => lm({
        "de": "Setzt den Text an die angegebene Position (Mitte der Bühne ist 0/0)",
        "en": "Puts the text at the given position (the middle of the stage is 0/0)",
    });
    static textGetPositionComment = () => lm({
        "de": "Gibt die Position des Texts zurück",
        "en": "Returns the position of the text",
    });
    static textSetXComment = () => lm({
        "de": "Setzt die x-Position",
        "en": "Sets the x-position",
    });
    static textGetXComment = () => lm({
        "de": "Gibt die x-Position zurück",
        "en": "Returns the x-position",
    });
    static textSetYComment = () => lm({
        "de": "Setzt die y-Position",
        "en": "Sets the y-position",
    });
    static textGetYComment = () => lm({
        "de": "Gibt die y-Position zurück",
        "en": "Returns the y-position",
    });
    static textSetTextColorComment = () => lm({
        "de": "Setzt die Schriftfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Sets the colour of the letters from its red, green and blue parts (each 0 to 255)",
    });
    static textSetTextColor2Comment = () => lm({
        "de": "Setzt die Schriftfarbe über den Farbton (0 bis 255)",
        "en": "Sets the colour of the letters by its hue (0 to 255)",
    });
    static textSetTextColor3Comment = () => lm({
        "de": "Setzt die Schriftfarbe",
        "en": "Sets the colour of the letters",
    });
    static textSetBackgroundColorComment = () => lm({
        "de": "Setzt die Hintergrundfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Sets the background colour from its red, green and blue parts (each 0 to 255)",
    });
    static textSetBackgroundColor2Comment = () => lm({
        "de": "Setzt die Hintergrundfarbe über den Farbton (0 bis 255)",
        "en": "Sets the background colour by its hue (0 to 255)",
    });
    static textSetBackgroundColor3Comment = () => lm({
        "de": "Setzt die Hintergrundfarbe",
        "en": "Sets the background colour",
    });
    static textSetStrokeColorComment = () => lm({
        "de": "Setzt die Rahmenfarbe aus Rot-, Grün- und Blauanteil (jeweils 0 bis 255)",
        "en": "Sets the colour of the frame from its red, green and blue parts (each 0 to 255)",
    });
    static textSetStrokeColor2Comment = () => lm({
        "de": "Setzt die Rahmenfarbe über den Farbton (0 bis 255)",
        "en": "Sets the colour of the frame by its hue (0 to 255)",
    });
    static textSetStrokeColor3Comment = () => lm({
        "de": "Setzt die Rahmenfarbe",
        "en": "Sets the colour of the frame",
    });
    static textAddFontComment = () => lm({
        "de": "Fügt eine Schriftart hinzu",
        "en": "Adds a font",
    });
    static textSwitchFontComment = () => lm({
        "de": "Wechselt zur Schriftart mit dem angegebenen Namen",
        "en": "Switches to the font of the given name",
    });
    static textNextFontComment = () => lm({
        "de": "Wechselt zur nächsten Schriftart",
        "en": "Switches to the next font",
    });
    static textGetCurrentFontNameComment = () => lm({
        "de": "Gibt den Namen der aktuellen Schriftart zurück",
        "en": "Returns the name of the current font",
    });
    static textGetCurrentFontIndexComment = () => lm({
        "de": "Gibt die Nummer der aktuellen Schriftart zurück",
        "en": "Returns the number of the current font",
    });
    static textSetFontComment = () => lm({
        "de": "Wechselt zur Schriftart mit dem angegebenen Namen",
        "en": "Switches to the font of the given name",
    });
    static textGetFontComment = () => lm({
        "de": "Gibt den Namen der aktuellen Schriftart zurück",
        "en": "Returns the name of the current font",
    });
    static textSetTextSizeComment = () => lm({
        "de": "Setzt die Schriftgröße",
        "en": "Sets the font size",
    });
    static textGetTextSizeComment = () => lm({
        "de": "Gibt die Schriftgröße zurück",
        "en": "Returns the font size",
    });
    static textGetWidthComment = () => lm({
        "de": "Gibt die Breite des Textfelds zurück",
        "en": "Returns the width of the text box",
    });
    static textSetWidthComment = () => lm({
        "de": "Setzt die Breite des Textfelds; längere Texte werden umgebrochen",
        "en": "Sets the width of the text box; longer texts wrap onto the next line",
    });
    static textSetAlignComment = () => lm({
        "de": "Legt fest, wie der Text zu seiner Position ausgerichtet wird",
        "en": "Chooses where the text sits relative to its position",
    });
    static textGetAlignComment = () => lm({
        "de": "Gibt die Ausrichtung des Texts zurück",
        "en": "Returns where the text sits relative to its position",
    });
    static textSetStyleComment = () => lm({
        "de": "Legt fest, ob der Text als Kasten, Sprech- oder Denkblase dargestellt wird",
        "en": "Chooses whether the text is drawn as a box, a speech bubble or a thought bubble",
    });
    static textRemoveComment = () => lm({
        "de": "Entfernt den Text von der Bühne",
        "en": "Removes the text from the stage",
    });
    static textGoToFrontLayerComment = () => lm({
        "de": "Bringt den Text vor die anderen Texte",
        "en": "Brings the text in front of the other texts",
    });
    static textGoToBackLayerComment = () => lm({
        "de": "Schiebt den Text hinter die anderen Texte",
        "en": "Sends the text behind the other texts",
    });
    static textGoLayersForwardsComment = () => lm({
        "de": "Bringt den Text um die angegebene Anzahl Ebenen nach vorne",
        "en": "Brings the text forward by the given number of layers",
    });
    static textGoLayersBackwardsComment = () => lm({
        "de": "Schiebt den Text um die angegebene Anzahl Ebenen nach hinten",
        "en": "Sends the text back by the given number of layers",
    });
    static textIsUIComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn der Text zur Benutzeroberfläche gehört",
        "en": "Returns true exactly when the text belongs to the interface",
    });
    static textSetIsUIComment = () => lm({
        "de": "Legt fest, ob der Text zur Benutzeroberfläche gehört und sich nicht mit der Kamera bewegt",
        "en": "Chooses whether the text belongs to the interface and so does not move with the camera",
    });
    static textGetStageComment = () => lm({
        "de": "Gibt die Bühne zurück, auf der der Text liegt",
        "en": "Returns the stage the text is on",
    });
    static textAddedToStageComment = () => lm({
        "de": "Wird aufgerufen, wenn der Text der Bühne hinzugefügt wird",
        "en": "Called when the text is added to the stage",
    });
    static textRemovedFromStageComment = () => lm({
        "de": "Wird aufgerufen, wenn der Text von der Bühne entfernt wird",
        "en": "Called when the text is removed from the stage",
    });
    static textWhenAddedToStageComment = () => lm({
        "de": "Wird aufgerufen, wenn der Text der Bühne hinzugefügt wird",
        "en": "Called when the text is added to the stage",
    });
    static textWhenAddedToStage2Comment = () => lm({
        "de": "Wird aufgerufen, wenn der Text der Bühne hinzugefügt wird",
        "en": "Called when the text is added to the stage",
    });
    static textWhenRemovedFromStageComment = () => lm({
        "de": "Wird aufgerufen, wenn der Text von der Bühne entfernt wird",
        "en": "Called when the text is removed from the stage",
    });
    static textWhenRemovedFromStage2Comment = () => lm({
        "de": "Wird aufgerufen, wenn der Text von der Bühne entfernt wird",
        "en": "Called when the text is removed from the stage",
    });
    static textGetDefaultFontComment = () => lm({
        "de": "Gibt die Standardschriftart zurück",
        "en": "Returns the font text is written in by default",
    });
    static textGetDefaultFontSizeComment = () => lm({
        "de": "Gibt die Standardschriftgröße zurück",
        "en": "Returns the size text is written in by default",
    });
    static textGetDefaultFontSizesComment = () => lm({
        "de": "Gibt die voreingestellten Schriftgrößen zurück",
        "en": "Returns the font sizes prepared in advance",
    });
    static textUseFontComment = () => lm({
        "de": "Legt Schriftart und -größe für alle Texte fest",
        "en": "Chooses the font and the size for every text",
    });
    static textUseFont2Comment = () => lm({
        "de": "Legt die Schriftart für alle Texte fest",
        "en": "Chooses the font for every text",
    });
    static textUseFontSizesComment = () => lm({
        "de": "Legt die verfügbaren Schriftgrößen fest; die erste ist die Standardgröße",
        "en": "Chooses the sizes that are available; the first one is the usual size",
    });
    static textUseSmoothingComment = () => lm({
        "de": "Legt fest, ob Schrift geglättet wird",
        "en": "Chooses whether letters are smoothed",
    });
    static textIsSmoothingComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn Schrift geglättet wird",
        "en": "Returns true exactly when letters are smoothed",
    });

    // ---- Timer ----
    static timerClassComment = () => lm({
        "de": "Timer für zeitgesteuerte Abläufe",
        "en": "A timer, for anything that has to happen on time",
    });
    static timerConstructorComment = () => lm({
        "de": "Erzeugt einen neuen Timer",
        "en": "Creates a new timer",
    });
    static timerResetComment = () => lm({
        "de": "Setzt den Timer auf 0 zurück",
        "en": "Sets the timer back to 0",
    });
    static timerMillisComment = () => lm({
        "de": "Gibt die seit dem Programmstart vergangenen Millisekunden zurück",
        "en": "Returns the milliseconds since the program started",
    });
    static timerEveryMillisComment = () => lm({
        "de": "Gibt alle millis Millisekunden einmal true zurück",
        "en": "Returns true once every millis milliseconds",
    });
    static timerForMillisComment = () => lm({
        "de": "Gibt für die ersten millis Millisekunden nach dem Zurücksetzen true zurück",
        "en": "Returns true for the first millis milliseconds after being reset",
    });
    static timerAfterMillisComment = () => lm({
        "de": "Gibt true zurück, sobald seit dem Zurücksetzen millis Millisekunden vergangen sind",
        "en": "Returns true once millis milliseconds have passed since it was reset",
    });
    static timerIntervalMillisComment = () => lm({
        "de": "Wechselt alle millis Millisekunden zwischen true und false",
        "en": "Changes between true and false every millis milliseconds",
    });
    static timerIntervalMillis2Comment = () => lm({
        "de": "Wechselt alle millis Millisekunden zwischen true und false; skipFirst überspringt das erste Intervall",
        "en": "Changes between true and false every millis milliseconds; skipFirst leaves out the first round",
    });
    static timerIntervalMillis3Comment = () => lm({
        "de": "Gibt millis1 Millisekunden lang true und danach millis2 Millisekunden lang false zurück",
        "en": "Returns true for millis1 milliseconds and then false for millis2 milliseconds",
    });
    static timerIntervalMillis4Comment = () => lm({
        "de": "Gibt millis1 Millisekunden lang true und danach millis2 Millisekunden lang false zurück; skipFirst überspringt das erste Intervall",
        "en": "Returns true for millis1 milliseconds and then false for millis2 milliseconds; skipFirst leaves out the first round",
    });

    // ---- UISprite ----
    static uISpriteClassComment = () => lm({
        "de": "Figur für Benutzeroberflächen (Knöpfe, Balken); wird oben gezeichnet und kollidiert nicht",
        "en": "A sprite for interfaces (buttons, bars); drawn on top and touching nothing",
    });
    static uISpriteConstructorComment = () => lm({
        "de": "Erzeugt eine neue UI-Figur",
        "en": "Creates a new interface sprite",
    });
    static uISpriteSetWidthComment = () => lm({
        "de": "Setzt die Breite in Pixeln",
        "en": "Sets the width in pixels",
    });
    static uISpriteSetHeightComment = () => lm({
        "de": "Setzt die Höhe in Pixeln",
        "en": "Sets the height in pixels",
    });
    static uISpriteChangeWidthComment = () => lm({
        "de": "Ändert die Breite um die angegebene Anzahl Pixel",
        "en": "Changes the width by the given number of pixels",
    });
    static uISpriteChangeHeightComment = () => lm({
        "de": "Ändert die Höhe um die angegebene Anzahl Pixel",
        "en": "Changes the height by the given number of pixels",
    });
    static uISpriteSetNineSliceComment = () => lm({
        "de": "Hält die Ecken und Ränder des Kostüms beim Skalieren fest (Nine-Slice)",
        "en": "Keeps the corners and edges of the costume from stretching (nine-slice)",
    });
    static uISpriteDisableNineSliceComment = () => lm({
        "de": "Lässt das ganze Kostüm wieder mitskalieren",
        "en": "Lets the whole costume stretch again",
    });

    // ---- Vector2 ----
    static vector2ClassComment = () => lm({
        "de": "Unveränderlicher 2D-Vektor; alle Winkel in Grad",
        "en": "An unchanging 2D vector; every angle in degrees",
    });
    static vector2ConstructorComment = () => lm({
        "de": "Erzeugt den Nullvektor",
        "en": "Creates the null vector",
    });
    static vector2Constructor2Comment = () => lm({
        "de": "Erzeugt einen Vektor mit den angegebenen Koordinaten",
        "en": "Creates a vector with the given coordinates",
    });
    static vector2Constructor3Comment = () => lm({
        "de": "Erzeugt eine Kopie des übergebenen Vektors",
        "en": "Creates a copy of the given vector",
    });
    static vector2FromPolarComment = () => lm({
        "de": "Erzeugt einen Vektor aus Länge und Winkel (in Grad)",
        "en": "Creates a vector from a length and an angle (in degrees)",
    });
    static vector2LengthComment = () => lm({
        "de": "Gibt die Länge des Vektors zurück",
        "en": "Returns the length of the vector",
    });
    static vector2LengthSqComment = () => lm({
        "de": "Gibt das Quadrat der Länge zurück (schneller als length())",
        "en": "Returns the squared length (quicker than length())",
    });
    static vector2DistanceSqComment = () => lm({
        "de": "Gibt das Quadrat des Abstands zu v zurück",
        "en": "Returns the squared distance to v",
    });
    static vector2DistanceComment = () => lm({
        "de": "Gibt den Abstand zu v zurück",
        "en": "Returns the distance to v",
    });
    static vector2AngleComment = () => lm({
        "de": "Gibt den Winkel des Vektors in Grad zurück",
        "en": "Returns the angle of the vector in degrees",
    });
    static vector2UnitVectorComment = () => lm({
        "de": "Gibt einen Vektor gleicher Richtung mit der Länge 1 zurück",
        "en": "Returns a vector in the same direction of length 1",
    });
    static vector2NormalVectorComment = () => lm({
        "de": "Gibt einen dazu senkrechten Vektor zurück",
        "en": "Returns a vector at right angles to it",
    });
    static vector2AddComment = () => lm({
        "de": "Gibt die Summe beider Vektoren als neuen Vektor zurück",
        "en": "Returns the sum of the two vectors, as a new vector",
    });
    static vector2SubComment = () => lm({
        "de": "Gibt die Differenz beider Vektoren als neuen Vektor zurück",
        "en": "Returns the difference of the two vectors, as a new vector",
    });
    static vector2MultiplyComment = () => lm({
        "de": "Gibt den mit scalar multiplizierten Vektor als neuen Vektor zurück",
        "en": "Returns the vector multiplied by scalar, as a new vector",
    });
    static vector2DotComment = () => lm({
        "de": "Gibt das Skalarprodukt beider Vektoren zurück",
        "en": "Returns the dot product of the two vectors",
    });
    static vector2RotateByComment = () => lm({
        "de": "Gibt den um angle Grad gedrehten Vektor als neuen Vektor zurück",
        "en": "Returns the vector turned by angle degrees, as a new vector",
    });
    static vector2RotateToComment = () => lm({
        "de": "Gibt einen Vektor gleicher Länge mit dem Winkel angle (in Grad) zurück",
        "en": "Returns a vector of the same length pointing at angle (in degrees)",
    });
    static vector2ReverseComment = () => lm({
        "de": "Gibt den entgegengesetzten Vektor zurück",
        "en": "Returns the vector pointing the other way",
    });
    static vector2GetXComment = () => lm({
        "de": "Gibt die x-Koordinate zurück",
        "en": "Returns the x-coordinate",
    });
    static vector2GetYComment = () => lm({
        "de": "Gibt die y-Koordinate zurück",
        "en": "Returns the y-coordinate",
    });
    static vector2CloneComment = () => lm({
        "de": "Gibt eine Kopie des Vektors zurück",
        "en": "Returns a copy of the vector",
    });
    static vector2EqualsComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn beide Vektoren gleich sind",
        "en": "Returns true exactly when the two vectors are the same",
    });
    static vector2ToStringComment = () => lm({
        "de": "Gibt den Vektor als Zeichenkette zurück",
        "en": "Returns the vector as a text",
    });
    static vector2HashCodeComment = () => lm({
        "de": "Gibt den Hashwert des Vektors zurück",
        "en": "Returns the hash code of the vector",
    });

    // ---- Window ----
    static windowClassComment = () => lm({
        "de": "Das Programmfenster",
        "en": "The program's window",
    });
    static windowConstructorComment = () => lm({
        "de": "Erzeugt ein Fenster in Standardgröße",
        "en": "Creates a window of the usual size",
    });
    static windowConstructor2Comment = () => lm({
        "de": "Erzeugt ein Fenster mit eigenem Asset-Ordner",
        "en": "Creates a window with an assets folder of your own",
    });
    static windowConstructor3Comment = () => lm({
        "de": "Erzeugt ein Fenster mit der angegebenen Größe",
        "en": "Creates a window of the given size",
    });
    static windowConstructor4Comment = () => lm({
        "de": "Erzeugt ein Fenster mit Größe und eigenem Asset-Ordner",
        "en": "Creates a window of the given size with an assets folder of your own",
    });
    static windowGetInstanceComment = () => lm({
        "de": "Gibt das Fenster des laufenden Programms zurück",
        "en": "Returns the window of the running program",
    });
    static windowGetWidthComment = () => lm({
        "de": "Gibt die Breite des Fensters in Pixeln zurück",
        "en": "Returns the width of the window in pixels",
    });
    static windowGetHeightComment = () => lm({
        "de": "Gibt die Höhe des Fensters in Pixeln zurück",
        "en": "Returns the height of the window in pixels",
    });
    static windowGetDeltaTimeComment = () => lm({
        "de": "Gibt die Dauer des letzten Frames in Sekunden zurück",
        "en": "Returns how long the last frame took, in seconds",
    });
    static windowGetStageComment = () => lm({
        "de": "Gibt die Bühne zurück, die gerade angezeigt wird",
        "en": "Returns the stage being shown",
    });
    static windowSetStageComment = () => lm({
        "de": "Zeigt die angegebene Bühne an",
        "en": "Shows the given stage",
    });
    static windowTransitionToStageComment = () => lm({
        "de": "Blendet über Schwarz zur angegebenen Bühne über",
        "en": "Fades through black to the given stage",
    });
    static windowSetDebugComment = () => lm({
        "de": "Schaltet die Ausgabe von debug() ein oder aus",
        "en": "Turns what debug() prints on or off",
    });
    static windowIsDebugComment = () => lm({
        "de": "Gibt genau dann true zurück, wenn die Fehlersuche eingeschaltet ist",
        "en": "Returns true exactly when debug mode is on",
    });
    static windowDebugComment = () => lm({
        "de": "Gibt Werte zur Fehlersuche aus, wenn setDebug(true) gesetzt ist",
        "en": "Prints values to help with finding a mistake, when setDebug(true) is on",
    });
    static windowExitComment = () => lm({
        "de": "Beendet das Programm",
        "en": "Ends the program",
    });
    static windowWhenExitsComment = () => lm({
        "de": "Wird beim Beenden des Programms aufgerufen",
        "en": "Called as the program ends",
    });
    static windowGetLibraryVersionComment = () => lm({
        "de": "Gibt die Version der Bibliothek zurück",
        "en": "Returns the version of the library",
    });
    static windowGetLibraryTitleComment = () => lm({
        "de": "Gibt den Namen der Bibliothek zurück",
        "en": "Returns the name of the library",
    });
    static windowUseFullScreenComment = () => lm({
        "de": "Nur in der Desktop-Version: startet im Vollbild",
        "en": "Only in the desktop version: starts in fullscreen",
    });
    static windowUseTextureSamplingComment = () => lm({
        "de": "Nur in der Desktop-Version: legt die Bildglättung fest",
        "en": "Only in the desktop version: chooses how pictures are smoothed",
    });
    static windowGetTextureSamplingComment = () => lm({
        "de": "Gibt das eingestellte Glättungsverfahren zurück",
        "en": "Returns how pictures are being smoothed",
    });
    static windowUseSplashLogoComment = () => lm({
        "de": "Nur in der Desktop-Version: zeigt beim Start ein Logo",
        "en": "Only in the desktop version: shows a logo while starting up",
    });
    static windowGetSplashLogoComment = () => lm({
        "de": "Gibt den Pfad des Startlogos zurück",
        "en": "Returns the path of the picture shown while starting up",
    });

    // ---- TextAlign ----
    static textAlignClassComment = () => lm({
        "de": "Ausrichtung eines Texts zu seiner Position",
        "en": "Where a text sits relative to its position",
    });

    // ---- TextStyle ----
    static textStyleClassComment = () => lm({
        "de": "Legt fest, wie ein Text umrahmt wird",
        "en": "Chooses how a text is framed",
    });

    // ---- TextureSampling ----
    static textureSamplingClassComment = () => lm({
        "de": "Legt fest, wie Bilder beim Skalieren geglättet werden",
        "en": "Chooses how pictures are smoothed when they are scaled",
    });
    static textureSamplingGetModeComment = () => lm({
        "de": "Gibt die Nummer des Verfahrens zurück",
        "en": "Returns the number of the method",
    });
}
