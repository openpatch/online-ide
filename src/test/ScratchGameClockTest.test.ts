import { expect, test } from 'vitest';
import { ScratchGameClock, resetScratchGameClock, scratchGameClock } from '../compiler/java/runtime/graphics/scratch/ScratchGameClock';
import { ThreadState } from '../compiler/common/interpreter/ThreadState';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';

function frames(clock: ScratchGameClock, count: number) {
    let steps = 0;
    for (let frame = 0; frame < count; frame++) {
        const n = clock.frame(1 / 60);
        for (let step = 0; step < n; step++) clock.advance();
        steps += n;
    }
    return steps;
}

test.each([[1, 60, 1000], [0.5, 30, 500], [2, 120, 2000]])('speed %s matches desktop frame counts and game time', (speed, steps, millis) => {
    const clock = new ScratchGameClock();
    clock.setSpeed(speed);
    expect(frames(clock, 60)).toBe(steps);
    expect(clock.millis).toBeCloseTo(millis);
});

test('pause freezes timers; queued steps advance once; resume clears remaining requests', () => {
    const clock = new ScratchGameClock();
    frames(clock, 30);
    clock.pause();
    expect(frames(clock, 60)).toBe(0);
    expect(clock.millis).toBeCloseTo(500);
    clock.step(); clock.step();
    expect(frames(clock, 60)).toBe(2);
    expect(clock.millis).toBeCloseTo(500 + 1000 / 30);
    clock.step(); clock.resume();
    expect(frames(clock, 60)).toBe(60);
});

test('timed speech deadlines use game time and support cancellation', () => {
    const clock = new ScratchGameClock();
    let expired = 0;
    clock.schedule(() => expired++, 500);
    const cancel = clock.schedule(() => expired += 10, 250);
    cancel();
    clock.pause();
    frames(clock, 60);
    expect(expired).toBe(0);
    clock.resume();
    frames(clock, 31);
    expect(expired).toBe(1);
});

test('fast frames are bounded and invalid speeds cannot poison the clock', () => {
    const clock = new ScratchGameClock();
    clock.setSpeed(100);
    expect(clock.frame(1 / 60)).toBe(8);
    for (const speed of [-3, NaN, Infinity]) { clock.setSpeed(speed); expect(clock.speed).toBe(0); }
});

test('waitSeconds waits game time: it follows the speed, holds while paused and passes with steps', () => {
    // waitSeconds schedules on the clock singleton the stages run on, so the
    // test has to drive that one.
    const clock = resetScratchGameClock();
    expect(clock).toBe(scratchGameClock());
    const suspended: any[] = [];
    const restored: any[] = [];
    const thread: any = {
        scheduler: {
            suspendThread: (t: any) => suspended.push(t),
            restoreThread: (t: any) => restored.push(t),
        },
    };
    // Stage.waitSeconds, unbound from a stage: it only touches the thread and
    // the clock.
    const waitSeconds = (seconds: number) =>
        ScratchStageClass.prototype._mj$waitSeconds$void$double.call(undefined, thread, undefined, seconds);

    waitSeconds(1);
    expect(suspended).toEqual([thread]);           // the calling thread is parked
    expect(thread.state).toBe(ThreadState.timedWaiting);

    frames(clock, 30);                             // half a second of game time
    expect(restored).toEqual([]);

    clock.pause();
    frames(clock, 60);                             // paused: game time stands still
    expect(restored).toEqual([]);
    clock.resume();

    frames(clock, 30);                             // the other half
    expect(restored).toEqual([thread]);            // exactly 1 s of game time later

    // Half the speed: the same wait needs twice the game time to pass.
    resetScratchGameClock();
    const clock2 = scratchGameClock();
    const restored2: any[] = [];
    const thread2: any = { scheduler: { suspendThread: () => { }, restoreThread: (t: any) => restored2.push(t) } };
    ScratchStageClass.prototype._mj$waitSeconds$void$double.call(undefined, thread2, undefined, 1);
    clock2.setSpeed(0.5);
    frames(clock2, 60);
    expect(restored2).toEqual([]);
    frames(clock2, 60);
    expect(restored2).toEqual([thread2]);
});
