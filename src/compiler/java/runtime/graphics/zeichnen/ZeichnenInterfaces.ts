import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { InterfaceClass } from "../../system/javalang/InterfaceClass";

export class ZeichnendesObjektInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "interface ZeichnendesObjekt", comment: "Ein Objekt, das auf einer Zeichenfläche dargestellt werden kann." },
        { type: "method", signature: "void setFlaeche(Zeichenflaeche pFlaeche)", java: ZeichnendesObjektInterface.prototype._mj$setFlaeche$void$Zeichenflaeche, comment: "Legt fest, auf welcher Zeichenfläche sich das Objekt befindet." },
        { type: "method", signature: "void zeichneDich()", java: ZeichnendesObjektInterface.prototype._mj$zeichneDich$void$, comment: "Legt fest, wie sich das Objekt selbst zeichnet." },
    ];

    static type: NonPrimitiveType;

    _mj$setFlaeche$void$Zeichenflaeche(_t: Thread, _callback: CallbackFunction, _flaeche: any) { }
    _mj$zeichneDich$void$(_t: Thread, _callback: CallbackFunction) { }
}

export class AgierendesObjektInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "interface AgierendesObjekt", comment: "Ein Objekt, das auf den Impuls des Timers einer Timerfläche reagiert." },
        { type: "method", signature: "void agiere()", java: AgierendesObjektInterface.prototype._mj$agiere$void$, comment: "Legt fest, wie das Objekt auf den Impuls des Timers der Timerfläche reagiert." },
    ];

    static type: NonPrimitiveType;

    _mj$agiere$void$(_t: Thread, _callback: CallbackFunction) { }
}

export class SteuerbaresObjektInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "zeichnen", signature: "interface SteuerbaresObjekt extends ZeichnendesObjekt", comment: "Ein Objekt, das auf Tastendrücke auf einer Tastenfläche reagiert." },
        { type: "method", signature: "void reagiereAufTaste(char pTaste)", java: SteuerbaresObjektInterface.prototype._mj$reagiereAufTaste$void$char, comment: "Legt fest, wie das Objekt auf das Drücken der Taste mit dem Zeichen pTaste reagiert." },
    ];

    static type: NonPrimitiveType;

    _mj$reagiereAufTaste$void$char(_t: Thread, _callback: CallbackFunction, _taste: string) { }
}
