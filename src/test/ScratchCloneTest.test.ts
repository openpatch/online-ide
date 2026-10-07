import { expect, test, vi } from 'vitest';
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import * as PIXI from 'pixi.js';
import { ScratchSpriteClass } from '../compiler/java/runtime/graphics/scratch/ScratchSpriteClass';
import { ScratchAnimatedSpriteClass } from '../compiler/java/runtime/graphics/scratch/ScratchAnimatedSpriteClass';
import { ScratchRuntimeManager } from '../compiler/java/runtime/graphics/scratch/ScratchRuntimeManager';
import { StringClass } from '../compiler/java/runtime/system/javalang/ObjectClassStringClass';

function environment() {
    const store = new Map();
    const interpreter: any = {
        actorManager: { registerActor: vi.fn(), unregisterActor: vi.fn(), shapesToDestroySafely: [] },
        scheduler: { createThread: () => ({ s: [] }) },
        retrieveObject: (key: string) => store.get(key),
        storeObject: (key: string, value: any) => store.set(key, value),
    };
    const world: any = { width: 600, height: 240, interpreter,
        shapesWhichBelongToNoGroup: [], shapesNotAffectedByWorldTransforms: [],
        mouseManager: { internalMouseListeners: [], addShapeWithImplementedMouseMethods: vi.fn(), removeShapeWithImplementedMouseMethods: vi.fn() },
        app: { stage: new PIXI.Container() },
    };
    const thread: any = { s: [], scheduler: { interpreter } };
    const stage: any = { sprites: [] };
    return { world, thread, stage, interpreter };
}

function prepare<T extends ScratchSpriteClass>(sprite: T, env: ReturnType<typeof environment>) {
    sprite.world = env.world;
    sprite.container = new PIXI.Container();
    env.world.app.stage.addChild(sprite.container);
    sprite.attachToStage(env.stage);
    env.stage.sprites.push(sprite);
    return sprite;
}

test('clones preserve subclasses, shallow student fields, stage order and synchronous lifecycle', () => {
    let constructions = 0;
    class Cat extends ScratchSpriteClass {
        lives = 7;
        toys = ['ball'];
        starts = 0;
        constructor() { super(); constructions++; }
        override _mj$whenStartsAsClone$void$(_thread: any, callback: any) {
            expect(this._isClone()).toBe(true);
            expect(this.stage?.sprites).toContain(this);
            this.starts++;
            callback?.();
        }
    }
    const env = environment();
    const cat = prepare(new Cat(), env);
    cat._setPosition(30, -20);
    cat._getPen()._setSize(5);
    const callback = vi.fn();
    cat._mj$copy$Shape$(env.thread, callback);
    const clone = env.thread.s.pop() as Cat;
    expect(constructions).toBe(1);
    expect(clone).toBeInstanceOf(Cat);
    expect(clone.starts).toBe(1);
    expect(cat.starts).toBe(0);
    expect(callback).toHaveBeenCalledOnce();
    expect(env.stage.sprites).toEqual([clone, cat]);
    expect(env.world.app.stage.children).toEqual([clone.container, cat.container]);
    expect(clone.toys).toBe(cat.toys);
    clone.lives = 1;
    expect(cat.lives).toBe(7);
    expect(clone._getX()).toBe(30);
    expect(clone._getY()).toBe(-20);
    expect(clone._getPen()).not.toBe(cat._getPen());
    expect(clone._getTimer()).not.toBe(cat._getTimer());
    clone._getPen()._setSize(9);
    expect(cat._getPen()._getSize()).toBe(5);
    clone._mj$copy$Shape$(env.thread, undefined);
    expect(env.thread.s.pop()._isClone()).toBe(true);
});

test('clone deletion is idempotent, unregisters broadcasts and leaves originals alive', () => {
    class Cat extends ScratchSpriteClass {
        messages = 0;
        override _mj$whenIReceive$void$String(_thread: any, callback: any, _message: any) { this.messages++; callback?.(); }
    }
    const env = environment();
    const cat = prepare(new Cat(), env);
    cat._registerListeners(env.thread);
    cat._mj$copy$Shape$(env.thread, undefined);
    const clone = env.thread.s.pop() as Cat;
    cat._mj$deleteThisClone$void$(env.thread, undefined);
    expect(cat.isDestroyed).toBe(false);
    clone._mj$deleteThisClone$void$(env.thread, undefined);
    clone._mj$deleteThisClone$void$(env.thread, undefined);
    expect(env.stage.sprites).toEqual([cat]);
    expect(clone.stage).toBeUndefined();
    expect(clone.container.parent).toBeNull();
    ScratchRuntimeManager.forInterpreter(env.interpreter, env.world).broadcast(new StringClass('hello'), env.stage);
    expect(cat.messages).toBe(1);
    expect(clone.messages).toBe(0);
});

test('animated clones preserve student subclasses and independent animation tables', () => {
    class Bunny extends ScratchAnimatedSpriteClass { points = 12; }
    const env = environment();
    const bunny = prepare(new Bunny(), env);
    bunny['animations'].set('walk', ['frame1', 'frame2']);
    bunny._mj$clone$AnimatedSprite$(env.thread, undefined);
    const clone = env.thread.s.pop() as Bunny;
    expect(clone).toBeInstanceOf(Bunny);
    expect(clone._isClone()).toBe(true);
    expect(clone.points).toBe(12);
    clone['animations'].set('jump', ['frame3']);
    expect(bunny['animations'].has('jump')).toBe(false);
});
