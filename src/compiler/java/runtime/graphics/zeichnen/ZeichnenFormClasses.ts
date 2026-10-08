import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { TokenType } from "../../../TokenType";
import { IJavaClass } from "../../../types/JavaClass";
import { JavaMethod } from "../../../types/JavaMethod";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ArrayListClass } from "../../system/collections/ArrayListClass";
import { IndexOutOfBoundsExceptionClass } from "../../system/javalang/IndexOutOfBoundsExceptionClass";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { classString, FigurClass, ZeichnenFrame } from "./ZeichnenFigurClasses";
import { forEachInOrder } from "./ZeichnenRuntime";

/** Calls the Java method by its internal name and hands its return value to then. */
function callJava(t: Thread, object: any, internalName: string, then: (value: any) => void, ...args: any[]) {
    object[internalName](t, () => then(t.s.pop()), ...args);
}

function callVoid(t: Thread, object: any, internalName: string, then: () => void, ...args: any[]) {
    object[internalName](t, then, ...args);
}

/** toString() of each object, which may be a method of the program. */
export function describe(t: Thread, objects: any[], callback: (lines: string[]) => void) {
    let lines: string[] = [];
    forEachInOrder(objects, (o, next) => {
        if (o == null) { lines.push("null"); next(); return; }
        callJava(t, o, "_mj$toString$String$", (s: StringClass | string) => {
            lines.push(s == null ? "null" : typeof s == "string" ? s : s.value);
            next();
        });
    }, () => callback(lines));
}

function checkIndex(array: any[], index: number) {
    if (index < 0 || index >= array.length) {
        throw new IndexOutOfBoundsExceptionClass(`Index ${index} out of bounds for length ${array.length}`);
    }
}

export class ZusammengesetzteFormClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class ZusammengesetzteForm extends Object implements ZeichnendesObjekt", comment: "Verwaltet mehrere Figuren in einem Array und stellt sie als eine zusammengesetzte Form dar." },

        { type: "field", signature: "protected Figur[] meineFiguren", comment: "Die Figuren, die zu der zusammengesetzten Form gehören." },

        { type: "method", signature: "ZusammengesetzteForm(int pAnzahl)", native: ZusammengesetzteFormClass.prototype._zusammengesetzteForm, comment: "Erstellt eine zusammengesetzte Form. Das Array meineFiguren hat die Länge pAnzahl, ist aber leer." },
        { type: "method", signature: "protected void setzeBezeichnung(String pBez)", native: ZusammengesetzteFormClass.prototype._setzeBezeichnung, comment: "Legt die Bezeichnung fest, mit der die Form im Infofenster erscheint." },
        { type: "method", signature: "void setFlaeche(Zeichenflaeche pFrame)", java: ZusammengesetzteFormClass.prototype._mj$setFlaeche$void$Zeichenflaeche, comment: "Legt fest, auf welcher Zeichenfläche sich die Form (und jede ihrer Figuren) befindet." },
        { type: "method", signature: "void zeichneDich()", java: ZusammengesetzteFormClass.prototype._mj$zeichneDich$void$, comment: "Zeichnet alle Figuren der Form." },
        { type: "method", signature: "void setzeTeil(int pNummer, Figur pFigur)", native: ZusammengesetzteFormClass.prototype._setzeTeil, comment: "Legt die Figur pFigur im Array unter dem Index pNummer ab." },
        { type: "method", signature: "void setzeFarbe(int pNummer, String pFarbe)", native: ZusammengesetzteFormClass.prototype._setzeFarbe, comment: "Setzt die Farbe der Figur mit dem Index pNummer auf pFarbe." },
        { type: "method", signature: "void setzeSichtbar(boolean pSichtbar)", native: ZusammengesetzteFormClass.prototype._setzeSichtbar, comment: "Setzt die Sichtbarkeit aller Figuren auf pSichtbar." },
        { type: "method", signature: "String toString()", java: ZusammengesetzteFormClass.prototype._mj$toString$String$, comment: "Die Bezeichnung und darunter eine Zeile je Figur." },
        { type: "method", signature: "Figur getTeil(int pNummer)", native: ZusammengesetzteFormClass.prototype._getTeil, comment: "Liefert die Figur mit dem Index pNummer." },
        { type: "method", signature: "Figur[] getFiguren()", native: ZusammengesetzteFormClass.prototype._getFiguren, comment: "Liefert das Array mit den Figuren." },
    ];

    static type: NonPrimitiveType;

    meineFiguren: (FigurClass | null)[] = [];
    meinFrame: ZeichnenFrame | null = null;
    bezeichnung: string | null = null;

    _zusammengesetzteForm(anzahl: number): ZusammengesetzteFormClass {
        this.meineFiguren = new Array(anzahl).fill(null);
        return this;
    }

    _setzeBezeichnung(bezeichnung: StringClass | string | null) {
        this.bezeichnung = bezeichnung == null ? null : typeof bezeichnung == "string" ? bezeichnung : bezeichnung.value;
    }

    _mj$setFlaeche$void$Zeichenflaeche(t: Thread, callback: CallbackFunction, frame: ZeichnenFrame | null) {
        this.meinFrame = frame;
        forEachInOrder(this.meineFiguren.filter(f => f != null), (f, next) =>
            callVoid(t, f, "_mj$setFlaeche$void$Zeichenflaeche", next, frame), () => callback?.());
    }

    _mj$zeichneDich$void$(t: Thread, callback: CallbackFunction) {
        forEachInOrder(this.meineFiguren.filter(f => f != null), (f, next) =>
            callVoid(t, f, "_mj$zeichneDich$void$", next), () => callback?.());
    }

    _setzeTeil(nummer: number, figur: FigurClass | null) {
        if (figur == null) return;
        checkIndex(this.meineFiguren, nummer);
        this.meineFiguren[nummer] = figur;
        figur._setFlaeche(this.meinFrame);
        this.meinFrame?.markDirty();
    }

    _setzeFarbe(nummer: number, farbe: StringClass) {
        checkIndex(this.meineFiguren, nummer);
        this.meineFiguren[nummer]?._setzeFarbeName(farbe);
    }

    _setzeSichtbar(sichtbar: boolean) {
        for (let f of this.meineFiguren) f?._setzeSichtbar(sichtbar);
    }

    _mj$toString$String$(t: Thread, callback: CallbackFunction) {
        describe(t, this.meineFiguren, lines => {
            t.s.push(new StringClass(this.bezeichnung + lines.map(l => "\n * " + l + " *").join("")));
            callback?.();
        });
    }

    _getTeil(nummer: number): FigurClass | null {
        checkIndex(this.meineFiguren, nummer);
        return this.meineFiguren[nummer];
    }

    _getFiguren(): (FigurClass | null)[] {
        return this.meineFiguren;
    }
}

function isFigurType(type: any): boolean {
    return type instanceof NonPrimitiveType && type.fastExtendsImplements("zeichnen.Figur");
}

export class KomplexeFormClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class KomplexeForm extends Object implements ZeichnendesObjekt", comment: "Basisklasse für eigene Formen: gezeichnet werden alle Figuren, die die Methoden der Unterklasse (z. B. Getter) zurückgeben." },

        { type: "field", signature: "protected ArrayList<Figur> meineFiguren", comment: "Die Figuren der Form, wie sie die Methoden der Unterklasse zuletzt geliefert haben." },

        { type: "method", signature: "KomplexeForm()", native: KomplexeFormClass.prototype._komplexeForm, comment: "Erstellt eine komplexe Form." },
        { type: "method", signature: "void setFlaeche(Zeichenflaeche pFrame)", java: KomplexeFormClass.prototype._mj$setFlaeche$void$Zeichenflaeche, comment: "Legt fest, auf welcher Zeichenfläche sich die Figuren der Form befinden." },
        { type: "method", signature: "void zeichneDich()", java: KomplexeFormClass.prototype._mj$zeichneDich$void$, comment: "Zeichnet alle Figuren, die die Methoden der Unterklasse liefern." },
        { type: "method", signature: "void setzeSichtbar(boolean pSichtbar)", java: KomplexeFormClass.prototype._mj$setzeSichtbar$void$boolean, comment: "Setzt die Sichtbarkeit aller Figuren auf pSichtbar." },
        { type: "method", signature: "String toString()", java: KomplexeFormClass.prototype._mj$toString$String$, comment: "Der Klassenname und darunter eine Zeile je Figur." },
        { type: "method", signature: "protected void updateByMethods()", java: KomplexeFormClass.prototype._mj$updateByMethods$void$, comment: "Sammelt in meineFiguren die Figuren, die die parameterlosen Methoden der Unterklassen liefern: Oberklassen zuerst, je Klasse nach Methodennamen sortiert." },
    ];

    static type: NonPrimitiveType;

    meineFiguren: ArrayListClass = new ArrayListClass();

    _komplexeForm(): KomplexeFormClass {
        return this;
    }

    figuren(): FigurClass[] {
        return (this.meineFiguren as any).elements;
    }

    _mj$updateByMethods$void$(t: Thread, callback: CallbackFunction) {
        let classes: IJavaClass[] = [];
        for (let type = this.getType() as IJavaClass | undefined; type; type = type.getExtends()) {
            classes.unshift(type);      // super classes first
        }
        let methods: JavaMethod[] = [];
        for (let klass of classes) {
            methods.push(...klass.getOwnMethods()
                .filter(m => !m.isConstructor && !m.isStatic && m.parameters.length == 0 && isFigurType(m.returnParameterType))
                .sort((a, b) => a.identifier < b.identifier ? -1 : a.identifier > b.identifier ? 1 : 0));
        }
        let figuren: FigurClass[] = [];
        forEachInOrder(methods, (m, next) => {
            let internalName = m.getInternalName("java");
            if (typeof (this as any)[internalName] != "function") { next(); return; }
            callJava(t, this, internalName, (figur) => { figuren.push(figur); next(); });
        }, () => {
            this.meineFiguren = new ArrayListClass(figuren);
            if (figuren.length == 0) {
                t.println("Es gibt nichts zu zeichnen. Bitte prüfen, ob die Unterklasse(n) von KomplexeForm die Getter bereitstellen!", undefined);
            }
            callback?.();
        });
    }

    /** updateByMethods, then f for every figure that is not null */
    private forEachFigur(t: Thread, f: (figur: FigurClass, next: () => void) => void, callback: CallbackFunction) {
        callVoid(t, this, "_mj$updateByMethods$void$", () => {
            forEachInOrder(this.figuren().filter(fig => fig != null), f, () => callback?.());
        });
    }

    _mj$setFlaeche$void$Zeichenflaeche(t: Thread, callback: CallbackFunction, frame: ZeichnenFrame | null) {
        this.forEachFigur(t, (figur, next) => callVoid(t, figur, "_mj$setFlaeche$void$Zeichenflaeche", next, frame), callback);
    }

    _mj$zeichneDich$void$(t: Thread, callback: CallbackFunction) {
        this.forEachFigur(t, (figur, next) => callVoid(t, figur, "_mj$zeichneDich$void$", next), callback);
    }

    _mj$setzeSichtbar$void$boolean(t: Thread, callback: CallbackFunction, sichtbar: boolean) {
        this.forEachFigur(t, (figur, next) => { figur._setzeSichtbar(sichtbar); next(); }, callback);
    }

    _mj$toString$String$(t: Thread, callback: CallbackFunction) {
        callVoid(t, this, "_mj$updateByMethods$void$", () => {
            describe(t, this.figuren(), lines => {
                t.s.push(new StringClass(classString(this) + lines.map(l => "\n * " + l + " *").join("")));
                callback?.();
            });
        });
    }
}

/**
 * The public parameterless get-methods of the object's class, sorted by name
 * ignoring case, as Objektinterpreter finds them with Class.getMethods().
 */
function getters(o: ObjectClass): JavaMethod[] {
    let type = o.getType?.() as IJavaClass | undefined;
    if (!type || typeof type.getAllMethods != "function") return [];
    let seen = new Set<string>();
    let result: JavaMethod[] = [];
    for (let m of type.getAllMethods()) {
        if (!m || m.isConstructor || m.isStatic || m.parameters.length > 0) continue;
        if (m.visibility != TokenType.keywordPublic) continue;
        if (!m.identifier.startsWith("get") || m.identifier.startsWith("getClass")) continue;
        if (!m.returnParameterType || m.returnParameterType.identifier == "void") continue;
        let internalName = m.getInternalName("java");
        if (seen.has(internalName)) continue;       // overridden further down
        seen.add(internalName);
        if (typeof (o as any)[internalName] != "function") continue;
        result.push(m);
    }
    return result.sort((a, b) => {
        let x = a.identifier.toLowerCase(), y = b.identifier.toLowerCase();
        return x < y ? -1 : x > y ? 1 : 0;
    });
}

/**
 * Only objects of the program and composite forms of this library are looked
 * into; other library objects (Strings, wrappers, lists ...) hold no figures.
 */
function worthLookingInto(o: any): boolean {
    if (o == null || typeof o != "object" || Array.isArray(o)) return false;
    if (o instanceof StringClass || o instanceof FigurClass) return false;
    let type = o.getType?.() as NonPrimitiveType | undefined;
    if (!type) return false;
    return !type.isLibraryType || o instanceof ZusammengesetzteFormClass || o instanceof KomplexeFormClass;
}

export class ObjektinterpreterClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Objektinterpreter extends Object", comment: "Findet die Figuren eines beliebigen Objekts über dessen get-Methoden. So kann jedes Objekt, das seine Figuren über Getter herausgibt, auf einer Zeichenfläche dargestellt werden." },
        { type: "method", signature: "Objektinterpreter()", native: ObjektinterpreterClass.prototype._objektinterpreter },
        { type: "method", signature: "static ZusammengesetzteForm interpretiere(Object obj)", java: ObjektinterpreterClass._mj$interpretiere$ZusammengesetzteForm$Object, comment: "Fasst alle Figuren, die die get-Methoden des Objekts liefern, zu einer zusammengesetzten Form zusammen; null, wenn es keine gibt." },
        { type: "method", signature: "static ArrayList<Figur> objectToList(Object obj)", java: ObjektinterpreterClass._mj$objectToList$ArrayList$Object, comment: "Liefert alle Figuren, die die öffentlichen parameterlosen get-Methoden des Objekts liefern (alphabetisch nach Methodennamen), auch aus Arrays und aus Objekten, die die Getter liefern." },
    ];

    static type: NonPrimitiveType;

    _objektinterpreter(): ObjektinterpreterClass {
        return this;
    }

    static _mj$interpretiere$ZusammengesetzteForm$Object(t: Thread, obj: any) {
        ObjektinterpreterClass.interpretiere(t, obj, form => t.s.push(form));
    }

    static _mj$objectToList$ArrayList$Object(t: Thread, obj: any) {
        ObjektinterpreterClass.objectToList(t, obj, new Set(), list => t.s.push(new ArrayListClass(list)));
    }

    static interpretiere(t: Thread, obj: any, callback: (form: ZusammengesetzteFormClass | null) => void) {
        ObjektinterpreterClass.objectToList(t, obj, new Set(), figuren => {
            if (figuren.length == 0) {
                t.println("Es wurde versucht ein Objekt hinzuzufuegen, bei dem es nichts zu zeichnen gibt. Eventuell wurden die get-Methoden vergessen bei: " + (obj == null ? "null" : classString(obj)), undefined);
                callback(null);
                return;
            }
            let form = new ZusammengesetzteFormClass()._zusammengesetzteForm(figuren.length);
            figuren.forEach((f, i) => form._setzeTeil(i, f));
            form._setzeBezeichnung((obj.getType() as NonPrimitiveType).pathAndIdentifierAsDotSeparatedString);
            callback(form);
        });
    }

    static objectToList(t: Thread, obj: any, path: Set<any>, callback: (figuren: FigurClass[]) => void) {
        let result: FigurClass[] = [];
        if (!worthLookingInto(obj) || path.has(obj)) {
            callback(result);
            return;
        }
        path.add(obj);

        const addAll = (value: any, next: () => void) => {
            ObjektinterpreterClass.objectToList(t, value, path, list => { result.push(...list); next(); });
        };

        forEachInOrder(getters(obj), (m, next) => {
            callJava(t, obj, m.getInternalName("java"), (value) => {
                if (value instanceof FigurClass) {
                    result.push(value);
                    next();
                } else if (Array.isArray(value)) {
                    forEachInOrder(value, (entry, nextEntry) => {
                        if (entry instanceof FigurClass) {
                            result.push(entry);
                            nextEntry();
                        } else {
                            addAll(entry, nextEntry);
                        }
                    }, next);
                } else {
                    addAll(value, next);
                }
            });
        }, () => {
            path.delete(obj);
            callback(result);
        });
    }
}
