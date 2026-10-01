import { afterEach, describe, expect, test, vi } from 'vitest';
// the interpreter and compiler first, as JavaTests does: importing the runtime classes
// on their own runs into an import cycle
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { ThreadState } from '../compiler/common/interpreter/ThreadState';
import { ScratchCostumes } from '../compiler/java/runtime/graphics/scratch/ScratchCostumes';
import { getTextureSampling, setTextureSampling, trackTexture } from '../compiler/java/runtime/graphics/scratch/ScratchTextureSampling';
import { TextureSampling } from '../compiler/java/runtime/graphics/scratch/TextureSamplingEnum';

/** Just enough of a texture: its source with the filters and the style the renderer caches. */
function fakeTexture(): any {
    const source = {
        minFilter: "linear", magFilter: "linear", destroyed: false,
        style: { updates: 0, update() { this.updates++; } },
    };
    return { source };
}

/** Just enough of a thread for ScratchCostumes.whenLoaded. */
function fakeThread(): any {
    return {
        state: ThreadState.running,
        thrown: undefined as any,
        throwRuntimeExceptionOnLastExecutedStep(e: any) { this.thrown = e; },
    };
}

describe('Scratch texture sampling', () => {

    afterEach(() => setTextureSampling(TextureSampling.LINEAR));

    test('a texture starts out linear', () => {
        const texture = trackTexture(fakeTexture());
        expect(texture.source.minFilter).toBe("linear");
        expect(texture.source.magFilter).toBe("linear");
    });

    test('POINT makes textures loaded before and after nearest', () => {
        const before = trackTexture(fakeTexture());
        setTextureSampling(TextureSampling.POINT);
        const after = trackTexture(fakeTexture());

        for (const texture of [before, after]) {
            expect(texture.source.minFilter).toBe("nearest");
            expect(texture.source.magFilter).toBe("nearest");
        }
        // the renderer has to drop its cached sampler
        expect(before.source.style.updates).toBe(1);
        expect(getTextureSampling()).toBe(TextureSampling.POINT);
    });

    test('BILINEAR and TRILINEAR are drawn linear', () => {
        const texture = trackTexture(fakeTexture());
        setTextureSampling(TextureSampling.POINT);
        setTextureSampling(TextureSampling.TRILINEAR);
        expect(texture.source.magFilter).toBe("linear");
    });
});

describe('Scratch images that have to be loaded first', () => {

    afterEach(() => vi.restoreAllMocks());

    test('a known image runs at once, without waiting', () => {
        vi.spyOn(ScratchCostumes, 'getTexture').mockReturnValue(<any>{});
        const t = fakeThread();
        const order: string[] = [];

        ScratchCostumes.whenLoaded(t, ["bunny1_stand"], () => order.push("callback"), () => order.push("action"));

        expect(order).toEqual(["action", "callback"]);
        expect(t.state).toBe(ThreadState.running);
    });

    test('a URL is loaded once, while the thread waits', async () => {
        vi.spyOn(ScratchCostumes, 'getTexture').mockReturnValue(undefined);
        let arrive!: (texture: any) => void;
        const load = vi.spyOn(ScratchCostumes, 'loadTexture')
            .mockReturnValue(new Promise(resolve => arrive = resolve));
        const t = fakeThread();
        const order: string[] = [];

        ScratchCostumes.whenLoaded(t, ["https://example.org/held.png", "https://example.org/held.png"],
            () => order.push("callback"), () => order.push("action"));

        expect(load).toHaveBeenCalledTimes(1);
        expect(t.state).toBe(ThreadState.waiting);
        expect(order).toEqual([]);

        arrive({});
        await vi.waitFor(() => expect(order).toEqual(["action", "callback"]));
        expect(t.state).toBe(ThreadState.running);
    });

    test('an image that cannot be loaded becomes a RuntimeException', async () => {
        vi.spyOn(ScratchCostumes, 'getTexture').mockReturnValue(undefined);
        vi.spyOn(ScratchCostumes, 'loadTexture').mockRejectedValue("404");
        const t = fakeThread();
        const action = vi.fn();

        ScratchCostumes.whenLoaded(t, ["https://example.org/fehlt.png"], () => { }, action);

        await vi.waitFor(() => expect(t.thrown).toBeDefined());
        expect(action).not.toHaveBeenCalled();
        expect(t.state).toBe(ThreadState.running);
        expect(String(t.thrown.message ?? t.thrown)).toContain("fehlt.png");
    });
});
