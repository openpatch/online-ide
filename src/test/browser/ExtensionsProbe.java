import org.openpatch.scratch.*;
import org.openpatch.scratch.extensions.drawing.*;
import org.openpatch.scratch.extensions.text.BitmapText;
import org.openpatch.scratch.extensions.tiled.TiledMap;
import org.openpatch.scratch.extensions.sound.SoundPlayback;
import org.openpatch.scratch.extensions.tiled.MapObject;
import java.util.List;

class SpawnMap extends Sprite {
    static int chosen=0;
    int power;
    boolean ready=false;
    boolean added=false;
    SpawnMap(MapObject object) {
        chosen=1;
        if (!object.name.equals("from-map")) throw new RuntimeException("map object name");
        power=object.getPropertyInt("power");
        addCostume("test", "/test/extensions-glyph.png");
        hide();
        ready=true;
    }
    SpawnMap(double x,double y) { chosen=2; }
    SpawnMap() { chosen=3; }
    public void whenAddedToStage() {
        if (!ready || getStage()==null) throw new RuntimeException("spawn hook ordering");
        added=true;
    }
}
class SpawnXY extends Sprite {
    double constructorX,constructorY;
    SpawnXY(double x,double y) { constructorX=x; constructorY=y; hide(); }
    SpawnXY() { throw new RuntimeException("wrong XY constructor"); }
}
class SpawnDefault extends Sprite {
    boolean ready=false;
    SpawnDefault() { hide(); ready=true; }
}
class SpawnMarker { }
class SpawnBad extends Sprite { SpawnBad(int unused) { } }
class SpawnExplodes extends Sprite { SpawnExplodes() { throw new RuntimeException("constructor failed"); } }

class ClippedDrawing extends DrawingSprite {
    public void draw(Drawing canvas) {
        canvas.clip(0, 0, 10, 10);
        canvas.rectangle(0, 0, 50, 50, new Color(0, 255, 0));
    }
}
class UnclippedDrawing extends DrawingSprite {
    public void draw(Drawing canvas) {
        canvas.rectangle(80, -20, 10, 10, new Color(0, 0, 255));
        canvas.image("/test/extensions-glyph.png", 0, -70, 12, 12);
    }
}
class ExtensionsStage extends Stage {
    UISprite ui;
    BitmapText text;
    int frames = 0;
    ExtensionsStage() {
        Window.getInstance().pause();
        setColor(255, 255, 255);
        ui = new UISprite();
        ui.addCostume("red", "/test/extensions-glyph.png");
        ui.setPosition(-100, 60); add(ui); ui.stamp(Layer.UI); ui.setPosition(-60, 60);
        UISprite pen = new UISprite();
        pen.setPosition(40, -50); add(pen);
        pen.getPen().setColor(0, 0, 255); pen.getPen().setSize(6);
        pen.getPen().down(); pen.setPosition(60, -50); pen.getPen().up(); pen.hide();
        ClippedDrawing road = new ClippedDrawing();
        road.setPosition(30, -20); road.setSize(200); add(road);
        add(new UnclippedDrawing());
        text = new BitmapText("glyph%d.png");
        text.addGlyph('A', "/test/extensions-glyph.png");
        text.showText("AA"); text.setIsUI(true); text.setPosition(-100, 0); add(text);
        if (text.getWidth()!=12 || text.getHeight()!=6) throw new RuntimeException("bitmap measurement");
        TiledMap map = new TiledMap("/test/extensions-map.tmx");
        if (map.getWidth()!=2 || map.getHeight()!=1 || map.getTileId("ground",1,0)!=7)
            throw new RuntimeException("map dimensions and IDs");
        if (!map.getProperty("biome").equals("forest")) throw new RuntimeException("map property");
        Shape[] shapes=map.getTileCollisionShapes("ground",1,0);
        if (shapes.length!=1 || shapes[0].getBounds().x()!=26 || shapes[0].getBounds().y()!=-9)
            throw new RuntimeException("map collision flip");
        TiledMap renderedMap=new TiledMap("/test/extensions-map.tmx",this);
        renderedMap.stampLayerToBackground("ground");
        List<Sprite> made=renderedMap.spawn("spawn");
        if (made.size()!=3 || !(made.get(0) instanceof SpawnMap) || !(made.get(1) instanceof SpawnXY)
            || !(made.get(2) instanceof SpawnDefault)) throw new RuntimeException("spawn order and markers");
        SpawnMap mapped=(SpawnMap)made.get(0);
        if (SpawnMap.chosen!=1 || mapped.power!=42 || !mapped.added || mapped.getStage()!=this
            || mapped.getX()!=-120 || mapped.getY()!=-60) throw new RuntimeException("spawn MapObject constructor");
        if (mapped.getHitbox().getBounds().width()!=8 || mapped.getHitbox().getBounds().height()!=12)
            throw new RuntimeException("spawn rectangle hitbox");
        SpawnXY xy=(SpawnXY)made.get(1);
        if (xy.constructorX!=-80 || xy.constructorY!=-40 || xy.getStage()!=this)
            throw new RuntimeException("spawn XY constructor");
        if (!((SpawnDefault)made.get(2)).ready || made.get(2).getHitbox().getBounds().width()!=5)
            throw new RuntimeException("spawn default constructor and polygon hitbox");
        boolean rejected=false;
        try { renderedMap.spawn("bad"); } catch (RuntimeException e) { rejected=true; }
        if (!rejected) throw new RuntimeException("spawn bad constructor accepted");
        rejected=false;
        try { renderedMap.spawn("explodes"); } catch (RuntimeException e) { rejected=e.getMessage().equals("constructor failed"); }
        if (!rejected) throw new RuntimeException("spawn constructor exception lost");
        rejected=false;
        try { renderedMap.spawn("absent"); } catch (RuntimeException e) { rejected=true; }
        if (!rejected) throw new RuntimeException("spawn absent layer accepted");
        addSound("hit", "impactWood_heavy_001");
        SoundPlayback first=playSoundCopy("hit",30), second=playSoundCopy("hit",80);
        first.setVolume(25);
        if (first.getVolume()!=25 || !first.getName().equals("hit")) throw new RuntimeException("playback volume and name");
        first.stop();
        if (first.isPlaying() || !second.isPlaying()) throw new RuntimeException("independent playback stop");
        AutoCloseable closeable=second;
        closeable.close();
        if (second.isPlaying()) throw new RuntimeException("closing a playback");
        println("EXTENSIONS_READY");
    }
    public void run() {
        frames++;
        if (frames==8) {
            ui.setPosition(-20,60); text.setPosition(-80,0); text.setAlign(TextAlign.RIGHT); text.showText("A");
        }
        if (frames==16) { ui.hide(); text.hide(); }
        if (frames==24) eraseAll();
    }
}
void main() {
    Window window = new Window(320,200);
    window.setStage(new ExtensionsStage());
}
