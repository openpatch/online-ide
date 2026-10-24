/**
 * The state of the connected gamepads, polled once per batch of ticks, right
 * before they run.
 *
 * This is the browser counterpart of the desktop library's internal gamepad
 * plumbing (extensions/gamepad: GamepadState, GamepadExtension and
 * GlfwGamepadSource): four player slots filled in the order the pads sit in
 * the system's gamepad list, and the edges between two polls turned into
 * GamepadListener calls. It carries no __javaDeclarations — the learner-facing
 * side lives in ScratchGamepadClasses.ts, which reads the state through the
 * accessors below.
 *
 * Everything works on plain numbers (ordinals) instead of the enum classes, so
 * this module stays free of imports from ScratchGamepadClasses and no import
 * cycle can arise.
 */

/** How many controllers can be read at once, mirroring GamepadState.PLAYERS. */
export const GAMEPAD_PLAYERS = 4;

/** How many buttons the GamepadButton enum has; the arrays below are indexed by ordinal. */
export const GAMEPAD_BUTTON_COUNT = 14;

/** Sticks report 0 around rest; anything nearer than this counts as rest (GlfwGamepadSource.DEAD_ZONE). */
export const GAMEPAD_DEAD_ZONE = 0.15;

/**
 * An event between two polls, with the button as a GamepadButton ordinal.
 * The dispatcher in ScratchRuntimeManager turns these into the
 * GamepadListener calls on the player's objects.
 */
export type GamepadEvent =
    | { kind: "connected", player: number }
    | { kind: "buttonPressed", player: number, button: number }
    | { kind: "buttonReleased", player: number, button: number };

/**
 * A gamepad as the Gamepad API hands it over — narrowed to what this module
 * reads, so tests can fake pads with plain objects.
 */
export type RawGamepad = {
    mapping?: string;
    buttons?: { pressed?: boolean, value?: number }[];
    axes?: number[];
};

type GamepadPlayerState = {
    connected: boolean;
    buttons: boolean[];
    sticks: number[];
    triggers: number[];
};

/**
 * The button of the W3C standard layout each Gamepad API slot carries, as its
 * GamepadButton ordinal. The order must match the GamepadButton enum; the gaps
 * are the analog triggers (read as values below) and the guide button, which
 * has no GamepadButton.
 */
const BUTTON_INDEX_TO_ORDINAL: (number | undefined)[] = [
    0, 1, 2, 3,             // A, B, X, Y
    4, 5,                   // LEFT_BUMPER, RIGHT_BUMPER
    undefined, undefined,   // the analog triggers, read as values below
    6, 7,                   // BACK, START
    8, 9,                   // LEFT_STICK, RIGHT_STICK
    10, 12, 13, 11,         // DPAD_UP, DPAD_DOWN, DPAD_LEFT, DPAD_RIGHT
    undefined,              // the guide button
];

function createSlots(): GamepadPlayerState[] {
    return Array.from({ length: GAMEPAD_PLAYERS }, () => ({
        connected: false,
        buttons: new Array(GAMEPAD_BUTTON_COUNT).fill(false),
        sticks: [0, 0, 0, 0],
        triggers: [0, 0],
    }));
}

function copySlots(into: GamepadPlayerState[], from: GamepadPlayerState[]) {
    for (let player = 0; player < GAMEPAD_PLAYERS; player++) {
        into[player].connected = from[player].connected;
        into[player].buttons = [...from[player].buttons];
        into[player].sticks = [...from[player].sticks];
        into[player].triggers = [...from[player].triggers];
    }
}

function clearSlots(slots: GamepadPlayerState[]) {
    for (const slot of slots) {
        slot.connected = false;
        slot.buttons.fill(false);
        slot.sticks.fill(0);
        slot.triggers.fill(0);
    }
}

/** The state the latest poll produced; what the Gamepad queries read. */
const now: GamepadPlayerState[] = createSlots();
/** The state the last diff saw; the baseline for the edge detection. */
const previous: GamepadPlayerState[] = createSlots();

/**
 * Where the controllers' state comes from; swapped out in tests, like the
 * desktop library's GamepadExtension.useSource. Returns the Gamepad API's
 * array (with null holes for pads the browser has not listed yet).
 */
let source: () => RawGamepad[] | undefined = () => {
    const getGamepads = (typeof navigator === "undefined" ? undefined : (navigator as any).getGamepads);
    return typeof getGamepads === "function" ? getGamepads.call(navigator) : undefined;
};

/** Replaces where the controllers' state comes from, for tests. */
export function useGamepadSource(s: () => RawGamepad[] | undefined) {
    source = s;
}

/**
 * Reads the controllers once. Only pads with the standard mapping count —
 * controllers without a known layout are skipped, as on the desktop — and
 * they fill the player slots 1 to 4 in the order the browser lists them.
 */
export function pollGamepads() {
    clearSlots(now);
    let player = 0;
    for (const pad of source() ?? []) {
        if (player >= GAMEPAD_PLAYERS) break;
        // A pad without a known layout has no reliable button order, so it
        // cannot be mapped onto the GamepadButton names.
        if (!pad || pad.mapping !== "standard") continue;
        fillSlot(now[player], pad);
        player++;
    }
}

function fillSlot(slot: GamepadPlayerState, pad: RawGamepad) {
    slot.connected = true;
    const buttons = pad.buttons ?? [];
    for (const [index, ordinal] of BUTTON_INDEX_TO_ORDINAL.entries()) {
        const button = buttons[index];
        if (ordinal === undefined || !button) continue;
        slot.buttons[ordinal] = button.pressed === true || (button.value ?? 0) > 0.5;
    }
    const axes = pad.axes ?? [];
    // The browser reports y down-positive, the stage up-positive, like the
    // desktop library; sticks resting near the middle report 0.
    slot.sticks[0] = deadZone(axes[0] ?? 0);
    slot.sticks[1] = stickY(axes[1] ?? 0);
    slot.sticks[2] = deadZone(axes[2] ?? 0);
    slot.sticks[3] = stickY(axes[3] ?? 0);
    slot.triggers[0] = buttons[6]?.value ?? 0;
    slot.triggers[1] = buttons[7]?.value ?? 0;
}

function deadZone(value: number): number {
    return Math.abs(value) < GAMEPAD_DEAD_ZONE ? 0 : value;
}

/** Turns the browser's down-positive y into the stage's up-positive one, without -0. */
function stickY(value: number): number {
    const y = deadZone(value);
    return y === 0 ? 0 : -y;
}

/**
 * Compares the latest poll with the previous one and turns the differences
 * into events, mirroring GamepadExtension's beforeTick: a controller that
 * appeared, and buttons that went down or up. Called once per batch of ticks,
 * before they run — so, as on the desktop, no events arrive while the game is
 * paused, and a button that goes down and up between two batches is not
 * reported.
 */
export function diffAndDispatchGamepads(dispatch: (event: GamepadEvent) => void) {
    for (let player = 1; player <= GAMEPAD_PLAYERS; player++) {
        const current = now[player - 1], before = previous[player - 1];
        if (current.connected && !before.connected) {
            dispatch({ kind: "connected", player });
        }
        // A pad that just went away keeps its buttons to itself: no burst of
        // releases for a controller that is no longer there.
        if (!current.connected) continue;
        for (let ordinal = 0; ordinal < GAMEPAD_BUTTON_COUNT; ordinal++) {
            const pressed = current.buttons[ordinal];
            if (pressed && !before.buttons[ordinal]) {
                dispatch({ kind: "buttonPressed", player, button: ordinal });
            } else if (!pressed && before.buttons[ordinal]) {
                dispatch({ kind: "buttonReleased", player, button: ordinal });
            }
        }
    }
    copySlots(previous, now);
}

function slotState(player: number): GamepadPlayerState | undefined {
    // Upstream's GamepadState.slot throws for players outside 1..4. At this
    // boundary the resting answers are friendlier: a program that probes for
    // controllers cannot crash on a wrong number.
    return player >= 1 && player <= GAMEPAD_PLAYERS ? now[player - 1] : undefined;
}

function firstConnectedPlayer(): number | undefined {
    return now.findIndex(slot => slot.connected) + 1 || undefined;
}

/** Whether a controller sits in the player's slot; without a player, whether any did. */
export function gamepadConnected(player?: number): boolean {
    if (player === undefined) return now.some(state => state.connected);
    return slotState(player)?.connected ?? false;
}

/** Whether the player's controller — or any of them — has the button down. */
export function gamepadButtonPressed(buttonOrdinal: number, player?: number): boolean {
    if (player === undefined) {
        return now.some(state => state.connected && state.buttons[buttonOrdinal]);
    }
    return slotState(player)?.buttons[buttonOrdinal] ?? false;
}

/**
 * Where the player's stick points — or the first connected controller's, when
 * no player is given — x from -1 (left) to 1 (right), y from -1 (down) to
 * 1 (up), as on the stage. (0, 0) without a controller.
 */
export function gamepadStick(stickOrdinal: number, player?: number): { x: number, y: number } {
    const state = slotState(player ?? firstConnectedPlayer() ?? NaN);
    if (!state) return { x: 0, y: 0 };
    return { x: state.sticks[stickOrdinal * 2], y: state.sticks[stickOrdinal * 2 + 1] };
}

/** How far down the player's trigger — or the first connected controller's — is, 0 without a controller. */
export function gamepadTrigger(triggerOrdinal: number, player?: number): number {
    const state = slotState(player ?? firstConnectedPlayer() ?? NaN);
    return state?.triggers[triggerOrdinal] ?? 0;
}
