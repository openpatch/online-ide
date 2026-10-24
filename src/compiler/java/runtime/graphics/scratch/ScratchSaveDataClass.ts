import type { CallbackParameter } from '../../../../common/interpreter/CallbackParameter';
import type { Thread } from '../../../../common/interpreter/Thread';
import { ThreadState } from '../../../../common/interpreter/ThreadState';
import type { LibraryDeclarations } from '../../../module/libraries/DeclareType';
import { JavaClass } from '../../../types/JavaClass';
import type { NonPrimitiveType } from '../../../types/NonPrimitiveType';
import type { ClassClass } from '../../system/ClassClass';
import { ExceptionClass } from '../../system/javalang/ExceptionClass';
import { IllegalArgumentExceptionClass } from '../../system/javalang/IllegalArgumentException';
import { ObjectClass } from '../../system/javalang/ObjectClassStringClass';
import { ThrowableClass } from '../../system/javalang/ThrowableClass';
import { decodeScratchSave, encodeScratchSave } from './ScratchSaveDataCodec';
import { readScratchSave, scratchSaveDatabase, writeScratchSave } from './ScratchSaveDataStore';
import type { SupplierInterface } from './SupplierInterface';

/** Catchable storage failures, including unavailable, blocked or full browser storage. */
export class ScratchIOExceptionClass extends ExceptionClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: 'declaration', package: 'java.io', signature: 'class IOException extends Exception' },
        { type: 'method', signature: 'IOException(String message)', native: ThrowableClass.prototype._constructor_m },
    ];
    static type: NonPrimitiveType;
    constructor(public message?: string) { super(); }
}

function checkName(value: string) {
    if (value == null || value.length > 100 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
        || value.endsWith('.') || value.includes('..')
        || /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])$/i.test(value.split('.')[0])) {
        throw new IllegalArgumentExceptionClass('Use a simple game ID or slot name: ' + value);
    }
}

/** Same sequential Java API as the desktop helper, with asynchronous IndexedDB underneath. */
export class ScratchSaveDataClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: 'declaration', package: 'org.openpatch.scratch.save', signature: 'class SaveData<T> extends Object' },
        { type: 'method', signature: 'SaveData(string gameId, string slot, Class<T> type)', native: ScratchSaveDataClass.prototype._constructorSave },
        { type: 'method', signature: 'T loadOrDefault(Supplier<? extends T> defaults)', java: ScratchSaveDataClass.prototype._loadOrDefault },
        { type: 'method', signature: 'void save(T data)', java: ScratchSaveDataClass.prototype._save },
        { type: 'method', signature: 'string getLocation()', native: ScratchSaveDataClass.prototype._getLocation },
    ];
    static type: NonPrimitiveType;
    private gameId!: string;
    private slot!: string;
    private dataType!: JavaClass;

    _constructorSave(gameId: string, slot: string, type: ClassClass) {
        checkName(gameId);
        checkName(slot);
        if (!(type?.type instanceof JavaClass)) throw new IllegalArgumentExceptionClass('Save data needs a data class');
        this.gameId = gameId;
        this.slot = slot;
        this.dataType = type.type;
        return this;
    }

    _getLocation(): string {
        return `indexeddb://${scratchSaveDatabase}/saves/${this.gameId}/${this.slot}`;
    }

    _loadOrDefault(thread: Thread, callback: CallbackParameter, defaults: SupplierInterface) {
        if (!defaults) throw new IllegalArgumentExceptionClass('Defaults must not be null');
        this.wait(thread, () => readScratchSave(this.gameId, this.slot), json => {
            if (json === undefined) {
                defaults._mj$get$T$(thread, () => {
                    if (thread.s[thread.s.length - 1] == null) {
                        thread.s.pop();
                        thread.throwRuntimeExceptionOnLastExecutedStep(new ScratchIOExceptionClass('Defaults returned null'));
                    } else callback?.();
                });
            } else {
                decodeScratchSave(thread, json, this.dataType, value => { thread.s.push(value); callback?.(); });
            }
        });
    }

    _save(thread: Thread, callback: CallbackParameter, data: ObjectClass) {
        let json: string;
        try { json = encodeScratchSave(data, this.dataType); }
        catch (error) { throw this.failure(error); }
        this.wait(thread, () => writeScratchSave(this.gameId, this.slot, json), () => callback?.());
    }

    /** Resume only the original live thread; stopping a program never resumes stale work. */
    private wait<T>(thread: Thread, operation: () => Promise<T>, done: (value: T) => void) {
        const events = thread.scheduler.interpreter.eventManager;
        let stopped = false;
        const stop = () => { stopped = true; };
        events.once('stop', stop);
        thread.state = ThreadState.waiting;
        void Promise.resolve().then(operation).then(value => {
            if (!stopped && thread.state === ThreadState.waiting) {
                thread.state = ThreadState.running;
                done(value);
            }
        }).catch(error => {
            if (!stopped && ![ThreadState.terminated, ThreadState.terminatedWithException].includes(thread.state)) {
                thread.state = ThreadState.running;
                thread.throwRuntimeExceptionOnLastExecutedStep(this.failure(error));
            }
        }).finally(() => events.off(stop));
    }

    private failure(error: unknown): ScratchIOExceptionClass {
        return new ScratchIOExceptionClass(`Cannot save or load ${this.gameId}/${this.slot}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
