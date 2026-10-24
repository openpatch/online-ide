import { afterEach, expect, test, vi } from 'vitest';
import '../compiler/common/interpreter/Interpreter';
import { JavaCompiler } from '../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../compiler/java/runtime/JavaLibraryManager';
import { CompilerFile } from '../compiler/common/module/CompilerFile';
import * as PIXI from 'pixi.js';
import { ScratchDrawingClass } from '../compiler/java/runtime/graphics/scratch/ScratchDrawingClasses';
import { ScratchBitmapTextClass } from '../compiler/java/runtime/graphics/scratch/ScratchBitmapTextClass';
import { ScratchCostumes } from '../compiler/java/runtime/graphics/scratch/ScratchCostumes';
import { ScratchColorClass } from '../compiler/java/runtime/graphics/scratch/ScratchColorClass';
import { TextAlignEnum } from '../compiler/java/runtime/graphics/scratch/TextAlignEnum';
import { ScratchTiledMapClass } from '../compiler/java/runtime/graphics/scratch/ScratchTiledMapClass';
import { ScratchWorkspaceAssets } from '../compiler/java/runtime/graphics/scratch/ScratchWorkspaceAssets';
import { deflate, gzip } from 'pako';

afterEach(() => vi.restoreAllMocks());

test.each([false, true])('new extension declarations compile together, NRW=%s', async nrw => {
    const compiler = new JavaCompiler();
    const libraries = new JavaLibraryManager();
    libraries.addLibraries(...(nrw ? ['scratch', 'nrw'] : ['scratch']));
    libraries.addLibrariesToCompiler(compiler);
    const file = new CompilerFile('Extensions.java');
    file.setText(`
import org.openpatch.scratch.drawing.*;
import org.openpatch.scratch.tiled.*;
import java.util.List;
class Road extends DrawingSprite {
  public void draw(Drawing canvas) {
    canvas.clip(0,0,100,100);
    canvas.rectangle(0,0,100,100,new Color(255,0,0));
    canvas.polygon(new double[]{0,20,0},new double[]{0,0,20},new Color(255,255,255));
    canvas.image("slimeGreen",0,0,20,20);
    int width=canvas.imageWidth("slimeGreen");
    canvas.noClip();
  }
}
void main() {
  Window w=new Window(320,200); Stage s=new Stage(); w.setStage(s);
  Road road=new Road(); road.setLayer(Layer.UI); s.add(road);
  BitmapText score=new BitmapText("font%03d.png"); score.addGlyph('A',"slimeGreen");
  score.showText("A"); score.setAlign(TextAlign.CENTER); score.setSpaceWidth(4);
  score.setLetterSpacing(1); score.setLineSpacing(2); score.setLayer(Layer.UI); s.add(score);
  println(score.getContent()+score.getWidth()+score.getHeight());
  s.addSound("hit","impactWood_heavy_001");
  SoundPlayback p=s.playSoundCopy("hit",30); p.setVolume(20); println(p.isPlaying()); p.stop(); p.close();
  AutoCloseable closeable=p; closeable.close();
  TiledMap map=new TiledMap("map.tmx");
  println(map.getWidth()+map.getHeight()+map.getTileWidth()+map.getTileHeight());
  println(map.getProperty("biome","forest")); println(map.getPropertyInt("lives"));
  Shape[] shapes=map.getTileCollisionShapes("ground",0,0);
  Shape[] local=map.getTileCollisionShapes(map.getTileId("ground",0,0));
  List<Sprite> spawned=map.spawn("objects");
  println(spawned.size());
}`);
    compiler.setFiles([file]);
    const executable = await compiler.compileIfDirty();
    expect(executable?.getAllErrors().filter(error => error.level === 'error')).toEqual([]);
});

test('bitmap text measures and aligns variable image glyphs like the desktop', () => {
    const images = new Map([
        ['font065.png', new PIXI.Texture({ source: new PIXI.TextureSource({ width: 4, height: 7 }) })],
        ['font066.png', new PIXI.Texture({ source: new PIXI.TextureSource({ width: 6, height: 9 }) })],
    ]);
    vi.spyOn(ScratchCostumes, 'getTexture').mockImplementation(path => images.get(path));
    const text = new ScratchBitmapTextClass();
    text._mj$setFont$void$string(undefined as any, undefined, 'font%03d.png');
    text._setSpaceWidth(3); text._setLetterSpacing(1); text._setLineSpacing(2);
    text._mj$showText$void$string(undefined as any, undefined, 'A B\nBA');
    expect(text._getSpriteWidth()).toBe(15);
    expect(text._getSpriteHeight()).toBe(20);
    text.size = 150;
    expect(text._getSpriteWidth()).toBe(23);
    expect(text._getSpriteHeight()).toBe(30);
    text._setAlign(TextAlignEnum.values[1]);
    const drawing = new ScratchDrawingClass();
    text._mj$draw$void$Drawing(undefined as any, undefined, drawing);
    expect(drawing.content.children[0].position.x).toBe(-5.5);
    expect(drawing.content.children[0].position.y).toBe(3.5);
    expect(drawing.content.children[2].position.y).toBe(15.5);
    expect(() => text._mj$setFont$void$string(undefined as any, undefined, '%%d.png')).toThrow();
    expect(() => text._setSpaceWidth(-1)).toThrow();
});

test('drawing scales images without modifying their cache and expires after a frame', () => {
    const texture = new PIXI.Texture({ source: new PIXI.TextureSource({ width: 4, height: 7 }) });
    vi.spyOn(ScratchCostumes, 'getTexture').mockReturnValue(texture);
    const drawing = new ScratchDrawingClass();
    drawing._image('glyph', 10, 20, 40, 70);
    expect(texture.width).toBe(4);
    expect(drawing.content.children[0].position.y).toBe(-20);
    expect(drawing.content.children[0].width).toBe(40);
    expect(() => drawing._polygon([0, 1], [0, 1], new ScratchColorClass())).toThrow();
    expect(() => drawing._image('glyph', 0, 0, -1, 1)).toThrow();
    drawing.finish();
    expect(() => drawing._image('glyph', 0, 0)).toThrow();
});

test('TMX data reads properties, TSX collisions, groups and all eight tile flips', async () => {
    const ids = Array.from({ length: 8 }, (_, flags) => (7 | (flags << 29)) >>> 0).join(',');
    const files: Record<string, string> = {
        'maps/map.tmx': `<map orientation="orthogonal" width="8" height="1" tilewidth="16" tileheight="16">
          <properties><property name="biome" value="forest"/><property name="lives" value="3"/>
          <property name="message">first\nsecond</property></properties>
          <tileset firstgid="7" source="../tiles.tsx"/>
          <group name="g"><layer name="ground" width="8" height="1"><data encoding="csv">${ids}</data></layer></group>
          <objectgroup name="objects"><object id="1" x="4" y="12" class="start"><point/></object></objectgroup>
        </map>`,
        'tiles.tsx': `<tileset tilewidth="16" tileheight="16" columns="1" tilecount="1"><image source="tiles.png"/>
          <tile id="0"><objectgroup><object x="2" y="3" width="4" height="6"/></objectgroup></tile></tileset>`,
    };
    vi.spyOn(ScratchWorkspaceAssets, 'getText').mockImplementation(path => files[path]);
    const map = new ScratchTiledMapClass();
    await map.load('maps/map.tmx');
    expect(map._getWidth()).toBe(8); expect(map._getHeight()).toBe(1);
    expect(map._getTileWidth()).toBe(16); expect(map._getTileHeight()).toBe(16);
    expect(map._getProperty('message')).toBe('first\nsecond');
    expect(map._getPropertyInt('lives')).toBe(3);
    expect(map._getPropertyDefault('absent', 'default')).toBe('default');
    expect(() => map._getProperty('absent')).toThrow();
    expect(map._getObjectsFromLayer('objects')![0].y).toBe(-12);
    expect(map._getObjectsFromLayer('objects')![0].y).toBe(-12);
    expect(map._getTileCollisionShapes(999)).toEqual([]);
    for (let flags = 0; flags < 8; flags++) {
        expect(map._getTileId('ground', flags, 0)).toBe(7);
        const points = [2, 6].flatMap(originalX => [3, 9].map(originalY => {
            let x = originalX, y = originalY;
            if (flags & 1) [x, y] = [y, x];
            return { x: flags * 16 + (flags & 4 ? 16 - x : x), y: -(flags & 2 ? 16 - y : y) };
        }));
        const bounds = map._getCellCollisionShapes('ground', flags, 0)[0]._getBounds();
        expect(bounds.bx).toBeCloseTo(Math.min(...points.map(p => p.x)));
        expect(bounds.by).toBeCloseTo(Math.min(...points.map(p => p.y)));
    }
    expect(map._getTileId('ground', -1, 0)).toBe(0);
    expect(() => map._getTileId('missing', 0, 0)).toThrow();
});

test.each(['xml', 'base64', 'zlib', 'gzip'])('Tiled layer data supports %s', async encoding => {
    const bytes = new Uint8Array(8);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 7, true); view.setUint32(4, 2147483655, true);
    const compressed = encoding === 'zlib' ? deflate(bytes) : encoding === 'gzip' ? gzip(bytes) : bytes;
    const data = encoding === 'xml' ? '<data><tile gid="7"/><tile gid="2147483655"/></data>'
        : `<data encoding="base64" ${['zlib','gzip'].includes(encoding) ? `compression="${encoding}"` : ''}>${btoa(String.fromCharCode(...compressed))}</data>`;
    vi.spyOn(ScratchWorkspaceAssets, 'getText').mockReturnValue(`<map orientation="orthogonal" width="2" height="1" tilewidth="16" tileheight="16"><layer name="ground" width="2" height="1">${data}</layer></map>`);
    const map = new ScratchTiledMapClass();
    await map.load('map.tmx');
    expect(map._getTileId('ground', 0, 0)).toBe(7);
    expect(map._getTileId('ground', 1, 0)).toBe(7);
});

test('workspace Tiled text assets decode XML and UTF-8 without needing a window', async () => {
    const map = '<map><properties><property name="biome" value="Wüste"/></properties></map>';
    const tsx = '<tileset name="terrain"/>';
    const files = [
        { name: 'map.tmx', getText: () => 'data:application/xml;base64,' + btoa(unescape(encodeURIComponent(map))) },
        { name: 'tiles.tsx', getText: () => tsx },
    ];
    await ScratchWorkspaceAssets.load({ getFiles: () => files, getPath: () => [] } as any);
    expect(ScratchWorkspaceAssets.getText('map.tmx')).toBe(map);
    expect(ScratchWorkspaceAssets.getText('tiles.tsx')).toBe(tsx);
});
