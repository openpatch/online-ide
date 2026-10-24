import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { describe, expect, test } from 'vitest';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';
import { ThreadState } from '../compiler/common/interpreter/ThreadState';
import { JavaCompiler } from '../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../compiler/java/runtime/JavaLibraryManager';
import { CompilerFile } from '../compiler/common/module/CompilerFile';

/**
 * Stage.sortBy(Comparator): the browser port cannot run a student's comparator
 * synchronously — interpreted code only runs on a thread — so the stage sorts a
 * snapshot of its sprites with a callback-driven merge sort on a thread of its
 * own, once per rendered frame. With a native (synchronous) comparator the
 * whole sort completes inside the call, which is what the tests below use; an
 * interpreted comparator rides the same callbacks, one comparison per
 * scheduler step, exactly as ArrayList.sort() rides its quicksort.
 */

type SpriteStub = {
    name: string;
    x: number;
    y: number;
    isDestroyed: boolean;
    isUI(): boolean;
    depth: number | undefined;
    _getY(): number;
    _getSpriteHeight(): number;
    _setDrawDepth(depth: number): void;
};

function sprite(name: string, x: number, y: number = 0): SpriteStub {
    const sprite: SpriteStub = {
        name,
        x,
        y,
        isDestroyed: false,
        isUI: () => false,
        depth: undefined,
        _getY: () => sprite.y,
        _getSpriteHeight: () => 10,
        _setDrawDepth(depth: number) { sprite.depth = depth; },
    };
    return sprite;
}

/** A native comparator: synchronous, so the callback-driven sort finishes within the call. */
function comparatorBy(order: (a: SpriteStub, b: SpriteStub) => number) {
    return {
        _mj$compare$int$T$T(t: { s: number[] }, callback: () => void, a: SpriteStub, b: SpriteStub) {
            t.s.push(order(a, b));
            callback();
        },
    };
}

function stageWith(sprites: SpriteStub[]) {
    const threads: any[] = [];
    const stage: any = Object.create(ScratchStageClass.prototype);
    stage.sprites = sprites;
    stage.sortByYEnabled = false;
    stage.scratchLayers = { sprites: { sortableChildren: false, destroyed: false } };
    stage.world = {
        interpreter: {
            scheduler: {
                createThread: (name: string) => {
                    const thread: any = { s: [], state: undefined, name };
                    threads.push(thread);
                    return thread;
                },
            },
        },
    };
    const layer = stage.scratchLayers.sprites as { sortableChildren: boolean };
    return { stage, threads, layer };
}

describe('Stage.sortBy', () => {

    test('orders the draw depths by the comparator, its smallest sprite drawn first', () => {
        const a = sprite('a', 30), b = sprite('b', 10), c = sprite('c', 20);
        const { stage, threads, layer } = stageWith([a, b, c]);

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => a.x - b.x));
        expect(stage.sortByYEnabled).toBe(false);
        stage._applySorting();

        expect(layer.sortableChildren).toBe(true);
        expect(b.depth).toBe(0);
        expect(c.depth).toBe(1);
        expect(a.depth).toBe(2);
        // the pass ran on its own thread, which the scheduler is meant to step
        expect(threads).toHaveLength(1);
        expect(threads[0].name).toBe('scratch sortBy');
        expect(threads[0].state).toBe(ThreadState.running);
    });

    test('a reversed comparator turns the order around', () => {
        const a = sprite('a', 30), b = sprite('b', 10), c = sprite('c', 20);
        const { stage } = stageWith([a, b, c]);

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => b.x - a.x));
        stage._applySorting();

        expect(a.depth).toBe(0);
        expect(c.depth).toBe(1);
        expect(b.depth).toBe(2);
    });

    test('sprites that compare equal keep the order they were in', () => {
        const a = sprite('a', 10), b = sprite('b', 10), c = sprite('c', 10);
        const { stage } = stageWith([a, b, c]);

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy(() => 0));
        stage._applySorting();

        expect(a.depth).toBe(0);
        expect(b.depth).toBe(1);
        expect(c.depth).toBe(2);
    });

    test('the last sorting order to be set wins', () => {
        const a = sprite('a', 30, 10), b = sprite('b', 10, 30);
        const { stage, layer } = stageWith([a, b]);

        // sortBy, then sortByY: the comparator is out again, the y order is on
        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => a.x - b.x));
        stage._sortByY();
        expect(stage.sortByYEnabled).toBe(true);
        expect(stage.sortComparator).toBeUndefined();
        stage._applySorting();
        expect(stage.sortJob).toBeUndefined();
        expect(a.depth).toBe(-(10 - 5)); // sortByY: the lower edge decides
        expect(b.depth).toBe(-(30 - 5));

        // sortByY, then sortBy: the comparator is back
        stage._sortByY();
        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => a.x - b.x));
        stage._applySorting();
        expect(stage.sortByYEnabled).toBe(false);
        expect(b.depth).toBe(0);
        expect(a.depth).toBe(1);

        // stopSorting: no order at all, the layer falls back to its own order
        const drawCalls = [a, b].map(sprite => sprite.depth!.valueOf());
        a.depth = undefined;
        b.depth = undefined;
        stage._stopSorting();
        expect(stage.sortByYEnabled).toBe(false);
        expect(stage.sortComparator).toBeUndefined();
        stage._applySorting();
        expect(layer.sortableChildren).toBe(false);
        expect(stage.sortJob).toBeUndefined();
        expect(a.depth).toBeUndefined();
        expect(b.depth).toBeUndefined();
        expect(drawCalls).toEqual([1, 0]);
    });

    test('a pass whose thread died is dropped and started again', () => {
        const a = sprite('a', 30), b = sprite('b', 10);
        const { stage, threads } = stageWith([a, b]);

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => a.x - b.x));
        stage._applySorting();
        expect(b.depth).toBe(0);

        // the comparator threw on the pass before: the next frame starts over
        stage.sortJob = { thread: { state: ThreadState.terminatedWithException }, sprites: [a, b] };
        b.depth = undefined;
        stage._applySorting();
        expect(stage.sortJob).toBeUndefined();
        expect(threads).toHaveLength(2);
        expect(b.depth).toBe(0);

        // a pass still in flight is left alone
        const runningJob = { thread: { state: ThreadState.running }, sprites: [a, b] };
        stage.sortJob = runningJob;
        b.depth = undefined;
        stage._applySorting();
        expect(stage.sortJob).toBe(runningJob);
        expect(threads).toHaveLength(2);
        expect(b.depth).toBeUndefined();
    });

    test('UI sprites are not sorted and destroyed ones are skipped', () => {
        const a = sprite('a', 30), ui = sprite('ui', 5), gone = sprite('gone', 1), b = sprite('b', 20);
        ui.isUI = () => true;
        gone.isDestroyed = true;
        const { stage } = stageWith([a, ui, gone, b]);

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => a.x - b.x));
        stage._applySorting();

        // only a and b were in the snapshot: b first (x = 20), then a (x = 30)
        expect(b.depth).toBe(0);
        expect(a.depth).toBe(1);
        expect(ui.depth).toBeUndefined();
        expect(gone.depth).toBeUndefined();
    });

    test('a sprite destroyed while the pass runs keeps the depth it had', () => {
        const late = sprite('late', 5), b = sprite('b', 20);
        const { stage } = stageWith([late, b]);

        // the comparator destroys "late" with its first comparison; the pass
        // sorts it anyway and skips it when the order is applied
        let calls = 0;
        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => {
            if (++calls === 1) late.isDestroyed = true;
            return a.x - b.x;
        }));
        stage._applySorting();

        expect(late.depth).toBeUndefined();
        expect(b.depth).toBe(1); // its place in the sorted snapshot, not shifted up
    });

    test('an interpreted comparator answers one comparison per scheduler step', () => {
        const a = sprite('a', 30), b = sprite('b', 10), c = sprite('c', 20);
        const { stage, threads, layer } = stageWith([a, b, c]);

        // an interpreted comparator cannot answer synchronously: it leaves the
        // comparison pending until the scheduler steps the sort thread again
        const pending: (() => void)[] = [];
        const comparator = {
            _mj$compare$int$T$T(t: { s: number[] }, callback: () => void, a: SpriteStub, b: SpriteStub) {
                pending.push(() => { t.s.push(a.x - b.x); callback(); });
            },
        };

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparator);
        stage._applySorting();
        expect(stage.sortJob).toBeDefined();
        expect(threads[0].state).toBe(ThreadState.running);
        expect(a.depth).toBeUndefined(); // nothing decided yet

        // while the pass is in flight, the next frame starts no second one
        stage._applySorting();
        expect(threads).toHaveLength(1);

        // the scheduler steps the thread until the pass is through
        while (pending.length) pending.shift()!();
        expect(stage.sortJob).toBeUndefined();
        expect(b.depth).toBe(0);
        expect(c.depth).toBe(1);
        expect(a.depth).toBe(2);
        expect(layer.sortableChildren).toBe(true);
    });

    test('a new sortBy while a pass is in flight cancels it', () => {
        const a = sprite('a', 30), b = sprite('b', 10);
        const { stage, threads } = stageWith([a, b]);

        const pending: (() => void)[] = [];
        const comparator = {
            _mj$compare$int$T$T(t: { s: number[] }, callback: () => void, a: SpriteStub, b: SpriteStub) {
                pending.push(() => { t.s.push(a.x - b.x); callback(); });
            },
        };

        stage._mj$sortBy$void$Comparator(undefined, undefined, comparator);
        stage._applySorting();
        expect(stage.sortJob).toBeDefined();
        const abandoned = stage.sortJob.thread;

        // the comparator is swapped before the pass got anywhere
        stage._mj$sortBy$void$Comparator(undefined, undefined, comparatorBy((a, b) => a.x - b.x));
        expect(stage.sortJob).toBeUndefined();
        expect(abandoned.state).toBe(ThreadState.terminated);

        // the next pass runs with the new comparator and completes
        stage._applySorting();
        expect(threads).toHaveLength(2);
        expect(b.depth).toBe(0);
        expect(a.depth).toBe(1);
        expect(pending).toHaveLength(1); // the cancelled pass was never stepped
    });

    test('sortBy compiles with a lambda against the scratch library', async () => {
        const compiler = new JavaCompiler();
        const libraries = new JavaLibraryManager();
        libraries.addLibraries('scratch');
        libraries.addLibrariesToCompiler(compiler);
        const file = new CompilerFile('SortBy.java');
        file.setText(`
void main() {
    Stage stage = new Stage();
    stage.sortBy((a, b) -> (int) Math.signum(a.getX() - b.getX()));
    stage.sortByY();
    stage.stopSorting();
}`);
        compiler.setFiles([file]);
        const executable = await compiler.compileIfDirty();
        const errors = (executable?.getAllErrors() ?? []).filter(error => error.level === 'error');
        expect(errors.map(error => error.message)).toEqual([]);
    });

    test('sortBy compiles with an explicit java.util.Comparator variable', async () => {
        const compiler = new JavaCompiler();
        const libraries = new JavaLibraryManager();
        libraries.addLibraries('scratch');
        libraries.addLibrariesToCompiler(compiler);
        const file = new CompilerFile('SortByComparator.java');
        // NOTE: the fully qualified `java.util.Comparator<Sprite> order = ...`
        // inline does not resolve in student code — the runtime collections live
        // without packages, and no java.util package is imported (java.util.List
        // fails the same way). The import is the form that works.
        file.setText(`
import java.util.Comparator;

void main() {
    Stage stage = new Stage();
    Comparator<Sprite> order = (a, b) -> 0;
    stage.sortBy(order);
}`);
        compiler.setFiles([file]);
        const executable = await compiler.compileIfDirty();
        const errors = (executable?.getAllErrors() ?? []).filter(error => error.level === 'error');
        expect(errors.map(error => error.message)).toEqual([]);
    });
});
