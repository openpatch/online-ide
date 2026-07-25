import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";

/**
 * Keyboard keys, mirroring org.openpatch.scratch.KeyCode.
 *
 * Each entry carries the list of browser `KeyboardEvent.key` values (lower-cased)
 * that it corresponds to, so `Stage.isKeyPressed(KeyCode)` / `Sprite.whenKeyPressed`
 * can be resolved against the IDE's KeyboardManager (which stores keys lower-cased).
 */

// name -> browser KeyboardEvent.key value(s), lower-cased
const KEY_MAP: Record<string, string[]> = {
    // letters
    ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c => [c, [c.toLowerCase()]])),
    // digits
    DIGIT_0: ["0"], DIGIT_1: ["1"], DIGIT_2: ["2"], DIGIT_3: ["3"], DIGIT_4: ["4"],
    DIGIT_5: ["5"], DIGIT_6: ["6"], DIGIT_7: ["7"], DIGIT_8: ["8"], DIGIT_9: ["9"],
    // numpad
    NUMPAD_0: ["0"], NUMPAD_1: ["1"], NUMPAD_2: ["2"], NUMPAD_3: ["3"], NUMPAD_4: ["4"],
    NUMPAD_5: ["5"], NUMPAD_6: ["6"], NUMPAD_7: ["7"], NUMPAD_8: ["8"], NUMPAD_9: ["9"],
    // arrows
    LEFT: ["arrowleft"], RIGHT: ["arrowright"], UP: ["arrowup"], DOWN: ["arrowdown"],
    KP_LEFT: ["arrowleft"], KP_RIGHT: ["arrowright"], KP_UP: ["arrowup"], KP_DOWN: ["arrowdown"],
    // whitespace / editing
    SPACE: [" "], ENTER: ["enter"], BACKSPACE: ["backspace"], TAB: ["tab"], ESCAPE: ["escape"],
    DELETE: ["delete"], INSERT: ["insert"],
    // modifiers
    SHIFT: ["shift"], CTRL: ["control"], ALT: ["alt"], META: ["meta"], WINDOWS: ["meta"],
    CAPS_LOCK: ["capslock"], NUM_LOCK: ["numlock"], SCROLL_LOCK: ["scrolllock"],
    // navigation
    HOME: ["home"], END: ["end"], PAGE_UP: ["pageup"], PAGE_DOWN: ["pagedown"],
    // function keys
    F1: ["f1"], F2: ["f2"], F3: ["f3"], F4: ["f4"], F5: ["f5"], F6: ["f6"],
    F7: ["f7"], F8: ["f8"], F9: ["f9"], F10: ["f10"], F11: ["f11"], F12: ["f12"],
    // punctuation / symbols
    COMMA: [","], PERIOD: ["."], MINUS: ["-"], SUBTRACT: ["-"], EQUALS: ["="], ADD: ["+"],
    // NOTE: where two KeyCodes share a browser key (SLASH/DIVIDE, PERIOD/DECIMAL,
    // MINUS/SUBTRACT, DIGIT_n/NUMPAD_n, LEFT/KP_LEFT, META/WINDOWS), the one listed
    // FIRST is the one delivered to whenKeyPressed — see ScratchRuntimeManager.keyCodeFor.
    MULTIPLY: ["*"], SLASH: ["/"], DIVIDE: ["/"], BACK_SLASH: ["\\"], SEMICOLON: [";"],
    QUOTE: ["'"], BACK_QUOTE: ["`"], OPEN_BRACKET: ["["], CLOSE_BRACKET: ["]"], DECIMAL: ["."],
    // misc
    PAUSE: ["pause"], PRINT_SCREEN: ["printscreen"], CANCEL: ["cancel"], CLEAR: ["clear"],
    HELP: ["help"], CONTEXT_MENU: ["contextmenu"], UNKNOWN: [],
};

export class KeyCodeEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "enum KeyCode", comment: "Tastaturtasten" },
    ];

    static type: NonPrimitiveType;

    /** browser KeyboardEvent.key values (lower-cased) this key corresponds to */
    browserKeys: string[];

    constructor(name: string, ordinal: number, browserKeys: string[]) {
        super(name, ordinal);
        this.browserKeys = browserKeys;
    }

    static values: KeyCodeEnum[] = Object.keys(KEY_MAP).map(
        (name, index) => new KeyCodeEnum(name, index, KEY_MAP[name])
    );
}
