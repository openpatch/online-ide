import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ArrayListClass } from "../../system/collections/ArrayListClass";
import { NullPointerExceptionClass } from "../../system/javalang/NullPointerExceptionClass";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { DreieckClass, FigurClass, LinieClass, OvalClass, RechteckClass, ZeichnenFrame } from "./ZeichnenFigurClasses";
import { describe, ObjektinterpreterClass } from "./ZeichnenFormClasses";
import { ZeichnenGraphicsClass } from "./ZeichnenGraphicsClass";
import { forEachInOrder, ZeichnenLayer, ZeichnenRuntime, ZeichnenSurface } from "./ZeichnenRuntime";

const WHITE = { r: 255, g: 255, b: 255 };

function str(s: StringClass | string | null | undefined): string {
    return s == null ? "null" : typeof s == "string" ? s : s.value;
}

function implementsType(o: any, pathAndIdentifier: string): boolean {
    let type = o?.getType?.() as NonPrimitiveType | undefined;
    return !!type && type.fastExtendsImplements(pathAndIdentifier);
}

/** true if the method the object would run is one of this library, not one of the program */
function isLibraryMethod(o: any, name: string): boolean {
    for (let proto = Object.getPrototypeOf(o); proto; proto = Object.getPrototypeOf(proto)) {
        if (Object.prototype.hasOwnProperty.call(proto, name)) {
            return proto.constructor?.type?.isLibraryType === true;
        }
    }
    return true;
}

/** A figure of this library that draws itself without any code of the program. */
function drawsWithoutProgramCode(o: any): boolean {
    return o instanceof FigurClass && isLibraryMethod(o, "_mj$zeichneDich$void$") && isLibraryMethod(o, "_mj$zeichneDich$void$Graphics");
}

function elementsOf(list: ArrayListClass): any[] {
    return (list as any).elements;
}

export class InfofensterClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Infofenster extends Object", comment: "Fenster, das die Objekte einer Zeichenfläche auflistet. Wird über zeigeInfofenster() der Zeichenfläche geöffnet." },
        { type: "method", signature: "Infofenster(String pText)", native: InfofensterClass.prototype._infofenster, comment: "Erstellt ein (zunächst unsichtbares) Infofenster mit dem Titel pText." },
        { type: "method", signature: "void setzeText(String pText)", native: InfofensterClass.prototype._setzeText, comment: "Ersetzt den Text des Fensters." },
        { type: "method", signature: "void fuegeZeileHinzu(String pText)", native: InfofensterClass.prototype._fuegeZeileHinzu, comment: "Hängt eine Zeile an den Text an." },
        { type: "method", signature: "void setVisible(boolean pSichtbar)", native: InfofensterClass.prototype._setVisible, comment: "Zeigt das Fenster oder blendet es aus." },
    ];

    static type: NonPrimitiveType;

    titel: string = "";
    text: string = "";
    sichtbar: boolean = false;
    private div?: HTMLDivElement;
    private pre?: HTMLPreElement;

    /** where the window is shown: the div of the canvas */
    host?: () => HTMLElement | undefined;

    _infofenster(titel: StringClass): InfofensterClass {
        this.titel = str(titel);
        return this;
    }

    _setzeText(text: StringClass | string) {
        this.text = str(text);
        this.render();
    }

    _fuegeZeileHinzu(text: StringClass | string) {
        this.text = this.text == "" ? str(text) : this.text + "\n" + str(text);
        this.render();
    }

    _setVisible(sichtbar: boolean) {
        this.sichtbar = sichtbar;
        if (!sichtbar) {
            this.div?.remove();
            this.div = undefined;
        }
        this.render();
    }

    private render() {
        if (!this.sichtbar) return;
        if (!this.div) {
            let host = this.host?.();
            if (!host || typeof document == "undefined") return;
            if (getComputedStyle(host).position == "static") host.style.position = "relative";
            let div = document.createElement("div");
            div.style.cssText = "position:absolute;top:4px;right:4px;max-width:60%;max-height:60%;display:flex;flex-direction:column;"
                + "background:rgba(255,255,255,0.92);color:#000;border:1px solid #888;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.3);"
                + "font:11px monospace;z-index:10;";
            let titleBar = document.createElement("div");
            titleBar.style.cssText = "display:flex;justify-content:space-between;gap:8px;padding:2px 6px;background:#ddd;font-weight:bold;";
            let title = document.createElement("span");
            title.textContent = this.titel;
            let close = document.createElement("span");
            close.textContent = "✕";
            close.style.cursor = "pointer";
            close.onclick = () => this._setVisible(false);
            titleBar.append(title, close);
            let pre = document.createElement("pre");
            pre.style.cssText = "margin:0;padding:4px 6px;overflow:auto;white-space:pre;tab-size:4;";
            div.append(titleBar, pre);
            host.appendChild(div);
            this.div = div;
            this.pre = pre;
        }
        this.pre!.textContent = this.text;
    }
}

export class ZeichenflaecheClass extends ObjectClass implements ZeichnenSurface, ZeichnenFrame {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Zeichenflaeche extends Object", comment: "Eine Zeichenfläche, auf der Objekte (z. B. Rechteck, Oval, Linie, Dreieck) dargestellt werden. Die Objekte werden in der Reihenfolge der Liste meineFiguren gezeichnet, spätere über frühere." },

        { type: "field", signature: "protected ArrayList<ZeichnendesObjekt> meineFiguren", comment: "Die Objekte auf der Zeichenfläche, in der Reihenfolge, in der sie gezeichnet werden." },
        { type: "field", signature: "protected Infofenster infoFrame", comment: "Das Infofenster, das die Objekte der Zeichenfläche auflistet." },

        { type: "method", signature: "Zeichenflaeche()", java: ZeichenflaecheClass.prototype._cj$_constructor_$Zeichenflaeche$, comment: "Erstellt eine neue Zeichenfläche mit den Abmessungen 800 mal 600 Pixel." },
        { type: "method", signature: "Zeichenflaeche(int pBreite, int pHoehe)", java: ZeichenflaecheClass.prototype._cj$_constructor_$Zeichenflaeche$int$int, comment: "Erstellt eine neue Zeichenfläche mit den angegebenen Abmessungen." },

        { type: "method", signature: "void fuegeHinzu(ZeichnendesObjekt pNeues)", java: ZeichenflaecheClass.prototype._mj$fuegeHinzu$void$ZeichnendesObjekt, comment: "Fügt das Objekt am Ende von meineFiguren hinzu. Es wird (falls sichtbar) sofort angezeigt und im Infofenster aufgelistet." },
        { type: "method", signature: "void fuegeHinzu(Object pObject)", java: ZeichenflaecheClass.prototype._mj$fuegeHinzu$void$Object, comment: "Fügt ein beliebiges Objekt hinzu: gezeichnet werden alle Figuren, die seine öffentlichen get-Methoden liefern (in alphabetischer Reihenfolge der Methodennamen)." },
        { type: "method", signature: "void setzeEinsNachVorne(int pNummer)", native: ZeichenflaecheClass.prototype._setzeEinsNachVorne, comment: "Schiebt das Objekt mit dem Index pNummer in meineFiguren eine Position nach vorne (es wird später gezeichnet)." },
        { type: "method", signature: "void setzeEinsNachHinten(int pNummer)", native: ZeichenflaecheClass.prototype._setzeEinsNachHinten, comment: "Schiebt das Objekt mit dem Index pNummer in meineFiguren eine Position nach hinten (es wird früher gezeichnet)." },
        { type: "method", signature: "void setzeEinsNachVorne(Figur pFigur)", native: ZeichenflaecheClass.prototype._setzeEinsNachVorneFigur, comment: "Schiebt die Figur in meineFiguren eine Position nach vorne. Ist sie nicht in der Liste, geschieht nichts." },
        { type: "method", signature: "void setzeEinsNachHinten(Figur pFigur)", native: ZeichenflaecheClass.prototype._setzeEinsNachHintenFigur, comment: "Schiebt die Figur in meineFiguren eine Position nach hinten. Ist sie nicht in der Liste, geschieht nichts." },
        { type: "method", signature: "void setzeGanzNachVorne(int pNummer)", native: ZeichenflaecheClass.prototype._setzeGanzNachVorne, comment: "Schiebt das Objekt mit dem Index pNummer ganz nach vorne (es wird zuletzt gezeichnet)." },
        { type: "method", signature: "void setzeGanzNachVorne(Figur pFigur)", native: ZeichenflaecheClass.prototype._setzeGanzNachVorneFigur, comment: "Schiebt die Figur ganz nach vorne (sie wird zuletzt gezeichnet). Ist sie nicht in der Liste, geschieht nichts." },
        { type: "method", signature: "void setzeGanzNachHinten(int pNummer)", native: ZeichenflaecheClass.prototype._setzeGanzNachHinten, comment: "Schiebt das Objekt mit dem Index pNummer ganz nach hinten (es wird als erstes gezeichnet)." },
        { type: "method", signature: "void setzeGanzNachHinten(Figur pFigur)", native: ZeichenflaecheClass.prototype._setzeGanzNachHintenFigur, comment: "Schiebt die Figur ganz nach hinten (sie wird als erstes gezeichnet). Ist sie nicht in der Liste, geschieht nichts." },
        { type: "method", signature: "int gibIndex(Figur pFigur)", native: ZeichenflaecheClass.prototype._gibIndex, comment: "Liefert den Index der Figur in meineFiguren, -1 wenn sie nicht darin ist." },
        { type: "method", signature: "void zeigeInfofenster()", native: ZeichenflaecheClass.prototype._zeigeInfofenster, comment: "Öffnet das Infofenster, das alle Objekte der Zeichenfläche auflistet." },
        { type: "method", signature: "protected void aktualisiereInfofenster()", java: ZeichenflaecheClass.prototype._mj$aktualisiereInfofenster$void$, comment: "Aktualisiert das Infofenster. Wird bei jedem Neuzeichnen aufgerufen." },
        { type: "method", signature: "Figur[] gibFiguren()", native: ZeichenflaecheClass.prototype._gibFiguren, comment: "Liefert die Figuren der Zeichenfläche in einem Array." },
        { type: "method", signature: "int getBreite()", native: ZeichenflaecheClass.prototype._getBreite, comment: "Liefert die Breite der Zeichenfläche." },
        { type: "method", signature: "int getHoehe()", native: ZeichenflaecheClass.prototype._getBreiteHoehe, comment: "Liefert die Höhe der Zeichenfläche." },

        // from JFrame
        { type: "method", signature: "void repaint()", native: ZeichenflaecheClass.prototype._repaint, comment: "Zeichnet die Zeichenfläche neu." },
        { type: "method", signature: "int getWidth()", native: ZeichenflaecheClass.prototype._getBreite, comment: "Liefert die Breite der Zeichenfläche." },
        { type: "method", signature: "int getHeight()", native: ZeichenflaecheClass.prototype._getBreiteHoehe, comment: "Liefert die Höhe der Zeichenfläche." },
        { type: "method", signature: "void setTitle(String title)", native: ZeichenflaecheClass.prototype._setTitle, comment: "Setzt den Fenstertitel." },
        { type: "method", signature: "String getTitle()", native: ZeichenflaecheClass.prototype._getTitle, comment: "Liefert den Fenstertitel." },
        { type: "method", signature: "java.awt.Graphics getGraphics()", native: ZeichenflaecheClass.prototype.graphicsObject, comment: "Liefert den Zeichenstift der Zeichenfläche." },
    ];

    static type: NonPrimitiveType;

    meineFiguren: ArrayListClass = new ArrayListClass();
    infoFrame: InfofensterClass = new InfofensterClass()._infofenster(new StringClass("Meine Figuren"));

    width: number = 800;
    height: number = 600;
    title: string = "";
    layer?: ZeichnenLayer;
    runtime!: ZeichnenRuntime;
    private stift?: ZeichnenGraphicsClass;

    _cj$_constructor_$Zeichenflaeche$(t: Thread, callback: CallbackFunction) {
        this.erzeuge(t, 800, 600, () => this.fertig(t, callback));
    }

    _cj$_constructor_$Zeichenflaeche$int$int(t: Thread, callback: CallbackFunction, breite: number, hoehe: number) {
        this.erzeuge(t, breite, hoehe, () => this.fertig(t, callback));
    }

    /** puts the surface on the canvas; then is called once it is there */
    erzeuge(t: Thread, breite: number, hoehe: number, then: () => void) {
        this.width = breite;
        this.height = hoehe;
        this.runtime = ZeichnenRuntime.of(t);
        this.infoFrame.host = () => this.runtime.world?.graphicsDiv;
        this.runtime.addSurface(t, this, then);
    }

    fertig(t: Thread, callback: CallbackFunction) {
        t.s.push(this);
        if (callback) callback();
    }

    figuren(): any[] {
        return elementsOf(this.meineFiguren);
    }

    graphicsObject(): ZeichnenGraphicsClass {
        if (!this.stift) this.stift = ZeichnenGraphicsClass.on(this);
        return this.stift;
    }

    markDirty() {
        this.runtime?.markDirty();
    }

    // ---- painting ----

    paint(t: Thread, callback: () => void) {
        this.layer?.clear(WHITE, this.width, this.height);
        forEachInOrder(this.zuZeichnen(), (o, next) => o._mj$zeichneDich$void$(t, next), () => {
            if (!this.infoFrame.sichtbar) { callback(); return; }
            (this as any)._mj$aktualisiereInfofenster$void$(t, callback);
        });
    }

    /** everything paint draws, in this order */
    zuZeichnen(): any[] {
        return this.figuren().filter(o => o != null);
    }

    needsContinuousRepaint(): boolean {
        return this.zuZeichnen().some(o => !drawsWithoutProgramCode(o));
    }

    _mj$aktualisiereInfofenster$void$(t: Thread, callback: CallbackFunction) {
        this.infoAbschnitte(t, abschnitte => {
            this.infoFrame._setzeText(abschnitte.join("\n"));
            if (callback) callback();
        });
    }

    /** the sections of the info window: a heading and one line per object */
    infoAbschnitte(t: Thread, callback: (abschnitte: string[]) => void) {
        describe(t, this.figuren(), lines => callback(["Zeichenbare Objekte", ...lines]));
    }

    // ---- adding ----

    _mj$fuegeHinzu$void$ZeichnendesObjekt(t: Thread, callback: CallbackFunction, neues: any) {
        this.hinzufuegenZeichnend(t, neues, () => callback?.());
    }

    _mj$fuegeHinzu$void$Object(t: Thread, callback: CallbackFunction, neues: any) {
        this.hinzufuegenObjekt(t, neues, () => callback?.());
    }

    hinzufuegenZeichnend(t: Thread, neues: any, then: () => void) {
        if (neues == null) { then(); return; }
        neues._mj$setFlaeche$void$Zeichenflaeche(t, () => {
            this.figuren().push(neues);
            this.markDirty();
            then();
        }, this);
    }

    /** objects that are no ZeichnendesObjekt are drawn with the figures their getters return */
    hinzufuegenObjekt(t: Thread, neues: any, then: () => void) {
        if (neues == null) { then(); return; }
        if (implementsType(neues, "zeichnen.ZeichnendesObjekt")) {
            this.hinzufuegenZeichnend(t, neues, then);
            return;
        }
        ObjektinterpreterClass.interpretiere(t, neues, form => this.hinzufuegenZeichnend(t, form, then));
    }

    // ---- order ----

    _setzeEinsNachVorne(nummer: number) {
        let liste = this.figuren();
        if (nummer >= 0 && nummer < liste.length - 1) {
            let tmp = liste[nummer];
            liste[nummer] = liste[nummer + 1];
            liste[nummer + 1] = tmp;
            this.markDirty();
        }
    }

    _setzeEinsNachHinten(nummer: number) {
        this._setzeEinsNachVorne(nummer - 1);
    }

    _setzeEinsNachVorneFigur(figur: FigurClass) {
        this._setzeEinsNachVorne(this._gibIndex(figur));
    }

    _setzeEinsNachHintenFigur(figur: FigurClass) {
        let index = this._gibIndex(figur);
        if (index >= 0) this._setzeEinsNachHinten(index);
    }

    _setzeGanzNachVorne(nummer: number) {
        if (nummer < 0) return;
        for (let i = 0; i < this.figuren().length - 1 - nummer; i++) {
            this._setzeEinsNachVorne(nummer + i);
        }
    }

    _setzeGanzNachVorneFigur(figur: FigurClass) {
        this._setzeGanzNachVorne(this._gibIndex(figur));
    }

    _setzeGanzNachHinten(nummer: number) {
        if (nummer >= this.figuren().length) return;
        for (let i = 0; i < nummer; i++) {
            this._setzeEinsNachHinten(nummer - i);
        }
    }

    _setzeGanzNachHintenFigur(figur: FigurClass) {
        this._setzeGanzNachHinten(this._gibIndex(figur));
    }

    _gibIndex(figur: FigurClass): number {
        return this.figuren().indexOf(figur);
    }

    // ---- other ----

    _zeigeInfofenster() {
        this.infoFrame._setVisible(true);
        this.markDirty();
    }

    _gibFiguren(): FigurClass[] {
        return this.figuren().filter(o => o instanceof FigurClass);
    }

    _getBreite(): number {
        return this.width;
    }

    _getBreiteHoehe(): number {
        return this.height;
    }

    _repaint() {
        this.markDirty();
    }

    _setTitle(title: StringClass) {
        this.title = str(title);
    }

    _getTitle(): StringClass {
        return new StringClass(this.title);
    }
}

export class TimerflaecheClass extends ZeichenflaecheClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Timerflaeche extends Zeichenflaeche", comment: "Eine Zeichenfläche mit einem Timer: in jedem Intervall (anfangs 1 Sekunde) wird agiere() aller agierenden Objekte aufgerufen und danach neu gezeichnet." },

        { type: "field", signature: "protected ArrayList<AgierendesObjekt> meineAkteure", comment: "Die Akteure der Timerfläche, deren agiere() der Timer aufruft." },

        { type: "method", signature: "Timerflaeche()", java: TimerflaecheClass.prototype._cj$_constructor_$Timerflaeche$, comment: "Erstellt eine neue Timerfläche mit den Abmessungen 800 mal 600 und startet den Timer." },
        { type: "method", signature: "void setzeIntervall(int pMillis)", native: TimerflaecheClass.prototype._setzeIntervall, comment: "Setzt das Intervall, in dem der Timer ein Signal gibt, auf pMillis Millisekunden." },
        { type: "method", signature: "void fuegeHinzu(ZeichnendesObjekt pNeues)", java: TimerflaecheClass.prototype._mj$fuegeHinzu$void$ZeichnendesObjekt, comment: "Fügt das Objekt hinzu. Ist es ein AgierendesObjekt, wird es zusätzlich bei jedem Signal des Timers zum Agieren aufgefordert." },
        { type: "method", signature: "void fuegeHinzu(Object pNeues)", java: TimerflaecheClass.prototype._mj$fuegeHinzu$void$Object, comment: "Fügt das Objekt hinzu. Ist es ein AgierendesObjekt, wird es bei jedem Signal des Timers zum Agieren aufgefordert; gezeichnet werden die Figuren, die seine get-Methoden liefern." },
        { type: "method", signature: "void aktualisiereInfofenster()", java: TimerflaecheClass.prototype._mj$aktualisiereInfofenster$void$, comment: "Aktualisiert das Infofenster." },
        { type: "method", signature: "protected void agiere()", java: TimerflaecheClass.prototype._mj$agiere$void$, comment: "Wird bei jedem Signal des Timers aufgerufen: ruft agiere() aller Akteure auf und zeichnet neu." },
    ];

    static type: NonPrimitiveType;

    meineAkteure: ArrayListClass = new ArrayListClass();
    intervall: number = 1000;

    _cj$_constructor_$Timerflaeche$(t: Thread, callback: CallbackFunction) {
        this.erzeugeTimerflaeche(t, () => this.fertig(t, callback));
    }

    erzeugeTimerflaeche(t: Thread, then: () => void) {
        this.erzeuge(t, 800, 600, () => {
            this.runtime.startTimer(this, this.intervall);
            then();
        });
    }

    _setzeIntervall(millis: number) {
        if (millis < 0) throw new RuntimeExceptionClass("Invalid delay: " + millis);
        this.intervall = millis;
        if (this.runtime) this.runtime.startTimer(this, millis);
    }

    onTimer(t: Thread, callback: () => void) {
        (this as any)._mj$agiere$void$(t, callback);
    }

    _mj$agiere$void$(t: Thread, callback: CallbackFunction) {
        forEachInOrder(elementsOf(this.meineAkteure).slice(), (akteur, next) => akteur._mj$agiere$void$(t, next), () => {
            this.markDirty();
            callback?.();
        });
    }

    _mj$fuegeHinzu$void$ZeichnendesObjekt(t: Thread, callback: CallbackFunction, neues: any) {
        this._mj$fuegeHinzu$void$Object(t, callback, neues);
    }

    _mj$fuegeHinzu$void$Object(t: Thread, callback: CallbackFunction, neues: any) {
        if (implementsType(neues, "zeichnen.AgierendesObjekt")) {
            elementsOf(this.meineAkteure).push(neues);
        }
        this.hinzufuegenObjekt(t, neues, () => {
            this.markDirty();
            callback?.();
        });
    }

    infoAbschnitte(t: Thread, callback: (abschnitte: string[]) => void) {
        super.infoAbschnitte(t, abschnitte => {
            describe(t, elementsOf(this.meineAkteure), lines => callback([...abschnitte, "", "Agierende Objekte", ...lines]));
        });
    }
}

export class TastenflaecheClass extends TimerflaecheClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class Tastenflaeche extends Timerflaeche", comment: "Eine Timerfläche, deren steuerbare Objekte auf Tastendrücke reagieren (Beta)." },

        { type: "field", signature: "protected ArrayList<SteuerbaresObjekt> meineReagierendenObjekte", comment: "Die Objekte, die auf das Drücken einer Taste reagieren." },

        { type: "method", signature: "Tastenflaeche()", java: TastenflaecheClass.prototype._cj$_constructor_$Tastenflaeche$, comment: "Erstellt eine neue Tastenfläche mit den Abmessungen 800 mal 600." },
        { type: "method", signature: "void fuegeHinzu(SteuerbaresObjekt pNeues)", java: TastenflaecheClass.prototype._mj$fuegeHinzu$void$SteuerbaresObjekt, comment: "Fügt das Objekt zu den Objekten hinzu, die auf Tastendrücke reagieren; es wird nach allen anderen Objekten gezeichnet." },
        { type: "method", signature: "void aktualisiereInfofenster()", java: TastenflaecheClass.prototype._mj$aktualisiereInfofenster$void$, comment: "Aktualisiert das Infofenster." },
    ];

    static type: NonPrimitiveType;

    meineReagierendenObjekte: ArrayListClass = new ArrayListClass();

    _cj$_constructor_$Tastenflaeche$(t: Thread, callback: CallbackFunction) {
        this.erzeugeTimerflaeche(t, () => {
            this.runtime.listenToKeys();
            this.fertig(t, callback);
        });
    }

    _mj$fuegeHinzu$void$SteuerbaresObjekt(t: Thread, callback: CallbackFunction, neues: any) {
        if (neues == null) throw new NullPointerExceptionClass("Das hinzuzufügende Objekt ist null.");
        neues._mj$setFlaeche$void$Zeichenflaeche(t, () => {
            elementsOf(this.meineReagierendenObjekte).push(neues);
            this.markDirty();
            callback?.();
        }, this);
    }

    onKeyTyped(t: Thread, callback: () => void, taste: string) {
        forEachInOrder(elementsOf(this.meineReagierendenObjekte).slice(), (o, next) => o._mj$reagiereAufTaste$void$char(t, next, taste), () => {
            this.markDirty();
            callback();
        });
    }

    zuZeichnen(): any[] {
        return super.zuZeichnen().concat(elementsOf(this.meineReagierendenObjekte).filter(o => o != null));
    }

    infoAbschnitte(t: Thread, callback: (abschnitte: string[]) => void) {
        super.infoAbschnitte(t, abschnitte => {
            describe(t, elementsOf(this.meineReagierendenObjekte), lines => callback([...abschnitte, "", "Steuerbare Objekte", ...lines]));
        });
    }
}

export class ImperativeZeichenflaecheClass extends ZeichenflaecheClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class ImperativeZeichenflaeche extends Zeichenflaeche", comment: "Zeichenfläche mit Methoden, die Figuren erzeugen und gleich hinzufügen. Wird von ImperativesZeichnen benutzt." },
        { type: "method", signature: "ImperativeZeichenflaeche()", java: ImperativeZeichenflaecheClass.prototype._cj$_constructor_$ImperativeZeichenflaeche$, comment: "Erstellt eine neue Zeichenfläche mit den Abmessungen 800 mal 600." },
        { type: "method", signature: "void zeichneRechteck(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe)", native: ImperativeZeichenflaecheClass.prototype._zeichneRechteck, comment: "Fügt ein Rechteck hinzu." },
        { type: "method", signature: "void zeichneDreieck(int pX1, int pY1, int pX2, int pY2, int pX3, int pY3, boolean pGefuellt, String pFarbe)", native: ImperativeZeichenflaecheClass.prototype._zeichneDreieck, comment: "Fügt ein Dreieck hinzu." },
        { type: "method", signature: "void zeichneOval(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe)", native: ImperativeZeichenflaecheClass.prototype._zeichneOval, comment: "Fügt ein Oval hinzu." },
        { type: "method", signature: "void zeichneLinie(int pXKoord, int pYKoord, int pXEnde, int pYEnde, String pFarbe)", native: ImperativeZeichenflaecheClass.prototype._zeichneLinie, comment: "Fügt eine Linie hinzu." },
    ];

    static type: NonPrimitiveType;

    _cj$_constructor_$ImperativeZeichenflaeche$(t: Thread, callback: CallbackFunction) {
        this.erzeuge(t, 800, 600, () => this.fertig(t, callback));
    }

    /** a figure of the library has nothing to run on a thread: add it right away */
    private hinzu(figur: FigurClass) {
        figur._setFlaeche(this);
        this.figuren().push(figur);
        this.markDirty();
    }

    _zeichneRechteck(x: number, y: number, b: number, h: number, gefuellt: boolean, farbe: StringClass) {
        this.hinzu(new RechteckClass()._rechteckMitFarbname(x, y, b, h, gefuellt, farbe));
    }

    _zeichneDreieck(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, gefuellt: boolean, farbe: StringClass) {
        this.hinzu(new DreieckClass()._dreieckMitFarbname(x1, y1, x2, y2, x3, y3, gefuellt, farbe));
    }

    _zeichneOval(x: number, y: number, b: number, h: number, gefuellt: boolean, farbe: StringClass) {
        this.hinzu(new OvalClass()._ovalMitFarbname(x, y, b, h, gefuellt, farbe));
    }

    _zeichneLinie(x: number, y: number, xEnde: number, yEnde: number, farbe: StringClass) {
        this.hinzu(new LinieClass()._linieMitFarbname(x, y, xEnde, yEnde, farbe));
    }
}

const SCHWARZ = new StringClass("schwarz");

export class ImperativesZeichnenClass extends ObjectClass {

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "class ImperativesZeichnen extends Object", comment: "Zeichnen ohne Objekte: mit import static zeichnen.ImperativesZeichnen.*; stehen starteZeichenflaeche(), zeichneRechteck(...) usw. direkt zur Verfügung." },
        { type: "method", signature: "ImperativesZeichnen()", native: ImperativesZeichnenClass.prototype._imperativesZeichnen },

        { type: "method", signature: "static void starteZeichenflaeche()", java: ImperativesZeichnenClass._starteZeichenflaeche, comment: "Öffnet die Zeichenfläche (800 mal 600 Pixel). Muss vor dem ersten Zeichnen aufgerufen werden." },
        { type: "method", signature: "static void zeichneWas()", native: ImperativesZeichnenClass._zeichneWas, comment: "Zeichnet ein pinkfarbenes Rechteck." },
        { type: "method", signature: "static void zeichneRechteck(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe)", native: ImperativesZeichnenClass._zeichneRechteckFarbe, comment: "Zeichnet ein Rechteck mit der linken oberen Ecke (pXKoord|pYKoord) in der angegebenen Farbe." },
        { type: "method", signature: "static void zeichneRechteck(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt)", native: ImperativesZeichnenClass._zeichneRechteck, comment: "Zeichnet ein schwarzes Rechteck mit der linken oberen Ecke (pXKoord|pYKoord)." },
        { type: "method", signature: "static void zeichneOval(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe)", native: ImperativesZeichnenClass._zeichneOvalFarbe, comment: "Zeichnet ein Oval in das Rechteck mit der linken oberen Ecke (pXKoord|pYKoord) in der angegebenen Farbe." },
        { type: "method", signature: "static void zeichneOval(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt)", native: ImperativesZeichnenClass._zeichneOval, comment: "Zeichnet ein schwarzes Oval in das Rechteck mit der linken oberen Ecke (pXKoord|pYKoord)." },
        { type: "method", signature: "static void zeichnePunkt(int pXKoord, int pYKoord)", native: ImperativesZeichnenClass._zeichnePunkt, comment: "Zeichnet einen schwarzen Punkt (Durchmesser 4 Pixel) bei (pXKoord|pYKoord)." },
        { type: "method", signature: "static void zeichneDreieck(int pX1, int pY1, int pX2, int pY2, int pX3, int pY3, boolean pGefuellt, String pFarbe)", native: ImperativesZeichnenClass._zeichneDreieckFarbe, comment: "Zeichnet ein Dreieck mit den drei Eckpunkten in der angegebenen Farbe." },
        { type: "method", signature: "static void zeichneDreieck(int pX1, int pY1, int pX2, int pY2, int pX3, int pY3, boolean pGefuellt)", native: ImperativesZeichnenClass._zeichneDreieck, comment: "Zeichnet ein schwarzes Dreieck mit den drei Eckpunkten." },
        { type: "method", signature: "static void zeichneLinie(int pXKoord, int pYKoord, int pXEnde, int pYEnde, String pFarbe)", native: ImperativesZeichnenClass._zeichneLinieFarbe, comment: "Zeichnet eine Linie von (pXKoord|pYKoord) nach (pXEnde|pYEnde) in der angegebenen Farbe." },
        { type: "method", signature: "static void zeichneLinie(int pXKoord, int pYKoord, int pXEnde, int pYEnde)", native: ImperativesZeichnenClass._zeichneLinie, comment: "Zeichnet eine schwarze Linie von (pXKoord|pYKoord) nach (pXEnde|pYEnde)." },
        { type: "method", signature: "static void warte(int pDauer)", java: ImperativesZeichnenClass._warte, comment: "Hält das Programm pDauer Millisekunden lang an." },
    ];

    static type: NonPrimitiveType;

    /** the surface of the running program; there is one program at a time */
    static meineFlaeche?: ImperativeZeichenflaecheClass;

    _imperativesZeichnen(): ImperativesZeichnenClass {
        return this;
    }

    static _starteZeichenflaeche(t: Thread) {
        let flaeche = new ImperativeZeichenflaecheClass();
        ImperativesZeichnenClass.meineFlaeche = flaeche;
        let runtime = ZeichnenRuntime.of(t);
        runtime.onReset(() => {
            if (ImperativesZeichnenClass.meineFlaeche === flaeche) ImperativesZeichnenClass.meineFlaeche = undefined;
        });
        flaeche._cj$_constructor_$ImperativeZeichenflaeche$(t, () => { t.s.pop(); });
    }

    static flaeche(): ImperativeZeichenflaecheClass {
        let flaeche = ImperativesZeichnenClass.meineFlaeche;
        if (!flaeche) throw new NullPointerExceptionClass("Es gibt noch keine Zeichenfläche: zuerst starteZeichenflaeche() aufrufen.");
        return flaeche;
    }

    static _zeichneWas() {
        ImperativesZeichnenClass.flaeche()._zeichneRechteck(100, 200, 200, 50, true, new StringClass("pink"));
    }

    static _zeichneRechteckFarbe(x: number, y: number, b: number, h: number, gefuellt: boolean, farbe: StringClass) {
        ImperativesZeichnenClass.flaeche()._zeichneRechteck(x, y, b, h, gefuellt, farbe);
    }

    static _zeichneRechteck(x: number, y: number, b: number, h: number, gefuellt: boolean) {
        ImperativesZeichnenClass._zeichneRechteckFarbe(x, y, b, h, gefuellt, SCHWARZ);
    }

    static _zeichneOvalFarbe(x: number, y: number, b: number, h: number, gefuellt: boolean, farbe: StringClass) {
        ImperativesZeichnenClass.flaeche()._zeichneOval(x, y, b, h, gefuellt, farbe);
    }

    static _zeichneOval(x: number, y: number, b: number, h: number, gefuellt: boolean) {
        ImperativesZeichnenClass._zeichneOvalFarbe(x, y, b, h, gefuellt, SCHWARZ);
    }

    static _zeichnePunkt(x: number, y: number) {
        ImperativesZeichnenClass.flaeche()._zeichneOval(x - 2, y - 2, 4, 4, true, SCHWARZ);
    }

    static _zeichneDreieckFarbe(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, gefuellt: boolean, farbe: StringClass) {
        ImperativesZeichnenClass.flaeche()._zeichneDreieck(x1, y1, x2, y2, x3, y3, gefuellt, farbe);
    }

    static _zeichneDreieck(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, gefuellt: boolean) {
        ImperativesZeichnenClass._zeichneDreieckFarbe(x1, y1, x2, y2, x3, y3, gefuellt, SCHWARZ);
    }

    static _zeichneLinieFarbe(x: number, y: number, xEnde: number, yEnde: number, farbe: StringClass) {
        ImperativesZeichnenClass.flaeche()._zeichneLinie(x, y, xEnde, yEnde, farbe);
    }

    static _zeichneLinie(x: number, y: number, xEnde: number, yEnde: number) {
        ImperativesZeichnenClass._zeichneLinieFarbe(x, y, xEnde, yEnde, SCHWARZ);
    }

    static _warte(t: Thread, dauer: number) {
        warte(t, dauer);
    }
}

/** Thread.sleep for warte(int) of ImperativesZeichnen and Zeichenturtle */
export function warte(t: Thread, dauer: number) {
    if (dauer < 0) throw new RuntimeExceptionClass("timeout value is negative");
    t.scheduler.suspendThread(t);
    t.state = ThreadState.timedWaiting;
    setTimeout(() => t.scheduler.restoreThread(t), dauer);
}
