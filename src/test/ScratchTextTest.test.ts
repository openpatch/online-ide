import * as PIXI from 'pixi.js';
import { beforeAll, describe, expect, test } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import { createScratchLayers } from '../compiler/java/runtime/graphics/scratch/ScratchLayers';
import { ScratchTextClass } from '../compiler/java/runtime/graphics/scratch/ScratchTextClass';

/**
 * Which of several texts is on top, without a browser.
 *
 * <p>Upstream (org.openpatch.scratch.Text) draws the texts of a stage in the
 * order they were added, after every sprite, and goToBackLayer() and friends
 * move one within that order. Here the order is the order of the children of
 * the stage's text layer, so these tests read that.
 */

/**
 * jsdom has no canvas, and PIXI measures every string it is asked to lay out.
 * A monospace stand-in is enough: these tests read which text is on top, never
 * how wide one came out.
 */
beforeAll(() => {
    const letter = 7;
    (HTMLCanvasElement.prototype as any).getContext = () => ({
        font: "",
        measureText: (text: string) => ({
            width: text.length * letter,
            actualBoundingBoxAscent: 10,
            actualBoundingBoxDescent: 3,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: text.length * letter,
        }),
    });
});

/** Enough of a world for a text: a size, and somewhere for the layers to hang. */
function fakeWorld(): IWorld {
    return {
        width: 480, height: 360,
        app: { stage: new PIXI.Container() },
    } as unknown as IWorld;
}

/** Enough of a thread for the constructor: it looks the world up and pushes itself. */
function fakeThread(world: IWorld): any {
    return { scheduler: { interpreter: { retrieveObject: () => world } }, s: [] };
}

/** A stage of layers, and the world they were built for. */
function stageWithLayers(world: IWorld) {
    return { scratchLayers: createScratchLayers((world as any).app.stage) };
}

function textOn(stage: any, world: IWorld, words: string, width: number = 200): ScratchTextClass {
    const text = new ScratchTextClass();
    text._cj$_constructor_$Text$string$double$double$double(fakeThread(world), undefined, words, 0, 0, width);
    text.world = world;
    text.attachToStage(stage);
    return text;
}

/** The PIXI label a text was drawn as. */
function labelOf(text: ScratchTextClass): PIXI.Text {
    const container = (text as unknown as { container: PIXI.Container }).container;
    return container.children[0] as PIXI.Text;
}

/** The words of the texts in the layer, back to front. */
function order(stage: any): string[] {
    return stage.scratchLayers.texts.children.map(
        (child: PIXI.Container) => ((child.children[0] as PIXI.Text)?.text) ?? "");
}

describe('Scratch text', () => {

    test('a text is drawn above the sprites, in the layer of its own', () => {
        const world = fakeWorld();
        const stage = stageWithLayers(world);

        textOn(stage, world, "Hello");

        expect(stage.scratchLayers.texts.children.length).toBe(1);
        expect(stage.scratchLayers.sprites.children.length).toBe(0);
    });

    test('the text added last is on top', () => {
        const world = fakeWorld();
        const stage = stageWithLayers(world);

        textOn(stage, world, "One");
        textOn(stage, world, "Two");

        expect(order(stage)).toEqual(["One", "Two"]);
    });

    test('to the back and to the front', () => {
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const one = textOn(stage, world, "One");
        const two = textOn(stage, world, "Two");
        textOn(stage, world, "Three");

        two._goToBackLayer();
        expect(order(stage)).toEqual(["Two", "One", "Three"]);

        one._goToFrontLayer();
        expect(order(stage)).toEqual(["Two", "Three", "One"]);
    });

    test('forwards and backwards by a number of layers, no further than the ends', () => {
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const one = textOn(stage, world, "One");
        textOn(stage, world, "Two");
        const three = textOn(stage, world, "Three");

        one._goLayersForwards(1);
        expect(order(stage)).toEqual(["Two", "One", "Three"]);

        three._goLayersBackwards(2);
        expect(order(stage)).toEqual(["Three", "Two", "One"]);

        // asking for more layers than there are leaves it at the end
        three._goLayersBackwards(10);
        expect(order(stage)).toEqual(["Three", "Two", "One"]);
        three._goLayersForwards(10);
        expect(order(stage)).toEqual(["Two", "One", "Three"]);
    });

    test('saying something else keeps the layer the text was put in', () => {
        // The text is rebuilt whenever anything about it changes, and a new
        // child goes on top: a score sent to the back came back to the front the
        // moment it counted up.
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const one = textOn(stage, world, "One");
        textOn(stage, world, "Two");

        one._goToBackLayer();
        one._showText("One again");
        expect(order(stage)).toEqual(["One again", "Two"]);

        one._setPosition(40, 40);
        expect(order(stage)).toEqual(["One again", "Two"]);
    });

    test('plain words are centred on the position they were given', () => {
        // They used to be drawn eight pixels down and to the right of it - the
        // padding a framed style needs inside its border - so a centred label
        // never landed on the thing it labelled.
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const text = textOn(stage, world, "Hello");

        const container = (text as unknown as { container: PIXI.Container }).container;
        const label = labelOf(text);
        expect(container.x).toBe(world.width / 2);
        expect(container.y).toBe(world.height / 2);
        expect(label.x).toBeCloseTo(-label.width / 2);
        expect(label.y).toBeCloseTo(-label.height / 2);
    });

    test('a width with no room for a letter does not wrap the words', () => {
        // new Text("42", x, y, 1) asks for one, and it drew a 4 above a 2.
        const world = fakeWorld();
        const stage = stageWithLayers(world);

        expect(labelOf(textOn(stage, world, "42", 1)).style.wordWrap).toBe(false);
        // and neither does a width of none at all, as upstream
        expect(labelOf(textOn(stage, world, "42", 0)).style.wordWrap).toBe(false);
        // a width that can hold a line still wraps at it
        expect(labelOf(textOn(stage, world, "42", 200)).style.wordWrap).toBe(true);
    });

    test('a text with no stage yet does not fall over when its layer is changed', () => {
        const world = fakeWorld();
        const text = new ScratchTextClass();
        text._cj$_constructor_$Text$string$double$double$double(fakeThread(world), undefined, "Hello", 0, 0, 200);

        expect(() => {
            text._goToFrontLayer();
            text._goToBackLayer();
            text._goLayersForwards(2);
            text._goLayersBackwards(2);
        }).not.toThrow();
    });
});
