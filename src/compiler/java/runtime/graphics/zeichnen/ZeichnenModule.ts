import { CodeFragment } from "../../../../common/disassembler/CodeFragment";
import { JavaLibraryModule } from "../../../module/libraries/JavaLibraryModule";
import { FarbmanagerClass, ZuordnungClass } from "./FarbmanagmentClasses";
import { BasisturtleClass, TurtleflaecheClass, ZeichenturtleClass } from "./TurtleClasses";
import { DreieckClass, FigurClass, LinieClass, OvalClass, RechteckClass } from "./ZeichnenFigurClasses";
import { ImperativesZeichnenClass, ImperativeZeichenflaecheClass, InfofensterClass, TastenflaecheClass, TimerflaecheClass, ZeichenflaecheClass } from "./ZeichnenFlaecheClasses";
import { KomplexeFormClass, ObjektinterpreterClass, ZusammengesetzteFormClass } from "./ZeichnenFormClasses";
import { ZeichnenGraphicsClass } from "./ZeichnenGraphicsClass";
import { AgierendesObjektInterface, SteuerbaresObjektInterface, ZeichnendesObjektInterface } from "./ZeichnenInterfaces";

/**
 * "Zeichnen mit Java" (ZeichnenMitJavaVSC2025_07.jar): the packages zeichnen,
 * turtle and farbmanagment, used as on the desktop with import zeichnen.*; or
 * import static zeichnen.ImperativesZeichnen.*;
 *
 * Nothing is imported implicitly, so classes of the program may carry the names
 * of the library's classes, as the examples of the book do (e.g. AgierendesRechteck).
 */
export class ZeichnenModule extends JavaLibraryModule {

    constructor() {
        super();
        this.classesInterfacesEnums.push(
            ZeichnenGraphicsClass,
            FarbmanagerClass, ZuordnungClass,
            ZeichnendesObjektInterface, AgierendesObjektInterface, SteuerbaresObjektInterface,
            FigurClass, LinieClass, OvalClass, RechteckClass, DreieckClass,
            ZusammengesetzteFormClass, KomplexeFormClass, ObjektinterpreterClass,
            InfofensterClass, ZeichenflaecheClass, TimerflaecheClass, TastenflaecheClass,
            ImperativeZeichenflaecheClass, ImperativesZeichnenClass,
            BasisturtleClass, ZeichenturtleClass, TurtleflaecheClass,
        );
    }

    isReplModule(): boolean {
        return false;
    }

    getCodeFragments(): CodeFragment[] {
        return [];
    }
}
