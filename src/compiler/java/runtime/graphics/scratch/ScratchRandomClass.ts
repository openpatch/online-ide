import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { noise2, noise3ImproveXY } from "./OpenSimplex2S";
import { ScratchStageClass } from "./ScratchStageClass";
import { ScratchVector2Class } from "./ScratchVector2Class";

/** Constants of java.util.Random's linear congruential generator. */
const LCG_MULTIPLIER = 0x5deece66dn;
const LCG_ADDEND = 0xbn;
const LCG_MASK = (1n << 48n) - 1n;
const DOUBLE_UNIT = Math.pow(2, -53);

/**
 * Reimplementation of java.util.Random, so that a program seeded with
 * randomSeed() produces the very same sequence here as on the desktop.
 */
class JavaRandom {
    private seed: bigint = 0n;

    constructor() {
        // java.util.Random() seeds itself from the clock; any unpredictable
        // value will do, as long as randomSeed() can still make it repeatable.
        this.setSeed(BigInt(Date.now()) ^ BigInt(Math.floor(Math.random() * 0x1000000000000)));
    }

    setSeed(seed: bigint) {
        this.seed = (seed ^ LCG_MULTIPLIER) & LCG_MASK;
    }

    private next(bits: number): number {
        this.seed = (this.seed * LCG_MULTIPLIER + LCG_ADDEND) & LCG_MASK;
        return Number(this.seed >> BigInt(48 - bits)) | 0;
    }

    nextDouble(): number {
        return ((this.next(26) * 134217728) + this.next(27)) * DOUBLE_UNIT;
    }

    nextInt(bound: number): number {
        let r = this.next(31);
        const m = bound - 1;
        if ((bound & m) === 0) {
            // Power of two: take the high bits of the product.
            r = Number((BigInt(bound) * BigInt(r)) >> 31n) | 0;
        } else {
            // Reject the values that would bias the modulo, exactly where
            // java.util.Random rejects them (the test relies on int overflow).
            for (let u = r; ((u - (r = u % bound) + m) | 0) < 0; u = this.next(31));
        }
        return r;
    }
}

/**
 * Static random and noise helpers, mirroring org.openpatch.scratch.Random.
 * Randomness comes from a java.util.Random clone and the noise from
 * OpenSimplex2S, so seeded programs behave identically to the desktop library.
 */
export class ScratchRandomClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Random extends Object", comment: "Zufallszahlen und Rauschen (Noise)" },

        { type: "method", signature: "static double noise(double x)", native: ScratchRandomClass._noise1, comment: "Gibt den Rauschwert (Open Simplex Noise) an der Stelle x zurück" },
        { type: "method", signature: "static double noise(double x, double y)", native: ScratchRandomClass._noise2, comment: "Gibt den Rauschwert (Open Simplex Noise) an der Stelle (x, y) zurück" },
        { type: "method", signature: "static double noise(double x, double y, double z)", native: ScratchRandomClass._noise3, comment: "Gibt den Rauschwert (Open Simplex Noise) an der Stelle (x, y, z) zurück" },
        { type: "method", signature: "static void noiseSeed(long noiseSeed)", native: ScratchRandomClass._noiseSeed, comment: "Setzt den Startwert für das Rauschen" },

        { type: "method", signature: "static Vector2 randomVector2()", native: ScratchRandomClass._randomVector2, comment: "Gibt einen zufälligen Vektor der Länge 1 zurück" },
        { type: "method", signature: "static double randomX()", java: ScratchRandomClass._randomX, comment: "Gibt eine zufällige x-Koordinate innerhalb der Bühne zurück" },
        { type: "method", signature: "static double randomY()", java: ScratchRandomClass._randomY, comment: "Gibt eine zufällige y-Koordinate innerhalb der Bühne zurück" },
        { type: "method", signature: "static Vector2 randomPosition()", java: ScratchRandomClass._randomPosition, comment: "Gibt eine zufällige Position auf der Bühne zurück" },

        { type: "method", signature: "static double random()", native: ScratchRandomClass._random0, comment: "Gibt eine Zufallszahl zwischen 0 und 1 zurück" },
        { type: "method", signature: "static double random(double max)", native: ScratchRandomClass._random1, comment: "Gibt eine Zufallszahl zwischen 0 und max zurück" },
        { type: "method", signature: "static double random(double min, double max)", native: ScratchRandomClass._random2, comment: "Gibt eine Zufallszahl zwischen min und max zurück" },
        { type: "method", signature: "static int randomInt(int max)", native: ScratchRandomClass._randomInt1, comment: "Gibt eine ganze Zufallszahl zwischen 0 und max zurück (beide eingeschlossen)" },
        { type: "method", signature: "static int randomInt(int min, int max)", native: ScratchRandomClass._randomInt2, comment: "Gibt eine ganze Zufallszahl zwischen min und max zurück (beide eingeschlossen)" },
        { type: "method", signature: "static void randomSeed(long seed)", native: ScratchRandomClass._randomSeed, comment: "Setzt den Startwert für die Zufallszahlen; danach wiederholt sich dieselbe Folge" },
    ];

    static type: NonPrimitiveType;

    private static internalRandom?: JavaRandom;
    private static noiseSeed: bigint = 1n;

    private static getRandom(): JavaRandom {
        if (ScratchRandomClass.internalRandom == null) {
            ScratchRandomClass.internalRandom = new JavaRandom();
        }
        return ScratchRandomClass.internalRandom;
    }

    static _noise1(x: number): number { return noise2(ScratchRandomClass.noiseSeed, x, x); }
    static _noise2(x: number, y: number): number { return noise2(ScratchRandomClass.noiseSeed, x, y); }
    static _noise3(x: number, y: number, z: number): number { return noise3ImproveXY(ScratchRandomClass.noiseSeed, x, y, z); }
    static _noiseSeed(noiseSeed: number) { ScratchRandomClass.noiseSeed = BigInt(Math.trunc(noiseSeed)); }

    static _random0(): number { return ScratchRandomClass.getRandom().nextDouble(); }
    static _random1(max: number): number { return ScratchRandomClass.getRandom().nextDouble() * max; }
    static _random2(min: number, max: number): number { return ScratchRandomClass.getRandom().nextDouble() * (max - min) + min; }
    static _randomInt1(max: number): number { return ScratchRandomClass.getRandom().nextInt(max + 1); }
    static _randomInt2(min: number, max: number): number { return ScratchRandomClass.getRandom().nextInt(max + 1 - min) + min; }
    static _randomSeed(seed: number) { ScratchRandomClass.getRandom().setSeed(BigInt(Math.trunc(seed))); }

    static _randomVector2(): ScratchVector2Class {
        const v = new ScratchVector2Class(ScratchRandomClass._random0(), ScratchRandomClass._random0());
        return v._unitVector();
    }

    /** The stage decides how far the coordinates may reach, so we need the interpreter. */
    private static stageSize(t: Thread): { width: number, height: number } {
        const stage = t.scheduler.interpreter.retrieveObject("ScratchStage") as ScratchStageClass | undefined;
        // Without a stage there is nothing to place anything on; fall back to
        // the default stage size rather than throwing.
        if (stage == null) return { width: 480, height: 360 };
        return { width: stage._getWidth(), height: stage._getHeight() };
    }

    private static randomXValue(t: Thread): number {
        const w = ScratchRandomClass.stageSize(t).width;
        return ScratchRandomClass._random2(-w / 2.0, w / 2.0);
    }

    private static randomYValue(t: Thread): number {
        const h = ScratchRandomClass.stageSize(t).height;
        return ScratchRandomClass._random2(-h / 2.0, h / 2.0);
    }

    static _randomX(t: Thread) { t.s.push(ScratchRandomClass.randomXValue(t)); }
    static _randomY(t: Thread) { t.s.push(ScratchRandomClass.randomYValue(t)); }

    static _randomPosition(t: Thread) {
        t.s.push(new ScratchVector2Class(ScratchRandomClass.randomXValue(t), ScratchRandomClass.randomYValue(t)));
    }
}
