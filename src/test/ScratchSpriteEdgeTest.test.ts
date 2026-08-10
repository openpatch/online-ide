import * as PIXI from 'pixi.js';
import { describe, expect, test } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import { RotationStyle } from '../compiler/java/runtime/graphics/scratch/RotationStyleEnum';
import { ScratchSpriteClass } from '../compiler/java/runtime/graphics/scratch/ScratchSpriteClass';

/**
 * Where a sprite is, and where its hitbox thinks it is — without a browser.
 *
 * <p>Two things used to come apart here. ifOnEdgeBounce() reflected a heading
 * with the formula for the other pair of borders, so a sprite pointing straight
 * at the right edge (direction 90) came away from it still pointing at it; and
 * the collision outline was measured off the costume's PIXI bounds, which are
 * the whole canvas and are moved by the camera as well.
 */

/** Enough of a world for a sprite: a size, and somewhere to put its costume. */
function fakeWorld(width: number, height: number): IWorld {
    const children: unknown[] = [];
    return {
        width, height,
        app: {
            stage: {
                addChild: (c: unknown) => { children.push(c); return c; },
                children,
            },
        },
    } as unknown as IWorld;
}

/**
 * A sprite with a square collision outline of `size` costume pixels, standing on
 * a stage of its own. The java constructor needs an interpreter thread, so the
 * few fields it would set are filled in directly.
 */
function spriteOnStage(stageWidth = 600, stageHeight = 240, size = 40): ScratchSpriteClass {
    const sprite = new ScratchSpriteClass();
    sprite.world = fakeWorld(stageWidth, stageHeight) as never;
    sprite.container = new PIXI.Container();
    const half = size / 2;
    sprite.hitPolygonInitial = [
        { x: -half, y: -half }, { x: half, y: -half },
        { x: half, y: half }, { x: -half, y: half },
    ];
    // only ever read back through getStage(), so anything non-null will do
    sprite.stage = {} as never;
    sprite._setPosition(0, 0);
    return sprite;
}

/** The hitbox in stage coordinates: centre origin, y pointing down. */
function hitbox(sprite: ScratchSpriteClass) {
    const b = sprite._getHitbox()._getBounds();
    return { left: b.bx, top: b.by, right: b.bx + b.bwidth, bottom: b.by + b.bheight };
}

describe('Scratch sprite hitbox', () => {

    test('the hitbox is where the sprite is, with no frame in between', () => {
        const sprite = spriteOnStage();

        sprite._setDirection(90);
        sprite._move2(137);

        const box = hitbox(sprite);
        expect(sprite._getX()).toBeCloseTo(137);
        expect((box.left + box.right) / 2).toBeCloseTo(137);
        expect((box.top + box.bottom) / 2).toBeCloseTo(0);
    });

    test('the hitbox follows every step of a walk, not the step before', () => {
        const sprite = spriteOnStage();
        sprite._setDirection(90);

        for (let step = 1; step <= 20; step++) {
            sprite._move2(11);
            expect((hitbox(sprite).left + hitbox(sprite).right) / 2).toBeCloseTo(step * 11);
        }
    });

    test('changing the size and the direction moves the hitbox with them', () => {
        const sprite = spriteOnStage();
        sprite._setPosition(-100, 50);
        sprite._setSize(200);

        const box = hitbox(sprite);
        expect(box.left).toBeCloseTo(-140);
        expect(box.right).toBeCloseTo(-60);
        // y points down in hitbox space, so the sprite at y=50 sits at -50
        expect(box.top).toBeCloseTo(-90);
        expect(box.bottom).toBeCloseTo(-10);
    });
});

describe('Scratch sprite ifOnEdgeBounce', () => {

    test('a sprite walking into the right border turns round', () => {
        const sprite = spriteOnStage();
        sprite._setDirection(90);
        sprite._setPosition(285, 0);

        sprite._move2(5);       // hitbox now reaches 310, the stage ends at 300
        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(270);
        expect(hitbox(sprite).right).toBeCloseTo(300);
    });

    test('and one walking into the left border does too', () => {
        const sprite = spriteOnStage();
        sprite._setDirection(270);
        sprite._setPosition(-285, 0);

        sprite._move2(5);
        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(90);
        expect(hitbox(sprite).left).toBeCloseTo(-300);
    });

    test('the top and bottom borders reflect the other way round', () => {
        const sprite = spriteOnStage();
        sprite._setDirection(0);            // straight up
        sprite._setPosition(0, 105);

        sprite._move2(5);                   // top of the hitbox at 130, stage ends at 120
        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(180);
        expect(hitbox(sprite).top).toBeCloseTo(-120);

        sprite._setPosition(0, -105);
        sprite._move2(5);
        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(0);
        expect(hitbox(sprite).bottom).toBeCloseTo(120);
    });

    test('a diagonal heading keeps the component the border does not reflect', () => {
        const sprite = spriteOnStage();
        sprite._setDirection(45);           // up and to the right
        sprite._setPosition(295, 0);

        sprite._ifOnEdgeBounce();

        // the right border mirrors the x component only: still going up, now left
        expect(sprite._getDirection()).toBe(315);
    });

    test('a sprite well past the border comes all the way back in', () => {
        const sprite = spriteOnStage();
        sprite._setDirection(90);
        sprite._setPosition(0, 0);

        sprite._move2(500);                 // far outside a 600 wide stage
        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(270);
        expect(hitbox(sprite).right).toBeCloseTo(300);
    });

    test.each([5, 17, 50, 133, 400])('a walk at %i steps a frame never leaves the stage', (speed) => {
        const sprite = spriteOnStage();
        sprite._setDirection(65);           // bounces off all four borders in turn
        sprite._setRotationStyle({ ordinal: RotationStyle.LEFT_RIGHT } as never);

        for (let frame = 0; frame < 400; frame++) {
            sprite._move2(speed);
            sprite._ifOnEdgeBounce();

            // the nudge puts the hitbox flush with the border, so all that is
            // allowed outside it is what the matrix arithmetic rounds away
            const slack = 1e-9;
            const box = hitbox(sprite);
            expect(box.left).toBeGreaterThanOrEqual(-300 - slack);
            expect(box.right).toBeLessThanOrEqual(300 + slack);
            expect(box.top).toBeGreaterThanOrEqual(-120 - slack);
            expect(box.bottom).toBeLessThanOrEqual(120 + slack);
        }
    });

    test('the slime bounces where the desktop library says its hitbox ends', () => {
        // Bounds[x=-44.0, y=2.0, width=88.0, height=62.0]: what
        // new Sprite("slime", "slimeBlue").getHitbox().getBounds() prints at
        // (0, 0) on the desktop, recorded in scratch-for-java's
        // src/test/resources/parity/expected.txt. The costume canvas is 128 by
        // 128, so the painted pixels are both narrower than it and well below
        // its middle — measuring the canvas instead would turn the sprite round
        // far too early sideways, and far too late going up.
        const sprite = spriteOnStage(600, 240);
        sprite.hitPolygonInitial = [
            { x: -44, y: 2 }, { x: 44, y: 2 }, { x: 44, y: 64 }, { x: -44, y: 64 },
        ];
        // as in the program that found this: LEFT_RIGHT keeps the costume — and
        // with it the hitbox — upright, so the numbers below are the ones a
        // paint program would read off the costume
        sprite._setRotationStyle({ ordinal: RotationStyle.LEFT_RIGHT } as never);
        sprite._setDirection(90);

        while (sprite._getDirection() === 90) { sprite._move2(5); sprite._ifOnEdgeBounce(); }

        // it walked to 260 (the first step past 300 - 44) and was put back flush
        expect(sprite._getDirection()).toBe(270);
        expect(sprite._getX()).toBeCloseTo(256);

        // and upwards it may go higher than half the stage, because the painted
        // pixels hang below the middle of the costume
        sprite._setPosition(0, 0);
        sprite._setDirection(0);
        while (sprite._getDirection() === 0) { sprite._move2(5); sprite._ifOnEdgeBounce(); }

        expect(sprite._getDirection()).toBe(180);
        expect(sprite._getY()).toBeCloseTo(122);
    });

    test('a sprite that has not been added to a stage stays as it is', () => {
        const sprite = spriteOnStage();
        sprite.stage = undefined;
        sprite._setDirection(90);
        sprite._setPosition(400, 0);

        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(90);
        expect(sprite._getX()).toBe(400);
    });

    test('so does one whose hitbox is switched off', () => {
        const sprite = spriteOnStage();
        sprite._disableHitbox();
        sprite._setDirection(90);
        sprite._setPosition(400, 0);

        sprite._ifOnEdgeBounce();

        expect(sprite._getDirection()).toBe(90);
        expect(sprite._getX()).toBe(400);
        expect(sprite._isTouchingEdge()).toBe(false);
    });

    test('touching the edge is about the hitbox, not the costume canvas', () => {
        const sprite = spriteOnStage();

        sprite._setPosition(279, 0);        // hitbox ends at 299
        expect(sprite._isTouchingEdge()).toBe(false);

        sprite._setPosition(281, 0);        // and now at 301
        expect(sprite._isTouchingEdge()).toBe(true);
    });
});
