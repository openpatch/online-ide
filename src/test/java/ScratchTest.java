/**::
 * Scratch Operators
 * {"libraries": ["scratch"]}
 */
// trigonometry is in DEGREES and named after the Scratch blocks ("sin of ...")
assertEquals(1.0, Operators.sinOf(90), "Operators.sinOf should take degrees");
assertEquals(1.0, Operators.cosOf(0), "Operators.cosOf should take degrees");

assertEquals(5.0, Operators.constrain(9, 1, 5), "Operators.constrain upper bound");
assertEquals(1.0, Operators.constrain(-3, 1, 5), "Operators.constrain lower bound");
assertEquals(3.0, Operators.constrain(3, 1, 5), "Operators.constrain inside range");

assertEquals(5.0, Operators.lerp(0, 10, 0.5), "Operators.lerp");
assertEquals(50.0, Operators.map(5, 0, 10, 0, 100), "Operators.map");

// Scratch mod is the Java-style remainder for positive operands
assertEquals(1.0, Operators.mod(7, 3), "Operators.mod");

/**::
 * Scratch Vector2 is immutable and works in degrees
 * {"libraries": ["scratch"]}
 */
Vector2 v = new Vector2(3, 4);
assertEquals(5.0, v.length(), "Vector2.length");
assertEquals(25.0, v.lengthSq(), "Vector2.lengthSq");

Vector2 sum = v.add(new Vector2(1, 1));
assertEquals(4.0, sum.getX(), "Vector2.add x");
assertEquals(5.0, sum.getY(), "Vector2.add y");
// add() returns a NEW vector; the receiver is unchanged
assertEquals(3.0, v.getX(), "Vector2 must be immutable");

Vector2 right = new Vector2(1, 0);
assertEquals(0.0, right.angle(), "Vector2.angle in degrees");
assertEquals(90.0, right.rotateBy(90).angle(), "Vector2.rotateBy in degrees");

// toString has to read exactly like the desktop library's
assertEquals("Vector2[3.0, 4.0]", v.toString(), "Vector2.toString");
assertEquals(true, v.hashCode() == new Vector2(3, 4).hashCode(), "equal vectors hash equal");

/**::
 * Scratch Color uses the java.awt HSB model with channels 0..255
 * {"libraries": ["scratch"]}
 */
Color c = new Color(255, 0, 0);
assertEquals(255.0, c.getRed(), "Color.getRed");
assertEquals(0.0, c.getGreen(), "Color.getGreen");
assertEquals(0.0, c.getBlue(), "Color.getBlue");

Color hex = new Color("#00ff00");
assertEquals(0.0, hex.getRed(), "Color(hex).getRed");
assertEquals(255.0, hex.getGreen(), "Color(hex).getGreen");

/**::
 * Scratch Random matches java.util.Random and OpenSimplex noise
 * {"libraries": ["scratch"]}
 */
// Seeded sequences have to come out the same here as in the desktop library,
// so a program copy-pasted between the two produces identical results.
Random.randomSeed(42);
assertEquals(3, Random.randomInt(1, 6), "Random.randomInt(min, max) #1");
assertEquals(4, Random.randomInt(1, 6), "Random.randomInt(min, max) #2");
assertEquals(1, Random.randomInt(1, 6), "Random.randomInt(min, max) #3");

// randomInt(max) includes max, so it draws from 0..10
Random.randomSeed(42);
assertEquals(7, Random.randomInt(10), "Random.randomInt(max)");

Random.randomSeed(42);
assertEquals(727564, Operators.round(Random.random() * 1000000), "Random.random()");

// Noise is deterministic; the noise seed starts at 1.
assertEquals(-347, Operators.round(Random.noise(0.5) * 1000), "Random.noise(x)");
assertEquals(-613, Operators.round(Random.noise(0.5, 0.25) * 1000), "Random.noise(x, y)");
assertEquals(249, Operators.round(Random.noise(0.5, 0.25, 0.75) * 1000), "Random.noise(x, y, z)");

Random.noiseSeed(99);
assertEquals(-588, Operators.round(Random.noise(0.5, 0.25) * 1000), "Random.noiseSeed");

// Without a stage the coordinate helpers fall back to the default 480 x 360.
double x = Random.randomX();
assertEquals(true, x >= -240 && x <= 240, "Random.randomX stays on the stage");
double y = Random.randomY();
assertEquals(true, y >= -180 && y <= 180, "Random.randomY stays on the stage");
assertEquals(1.0, Operators.round(Random.randomVector2().length(), 6), "Random.randomVector2 has length 1");

/**::
 * Scratch Camera pans and zooms, and converts between local and global
 * {"libraries": ["scratch"]}
 */
Camera cam = new Camera();
assertEquals(0.0, cam.getX(), "Camera starts centred");
assertEquals(100.0, cam.getZoom(), "Camera starts at zoom 100");

cam.setPosition(40, -20);
assertEquals(40.0, cam.getX(), "Camera.setPosition x");
assertEquals(-20.0, cam.getY(), "Camera.setPosition y");
cam.changeX(10);
assertEquals(50.0, cam.getX(), "Camera.changeX");
cam.changeY(5);
assertEquals(-15.0, cam.getY(), "Camera.changeY");

// zoom is clamped to the limits, which default to 50..200
cam.setZoom(500);
assertEquals(200.0, cam.getZoom(), "Camera.setZoom clamps to the upper limit");
cam.setZoomLimit(10, 400);
cam.setZoom(400);
assertEquals(400.0, cam.getZoom(), "Camera.setZoomLimit raises the ceiling");
cam.resetZoom();
assertEquals(100.0, cam.getZoom(), "Camera.resetZoom");

// toScreen and toWorld are inverses of each other (7.0 names)
cam.setPosition(30, 60);
cam.setZoom(200);
assertEquals(140.0, cam.toScreenX(100), "Camera.toScreenX");
assertEquals(100.0, cam.toWorldX(cam.toScreenX(100)), "toWorldX undoes toScreenX");
assertEquals(-40.0, cam.toWorldY(-200), "Camera.toWorldY");

/**::
 * Scratch Bounds and Hitbox
 * {"libraries": ["scratch"]}
 */
Bounds a = new Bounds(0, 0, 10, 10);
Bounds b = new Bounds(5, 5, 10, 10);
Bounds c = new Bounds(20, 20, 5, 5);
assertEquals(true, a.intersects(b), "Bounds.intersects overlapping");
assertEquals(false, a.intersects(c), "Bounds.intersects apart");
assertEquals(10.0, a.width(), "Bounds.width");

// 7.0: the Hitbox class is gone; custom outlines are Shapes
double[] xs = {0, 10, 10, 0};
double[] ys = {0, 0, 10, 10};
Polygon box = new Polygon(xs, ys);
assertEquals(true, box.contains(5, 5), "Polygon.contains inside");
assertEquals(false, box.contains(15, 5), "Polygon.contains outside");
assertEquals(10.0, box.getBounds().width(), "Polygon.getBounds");

/**::
 * Scratch Clock, HtmlColor and ScratchException
 * {"libraries": ["scratch"]}
 */
// Clock reads the real clock, so only the ranges can be asserted
assertEquals(true, Clock.getYear() >= 2024, "Clock.getYear");
assertEquals(true, Clock.getMonth() >= 1 && Clock.getMonth() <= 12, "Clock.getMonth is 1..12");
assertEquals(true, Clock.getDay() >= 1 && Clock.getDay() <= 31, "Clock.getDay");
assertEquals(true, Clock.getDayOfWeek() >= 1 && Clock.getDayOfWeek() <= 7, "Clock.getDayOfWeek is 1..7");
assertEquals(true, Clock.getHour() >= 0 && Clock.getHour() <= 23, "Clock.getHour");
assertEquals(true, Clock.getMinute() >= 0 && Clock.getMinute() <= 59, "Clock.getMinute");
assertEquals(true, Clock.getSecond() >= 0 && Clock.getSecond() <= 59, "Clock.getSecond");
assertEquals(true, Clock.getMillisecond() >= 0 && Clock.getMillisecond() <= 999, "Clock.getMillisecond");
assertEquals(true, Clock.getDaysSince2000() > 9000, "Clock.getDaysSince2000");

// the named HTML colours are ready-made Color objects
assertEquals(0.0, HtmlColor.BLUE.getRed(), "HtmlColor.BLUE red channel");
assertEquals(255.0, HtmlColor.BLUE.getBlue(), "HtmlColor.BLUE blue channel");
assertEquals(255.0, HtmlColor.WHITE.getGreen(), "HtmlColor.WHITE");
assertEquals(0.0, HtmlColor.BLACK.getBlue(), "HtmlColor.BLACK");
Color zufall = HtmlColor.getRandom();
assertEquals(true, zufall.getRed() >= 0, "HtmlColor.getRandom returns a colour");

// ScratchException is the library's own unchecked exception
// thrown from inside a method: a bare top-level throw is not supported here
boolean caught = false;
try {
    kaputt();
} catch (ScratchException e) {
    caught = true;
}
assertEquals(true, caught, "ScratchException can be thrown and caught");

void kaputt() {
    throw new ScratchException("kaputt");
}

/**::
 * Scratch Shape geometry backs the custom hitboxes
 * {"libraries": ["scratch"]}
 */
// Rectangle(x, y, w, h): x/y is the top-left corner, as in the desktop library
Rectangle r = new Rectangle(0, 0, 10, 10);
assertEquals(true, r.contains(5, 5), "Rectangle.contains inside");
assertEquals(false, r.contains(11, 5), "Rectangle.contains outside");
assertEquals(10.0, r.getBounds().width(), "Rectangle.getBounds");

// Circle(x, y, radius): x/y is the CENTRE
Circle c = new Circle(0, 0, 10);
assertEquals(true, c.contains(0, 0), "Circle.contains centre");
assertEquals(false, c.contains(9, 9), "Circle.contains outside the arc");
assertEquals(20.0, Operators.round(c.getBounds().width()), "Circle.getBounds spans the diameter");

Triangle t = new Triangle(0, 0, 10, 0, 0, 10);
assertEquals(true, t.contains(2, 2), "Triangle.contains inside");
assertEquals(false, t.contains(8, 8), "Triangle.contains beyond the hypotenuse");

Polygon poly = new Polygon();
poly.addPoint(0, 0);
poly.addPoint(10, 0);
poly.addPoint(10, 10);
assertEquals(true, poly.contains(8, 5), "Polygon.addPoint builds an outline");

// shapes overlap, and the transforms return new shapes
assertEquals(true, r.intersects(new Rectangle(5, 5, 10, 10)), "Shape.intersects overlapping");
assertEquals(false, r.intersects(new Rectangle(50, 50, 10, 10)), "Shape.intersects apart");
Shape moved = r.translate(100, 0);
assertEquals(100.0, moved.getBounds().x(), "Shape.translate");
assertEquals(0.0, r.getBounds().x(), "Shape.translate leaves the original alone");
Shape big = r.scale(2, 2);
assertEquals(20.0, big.getBounds().width(), "Shape.scale");
// rotate takes DEGREES, like upstream
Shape turned = new Rectangle(0, 0, 10, 2).rotate(90, 0, 0);
assertEquals(2.0, Operators.round(turned.getBounds().width()), "Shape.rotate works in degrees");

/**::
 * Desktop-only classes still compile and run, they just do nothing
 * {"libraries": ["scratch"], "expectedOutput": "weiter"}
 */
// The point of these stubs: code copied from the desktop library keeps running.
// File's methods are static, like the desktop's.
File.save("save.txt", 42);
Object loaded = File.load("save.txt", Integer.class);

GifRecorder rec = new GifRecorder("out.gif");
rec.start();
rec.snapshot();
rec.stop();

print("weiter");

/**::
 * Scratch Stage/Sprite subclasses compile against the ported API
 * {"libraries": ["scratch"], "expectedOutput": "compiled"}
 */
// The graphics classes need a browser, so this only checks that every signature
// in the port resolves — i.e. that the library declarations parse into the type store.
class MyStage extends Stage {
    public MyStage() {
        this.addBackdrop("tappy_plane/background");
        this.addSound("footstep_grass_000");
        this.setColor(200, 40, 60);
        this.broadcast("go");
    }

    public void run() {
        if (this.isKeyPressed(KeyCode.SPACE)) this.broadcast("jump");
        // ask() is non-blocking; the reply arrives via getAnswer()
        if (!this.isAsking() && this.getAnswer().isEmpty()) this.ask("Wie heißt du?");
        if (!this.getAnswer().isEmpty()) this.display("Hallo " + this.getAnswer());
    }

    public void scatter() {
        Vector2 p = Random.randomPosition();
        Vector2 dir = Random.randomVector2();
    }

    public void newStageApi() {
        this.getCamera().changeZoom(5);
        this.setColorEffect(25);
        this.changeColorEffect(10);
        double fx = this.getColorEffect();
        this.setColor(new Color(30, 60, 90));
        this.setTint(new Color(120, 120, 120));
        this.setTransparency(30);
        this.changeTransparency(-10);
        this.getTransparency();
        this.setCursor("carrot");
        // NOTE: `this.getWidth()` does not resolve inside a lambda in this
        // compiler, so the implicit-this form is the one to use.
        this.waitUntil(() -> getWidth() > 0);
        this.remove(new Pen());
        this.sortByY();
        this.stopSorting();
        this.waitSeconds(0.1);
        // desktop-only, but has to compile
        Pixels px = Pixels.of(this);
        Pixels fromImage = Pixels.of("terrain.png");
        Shaders sh = this.getShaders();
    }

    // Shaders load assets asynchronously and need WebGL when executed.
    // Their source translation is covered by ScratchShaderTranslationTest;
    // this method checks the Java constructor and uniform signatures.
    public void shaderApi() {
        Shaders shaders = this.getShaders();
        Shader shader = shaders.add("blur", "blur.frag");
        shader.set("radius", 4);
        shader.set("tint", new Color(255, 0, 0));
        shader.set("offset", new Vector2(1, 2));
    }

    public void windowApi() {
        Window w = Window.getInstance();
        // several stages: only the one the window shows runs and reacts to input
        w.setStage(this);
        Stage showing = w.getStage();
        w.transitionToStage(this, 0.5);
        w.transitionToStage(() -> new MyStage(), Transition.FADE, 0.5);
        boolean busy = w.isTransitioning();
        Window w2 = Window.getInstance();
        int width = w2.getWidth();
        Window.usePixelArt();
        Window.useSmoothPixelArt();
        Window.useFrameSmoothing(0.1);
    }

    public void countSprites() {
        List<Sprite> everything = this.getAll();
        List<MySprite> mine = this.find(MySprite.class);
        int n = this.count(MySprite.class);
        this.remove(MySprite.class);
    }

    public void whenIReceive(String message) { }
    public void whenKeyPressed(KeyCode key) { }
    public void whenBackdropSwitches(String name) { }
    public void whenMouseClicked(MouseCode button) { }
    public void whenMouseWheelMoved(double steps) { }
}

class MySprite extends Sprite {
    public void whenAddedToStage() {
        this.addCostume("bunny1_stand");
        this.setSize(50);
        this.setRotationStyle(RotationStyle.LEFT_RIGHT);
        this.getPen().down();
    }

    public void run() {
        this.move(4);
        this.turnRight(2);
        this.ifOnEdgeBounce();
        if (this.isTouchingEdge()) this.glide(1, 0, 0);
        // class-literal sensing (Class<? extends Sprite> overloads)
        if (this.isTouchingSprite(MySprite.class)) this.stamp();
        Sprite other = this.getTouchingSprite(MySprite.class);
        List<MySprite> all = this.getTouchingSprites(MySprite.class);
    }

    public void newSpriteApi() {
        this.changeSize(10);
        this.changeTransparency(5);
        double t = this.getTransparency();
        this.setVolume(80);
        this.changeVolume(-10);
        double v = this.getVolume();
        this.move(4);
        this.setDirection(90);
        this.pointTowards(this);
        this.pointTowards(new Vector2(0, 1));
        this.pointTowardsMousePointer();
        this.addCostumes("tile", "bunny1_stand", 8, 8);
        this.addCostume("head", "bunny1_stand", 0, 0, 16, 16);
        MySprite twin = this.createClone();
        Stage s = this.getStage();
        this.broadcast("los");
        if (!this.isAsking()) this.ask("Wie alt bist du?");
        String answer = this.getAnswer();
        int n = this.pickRandom(1, 6);
        this.getText().showText("hallo");
        this.debug("pos", this.getX());
        Shape outline = this.getHitbox();
        // setHitbox takes a Shape; the layers, effects and animations are on the sprite
        this.setHitbox(new Circle(0, 0, 12));
        this.setHitbox(new Ellipse(-10, -6, 20, 12));
        this.disableHitbox();
        this.enableHitbox();
        this.setLayer(Layer.BACKGROUND);
        this.setLayer(Layer.FOREGROUND);
        this.setLayer(Layer.UI);
        Layer l = this.getLayer();
        this.setColorEffect(50);
        this.changeColorEffect(20);
        double fx = this.getColorEffect();
        this.setTint(new Color(200, 200, 0));
        this.setTint(200, 200, 0);
        Color tint = this.getTint();
        this.setWidth(44.8);
        this.setHeight(30);
        this.changeWidth(2.5);
        this.changeHeight(-1.5);
        double w = this.getWidth();
        double h = this.getHeight();
        this.setNineSlice(4, 4, 4, 4);
        this.disableNineSlice();
        this.setRotationStyle(RotationStyle.LEFT_RIGHT);
        RotationStyle rs = this.getRotationStyle();
        this.addAnimation("walk", "bunny1_walk%d.png", 4);
        this.addAnimation("hit", "hit%d.png", 0, 4);
        this.addAnimation("dance", "bunny1_sheet.png", 8, 8, 0, 1, 2);
        this.playAnimation("walk");
        this.playAnimation("dance", true);
        this.resetAnimation();
        this.setAnimationFrame(2);
        this.setAnimationInterval(0.1);
        double iv = this.getAnimationInterval();
        int frame = this.getAnimationFrame();
        boolean played = this.isAnimationPlayed();
    }

    public void whenClicked() { this.say("hi", 0.5); }
    public void whenRemovedFromStage() { }
    public void whenIReceive(String message) { this.think("hm"); }
    public void whenMouseMoved(double x, double y) { }
    public void whenMouseWheelMoved(double steps) { this.changeY(steps); }
}

// The Pen, Text and AnimatedSprite methods added for parity with the desktop.
class ApiCheck extends Sprite {
    public void penApi() {
        Pen p = this.getPen();
        p.setColor(new Color(0, 0, 255));
        p.setColor(30);
        p.setColor(255, 0, 0);
        Color c = p.getColor();
        // transparency runs 0..100, as in Scratch
        p.setTransparency(40);
        p.changeTransparency(10);
        double tr = p.getTransparency();
        p.setLayer(Layer.FOREGROUND);
        Layer l = p.getLayer();
        boolean down = p.isDown();
        p.goToMousePointer();
        p.goToRandomPosition();
        Vector2 pos = p.getPosition();
        p.stamp();
        p.eraseAll();
    }

    public void textApi() {
        Text t = new Text();
        t.useFont("assets/Retro.ttf", 11);
        t.useFont("assets/Retro.ttf");
        String font = t.getDefaultFont();
        double size = t.getDefaultFontSize();
        t.setTextSize(12.5);
        double ts = t.getTextSize();
        t.setTextColor(new Color(0, 0, 0));
        t.setTextColor(20, 20, 20);
        t.setBackgroundColor(new Color(255, 255, 255));
        t.setStrokeColor(218, 218, 218);
        t.setLayer(Layer.UI);
        Layer l = t.getLayer();
        t.show();
        t.hide();
        boolean vis = t.isVisible();
        Stage st = t.getStage();
        // which of several overlapping texts is on top, as on Sprite
        t.goToFrontLayer();
        t.goToBackLayer();
        t.goLayersForwards(2);
        t.goLayersBackwards(2);
    }
}

// Text subclasses can override the stage hooks, like upstream.
class MyText extends Text {
    public void whenAddedToStage() { }
    public void whenRemovedFromStage() { }
}

// 7.0: animations and the UI are on Sprite itself
class MyAnimatedSprite extends Sprite {
    public void whenAddedToStage() {
        // "%d" is replaced by 1..frames, as String.format does upstream
        this.addAnimation("walk", "bunny1_walk%d", 2);
        // first..last numbers instead of a count
        this.addAnimation("hit", "bunny1_hit%d.png", 0, 3);
        // a sheet: frame size, then the frame numbers, row by row from 0
        this.addAnimation("dance", "bunny1_sheet.png", 16, 16, 0, 1, 2);
        this.setAnimationInterval(0.2);
        MyAnimatedSprite twin = this.createClone();
    }

    public void run() {
        this.playAnimation("walk");
        if (this.isAnimationPlayed()) this.resetAnimation();
    }
}

class MyButton extends Sprite {
    public void whenAddedToStage() {
        this.addCostume("bunny1_stand");
        this.setLayer(Layer.UI);
        this.setNineSlice(8, 8, 8, 8);
        this.setWidth(200);
        this.setHeight(60);
        this.changeWidth(10);
        this.changeHeight(-5);
        this.disableNineSlice();
    }
}

// Several stages in one program: each waits off screen until the window is told
// to show it.
class Level2 extends Stage {
    public Level2() {
        this.addBackdrop("tappy_plane/background");
        this.add(new Portal());
    }
}

class Portal extends Sprite {
    public void whenAddedToStage() {
        this.addCostume("bunny1_stand");
    }

    public void whenClicked() {
        Stage here = this.getStage();
        Window.getInstance().transitionToStage(new Level2(), 250);
    }
}

print("compiled");

/**::
 * Stage.sortBy takes a Comparator, like the desktop's
 * {"libraries": ["scratch"], "expectedOutput": "sortiert"}
 */
// Compile coverage only: a Stage needs a Window before it and the graphics
// classes need a browser, so the calls sit in a method nobody calls.
class SortingStage extends Stage {
    public void sortApi() {
        // Stage.sortBy takes a java.util.Comparator, like the desktop's
        Stage sortStage = new Stage();
        sortStage.sortBy((a, b) -> (int) Math.signum(b.getY() - a.getY()));
        sortStage.sortByY();
        sortStage.stopSorting();
    }
}

print("sortiert");

/**::
 * Desktop imports resolve: import org.openpatch.scratch.*
 * {"libraries": ["scratch"], "expectedOutput": "importiert"}
 */
// A file copied from a desktop project keeps its imports. They have to resolve
// here, and the classes have to be the Scratch ones, not the always-on graphics
// classes that share these names.
import org.openpatch.scratch.*;

Vector2 v = new Vector2(3, 4);
assertEquals(5.0, v.length(), "Vector2 comes from org.openpatch.scratch");
assertEquals(1.0, Operators.sinOf(90), "static call on an imported class");

Color c = new Color(255, 0, 0);
assertEquals(255.0, c.getRed(), "Color comes from org.openpatch.scratch, not the graphics module");

// the shapes shadow the graphics classes of the same name: Circle(x, y, radius)
// is Scratch's signature, the graphics Circle takes no such constructor
Circle circle = new Circle(0, 0, 10);
assertEquals(true, circle.contains(0, 0), "Circle comes from org.openpatch.scratch");

print("importiert");

/**::
 * Desktop imports resolve: single types out of the extension packages
 * {"libraries": ["scratch"], "expectedOutput": "erweitert"}
 */
import org.openpatch.scratch.Camera;
import org.openpatch.scratch.save.File;
import org.openpatch.scratch.recorder.GifRecorder;
import java.util.function.BooleanSupplier;

Camera cam = new Camera();
cam.setPosition(40, -20);
assertEquals(40.0, cam.getX(), "Camera comes from the core package");

File f = new File();
f.save("save.txt", 42);

GifRecorder rec = new GifRecorder("out.gif");
rec.start();
rec.snapshot();

BooleanSupplier immerWahr = () -> true;
assertEquals(true, immerWahr.getAsBoolean(), "BooleanSupplier comes from java.util.function");

print("erweitert");

/**::
 * A fully qualified name works without any import
 * {"libraries": ["scratch"], "expectedOutput": "qualifiziert"}
 */
org.openpatch.scratch.Vector2 v = new org.openpatch.scratch.Vector2(3, 4);
assertEquals(5.0, v.length(), "fully qualified type and constructor");
// NOTE: this works wherever a TYPE is expected. A qualified name inside an
// expression (org.openpatch.scratch.HtmlColor.BLUE) is not supported by the
// compiler - it reports "package name can't be used as type". Import instead.

print("qualifiziert");

/**::
 * The gamepad extension compiles, and without a controller everything rests
 * {"libraries": ["scratch"], "expectedOutput": "gamepad"}
 */
// The hooks only exist on classes that implement GamepadListener, like upstream.
class PadSprite extends Sprite implements GamepadListener {
  int presses = 0;

  public void run() {
    this.changePosition(Gamepad.getStick(GamepadStick.LEFT).multiply(5));
  }

  public void whenGamepadButtonPressed(GamepadButton button) {
    if (button == GamepadButton.A) {
      this.presses++;
    }
  }

  public void whenGamepadButtonReleased(GamepadButton button) {
  }

  public void whenGamepadConnected(int player) {
  }
}

// Without a controller every query rests, so a game can ask without checking.
assertEquals(false, Gamepad.isConnected(), "no controller is connected");
assertEquals(false, Gamepad.isConnected(1), "no player has a controller");
assertEquals(false, Gamepad.isButtonPressed(GamepadButton.A), "no button is down");
assertEquals(false, Gamepad.isButtonPressed(2, GamepadButton.START), "no player's button is down");
assertEquals(0.0, Gamepad.getStick(GamepadStick.RIGHT).getX(), "a resting stick is 0");
assertEquals(0.0, Gamepad.getStick(1, GamepadStick.LEFT).getY(), "a resting stick is 0");
assertEquals(0.0, Gamepad.getTrigger(GamepadTrigger.LEFT), "a trigger is 0");
assertEquals(0.0, Gamepad.getTrigger(3, GamepadTrigger.RIGHT), "a player's trigger is 0");

print("gamepad");

/**::
 * An import that names nothing is an error
 * {"libraries": ["scratch"], "expectedCompilationError": { "id": "importedTypesNotFound", "line": 5 }}
 */
import org.openpatch.scratch.gibtesnicht.*;

print("egal");
