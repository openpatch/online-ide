import { CallbackFunction } from "../../../../common/interpreter/StepFunction.ts";
import { Thread } from "../../../../common/interpreter/Thread.ts";
import { Stacktrace } from "../../../../common/interpreter/ThrowableType.ts";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType.ts";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType.ts";
import { ObjectClass, StringClass } from "../javalang/ObjectClassStringClass.ts";
import { RuntimeExceptionClass } from "../javalang/RuntimeException.ts";
import { ThrowableClass } from "../javalang/ThrowableClass.ts";
import { InputClass } from "./InputClass.ts";

/** System.in: a Scanner on it reads what the user types into the output panel. */
export class InputStreamClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class InputStream extends Object", comment: "Eingabestrom. System.in steht für die Eingaben im Ausgabefenster; gelesen wird er mit einem Scanner." },
    ];

    static type: NonPrimitiveType;
}

export class NoSuchElementExceptionClass extends RuntimeExceptionClass {
    stacktrace: Stacktrace = [];

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class NoSuchElementException extends RuntimeException" },
    ];

    static type: NonPrimitiveType;

    constructor(public message?: string, public cause?: ThrowableClass) {
        super();
    }
}

export class InputMismatchExceptionClass extends NoSuchElementExceptionClass {
    stacktrace: Stacktrace = [];

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class InputMismatchException extends NoSuchElementException" },
    ];

    static type: NonPrimitiveType;

    constructor(public message?: string, public cause?: ThrowableClass) {
        super();
    }
}

type Parser<T> = (token: string) => T | undefined;

const parseInteger = (min: number, max: number): Parser<number> => token => {
    if (!/^[+-]?\d+$/.test(token)) return undefined;
    let n = Number(token);
    return n < min || n > max ? undefined : n;
};
const parseInt32 = parseInteger(-2147483648, 2147483647);
const parseLong = parseInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
const parseDouble: Parser<number> = token => {
    // a Scanner reads 1.5 as well as 1,5, as it does in a German locale
    let normalized = token.replace(",", ".");
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(normalized) && !/^[+-]?(Infinity|NaN)$/.test(normalized)) return undefined;
    return Number(normalized);
};
const parseBoolean: Parser<boolean> = token => {
    let lower = token.toLowerCase();
    return lower == "true" ? true : lower == "false" ? false : undefined;
};

/**
 * java.util.Scanner on System.in or on a String. On System.in the program waits
 * for a line whenever it needs more input than has been typed so far, as a
 * console would; like the real Scanner, nextInt() leaves the end of the line
 * for a following nextLine().
 */
export class ScannerClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Scanner extends Object", comment: "Liest Eingaben Wort für Wort oder zeilenweise, z. B. new Scanner(System.in) die Eingaben im Ausgabefenster." },
        { type: "method", signature: "Scanner(InputStream source)", native: ScannerClass.prototype._scannerInputStream, comment: "Ein Scanner, der liest, was im Ausgabefenster eingegeben wird (new Scanner(System.in))." },
        { type: "method", signature: "Scanner(String source)", native: ScannerClass.prototype._scannerString, comment: "Ein Scanner, der den Text liest." },

        { type: "method", signature: "String next()", java: ScannerClass.prototype._mj$next$String$, comment: "Liefert das nächste Wort." },
        { type: "method", signature: "String nextLine()", java: ScannerClass.prototype._mj$nextLine$String$, comment: "Liefert den Rest der aktuellen Zeile." },
        { type: "method", signature: "int nextInt()", java: ScannerClass.prototype._mj$nextInt$int$, comment: "Liefert die nächste ganze Zahl." },
        { type: "method", signature: "long nextLong()", java: ScannerClass.prototype._mj$nextLong$long$, comment: "Liefert die nächste ganze Zahl." },
        { type: "method", signature: "double nextDouble()", java: ScannerClass.prototype._mj$nextDouble$double$, comment: "Liefert die nächste Kommazahl (1.5 oder 1,5)." },
        { type: "method", signature: "boolean nextBoolean()", java: ScannerClass.prototype._mj$nextBoolean$boolean$, comment: "Liefert den nächsten Wahrheitswert (true oder false)." },
        { type: "method", signature: "boolean hasNext()", java: ScannerClass.prototype._mj$hasNext$boolean$, comment: "true, wenn noch ein Wort kommt." },
        { type: "method", signature: "boolean hasNextLine()", java: ScannerClass.prototype._mj$hasNextLine$boolean$, comment: "true, wenn noch eine Zeile kommt." },
        { type: "method", signature: "boolean hasNextInt()", java: ScannerClass.prototype._mj$hasNextInt$boolean$, comment: "true, wenn das nächste Wort eine ganze Zahl ist." },
        { type: "method", signature: "boolean hasNextDouble()", java: ScannerClass.prototype._mj$hasNextDouble$boolean$, comment: "true, wenn das nächste Wort eine Kommazahl ist." },
        { type: "method", signature: "boolean hasNextBoolean()", java: ScannerClass.prototype._mj$hasNextBoolean$boolean$, comment: "true, wenn das nächste Wort true oder false ist." },
        { type: "method", signature: "void close()", native: ScannerClass.prototype._close, comment: "Schließt den Scanner." },
    ];

    static type: NonPrimitiveType;

    buffer: string = "";
    position: number = 0;
    fromConsole: boolean = false;
    closed: boolean = false;

    _scannerInputStream(_source: InputStreamClass): ScannerClass {
        this.fromConsole = true;
        return this;
    }

    _scannerString(source: StringClass): ScannerClass {
        this.buffer = source?.value ?? "";
        return this;
    }

    _close() {
        this.closed = true;
    }

    /** Waits for another line from the user; false where no more input can come. */
    private readMore(t: Thread, then: (more: boolean) => void): boolean {
        if (!this.fromConsole || this.closed) return false;
        InputClass.readLine(t, "", line => {
            this.buffer = this.buffer.slice(this.position) + line + "\n";
            this.position = 0;
            then(true);
        });
        return true;
    }

    /**
     * Finds the next token, reading further lines while there is none. Calls
     * found with its start and end, or with undefined at the end of the input.
     * Reports whether it answered at once, i.e. without waiting for input.
     */
    private findToken(t: Thread, found: (token: { start: number, end: number } | undefined) => void): boolean {
        let start = this.position;
        while (start < this.buffer.length && /\s/.test(this.buffer[start])) start++;
        if (start < this.buffer.length) {
            let end = start;
            while (end < this.buffer.length && !/\s/.test(this.buffer[end])) end++;
            found({ start, end });
            return true;
        }
        if (!this.readMore(t, () => this.findToken(t, found))) {
            found(undefined);
            return true;
        }
        return false;
    }

    private closedCheck() {
        if (this.closed) throw new RuntimeExceptionClass("java.lang.IllegalStateException: Scanner closed");
    }

    /**
     * Hands the result back, or raises the exception: right away while the step
     * that called the method still runs, on the thread once input had to be
     * waited for.
     */
    private answer(t: Thread, callback: CallbackFunction, synchronous: boolean, value: any, exception?: RuntimeExceptionClass) {
        if (exception) {
            if (synchronous) throw exception;
            t.throwRuntimeExceptionOnLastExecutedStep(exception);
            return;
        }
        t.s.push(value);
        if (callback) callback();
    }

    private nextValue<T>(t: Thread, callback: CallbackFunction, parse: Parser<T>, wrap: (value: T) => any = v => v) {
        this.closedCheck();
        let synchronous = true;
        synchronous = this.findToken(t, token => {
            if (!token) {
                this.answer(t, callback, synchronous, undefined, new NoSuchElementExceptionClass("Keine weitere Eingabe vorhanden."));
                return;
            }
            let text = this.buffer.slice(token.start, token.end);
            let value = parse(text);
            if (value === undefined) {
                this.answer(t, callback, synchronous, undefined,
                    new InputMismatchExceptionClass(`Die Eingabe "${text}" passt nicht zum erwarteten Typ.`));
                return;
            }
            this.position = token.end;
            this.answer(t, callback, synchronous, wrap(value));
        });
    }

    private hasNextValue<T>(t: Thread, callback: CallbackFunction, parse: Parser<T>) {
        this.closedCheck();
        this.findToken(t, token => {
            t.s.push(token != null && parse(this.buffer.slice(token.start, token.end)) !== undefined);
            if (callback) callback();
        });
    }

    _mj$next$String$(t: Thread, callback: CallbackFunction) {
        this.nextValue(t, callback, token => token, token => new StringClass(token));
    }

    _mj$nextInt$int$(t: Thread, callback: CallbackFunction) {
        this.nextValue(t, callback, parseInt32);
    }

    _mj$nextLong$long$(t: Thread, callback: CallbackFunction) {
        this.nextValue(t, callback, parseLong);
    }

    _mj$nextDouble$double$(t: Thread, callback: CallbackFunction) {
        this.nextValue(t, callback, parseDouble);
    }

    _mj$nextBoolean$boolean$(t: Thread, callback: CallbackFunction) {
        this.nextValue(t, callback, parseBoolean);
    }

    _mj$hasNext$boolean$(t: Thread, callback: CallbackFunction) {
        this.hasNextValue(t, callback, token => token);
    }

    _mj$hasNextInt$boolean$(t: Thread, callback: CallbackFunction) {
        this.hasNextValue(t, callback, parseInt32);
    }

    _mj$hasNextDouble$boolean$(t: Thread, callback: CallbackFunction) {
        this.hasNextValue(t, callback, parseDouble);
    }

    _mj$hasNextBoolean$boolean$(t: Thread, callback: CallbackFunction) {
        this.hasNextValue(t, callback, parseBoolean);
    }

    _mj$nextLine$String$(t: Thread, callback: CallbackFunction) {
        this.closedCheck();
        let synchronous = true;
        let take = () => {
            let newline = this.buffer.indexOf("\n", this.position);
            if (newline >= 0) {
                let line = this.buffer.slice(this.position, newline).replace(/\r$/, "");
                this.position = newline + 1;
                this.answer(t, callback, synchronous, new StringClass(line));
            } else if (this.position < this.buffer.length) {
                // a String source without a final line break
                let line = this.buffer.slice(this.position);
                this.position = this.buffer.length;
                this.answer(t, callback, synchronous, new StringClass(line));
            } else if (!this.readMore(t, () => { synchronous = false; take(); })) {
                this.answer(t, callback, synchronous, undefined, new NoSuchElementExceptionClass("Keine weitere Zeile vorhanden."));
            }
        };
        take();
    }

    _mj$hasNextLine$boolean$(t: Thread, callback: CallbackFunction) {
        this.closedCheck();
        if (this.position < this.buffer.length) {
            t.s.push(true);
            if (callback) callback();
            return;
        }
        if (!this.readMore(t, () => {
            t.s.push(true);
            if (callback) callback();
        })) {
            t.s.push(false);
            if (callback) callback();
        }
    }
}
