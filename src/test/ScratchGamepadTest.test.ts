import { beforeEach, expect, test, vi } from 'vitest';
// the interpreter and compiler first, as the other scratch tests do: importing
// the runtime classes on their own runs into an import cycle
import '../compiler/common/interpreter/Interpreter';
import { JavaCompiler } from '../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../compiler/java/runtime/JavaLibraryManager';
import { CompilerFile } from '../compiler/common/module/CompilerFile';
import * as PIXI from 'pixi.js';
import { GamepadButtonEnum } from '../compiler/java/runtime/graphics/scratch/ScratchGamepadClasses';
import {
    GamepadEvent, diffAndDispatchGamepads, gamepadButtonPressed, gamepadConnected,
    gamepadStick, gamepadTrigger, pollGamepads, useGamepadSource,
} from '../compiler/java/runtime/graphics/scratch/ScratchGamepadState';
import { ThreadState } from '../compiler/common/interpreter/ThreadState';
import { resetScratchGameClock } from '../compiler/java/runtime/graphics/scratch/ScratchGameClock';
import { ScratchRuntimeManager } from '../compiler/java/runtime/graphics/scratch/ScratchRuntimeManager';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';
import { beginScratchStages, registerScratchStage } from '../compiler/java/runtime/graphics/scratch/ScratchStages';

/**
 * The browser port of the gamepad extension (org.openpatch.scratch.gamepad):
 * the declarations compile as in a desktop file, the queries read the state
 * the poll fills from the Gamepad API, and the edges between two polls become
 * the GamepadListener calls — once per batch of ticks, paced by the IDE's
 * speed slider together with the program.
 */

/** A fake pad with the W3C standard layout, as tests need it. */
function pad(buttons: number[] = [], axes: number[] = []): any {
    return {
        mapping: 'standard',
        buttons: Array.from({ length: 17 }, (_, index) =>
            ({ pressed: buttons.includes(index), value: buttons.includes(index) ? 1 : 0 })),
        axes,
    };
}

/** A pad with an unknown layout; the poll must skip it. */
function unmappedPad(): any {
    return { mapping: '', buttons: [], axes: [] };
}

beforeEach(() => {
    useGamepadSource(() => []);
    pollGamepads();
    diffAndDispatchGamepads(() => { });
});

test('a program with the gamepad extension compiles, with and without import', async () => {
    for (const withImport of [true, false]) {
        const compiler = new JavaCompiler();
        const libraries = new JavaLibraryManager();
        libraries.addLibraries('scratch');
        libraries.addLibrariesToCompiler(compiler);
        const file = new CompilerFile('Main.java');
        file.setText(`
${withImport ? 'import org.openpatch.scratch.gamepad.*;' : ''}
class Player extends Sprite implements GamepadListener {
  private int jumps = 0;
  private int connects = 0;

  public void run() {
    Vector2 stick = Gamepad.getStick(1, GamepadStick.LEFT);
    this.changePosition(stick.multiply(5));
    if (Gamepad.getTrigger(2, GamepadTrigger.RIGHT) > 0.5) {
      this.setSize(50);
    }
    if (Gamepad.isButtonPressed(GamepadButton.A) || Gamepad.isConnected(3)) {
      this.turnRight(5);
    }
  }

  public void whenGamepadButtonPressed(GamepadButton button) {
    if (button == GamepadButton.A) {
      this.jumps++;
    }
  }

  public void whenGamepadButtonReleased(GamepadButton button) {
  }

  public void whenGamepadConnected(int player) {
    this.connects++;
  }
}
void main() {
  Window w = new Window(320,200); Stage s = new Stage(); w.setStage(s);
  Player p = new Player(); s.add(p);
  println(Gamepad.isConnected() + "," + Gamepad.getStick(GamepadStick.RIGHT).getX());
}`);
        compiler.setFiles([file]);
        const executable = await compiler.compileIfDirty();
        expect(executable?.getAllErrors().filter(error => error.level === 'error'), withImport ? 'with import' : 'without import').toEqual([]);
    }
});

test('the poll maps the standard layout, turns y up and rests near the middle', () => {
    useGamepadSource(() => [pad(
        [0, 4, 8, 12, 15],     // A, LEFT_BUMPER, BACK, DPAD_UP, DPAD_RIGHT
        [0.5, -0.5, 0.05, 1],  // left stick x/y, right stick x (dead zone), right stick y
    )]);
    pollGamepads();

    expect(gamepadConnected()).toBe(true);
    expect(gamepadConnected(1)).toBe(true);
    expect(gamepadConnected(2)).toBe(false);
    expect(gamepadButtonPressed(GamepadButtonEnum.values[0].ordinal)).toBe(true);      // A
    expect(gamepadButtonPressed(GamepadButtonEnum.values[4].ordinal)).toBe(true);      // LEFT_BUMPER
    expect(gamepadButtonPressed(GamepadButtonEnum.values[10].ordinal)).toBe(true);     // DPAD_UP
    expect(gamepadButtonPressed(GamepadButtonEnum.values[11].ordinal)).toBe(true);     // DPAD_RIGHT
    expect(gamepadButtonPressed(GamepadButtonEnum.values[13].ordinal)).toBe(false);    // DPAD_LEFT
    // y is up-positive, as on the stage, and 0.05 rests inside the dead zone
    expect(gamepadStick(0)).toEqual({ x: 0.5, y: 0.5 });
    expect(gamepadStick(1)).toEqual({ x: 0, y: -1 });
});

test('the d-pad follows the W3C standard order: 12 up, 13 down, 14 left, 15 right', () => {
    useGamepadSource(() => [pad([13])]);   // the browser's "down"
    pollGamepads();
    expect(gamepadButtonPressed(GamepadButtonEnum.values[10].ordinal)).toBe(false);  // DPAD_UP
    expect(gamepadButtonPressed(GamepadButtonEnum.values[12].ordinal)).toBe(true);   // DPAD_DOWN
    expect(gamepadButtonPressed(GamepadButtonEnum.values[11].ordinal)).toBe(false);  // DPAD_RIGHT
    expect(gamepadButtonPressed(GamepadButtonEnum.values[13].ordinal)).toBe(false);  // DPAD_LEFT

    useGamepadSource(() => [pad([14])]);  // the browser's "left"
    pollGamepads();
    expect(gamepadButtonPressed(GamepadButtonEnum.values[13].ordinal)).toBe(true);   // DPAD_LEFT
});

test('triggers report how far down they are, 0 without a controller', () => {
    useGamepadSource(() => [pad([], [])]);
    pollGamepads();
    // the analog triggers are standard buttons 6 and 7, with a value
    useGamepadSource(() => [{
        mapping: 'standard',
        buttons: Array.from({ length: 17 }, (_, index) =>
            ({ pressed: index === 7, value: index === 6 ? 0.25 : index === 7 ? 1 : 0 })),
        axes: [],
    }]);
    pollGamepads();
    expect(gamepadTrigger(0)).toBe(0.25);  // LEFT
    expect(gamepadTrigger(1)).toBe(1);     // RIGHT

    useGamepadSource(() => []);
    pollGamepads();
    expect(gamepadTrigger(0)).toBe(0);
    expect(gamepadTrigger(1)).toBe(0);
});

test('without a player number, buttons ask everyone and sticks and triggers the first pad', () => {
    useGamepadSource(() => [pad([1]), pad([2])]);   // B on the first pad, X on the second
    pollGamepads();
    expect(gamepadConnected()).toBe(true);
    expect(gamepadConnected(1)).toBe(true);
    expect(gamepadConnected(2)).toBe(true);
    expect(gamepadButtonPressed(GamepadButtonEnum.values[1].ordinal)).toBe(true);   // B, first pad
    expect(gamepadButtonPressed(GamepadButtonEnum.values[2].ordinal)).toBe(true);   // X, second pad
    expect(gamepadButtonPressed(GamepadButtonEnum.values[3].ordinal)).toBe(false);  // Y, nobody
    expect(gamepadStick(0, 2)).toEqual({ x: 0, y: 0 });   // the second pad rests
});

test('pads without a known layout are skipped, and only four players exist', () => {
    useGamepadSource(() => [unmappedPad(), pad([0]), unmappedPad()]);
    pollGamepads();
    expect(gamepadConnected(1)).toBe(true);   // the standard pad takes slot 1, the unmapped ones none
    expect(gamepadConnected(2)).toBe(false);
    expect(gamepadButtonPressed(GamepadButtonEnum.values[0].ordinal)).toBe(true);

    useGamepadSource(() => [pad([0]), pad(), pad(), pad(), pad([3])]);
    pollGamepads();
    expect(gamepadConnected(4)).toBe(true);
    expect(gamepadConnected(5)).toBe(false);  // the fifth pad has no player
    expect(gamepadButtonPressed(GamepadButtonEnum.values[3].ordinal)).toBe(false);
});

test('the edges between two polls become connected, pressed and released', () => {
    const events: GamepadEvent[] = [];
    const dispatch = (event: GamepadEvent) => events.push(event);

    useGamepadSource(() => [pad()]);
    pollGamepads();
    diffAndDispatchGamepads(dispatch);
    expect(events).toEqual([{ kind: 'connected', player: 1 }]);

    useGamepadSource(() => [pad([0])]);
    pollGamepads();
    diffAndDispatchGamepads(dispatch);
    expect(events[1]).toEqual({ kind: 'buttonPressed', player: 1, button: GamepadButtonEnum.values[0].ordinal });

    useGamepadSource(() => [pad()]);
    pollGamepads();
    diffAndDispatchGamepads(dispatch);
    expect(events[2]).toEqual({ kind: 'buttonReleased', player: 1, button: GamepadButtonEnum.values[0].ordinal });

    // a button that goes down and up between two polls is not reported
    useGamepadSource(() => [pad([1])]);
    pollGamepads();
    useGamepadSource(() => [pad()]);
    pollGamepads();
    diffAndDispatchGamepads(dispatch);
    expect(events).toHaveLength(3);
});

test('the runtime manager tells the listener objects, on interpreter threads', () => {
    const store = new Map();
    const threads: any[] = [];
    const interpreter: any = {
        keyboardManager: undefined,
        scheduler: { createThread: (name: string) => { const t: any = { name, s: [] }; threads.push(t); return t; } },
        retrieveObject: (key: string) => store.get(key),
        storeObject: (key: string, value: any) => store.set(key, value),
    };
    const world: any = {
        width: 600, height: 240, interpreter,
        mouseManager: { internalMouseListeners: [] },
        app: { stage: new PIXI.Container() },
    };
    const manager = new ScratchRuntimeManager(interpreter, world);

    const heard: string[] = [];
    const player: any = {
        _mj$whenGamepadButtonPressed$void$GamepadButton: (t: any, cb: any, button: any) =>
            heard.push('pressed ' + button.name),
        _mj$whenGamepadConnected$void$int: (t: any, cb: any, playerNumber: number) =>
            heard.push('connected ' + playerNumber),
    };
    manager.register(player, { gamepad: true });

    useGamepadSource(() => [pad()]);
    manager.pollAndDispatchGamepads();
    useGamepadSource(() => [pad([0])]);
    manager.pollAndDispatchGamepads();
    useGamepadSource(() => [pad([1])]);
    manager.pollAndDispatchGamepads();   // another button goes down, player listens again

    expect(heard).toEqual(['connected 1', 'pressed A', 'pressed B']);
    expect(threads.map(t => t.name)).toEqual([
        'scratch whenGamepadConnected', 'scratch whenGamepadButtonPressed', 'scratch whenGamepadButtonPressed',
    ]);
    expect(threads.every(t => t.state === ThreadState.running)).toBe(true);

    manager.destroy();
});

test('the game clock polls the gamepads and re-applies the sort once per batch of ticks', () => {
    const clock = resetScratchGameClock();
    beginScratchStages({ width: 800, height: 400, app: { stage: { addChild: (c: any) => c } } } as any);
    const stage: any = Object.create(ScratchStageClass.prototype);
    stage.sprites = [];
    stage.isActing = false;
    stage._activate = () => { };
    stage._deactivate = () => { };
    stage._preRender = () => { };
    const polls = vi.fn();
    const sorts = vi.fn();
    stage.runtime = { pollAndDispatchGamepads: polls };
    stage._applySorting = sorts;
    registerScratchStage(stage);

    clock.runFrame(undefined as any, [stage]);
    expect(polls).toHaveBeenCalledTimes(1);      // the batch ran its ticks
    expect(sorts).toHaveBeenCalledTimes(1);

    clock.pause();
    polls.mockClear();
    sorts.mockClear();
    clock.runFrame(undefined as any, [stage]);
    expect(polls).not.toHaveBeenCalled();       // paused: no ticks run, so —
    expect(sorts).not.toHaveBeenCalled();       // like the desktop — nothing is handed out

    clock.step();                               // Window.step(): one tick while paused
    clock.runFrame(undefined as any, [stage]);
    expect(polls).toHaveBeenCalledTimes(1);
    expect(sorts).toHaveBeenCalledTimes(1);
});
