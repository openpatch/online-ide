import { ScratchTiledMapClass } from "./ScratchTiledMapClass";
import { ScratchDrawingClass, ScratchDrawingSpriteClass } from "./ScratchDrawingClasses";
import { ScratchBitmapTextClass } from "./ScratchBitmapTextClass";
import { AutoCloseableInterface, ScratchSoundPlaybackClass } from "./ScratchSoundPlaybackClass";
import { CodeFragment } from "../../../../common/disassembler/CodeFragment";
import { JavaLibraryModule } from "../../../module/libraries/JavaLibraryModule";
import { BooleanSupplierInterface } from "./BooleanSupplierInterface";
import { SupplierInterface } from './SupplierInterface';
import { applyScratchCatalog } from './ScratchCatalog';
import { KeyCodeEnum } from "./KeyCodeEnum";
import { LayerEnum } from "./LayerEnum";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { RotationStyleEnum } from "./RotationStyleEnum";
import { GamepadButtonEnum, GamepadListenerInterface, GamepadStickEnum, GamepadTriggerEnum, ScratchGamepadClass } from "./ScratchGamepadClasses";
import { ScratchBoundsClass } from "./ScratchBoundsClass";
import { ScratchCameraClass } from "./ScratchCameraClass";
import { ScratchClockClass } from "./ScratchClockClass";
import { ScratchColorClass } from "./ScratchColorClass";
import {
    ScratchFileClass, ScratchGifRecorderClass,
    ScratchMapObjectClass,
    ScratchPropertyClass,
    ScratchTilesetImageClass,
} from "./ScratchDesktopOnlyClasses";
import { ScratchPixelsClass } from "./ScratchPixels";
import { ScratchShaderClass, ScratchShadersClass } from "./ScratchShaders";
import { ScratchIOExceptionClass, ScratchSaveDataClass } from './ScratchSaveDataClass';
import { ScratchExceptionClass } from "./ScratchExceptionClass";
import { ScratchHtmlColorClass } from "./ScratchHtmlColorClass";
import { ScratchListFlavour } from "./ScratchLists";
import {
    ScratchCircleClass, ScratchEllipseClass, ScratchPolygonClass, ScratchRectangleClass,
    ScratchShapeClass, ScratchTriangleClass,
} from "./ScratchShapeClasses";
import { ScratchOperatorsClass } from "./ScratchOperatorsClass";
import { ScratchPenClass } from "./ScratchPenClass";
import { ScratchRandomClass } from "./ScratchRandomClass";
import { ScratchStageClass } from "./ScratchStageClass";
import { ScratchSpriteClass } from "./ScratchSpriteClass";
import { ScratchTextClass } from "./ScratchTextClass";
import { ScratchTimerClass } from "./ScratchTimerClass";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { TransitionEnum } from "./TransitionEnum";
import { ScratchWindowClass } from "./ScratchWindowClass";
import { TextAlignEnum } from "./TextAlignEnum";
import { TextStyleEnum } from "./TextStyleEnum";

/**
 * "Scratch for Java" library — a browser port of org.openpatch.scratch
 * (https://scratch4j.openpatch.org). Public class/method signatures match the
 * desktop library so student code copy-pastes between the two.
 *
 * The classes sit in the same packages as upstream, so a file copied from a
 * desktop project keeps its `import org.openpatch.scratch.*;` and still compiles.
 * `getStandardImports` imports all of them implicitly as well, so a program that
 * writes no import at all works just as it did before the packages existed.
 */
export class ScratchModule extends JavaLibraryModule implements ScratchListFlavour {

    /**
     * @param scratchNrwLists true when the NRW classes are loaded as well — the counterpart of
     * the NRW build of Scratch for Java: Stage.getAll, Stage.find and Sprite.getTouchingSprites
     * return the List of the NRW Zentralabitur instead of java.util.List. It needs the
     * NRWModule next to it, which is where that List comes from.
     */
    constructor(readonly scratchNrwLists: boolean = false) {
        super();
        this.classesInterfacesEnums.push(
            KeyCodeEnum, MouseCodeEnum, RotationStyleEnum, LayerEnum, TextAlignEnum, TextStyleEnum,
            TransitionEnum,
            // the gamepad extension, org.openpatch.scratch.gamepad
            GamepadButtonEnum, GamepadStickEnum, GamepadTriggerEnum,
            BooleanSupplierInterface,
            SupplierInterface, AutoCloseableInterface, GamepadListenerInterface,
            ScratchDrawingClass, ScratchDrawingSpriteClass, ScratchBitmapTextClass, ScratchSoundPlaybackClass,
            ScratchIOExceptionClass, ScratchSaveDataClass,
            ScratchOperatorsClass, ScratchRandomClass, ScratchClockClass, ScratchGamepadClass,
            ScratchHtmlColorClass, ScratchExceptionClass,
            ScratchColorClass, ScratchVector2Class, ScratchTimerClass, ScratchCameraClass,
            ScratchBoundsClass,
            // geometry for custom hitboxes; these names also exist in the
            // always-on graphics module, and Scratch's win (see getStandardImports)
            ScratchShapeClass, ScratchCircleClass, ScratchRectangleClass,
            ScratchEllipseClass, ScratchTriangleClass, ScratchPolygonClass,
            ScratchWindowClass,
            ScratchStageClass, ScratchSpriteClass,
            ScratchPenClass, ScratchTextClass,
            // desktop-only: declared so copied code still compiles and runs
            ScratchPixelsClass, ScratchShaderClass, ScratchShadersClass,
            ScratchGifRecorderClass,
            ScratchFileClass, ScratchMapObjectClass, ScratchTiledMapClass,
            ScratchPropertyClass, ScratchTilesetImageClass,
        );
        this.classesInterfacesEnums.forEach(applyScratchCatalog);
    }

    isReplModule(): boolean {
        return false;
    }

    getCodeFragments(): CodeFragment[] {
        return [];
    }

    /**
     * Upstream's package layout, so that every `import org.openpatch.scratch...` a desktop
     * file carries resolves here too. Importing them all as standard imports keeps the
     * simple names available without an import — and it is what makes the Scratch classes
     * shadow the always-on graphics classes of the same name (Color, Timer, Sprite, Text,
     * Circle, Rectangle, ...): TypeResolver looks in the imported types before it looks in
     * the type store, so no base class has to be removed for Scratch's version to win.
     */
    getStandardImports(): string[][] {
        return [
            ["org", "openpatch", "scratch", "*"],
            // the gamepad extension
            ["org", "openpatch", "scratch", "gamepad", "*"],
            ["java", "lang", "AutoCloseable"],
            ["org", "openpatch", "scratch", "drawing", "*"],
            ["org", "openpatch", "scratch", "save", "*"],
            ["org", "openpatch", "scratch", "recorder", "*"],
            ["org", "openpatch", "scratch", "tiled", "*"],
            // Stage.waitUntil takes a java.util.function.BooleanSupplier
            ["java", "util", "function", "*"],
            ["java", "io", "*"],
            // the declarations' List is the nrw List then; see the constructor
            ...(this.scratchNrwLists ? [["nrw", "List"]] : []),
        ];
    }

}
