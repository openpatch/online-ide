import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { ScratchSound, ScratchSoundBank } from "./ScratchSounds";
import { InterfaceClass } from "../../system/javalang/InterfaceClass";
import { Thread } from "../../../../common/interpreter/Thread";
import { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";

export class AutoCloseableInterface extends InterfaceClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "java.lang", signature: "interface AutoCloseable" },
        { type: "method", signature: "void close()", java: AutoCloseableInterface.prototype._mj$close$void$ },
    ];
    static type: NonPrimitiveType;
    _mj$close$void$(_t: Thread, _callback: CallbackParameter) { }
}

/** One play, backed by its own Howler playback ID rather than another audio file. */
export class ScratchSoundPlaybackClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.sound", signature: "class SoundPlayback extends Object implements java.lang.AutoCloseable" },
        { type: "method", signature: "private SoundPlayback()", native: ScratchSoundPlaybackClass.prototype._constructor },
        { type: "method", signature: "string getName()", native: ScratchSoundPlaybackClass.prototype._getName },
        { type: "method", signature: "boolean isPlaying()", native: ScratchSoundPlaybackClass.prototype._isPlaying },
        { type: "method", signature: "void stop()", native: ScratchSoundPlaybackClass.prototype._stop },
        { type: "method", signature: "void close()", native: ScratchSoundPlaybackClass.prototype._stop },
        { type: "method", signature: "void setVolume(double percent)", native: ScratchSoundPlaybackClass.prototype._setVolume },
        { type: "method", signature: "double getVolume()", native: ScratchSoundPlaybackClass.prototype._getVolume },
    ];
    static type: NonPrimitiveType;
    private sound!: ScratchSound;
    _constructor() { return this; }

    static start(bank: ScratchSoundBank, name: string, volume: number): ScratchSoundPlaybackClass {
        const handle = new ScratchSoundPlaybackClass();
        try { handle.sound = bank.playCopy(name, volume); }
        catch (error) { throw new RuntimeExceptionClass((error as Error).message); }
        return handle;
    }
    _getName(): string { return this.sound.name; }
    _isPlaying(): boolean { return this.sound.isPlaying(); }
    _stop(): void { this.sound.stop(); }
    _setVolume(percent: number): void {
        if (!Number.isFinite(percent)) throw new RuntimeExceptionClass("Sound volume must be a finite percentage.");
        this.sound.setVolume(percent);
    }
    _getVolume(): number { return this.sound.getVolume(); }
}
