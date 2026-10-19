import * as PIXI from 'pixi.js';
import { describe, expect, test } from 'vitest';
import { ScratchShapeClass } from '../compiler/java/runtime/graphics/scratch/ScratchShapeClasses';
import { ScratchSpriteClass } from '../compiler/java/runtime/graphics/scratch/ScratchSpriteClass';

/**
 * Collision for a sprite that has a hitbox and no costume — what TiledMap.spawn
 * makes of a map's walls, water and warps. The empty container renders nothing,
 * so its bounds are a single point; the collision pre-check has to look at the
 * hitbox outline instead, or the sprite stops colliding with anything.
 */

/** Enough of a world for a sprite, in the style of ScratchSpriteEdgeTest. */
function fakeWorld(width: number, height: number) {
    const children: unknown[] = [];
    return {
        width, height,
        app: { stage: { addChild: (c: unknown) => { children.push(c); return c; }, children } },
    } as never;
}

const stage = { sprites: [] } as unknown as Parameters<ScratchSpriteClass['attachToStage']>[0] & { sprites: ScratchSpriteClass[] };

function spriteAt(x: number, y: number): ScratchSpriteClass {
    const sprite = new ScratchSpriteClass();
    sprite.world = fakeWorld(600, 240);
    sprite.container = new PIXI.Container();
    sprite.attachToStage(stage);
    stage.sprites.push(sprite);
    sprite._setPosition(x, y);
    return sprite;
}

describe('Scratch sprite collision outline', () => {

    test('a costume-less sprite with a map hitbox shape collides where its hitbox is', () => {
        // the wall: no costume, its rectangle as the hitbox, like TiledMap.spawn
        const wall = spriteAt(100, 0);
        wall._setHitboxShape(ScratchShapeClass.of([
            { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 0, y: 40 },
        ]));

        // the player: a small outline, like a costume would give it
        const player = spriteAt(110, -10);
        player.hitPolygonInitial = [
            { x: -5, y: -5 }, { x: 5, y: -5 }, { x: 5, y: 5 }, { x: -5, y: 5 },
        ];

        expect(player._isTouchingSprite(wall)).toBe(true);

        // a sprite outside the wall's hitbox does not collide, even though
        // the wall's empty container sits at the hitbox's top-left corner
        player._setPosition(200, 0);
        expect(player._isTouchingSprite(wall)).toBe(false);

        // and the empty container's own point is not the whole story either:
        // the player beyond the shape's far corner does not collide
        player._setPosition(150, -50);
        expect(player._isTouchingSprite(wall)).toBe(false);
    });

    test('stationary collision checks reuse transformed polygons and movement or hitbox changes invalidate them', () => {
        const wall = spriteAt(100, 0), player = spriteAt(110, -10);
        const rectangle = ScratchShapeClass.of([
            { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 0, y: 40 },
        ]);
        wall._setHitboxShape(rectangle);
        player._setHitboxShape(rectangle);
        expect(player._isTouchingSprite(wall)).toBe(true);
        const playerPolygon = player.hitPolygonTransformed;
        const wallPolygon = wall.hitPolygonTransformed;
        for (let i = 0; i < 100; i++) expect(player._isTouchingSprite(wall)).toBe(true);
        expect(player.hitPolygonTransformed).toBe(playerPolygon);
        expect(wall.hitPolygonTransformed).toBe(wallPolygon);

        player._setPosition(200, 0);
        expect(player._isTouchingSprite(wall)).toBe(false);
        expect(player.hitPolygonTransformed).not.toBe(playerPolygon);
        expect(wall.hitPolygonTransformed).toBe(wallPolygon);

        wall._setHitboxShape(rectangle._scale(4, 1));
        expect(player._isTouchingSprite(wall)).toBe(true);
        expect(wall.hitPolygonTransformed).not.toBe(wallPolygon);

        wall._setDirection(180);
        expect(player._isTouchingSprite(wall)).toBe(false);
        wall._setDirection(90);
        expect(player._isTouchingSprite(wall)).toBe(true);
        wall._setSize(25);
        expect(player._isTouchingSprite(wall)).toBe(false);
    });

});
