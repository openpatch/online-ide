import { describe, expect, test } from 'vitest';
// the interpreter and compiler first, as JavaTests does: importing the runtime classes
// on their own runs into an import cycle
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { ScratchCostumes } from '../compiler/java/runtime/graphics/scratch/ScratchCostumes';
import platformer from '../../assets/graphics/scratch/platformer.json.txt?raw';
import spaceShooter from '../../assets/graphics/scratch/space_shooter.json.txt?raw';

describe('Scratch costumes face right', () => {

    test('directions wrap around like Scratch directions', () => {
        expect(ScratchCostumes.normaliseDirection(0)).toBe(0);
        expect(ScratchCostumes.normaliseDirection(90)).toBe(90);
        expect(ScratchCostumes.normaliseDirection(-90)).toBe(270);
        expect(ScratchCostumes.normaliseDirection(-180)).toBe(180);
        expect(ScratchCostumes.normaliseDirection(450)).toBe(90);
    });

    test('a slanted direction is refused', () => {
        expect(() => ScratchCostumes.normaliseDirection(45)).toThrow();
    });

    test('a picture that faces right already is left alone', () => {
        const texture: any = {};
        expect(ScratchCostumes.turnToFaceRight(texture, 90)).toBe(texture);
        expect(ScratchCostumes.turnToFaceRight(texture, -270)).toBe(texture);
    });

    test('the atlases say which built-ins are drawn facing another way', () => {
        const frames = (json: string) => JSON.parse(json).frames;
        // drawn pointing up, down and left on their sheets
        expect(frames(spaceShooter)["playerShip1_blue"].direction).toBe(0);
        expect(frames(spaceShooter)["enemyRed1"].direction).toBe(180);
        expect(frames(platformer)["snail"].direction).toBe(-90);
        // drawn facing right, or with no front to speak of
        expect(frames(platformer)["alienGreen_walk1"].direction).toBeUndefined();
        expect(frames(platformer)["coinGold"].direction).toBeUndefined();
    });
});
