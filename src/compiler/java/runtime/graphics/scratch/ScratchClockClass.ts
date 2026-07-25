import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";

/**
 * Date and time of the local clock, mirroring org.openpatch.scratch.Clock.
 * All methods are static and read the moment they are called.
 */
export class ScratchClockClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Clock extends Object", comment: "Datum und Uhrzeit" },

        { type: "method", signature: "static int getYear()", native: ScratchClockClass._getYear, comment: "Gibt das aktuelle Jahr zurück" },
        { type: "method", signature: "static int getMonth()", native: ScratchClockClass._getMonth, comment: "Gibt den aktuellen Monat zurück (1 = Januar)" },
        { type: "method", signature: "static int getDay()", native: ScratchClockClass._getDay, comment: "Gibt den aktuellen Tag im Monat zurück" },
        { type: "method", signature: "static int getDayOfWeek()", native: ScratchClockClass._getDayOfWeek, comment: "Gibt den Wochentag zurück (1 = Montag, 7 = Sonntag)" },
        { type: "method", signature: "static int getHour()", native: ScratchClockClass._getHour, comment: "Gibt die aktuelle Stunde zurück" },
        { type: "method", signature: "static int getMinute()", native: ScratchClockClass._getMinute, comment: "Gibt die aktuelle Minute zurück" },
        { type: "method", signature: "static int getSecond()", native: ScratchClockClass._getSecond, comment: "Gibt die aktuelle Sekunde zurück" },
        { type: "method", signature: "static int getMillisecond()", native: ScratchClockClass._getMillisecond, comment: "Gibt die aktuelle Millisekunde zurück" },
        { type: "method", signature: "static int getDaysSince2000()", native: ScratchClockClass._getDaysSince2000, comment: "Gibt die Anzahl der Tage seit dem 1. Januar 2000 zurück" },
    ];

    static type: NonPrimitiveType;

    static _getYear(): number { return new Date().getFullYear(); }
    /** Java counts months from 1; JavaScript counts from 0. */
    static _getMonth(): number { return new Date().getMonth() + 1; }
    static _getDay(): number { return new Date().getDate(); }
    /** java.time counts Monday as 1 and Sunday as 7; JavaScript makes Sunday 0. */
    static _getDayOfWeek(): number { const d = new Date().getDay(); return d === 0 ? 7 : d; }
    static _getHour(): number { return new Date().getHours(); }
    static _getMinute(): number { return new Date().getMinutes(); }
    static _getSecond(): number { return new Date().getSeconds(); }
    static _getMillisecond(): number { return new Date().getMilliseconds(); }

    static _getDaysSince2000(): number {
        // whole days between the two dates, so compare them at local midnight
        const now = new Date();
        const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const then = Date.UTC(2000, 0, 1);
        return Math.floor((today - then) / 86400000);
    }
}
