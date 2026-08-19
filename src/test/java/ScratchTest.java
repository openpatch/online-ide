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

// toGlobal and toLocal are inverses of each other
cam.setPosition(30, 60);
cam.setZoom(200);
assertEquals(140.0, cam.toGlobalX(100), "Camera.toGlobalX");
assertEquals(100.0, cam.toLocalX(cam.toGlobalX(100)), "toLocalX undoes toGlobalX");
assertEquals(-40.0, cam.toLocalY(-200), "Camera.toLocalY");

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

double[] xs = {0, 10, 10, 0};
double[] ys = {0, 0, 10, 10};
Hitbox box = new Hitbox(xs, ys);
assertEquals(true, box.contains(5, 5), "Hitbox.contains inside");
assertEquals(false, box.contains(15, 5), "Hitbox.contains outside");
assertEquals(10.0, box.getBounds().width(), "Hitbox.getBounds");

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
File f = new File("save.txt");
assertEquals("", f.read(), "File.read returns empty in the browser");
assertEquals(false, f.exists(), "File.exists is false in the browser");

GifRecorder rec = new GifRecorder("out.gif");
rec.start();
rec.stop();
assertEquals(false, rec.isRecording(), "GifRecorder never records here");

Shader shader = new Shader("blur", "blur.frag", "blur.vert");
assertEquals("blur", shader.getName(), "Shader keeps its name");
shader.set("radius", 4);

print("weiter");

/**::
 * Scratch Stage/Sprite subclasses compile against the ported API
 * {"libraries": ["scratch"], "expectedOutput": "compiled"}
 */
// The graphics classes need a browser, so this only checks that every signature
// in the port resolves — i.e. that the library declarations parse into the type store.
class MyStage extends Stage {
    public MyStage() {
        super(480, 360);
        this.addBackdrop("tappy_plane/background");
        this.addSound("footstep_grass_000");
        this.setColor(200);
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
        this.setTint(120);
        this.changeTint(10);
        this.setTransparency(30);
        this.changeTransparency(-10);
        this.setDebug(true);
        if (this.isDebug()) this.debug("x", 1, true);
        this.setCursor("carrot");
        // NOTE: `this.getWidth()` does not resolve inside a lambda in this
        // compiler, so the implicit-this form is the one to use.
        this.waitUntil(() -> getWidth() > 0);
        this.remove(new Pen());
        // desktop-only, but has to compile
        Pixels px = this.getPixels();
        Shaders sh = this.getShaders();
        Sorting so = this.getSorting();
    }

    public void windowApi() {
        Window w = Window.getInstance();
        // several stages: only the one the window shows runs and reacts to input
        w.setStage(this);
        Stage showing = w.getStage();
        w.transitionToStage(this, 500);
        int width = w.getWidth();
        double dt = w.getDeltaTime();
        Window.useFullScreen();
        Window.useTextureSampling(TextureSampling.POINT);
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
    public void whenMouseWheelMoved(int steps) { }
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
        this.move(new Vector2(3, 4));
        this.setDirection(new Vector2(0, 1));
        this.goToSprite(this);
        this.addCostumes("tile", "bunny1_stand", 8, 8);
        this.addCostume("head", "bunny1_stand", 0, 0, 16, 16);
        Sprite twin = this.clone();
        Stage s = this.getStage();
        this.broadcast("los");
        if (!this.isAsking()) this.ask("Wie alt bist du?");
        String answer = this.getAnswer();
        int n = this.pickRandom(1, 6);
        double dt = this.getDeltaTime();
        this.getText().showText("hallo");
        this.debug("pos", this.getX());
        Hitbox box = this.getHitbox();
        Shape outline = box.getShape();
        // both setHitbox forms: raw x/y pairs, and a Shape
        this.setHitbox(-8, -8, 8, -8, 8, 8, -8, 8);
        this.setHitbox(new Circle(0, 0, 12));
        this.setHitbox(new Ellipse(-10, -6, 20, 12));
        this.disableHitbox();
        this.enableHitbox();
    }

    public void whenClicked() { this.say("hi", 500); }
    public void whenRemovedFromStage() { }
    public void whenIReceive(String message) { this.think("hm"); }
    public void whenMouseMoved(double x, double y) { }
    public void whenMouseWheelMoved(int steps) { this.changeY(steps); }
}

// The Pen, Text and AnimatedSprite methods added for parity with the desktop.
class ApiCheck extends Sprite {
    public void penApi() {
        Pen p = this.getPen();
        p.setColor(new Color(0, 0, 255));
        Color c = p.getColor();
        // opacity runs 0..255 here, exactly as upstream, where 255 is opaque
        p.setTransparency(128);
        p.changeTransparency(40);
        p.goToForeground();
        p.goToBackground();
        if (p.isInBackground()) p.goToMousePointer();
        p.goToRandomPosition();
        p.stamp();
        String s = p.toString();
        p.addedToStage(this.getStage());
        p.removedFromStage(this.getStage());
    }

    public void textApi() {
        Text t = new Text();
        Text.useFont("assets/Retro.ttf", 11);
        Text.useFont("assets/Retro.ttf");
        Text.useFontSizes(14, 20);
        Text.useSmoothing(false);
        int[] sizes = Text.getDefaultFontSizes();
        boolean smooth = t.isSmoothing();
        t.setIsUI(true);
        if (t.isUI()) t.setPosition(0, 0);
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
    public void whenAddedToStage(Stage stage) { }
    public void whenRemovedFromStage() { }
    public void whenRemovedFromStage(Stage stage) { }
}

class MyAnimatedSprite extends AnimatedSprite {
    public void whenAddedToStage() {
        // "%d" is replaced by 1..frames, as String.format does upstream
        this.addAnimation("walk", "bunny1_walk%d", 2);
        // builder form: gets 1..frames and returns each frame's image.
        // The lambda needs an explicitly typed variable — this compiler will not
        // pick the Function overload from an inline lambda.
        Function<Integer, String> builder = i -> "bunny1_walk" + i;
        this.addAnimation("run", builder, 2);
        // one column of a sheet instead of a row
        this.addAnimation("fall", "bunny1_stand", 2, 16, 16, 0, true);
        this.setAnimationInterval(200);
        AnimatedSprite twin = this.clone();
        String s = this.toString();
    }

    public void run() {
        this.playAnimation("walk");
        if (this.isAnimationPlayed()) this.resetAnimation();
    }
}

class MyButton extends UISprite {
    public void whenAddedToStage() {
        this.addCostume("bunny1_stand");
        this.setNineSlice(8, 8, 8, 8);
        this.setWidth(200);
        this.setHeight(60);
        this.changeWidth(10);
        this.changeHeight(-5);
        this.disableNineSlice();
    }
}

// Several stages in one program. The first one a program builds is the one on
// screen; the others wait until the window is told to show them.
class Level2 extends Stage {
    public Level2() {
        super(480, 360);
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
import org.openpatch.scratch.extensions.camera.Camera;
import org.openpatch.scratch.extensions.fs.File;
import org.openpatch.scratch.extensions.recorder.GifRecorder;
import java.util.function.BooleanSupplier;

Camera cam = new Camera();
cam.setPosition(40, -20);
assertEquals(40.0, cam.getX(), "Camera comes from extensions.camera");

File f = new File("save.txt");
assertEquals(false, f.exists(), "File comes from extensions.fs");

GifRecorder rec = new GifRecorder("out.gif");
assertEquals(false, rec.isRecording(), "GifRecorder comes from extensions.recorder");

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
 * An import that names nothing is an error
 * {"libraries": ["scratch"], "expectedCompilationError": { "id": "importedTypesNotFound", "line": 5 }}
 */
import org.openpatch.scratch.gibtesnicht.*;

print("egal");
