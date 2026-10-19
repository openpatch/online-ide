import '../compiler/common/interpreter/Interpreter';
import * as PIXI from 'pixi.js';
import { afterEach, expect, test, vi } from 'vitest';
import { Thread } from '../compiler/common/interpreter/Thread';
import { ScratchCostumes } from '../compiler/java/runtime/graphics/scratch/ScratchCostumes';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';
import { ScratchTiledMapClass } from '../compiler/java/runtime/graphics/scratch/ScratchTiledMapClass';
import { clearScratchStampLayer, tiledTexture } from '../compiler/java/runtime/graphics/scratch/ScratchTiledRendering';
import { ScratchWorkspaceAssets } from '../compiler/java/runtime/graphics/scratch/ScratchWorkspaceAssets';

afterEach(() => vi.restoreAllMocks());

const xml = `<map orientation="orthogonal" width="3" height="1" tilewidth="16" tileheight="16">
    <tileset firstgid="1" tilewidth="16" tileheight="16" tilecount="2" columns="2">
        <image source="tiles.png"/>
    </tileset>
    <layer name="ground" width="3" height="1"><data encoding="csv">1,2,1</data></layer>
</map>`;

test('tile frames are shared across cells, stamps and reconstructed maps without retaining a texture per frame', async () => {
    const image = new PIXI.Texture({ source: new PIXI.TextureSource({ width: 32, height: 16 }) });
    vi.spyOn(ScratchWorkspaceAssets, 'getText').mockReturnValue(xml);
    vi.spyOn(ScratchCostumes, 'getTexture').mockReturnValue(image);
    const background = new PIXI.Container(), foreground = new PIXI.Container();
    const stage = { world: { width: 320, height: 200 }, scratchLayers: {
        backgroundStamps: background, foregroundStamps: foreground,
    } } as unknown as ScratchStageClass;
    const map = new ScratchTiledMapClass();
    (map as any).stage = stage;
    await map.load('map.tmx');
    const stamp = () => map._mj$stampLayerToBackground$void$string({} as Thread, undefined, 'ground');
    stamp();
    const snapshot = background.children[0];
    const first = snapshot.children[0] as PIXI.Sprite;
    expect(first.texture).toBe((snapshot.children[2] as PIXI.Sprite).texture);
    const listeners = image.source.listenerCount('resize');
    for (let frame = 0; frame < 100; frame++) {
        clearScratchStampLayer(background);
        expect(background.children).toHaveLength(0);
        stamp();
        expect(background.children[0]).toBe(snapshot);
        expect(snapshot.children[0]).toBe(first);
    }
    expect(image.source.listenerCount('resize')).toBe(listeners);

    // Two stamps without an erase must remain independent visible copies.
    stamp();
    expect(background.children).toHaveLength(2);
    expect(background.children[1]).not.toBe(snapshot);
    expect((background.children[1].children[0] as PIXI.Sprite).texture).toBe(first.texture);
    map._mj$stampLayerToForeground$void$string({} as Thread, undefined, 'ground');
    expect(foreground.children).toHaveLength(1);

    const nextMap = new ScratchTiledMapClass();
    (nextMap as any).stage = stage;
    await nextMap.load('map.tmx');
    nextMap._mj$stampLayerToForeground$void$string({} as Thread, undefined, 'ground');
    expect((foreground.children[1].children[0] as PIXI.Sprite).texture).toBe(first.texture);
    expect(image.source.listenerCount('resize')).toBe(listeners);
});

test('erasing ordinary stamps still destroys their display objects', () => {
    const layer = new PIXI.Container();
    const stamp = layer.addChild(new PIXI.Sprite());
    clearScratchStampLayer(layer);
    expect(stamp.destroyed).toBe(true);
    expect(layer.children).toHaveLength(0);
});

test('tile frames are relative to the image frame, without destroying the shared source', () => {
    const image = new PIXI.Texture({ source: new PIXI.TextureSource({ width: 128, height: 128 }),
        frame: new PIXI.Rectangle(10, 20, 64, 64) });
    const texture = tiledTexture(image, 16, 32, 8, 12);
    expect(texture.frame).toEqual(new PIXI.Rectangle(26, 52, 8, 12));
    expect(texture.source).toBe(image.source);
});

test('all four Tiled flags are cleared without changing the orthogonal flip transforms', async () => {
    const cells = Array.from({ length: 8 }, (_, flags) => 1 + flags * 0x20000000 + 0x10000000);
    vi.spyOn(ScratchWorkspaceAssets, 'getText').mockReturnValue(`<map orientation="orthogonal"
        width="8" height="1" tilewidth="16" tileheight="16">
        <tileset firstgid="1" tilewidth="16" tileheight="16" tilecount="1" columns="1">
            <image source="tiles.png"/><tile id="0"><objectgroup>
                <object x="2" y="3" width="4" height="6"/>
            </objectgroup></tile>
        </tileset>
        <layer name="ground" width="8" height="1"><data encoding="csv">${cells.join(',')}</data></layer>
    </map>`);
    const map = new ScratchTiledMapClass();
    await map.load('flags.tmx');
    for (let flags = 0; flags < 8; flags++) {
        expect(map._getTileId('ground', flags, 0)).toBe(1);
        const points = [2, 6].flatMap(originalX => [3, 9].map(originalY => {
            let x = originalX, y = originalY;
            if (flags & 1) [x, y] = [y, x];
            return { x: flags * 16 + (flags & 4 ? 16 - x : x), y: -(flags & 2 ? 16 - y : y) };
        }));
        const xs = points.map(p => p.x), ys = points.map(p => p.y);
        const bounds = map._getCellCollisionShapes('ground', flags, 0)[0]._getBounds();
        expect(bounds.bx).toBeCloseTo(Math.min(...xs));
        expect(bounds.by).toBeCloseTo(Math.min(...ys));
        expect(bounds.bwidth).toBeCloseTo(Math.max(...xs) - Math.min(...xs));
        expect(bounds.bheight).toBeCloseTo(Math.max(...ys) - Math.min(...ys));
    }
});
