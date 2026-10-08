import { JRC } from "../../../language/JavaRuntimeLibraryComments";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { ObjectClass, StringClass } from "../javalang/ObjectClassStringClass";
import { ArrayListClass } from "./ArrayListClass";

const primitiveElementTypes = ["int", "long", "double", "float", "char", "boolean", "byte", "short"];

/** One declaration per primitive element type, as java.util.Arrays has it. */
function forPrimitiveArrays(signature: (type: string) => string, native: Function, comment: string): LibraryDeclarations {
    return primitiveElementTypes.map(type => ({ type: "method", signature: signature(type), native: native, comment: comment }));
}

export class ArraysClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        {type: "declaration", signature: "class Arrays extends Object", comment: JRC.ArraysClassComment},
        {type: "method", signature: "public static <T> List<T> asList(T... a)", native:ArraysClass.prototype._asList, comment: JRC.ArraysClassAsListComment},

        ...forPrimitiveArrays(type => `public static boolean equals(${type}[] a, ${type}[] a2)`, ArraysClass._equalsPrimitive,
            "true, wenn beide Arrays gleich lang sind und an jeder Stelle denselben Wert haben (oder beide null sind)."),
        {type: "method", signature: "public static boolean equals(Object[] a, Object[] a2)", java: ArraysClass._mj$equals$boolean$Object_I$Object_I,
            comment: "true, wenn beide Arrays gleich lang sind und an jeder Stelle gleiche Elemente (equals) haben (oder beide null sind)."},

        ...forPrimitiveArrays(type => `public static string toString(${type}[] a)`, ArraysClass._toStringPrimitive,
            "Die Elemente des Arrays als Text, z. B. [2, 4, 6]."),
        {type: "method", signature: "public static string toString(Object[] a)", java: ArraysClass._mj$toString$string$Object_I,
            comment: "Die Elemente des Arrays als Text, z. B. [Anna, Ben]."},

        ...forPrimitiveArrays(type => `public static void fill(${type}[] a, ${type} val)`, ArraysClass._fill,
            "Setzt jedes Element des Arrays auf den Wert."),
        {type: "method", signature: "public static void fill(Object[] a, Object val)", native: ArraysClass._fill,
            comment: "Setzt jedes Element des Arrays auf den Wert."},

        ...["int", "long", "double", "float", "char", "byte", "short"].map(type => ({type: <const>"method",
            signature: `public static void sort(${type}[] a)`, native: ArraysClass._sortPrimitive,
            comment: "Sortiert das Array aufsteigend."})),
        {type: "method", signature: "public static void sort(String[] a)", native: ArraysClass._sortStrings,
            comment: "Sortiert das Array alphabetisch (nach Unicode, wie compareTo)."},
    ];

    _asList(a: any[]): any {
        return new ArrayListClass(a);
    }

    static _equalsPrimitive(a: any[], b: any[]): boolean {
        if (a === b) return true;
        if (a == null || b == null || a.length != b.length) return false;
        for (let i = 0; i < a.length; i++) {
            // Java compares doubles bitwise here: NaN equals NaN
            if (a[i] !== b[i] && !(Number.isNaN(a[i]) && Number.isNaN(b[i]))) return false;
        }
        return true;
    }

    static _mj$equals$boolean$Object_I$Object_I(t: Thread, a: any[], b: any[]) {
        if (a === b) { t.s.push(true); return; }
        if (a == null || b == null || a.length != b.length) { t.s.push(false); return; }
        let i = 0;
        let next = () => {
            while (i < a.length) {
                let x = a[i], y = b[i];
                i++;
                if (x === y) continue;
                if (x == null || y == null) { t.s.push(false); return; }
                if (x instanceof StringClass && y instanceof StringClass) {
                    if (x.value !== y.value) { t.s.push(false); return; }
                    continue;
                }
                if (typeof x._mj$equals$boolean$Object != "function") { t.s.push(x == y); return; }
                // a method of the program may run here: go on once it has answered
                x._mj$equals$boolean$Object(t, () => {
                    if (!t.s.pop()) { t.s.push(false); return; }
                    next();
                }, y);
                return;
            }
            t.s.push(true);
        };
        next();
    }

    static _toStringPrimitive(a: any[]): string {
        if (a == null) return "null";
        return "[" + a.map(v => "" + v).join(", ") + "]";
    }

    static _mj$toString$string$Object_I(t: Thread, a: any[]) {
        if (a == null) { t.s.push("null"); return; }
        let parts: string[] = [];
        let i = 0;
        let next = () => {
            while (i < a.length) {
                let element = a[i++];
                if (element == null) { parts.push("null"); continue; }
                if (element instanceof StringClass) { parts.push(element.value); continue; }
                if (typeof element._mj$toString$String$ != "function") { parts.push("" + element); continue; }
                element._mj$toString$String$(t, () => {
                    let s = t.s.pop();
                    parts.push(s == null ? "null" : typeof s == "string" ? s : s.value);
                    next();
                });
                return;
            }
            t.s.push("[" + parts.join(", ") + "]");
        };
        next();
    }

    static _fill(a: any[], value: any) {
        a.fill(value);
    }

    static _sortPrimitive(a: any[]) {
        if (a.some(x => typeof x != "number")) ArraysClass._sortStrings(a);    // char[]
        else a.sort((x: number, y: number) => x - y);
    }

    /** String[] elements may be String objects or plain strings, char[] elements are plain strings. */
    static _sortStrings(a: (StringClass | string)[]) {
        let text = (x: StringClass | string) => typeof x == "string" ? x : x.value;
        a.sort((x, y) => x == null ? (y == null ? 0 : 1) : y == null ? -1 : text(x) < text(y) ? -1 : text(x) > text(y) ? 1 : 0);
    }
}
