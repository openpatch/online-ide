import { Stacktrace } from "../../../../common/interpreter/ThrowableType";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ThrowableClass } from "../../system/javalang/ThrowableClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * The library's own unchecked exception, mirroring
 * org.openpatch.scratch.ScratchException, which declares only the message
 * constructor.
 *
 * The stacktrace field and the TS constructor are what every other exception
 * class here carries; without them the thrown object is not a usable Throwable
 * and the interpreter walks off the end of the step list while unwinding.
 */
export class ScratchExceptionClass extends RuntimeExceptionClass {

    stacktrace: Stacktrace = [];

    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class ScratchException extends RuntimeException", comment: SRC.exceptionClassComment },
        { type: "method", signature: "public ScratchException(String message)", native: ThrowableClass.prototype._constructor_m, comment: SRC.exceptionConstructorComment },
        { type: "method", signature: "public String toString()", native: ThrowableClass.prototype._toString, comment: SRC.exceptionToStringComment },
    ];

    static type: NonPrimitiveType;

    constructor(public message?: string, public cause?: ThrowableClass) {
        super();
    }
}
