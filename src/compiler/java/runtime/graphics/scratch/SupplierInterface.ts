import type { Thread } from '../../../../common/interpreter/Thread';
import type { CallbackParameter } from '../../../../common/interpreter/CallbackParameter';
import type { LibraryDeclarations } from '../../../module/libraries/DeclareType';
import { InterfaceClass } from '../../system/javalang/InterfaceClass';

export class SupplierInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: 'declaration', package: 'java.util.function', signature: 'interface Supplier<T>' },
        { type: 'method', signature: 'T get()', java: SupplierInterface.prototype._mj$get$T$ },
    ];
    _mj$get$T$(_thread: Thread, _callback: CallbackParameter) { }
}
