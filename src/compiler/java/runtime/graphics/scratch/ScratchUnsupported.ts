import { Interpreter } from "../../../../common/interpreter/Interpreter";
import { activeScratchStage } from "./ScratchStages";

/**
 * Parts of Scratch for Java cannot work in a browser: GLSL shaders, the raw
 * pixel buffer, GIF/video recording, the file system, real fullscreen. Those
 * methods are still declared here, so a program written against the desktop
 * library compiles and runs unchanged — calling one prints a notice into the
 * output and otherwise does nothing.
 *
 * The point is that copied code keeps running: nothing throws, and every method
 * returns a harmless default. The notice is printed once per method per program
 * run, so a call inside run() cannot flood the output.
 */

const NOTICE_COLOR = 0xd08000;

let interpreter: Interpreter | undefined;
let alreadyNotified: Set<string> = new Set();

/** Called from the Stage constructor, which is where a Scratch program begins. */
export function beginScratchProgram(currentInterpreter: Interpreter) {
    interpreter = currentInterpreter;
    alreadyNotified = new Set();
}

/**
 * Report that `what` (e.g. "Stage.getPixels()") only exists on the desktop.
 * Safe to call from anywhere; falls back to the browser console when no
 * program is running.
 */
export function desktopOnly(what: string, hint?: string): void {
    if (alreadyNotified.has(what)) return;
    alreadyNotified.add(what);

    const message = `${what} gibt es nur in der Desktop-Version von Scratch for Java`
        + ` und hat hier keine Wirkung.${hint ? " " + hint : ""}`
        + ` / ${what} only exists in the desktop version of Scratch for Java and has no effect here.`;

    const printManager = interpreter?.printManager;
    if (printManager) printManager.print(message, true, NOTICE_COLOR);
    else console.warn("Scratch: " + message);
}

/** Same notice, for a method that has to hand something back. */
export function desktopOnlyValue<T>(what: string, fallback: T, hint?: string): T {
    desktopOnly(what, hint);
    return fallback;
}

/**
 * The stage on screen, for the few classes that need it but have no `this.world`
 * to reach it through — Window, mainly. Which stage that is now belongs to
 * ScratchStages, since a program may have several.
 */
export function currentScratchStage<T>(): T | undefined {
    return activeScratchStage<T>();
}
