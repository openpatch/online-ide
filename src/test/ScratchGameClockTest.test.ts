import { expect, test } from 'vitest';
import { ScratchGameClock } from '../compiler/java/runtime/graphics/scratch/ScratchGameClock';

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
