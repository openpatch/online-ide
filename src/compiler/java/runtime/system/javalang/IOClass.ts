import { JRC } from "../../../language/JavaRuntimeLibraryComments";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { InputClass } from "../additional/InputClass";
import { ObjectClass } from "./ObjectClassStringClass";
import { SystemClass } from "./SystemClass";

/**
 * Java 25 (JEP 512) introduced the class java.lang.IO which provides static methods
 * for simple textual input and output. As this compiler doesn't know packages
 * the class is simply called IO here.
 */
export class IOClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class IO extends Object", comment: JRC.IOClassComment },

        { type: "method", signature: "static void print(char text)", java: IOClass._mj$print$void$string, comment: JRC.IOPrintComment },
        { type: "method", signature: "static void print(string text)", java: IOClass._mj$print$void$string, comment: JRC.IOPrintComment },
        { type: "method", signature: "static void print(int number)", java: IOClass._mj$print$void$int, comment: JRC.IOPrintComment },
        { type: "method", signature: "static void print(double number)", java: IOClass._mj$print$void$double, comment: JRC.IOPrintComment },
        { type: "method", signature: "static void print(boolean b)", java: IOClass._mj$print$void$boolean, comment: JRC.IOPrintComment },
        { type: "method", signature: "static void print(Object o)", java: IOClass._mj$print$void$Object, comment: JRC.IOPrintComment },

        { type: "method", signature: "static void println(char text)", java: IOClass._mj$println$void$string, comment: JRC.IOPrintlnComment },
        { type: "method", signature: "static void println(string text)", java: IOClass._mj$println$void$string, comment: JRC.IOPrintlnComment },
        { type: "method", signature: "static void println(int number)", java: IOClass._mj$println$void$int, comment: JRC.IOPrintlnComment },
        { type: "method", signature: "static void println(double number)", java: IOClass._mj$println$void$double, comment: JRC.IOPrintlnComment },
        { type: "method", signature: "static void println(boolean b)", java: IOClass._mj$println$void$boolean, comment: JRC.IOPrintlnComment },
        { type: "method", signature: "static void println(Object o)", java: IOClass._mj$println$void$Object, comment: JRC.IOPrintlnComment },
        { type: "method", signature: "static void println()", java: IOClass._mj$println$void$, comment: JRC.IOPrintlnComment2 },

        { type: "method", signature: "static string readln(string prompt)", java: IOClass._mj$readln$string$string, comment: JRC.IOReadlnWithPromptComment },
        { type: "method", signature: "static string readln()", java: IOClass._mj$readln$string$, comment: JRC.IOReadlnComment },
    ];

    static type: NonPrimitiveType;

    static _mj$print$void$string(t: Thread, text: string) {
        SystemClass.out._mn$print$void$string(t, undefined, text);
    }

    static _mj$print$void$int(t: Thread, n: number) {
        SystemClass.out._mn$print$void$int(t, undefined, n);
    }

    static _mj$print$void$double(t: Thread, n: number) {
        SystemClass.out._mn$print$void$double(t, undefined, n);
    }

    static _mj$print$void$boolean(t: Thread, b: boolean) {
        SystemClass.out._mn$print$void$boolean(t, undefined, b);
    }

    static _mj$print$void$Object(t: Thread, o: ObjectClass) {
        SystemClass.out._mn$print$void$Object(t, undefined, o);
    }

    static _mj$println$void$string(t: Thread, text?: string) {
        SystemClass.out._mn$println$void$string(t, undefined, text);
    }

    static _mj$println$void$int(t: Thread, n: number) {
        SystemClass.out._mn$println$void$int(t, undefined, n);
    }

    static _mj$println$void$double(t: Thread, n: number) {
        SystemClass.out._mn$println$void$double(t, undefined, n);
    }

    static _mj$println$void$boolean(t: Thread, b: boolean) {
        SystemClass.out._mn$println$void$boolean(t, undefined, b);
    }

    static _mj$println$void$Object(t: Thread, o: ObjectClass) {
        SystemClass.out._mn$println$void$Object(t, undefined, o);
    }

    static _mj$println$void$(t: Thread) {
        t.println("", undefined);
    }

    /**
     * Reading input suspends the thread. The entered value is pushed onto the
     * thread's stack by the InputManager, @see InputClass#readInput
     */
    static _mj$readln$string$string(t: Thread, prompt: string) {
        InputClass._mj$readString$string$string(t, prompt);
    }

    static _mj$readln$string$(t: Thread) {
        InputClass._mj$readString$string$string(t, "");
    }

}
