import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { InterfaceClass } from "../../system/javalang/InterfaceClass";

/**
 * Stand-in for java.util.function.BooleanSupplier, which Stage.waitUntil takes.
 * There are no packages in this Java subset, so the bare name has to do.
 */
export class BooleanSupplierInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "interface BooleanSupplier", comment: "Liefert einen Wahrheitswert, z.B. als Lambda-Ausdruck" },
        { type: "method", signature: "boolean getAsBoolean()", java: BooleanSupplierInterface.prototype._mj$getAsBoolean$boolean$, comment: "Gibt den Wahrheitswert zurück" },
    ];

    static type: NonPrimitiveType;

    _mj$getAsBoolean$boolean$(_t: Thread, _callback: CallbackFunction) { }
}
