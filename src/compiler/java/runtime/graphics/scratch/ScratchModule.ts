import { CodeFragment } from "../../../../common/disassembler/CodeFragment";
import { JavaLibraryModule } from "../../../module/libraries/JavaLibraryModule";
import { BooleanSupplierInterface } from "./BooleanSupplierInterface";
import { KeyCodeEnum } from "./KeyCodeEnum";
import { LayerEnum } from "./LayerEnum";
import { MouseCodeEnum } from "./MouseCodeEnum";
import { RotationStyleEnum } from "./RotationStyleEnum";
import { ScratchAnimatedSpriteClass } from "./ScratchAnimatedSpriteClass";
import { ScratchBoundsClass } from "./ScratchBoundsClass";
import { ScratchCameraClass } from "./ScratchCameraClass";
import { ScratchClockClass } from "./ScratchClockClass";
import { ScratchColorClass } from "./ScratchColorClass";
import {
    ScratchFFmpegRecorderClass, ScratchFileClass, ScratchFrameRecorderClass, ScratchGifRecorderClass,
    ScratchMapObjectClass, ScratchPixelsClass, ScratchRecorderClass, ScratchShaderClass,
    ScratchPropertyClass, ScratchShadersClass, ScratchSortingClass, ScratchTiledMapClass,
    ScratchTilesetImageClass,
} from "./ScratchDesktopOnlyClasses";
import { ScratchExceptionClass } from "./ScratchExceptionClass";
import { ScratchHitboxClass } from "./ScratchHitboxClass";
import { ScratchHtmlColorClass } from "./ScratchHtmlColorClass";
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
import { ScratchUISpriteClass } from "./ScratchUISpriteClass";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { ScratchWindowClass } from "./ScratchWindowClass";
import { TextAlignEnum } from "./TextAlignEnum";
import { TextStyleEnum } from "./TextStyleEnum";
import { TextureSamplingEnum } from "./TextureSamplingEnum";

/**
 * "Scratch for Java" library — a browser port of org.openpatch.scratch
 * (https://scratch4j.openpatch.org). Public class/method signatures match the
 * desktop library so student code copy-pastes between the two.
 *
 * Because the IDE's Java subset has no packages, the Scratch classes share the
 * global namespace with the always-on graphics classes. When this library is
 * enabled the workspace is Scratch-only, so `prepareSystemModule` removes the
 * base classes whose names Scratch reuses (see NRWModule for the same pattern).
 */
export class ScratchModule extends JavaLibraryModule {

    constructor() {
        super();
        this.classesInterfacesEnums.push(
            KeyCodeEnum, MouseCodeEnum, RotationStyleEnum, LayerEnum, TextAlignEnum, TextStyleEnum,
            TextureSamplingEnum,
            BooleanSupplierInterface,
            ScratchOperatorsClass, ScratchRandomClass, ScratchClockClass,
            ScratchHtmlColorClass, ScratchExceptionClass,
            ScratchColorClass, ScratchVector2Class, ScratchTimerClass, ScratchCameraClass,
            ScratchBoundsClass, ScratchHitboxClass,
            // geometry for custom hitboxes; these names also exist in the
            // always-on graphics module, and Scratch's win (see the note below)
            ScratchShapeClass, ScratchCircleClass, ScratchRectangleClass,
            ScratchEllipseClass, ScratchTriangleClass, ScratchPolygonClass,
            ScratchWindowClass,
            ScratchStageClass, ScratchSpriteClass, ScratchAnimatedSpriteClass, ScratchUISpriteClass,
            ScratchPenClass, ScratchTextClass,
            // desktop-only: declared so copied code still compiles and runs
            ScratchPixelsClass, ScratchSortingClass, ScratchShaderClass, ScratchShadersClass,
            ScratchRecorderClass, ScratchGifRecorderClass, ScratchFFmpegRecorderClass, ScratchFrameRecorderClass,
            ScratchFileClass, ScratchMapObjectClass, ScratchTiledMapClass,
            ScratchPropertyClass, ScratchTilesetImageClass,
        );
    }

    isReplModule(): boolean {
        return false;
    }

    getCodeFragments(): CodeFragment[] {
        return [];
    }

    // NOTE on name collisions: Scratch redefines names that also exist in the always-on
    // SystemModule (Color, Vector2, Timer, Sprite, Text). Additional modules compile AFTER
    // SystemModule and JavaTypeStore.addType is last-write-wins by identifier, so the Scratch
    // versions win automatically. We deliberately do NOT override prepareSystemModule to
    // remove the base classes: removal would risk unresolved-type errors for any base class
    // that still references a removed name, and "only Scratch runs when Scratch is enabled".

}
