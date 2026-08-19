import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { InterfaceClass } from "../../system/javalang/InterfaceClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Stand-in for java.util.function.BooleanSupplier, which Stage.waitUntil takes.
 * Declared in its real package, so a copied `import java.util.function.BooleanSupplier;`
 * resolves; ScratchModule's standard imports keep the simple name usable too.
 */
export class BooleanSupplierInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "java.util.function", signature: "interface BooleanSupplier", comment: SRC.booleanSupplierClassComment },
        { type: "method", signature: "boolean getAsBoolean()", java: BooleanSupplierInterface.prototype._mj$getAsBoolean$boolean$, comment: SRC.booleanSupplierGetAsBooleanComment },
    ];

    static type: NonPrimitiveType;

    _mj$getAsBoolean$boolean$(_t: Thread, _callback: CallbackFunction) { }
}
