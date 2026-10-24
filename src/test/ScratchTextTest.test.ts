import * as PIXI from 'pixi.js';
import { beforeAll, describe, expect, test } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import { createScratchLayers } from '../compiler/java/runtime/graphics/scratch/ScratchLayers';
import { registerScratchFontMetrics } from '../compiler/java/runtime/graphics/scratch/ScratchFont';
import { ScratchTextClass } from '../compiler/java/runtime/graphics/scratch/ScratchTextClass';
import { TextStyleEnum } from '../compiler/java/runtime/graphics/scratch/TextStyleEnum';

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

/** The lines a text was drawn as, one label each. */
function linesOf(text: ScratchTextClass): string[] {
    const container = (text as unknown as { container: PIXI.Container }).container;
    return container.children.map((child: PIXI.Container) => (child as PIXI.Text).text);
}

/** The words of the texts in the layer, back to front. */
function order(stage: any): string[] {
    return stage.scratchLayers.texts.children.map(
        (child: PIXI.Container) => ((child.children[0] as PIXI.Text)?.text) ?? "");
}

/** The font PIXI measures a label's text in. */
function fontOf(label: PIXI.Text) {
    return PIXI.CanvasTextMetrics.measureText(label.text, label.style as PIXI.TextStyle).fontProperties;
}

/** Where PIXI draws the first baseline of a label, relative to the text's position. */
function firstBaseline(label: PIXI.Text): number {
    const metrics = PIXI.CanvasTextMetrics.measureText(label.text, label.style as PIXI.TextStyle);
    return label.y + metrics.fontProperties.ascent + Math.max(0, (metrics.lineHeight - metrics.fontProperties.fontSize) / 2);
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
        // vertically as the desktop's Text.toDraw for a plain text: the first
        // baseline sits (ascent + descent) / 2 below the position, the descent
        // negative, so the line's ink straddles the position evenly. Without a
        // font file the canvas's measures stand in: 10 up, 3 down.
        expect(firstBaseline(label)).toBeCloseTo((10 - 3) / 2);
    });

    test('the lines hang below the first, one line step apart', () => {
        // The desktop's TextLayout steps from one baseline to the next by the
        // font's own line height - ascent - descent + lineGap - with no extra
        // leading. Without a font file the canvas's measures stand in: 10 up,
        // 3 down, so the step is 13. Each line is a label of its own, and a
        // trailing "\n" adds an empty line that draws nothing.
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const container = (textOn(stage, world, "a\nb\nc\n", 200) as unknown as { container: PIXI.Container }).container;

        expect(container.children.map((c: any) => c.text)).toEqual(["a", "b", "c"]);
        const baselines = container.children.map((c: PIXI.Text) => firstBaseline(c));
        expect(baselines[0]).toBeCloseTo((10 - 3) / 2);
        expect(baselines[1]).toBeCloseTo((10 - 3) / 2 + 13);
        expect(baselines[2]).toBeCloseTo((10 - 3) / 2 + 2 * 13);
    });

    test('the first baseline hangs from the font file\'s metrics, not the canvas\'s', () => {
        // UbuntuMono's, as the desktop's Font.verticalMetrics reads them: hhea
        // 830 above and -170 below the baseline, at 1000 units per em. The
        // canvas's own ascent (10 in this fake) is a different measure - only
        // where the label sits comes from the real metrics, the glyphs inside
        // it still hang from the canvas's ascent.
        registerScratchFontMetrics("FancyFont", { unitsPerEm: 1000, ascent: 830, descent: -170, lineGap: 0 });
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const text = textOn(stage, world, "Hello", 400);
        text._addFont("fancy", "FancyFont");
        text._switchFont("fancy");
        text._setTextSize(48);

        const label = labelOf(text);
        const ascent = 830 * 48 / 1000;   // 39.84
        const descent = -170 * 48 / 1000; // -8.16
        expect(fontOf(label).ascent).toBe(10);
        expect(label.y).toBeCloseTo((ascent + descent) / 2 - 10);
        expect(firstBaseline(label)).toBeCloseTo((ascent + descent) / 2);
    });

    test('the words wrap where the line breaker breaks them', () => {
        // "aaa bbb" is 49 wide at 7 a letter: too wide for 40, so it breaks at
        // the space - each line a label of its own, the space on neither.
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const wrapped = textOn(stage, world, "aaa bbb", 40);
        expect(linesOf(wrapped)).toEqual(["aaa", "bbb"]);

        // a width with no room for a letter wraps between letters, one per
        // line: upstream keeps it at Math.max(1, inner), and the LineBreaker
        // breaks the word there - new Text("42", x, y, 1) drew a 4 above a 2
        expect(linesOf(textOn(stage, world, "42", 1))).toEqual(["4", "2"]);
        // and a width of none at all does not wrap, as upstream
        expect(linesOf(textOn(stage, world, "42", 0))).toEqual(["42"]);
    });

    test('a box stands on its bottom edge, its lines inside the padding', () => {
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        const text = textOn(stage, world, "Hello");
        text._setStyle(TextStyleEnum.values[1]);   // SPEAK

        const container = (text as unknown as { container: PIXI.Container }).container;
        const label = container.children[1] as PIXI.Text;
        // a bubble is at least BUBBLE_MIN_WIDTH wide - the minimum REPLACES
        // the words' width plus the padding (upstream's Text.toDraw), it is
        // not added to it - and stands on its bottom edge at the position
        expect(container.x).toBeCloseTo(world.width / 2 - 80 / 2);
        expect(container.y).toBeCloseTo(world.height / 2 - (13 + 16));
        // the first baseline is an ascent below the block's top, which sits in
        // the padding: PAD + ascent from the box's top
        expect(label.y).toBeCloseTo(8 + 10 - 10);
        expect(firstBaseline(label)).toBeCloseTo(8 + 10);
    });

    test('a box grows with its lines, one line step apart, centred in the block', () => {
        const world = fakeWorld();
        const stage = stageWithLayers(world);
        // upstream wraps the words inside the padding: 45 - 16 = 29 for them.
        // "aaa bbbbb" is 56 wide: "aaa" fits, "bbbbb" (35) does not and
        // breaks between letters, its last one on a line of its own
        const text = textOn(stage, world, "aaa bbbbb", 45);
        text._setStyle(TextStyleEnum.values[0]);   // BOX

        const container = (text as unknown as { container: PIXI.Container }).container;
        const labels = container.children.slice(1) as PIXI.Text[];
        expect(labels.map(l => l.text)).toEqual(["aaa", "bbbb", "b"]);
        // the box: three lines of 13 plus the padding above and below
        expect(container.y).toBeCloseTo(world.height / 2 - (3 * 13 + 16));
        // the second baseline a line step below the first, all centred in
        // the block of the widest line
        expect(firstBaseline(labels[1]) - firstBaseline(labels[0])).toBeCloseTo(13);
        expect(labels[0].x).toBeCloseTo(8 + (28 - 21) / 2);
        expect(labels[1].x).toBeCloseTo(8);
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
