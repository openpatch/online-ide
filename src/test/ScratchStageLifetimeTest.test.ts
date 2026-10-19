import '../compiler/common/interpreter/Interpreter';
import * as PIXI from 'pixi.js';
import { expect, test, vi } from 'vitest';
import { createScratchLayers } from '../compiler/java/runtime/graphics/scratch/ScratchLayers';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';
import { ScratchSpriteClass } from '../compiler/java/runtime/graphics/scratch/ScratchSpriteClass';
import { beginScratchStages, setActiveScratchStage } from '../compiler/java/runtime/graphics/scratch/ScratchStages';

test('hidden rooms leave the World while retained stages keep their display and sprite state for reuse', () => {
    const world: any = { width: 320, height: 200, app: { stage: new PIXI.Container() },
        mouseManager: { internalMouseListeners: [] }, shapesWhichBelongToNoGroup: [],
        shapesNotAffectedByWorldTransforms: [], _setBackgroundColor: vi.fn() };
    beginScratchStages(world);
    const first = new ScratchStageClass(), second = new ScratchStageClass();
    for (const stage of [first, second]) {
        stage.world = world;
        stage.scratchLayers = createScratchLayers(world.app.stage);
        stage.scratchLayers.root.removeFromParent();
    }
    const sprite = new ScratchSpriteClass();
    sprite.world = world;
    sprite.container = new PIXI.Container();
    first.sprites.push(sprite);
    sprite.attachToStage(first);
    sprite._setPosition(42, -18);
    const display = sprite.container;

    setActiveScratchStage(first);
    expect(world.shapesWhichBelongToNoGroup).toEqual([sprite]);
    expect(world.mouseManager.internalMouseListeners).toEqual([first]);
    setActiveScratchStage(second);
    expect(world.app.stage.children).toEqual([second.scratchLayers!.root]);
    expect(world.shapesWhichBelongToNoGroup).toEqual([]);
    expect(world.mouseManager.internalMouseListeners).toEqual([second]);
    expect(first.sprites).toEqual([sprite]);

    setActiveScratchStage(first);
    expect(world.app.stage.children).toEqual([first.scratchLayers!.root]);
    expect(world.shapesWhichBelongToNoGroup).toEqual([sprite]);
    expect(world.mouseManager.internalMouseListeners).toEqual([first]);
    expect(sprite.container).toBe(display);
    expect(sprite._getX()).toBe(42);
    expect(sprite._getY()).toBe(-18);
});
