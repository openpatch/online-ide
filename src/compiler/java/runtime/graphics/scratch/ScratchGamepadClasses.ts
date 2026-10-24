import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { InterfaceClass } from "../../system/javalang/InterfaceClass";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import {
    gamepadButtonPressed, gamepadConnected, gamepadStick, gamepadTrigger,
} from "./ScratchGamepadState";
import { SRC } from "./ScratchLibraryComments";
import { ScratchVector2Class } from "./ScratchVector2Class";

/**
 * Gamepad support, mirroring org.openpatch.scratch.gamepad. The controllers are
 * polled once per batch of ticks from the Gamepad API (see ScratchGamepadState),
 * before the batch's ticks run, and the edges between two polls become the
 * GamepadListener calls — the same point of the tick as key events, and paced
 * by the IDE's speed slider together with the program.
 *
 * Like on the desktop, players are numbered 1 to 4 in the order their pads sit
 * in the system's gamepad list, and only pads with a known (standard) layout
 * are used.
 */

/**
 * A button of a gamepad, in Xbox positions. On a PlayStation controller A is
 * Cross, B is Circle, X is Square and Y is Triangle; the bumpers are L1 and R1.
 */
export enum GamepadButton {
    A, B, X, Y, LEFT_BUMPER, RIGHT_BUMPER, BACK, START,
    LEFT_STICK, RIGHT_STICK, DPAD_UP, DPAD_RIGHT, DPAD_DOWN, DPAD_LEFT,
}

export class GamepadButtonEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.gamepad", signature: "enum GamepadButton", comment: SRC.gamepadButtonClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new GamepadButtonEnum("A", GamepadButton.A),
        new GamepadButtonEnum("B", GamepadButton.B),
        new GamepadButtonEnum("X", GamepadButton.X),
        new GamepadButtonEnum("Y", GamepadButton.Y),
        new GamepadButtonEnum("LEFT_BUMPER", GamepadButton.LEFT_BUMPER),
        new GamepadButtonEnum("RIGHT_BUMPER", GamepadButton.RIGHT_BUMPER),
        new GamepadButtonEnum("BACK", GamepadButton.BACK),
        new GamepadButtonEnum("START", GamepadButton.START),
        new GamepadButtonEnum("LEFT_STICK", GamepadButton.LEFT_STICK),
        new GamepadButtonEnum("RIGHT_STICK", GamepadButton.RIGHT_STICK),
        new GamepadButtonEnum("DPAD_UP", GamepadButton.DPAD_UP),
        new GamepadButtonEnum("DPAD_RIGHT", GamepadButton.DPAD_RIGHT),
        new GamepadButtonEnum("DPAD_DOWN", GamepadButton.DPAD_DOWN),
        new GamepadButtonEnum("DPAD_LEFT", GamepadButton.DPAD_LEFT),
    ];
}

/** One of a gamepad's two sticks. */
export enum GamepadStick { LEFT, RIGHT }

export class GamepadStickEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.gamepad", signature: "enum GamepadStick", comment: SRC.gamepadStickClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new GamepadStickEnum("LEFT", GamepadStick.LEFT),
        new GamepadStickEnum("RIGHT", GamepadStick.RIGHT),
    ];
}

/** One of a gamepad's two analog triggers (the shoulder buttons that go down gradually). */
export enum GamepadTrigger { LEFT, RIGHT }

export class GamepadTriggerEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.gamepad", signature: "enum GamepadTrigger", comment: SRC.gamepadTriggerClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new GamepadTriggerEnum("LEFT", GamepadTrigger.LEFT),
        new GamepadTriggerEnum("RIGHT", GamepadTrigger.RIGHT),
    ];
}

/**
 * What a stage or sprite is told about the controllers, at the same point of
 * the tick as key events (before run()): a button going down or up on any
 * player's controller, and a controller appearing in a player's slot. Unlike
 * the keys, the calls do not arrive while the game is paused — a paused game
 * runs no ticks, and only the keys are handed out (as on the desktop). A
 * button that goes down and up between two ticks is not reported; ask Gamepad
 * in run() for the state that stays.
 */
export class GamepadListenerInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.gamepad", signature: "interface GamepadListener", comment: SRC.gamepadListenerClassComment },
        { type: "method", signature: "default void whenGamepadButtonPressed(GamepadButton button)", java: GamepadListenerInterface.prototype._mj$whenGamepadButtonPressed$void$GamepadButton, comment: SRC.gamepadWhenGamepadButtonPressedComment },
        { type: "method", signature: "default void whenGamepadButtonReleased(GamepadButton button)", java: GamepadListenerInterface.prototype._mj$whenGamepadButtonReleased$void$GamepadButton, comment: SRC.gamepadWhenGamepadButtonReleasedComment },
        { type: "method", signature: "default void whenGamepadConnected(int player)", java: GamepadListenerInterface.prototype._mj$whenGamepadConnected$void$int, comment: SRC.gamepadWhenGamepadConnectedComment },
    ];

    _mj$whenGamepadButtonPressed$void$GamepadButton(_t: Thread, _callback: CallbackFunction, _button: GamepadButtonEnum) { }
    _mj$whenGamepadButtonReleased$void$GamepadButton(_t: Thread, _callback: CallbackFunction, _button: GamepadButtonEnum) { }
    _mj$whenGamepadConnected$void$int(_t: Thread, _callback: CallbackFunction, _player: number) { }
}

/**
 * Asks the connected controllers, mirroring org.openpatch.scratch.gamepad.Gamepad.
 * All methods are static; without a player number they look at all controllers.
 */
export class ScratchGamepadClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.gamepad", signature: "class Gamepad extends Object", comment: SRC.gamepadClassComment },

        { type: "method", signature: "static boolean isConnected()", native: ScratchGamepadClass._isConnected, comment: SRC.gamepadIsConnectedComment },
        { type: "method", signature: "static boolean isConnected(int player)", native: ScratchGamepadClass._isConnectedPlayer, comment: SRC.gamepadIsConnectedPlayerComment },
        { type: "method", signature: "static boolean isButtonPressed(GamepadButton button)", native: ScratchGamepadClass._isButtonPressed, comment: SRC.gamepadIsButtonPressedComment },
        { type: "method", signature: "static boolean isButtonPressed(int player, GamepadButton button)", native: ScratchGamepadClass._isButtonPressedPlayer, comment: SRC.gamepadIsButtonPressedPlayerComment },
        { type: "method", signature: "static Vector2 getStick(GamepadStick stick)", native: ScratchGamepadClass._getStick, comment: SRC.gamepadGetStickComment },
        { type: "method", signature: "static Vector2 getStick(int player, GamepadStick stick)", native: ScratchGamepadClass._getStickPlayer, comment: SRC.gamepadGetStickPlayerComment },
        { type: "method", signature: "static double getTrigger(GamepadTrigger trigger)", native: ScratchGamepadClass._getTrigger, comment: SRC.gamepadGetTriggerComment },
        { type: "method", signature: "static double getTrigger(int player, GamepadTrigger trigger)", native: ScratchGamepadClass._getTriggerPlayer, comment: SRC.gamepadGetTriggerPlayerComment },
    ];

    static type: NonPrimitiveType;

    static _isConnected(): boolean {
        return gamepadConnected();
    }

    static _isConnectedPlayer(player: number): boolean {
        return gamepadConnected(player);
    }

    static _isButtonPressed(button: GamepadButtonEnum): boolean {
        return gamepadButtonPressed(button.ordinal);
    }

    static _isButtonPressedPlayer(player: number, button: GamepadButtonEnum): boolean {
        return gamepadButtonPressed(button.ordinal, player);
    }

    static _getStick(stick: GamepadStickEnum): ScratchVector2Class {
        const { x, y } = gamepadStick(stick.ordinal);
        return new ScratchVector2Class(x, y);
    }

    static _getStickPlayer(player: number, stick: GamepadStickEnum): ScratchVector2Class {
        const { x, y } = gamepadStick(stick.ordinal, player);
        return new ScratchVector2Class(x, y);
    }

    static _getTrigger(trigger: GamepadTriggerEnum): number {
        return gamepadTrigger(trigger.ordinal);
    }

    static _getTriggerPlayer(player: number, trigger: GamepadTriggerEnum): number {
        return gamepadTrigger(trigger.ordinal, player);
    }
}
