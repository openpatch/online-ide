/**
 * Port of org.openpatch.scratch.internal.OpenSimplex2S (KdotJPG, public domain),
 * reduced to the two evaluators the Scratch Random class exposes: 2D noise and
 * 3D noise with improved XY isotropy.
 *
 * The hash step needs true 64-bit wrap-around, so seeds and lattice coordinates
 * are bigints; everything else stays in JS doubles. Upstream computes the
 * falloffs in float, so values agree with the desktop library to about seven
 * decimal places rather than bit for bit.
 */

const PRIME_X = 0x5205402b9270c86fn;
const PRIME_Y = 0x598cd327003817b5n;
const PRIME_Z = 0x5bcc226e9fa0bacbn;
const HASH_MULTIPLIER = 0x53a3f72deec546f5n;

const SKEW_2D = 0.366025403784439;
const UNSKEW_2D = -0.21132486540518713;

const ROOT3OVER3 = 0.577350269189626;
const ROTATE3_ORTHOGONALIZER = UNSKEW_2D;

const N_GRADS_2D_EXPONENT = 7;
const N_GRADS_3D_EXPONENT = 8;
const N_GRADS_2D = 1 << N_GRADS_2D_EXPONENT;
const N_GRADS_3D = 1 << N_GRADS_3D_EXPONENT;

const NORMALIZER_2D = 0.05481866495625118;
const NORMALIZER_3D = 0.2781926117527186;

const RSQUARED_2D = 2.0 / 3.0;
const RSQUARED_3D = 3.0 / 4.0;

const SEED_FLIP_3D = -0x52d547b2e96ed629n;

/** The 24 unit gradients of the 2D lattice, tiled up to N_GRADS_2D entries. */
const GRAD_2D: number[] = [
    0.38268343236509, 0.923879532511287,
    0.923879532511287, 0.38268343236509,
    0.923879532511287, -0.38268343236509,
    0.38268343236509, -0.923879532511287,
    -0.38268343236509, -0.923879532511287,
    -0.923879532511287, -0.38268343236509,
    -0.923879532511287, 0.38268343236509,
    -0.38268343236509, 0.923879532511287,
    0.130526192220052, 0.99144486137381,
    0.608761429008721, 0.793353340291235,
    0.793353340291235, 0.608761429008721,
    0.99144486137381, 0.130526192220051,
    0.99144486137381, -0.130526192220051,
    0.793353340291235, -0.60876142900872,
    0.608761429008721, -0.793353340291235,
    0.130526192220052, -0.99144486137381,
    -0.130526192220052, -0.99144486137381,
    -0.608761429008721, -0.793353340291235,
    -0.793353340291235, -0.608761429008721,
    -0.99144486137381, -0.130526192220052,
    -0.99144486137381, 0.130526192220051,
    -0.793353340291235, 0.608761429008721,
    -0.608761429008721, 0.793353340291235,
    -0.130526192220052, 0.99144486137381,
];

/** The 48 gradients of the 3D lattice (x, y, z, unused), tiled to N_GRADS_3D. */
const GRAD_3D: number[] = [
    2.22474487139, 2.22474487139, -1.0, 0.0,
    2.22474487139, 2.22474487139, 1.0, 0.0,
    3.0862664687972017, 1.1721513422464978, 0.0, 0.0,
    1.1721513422464978, 3.0862664687972017, 0.0, 0.0,
    -2.22474487139, 2.22474487139, -1.0, 0.0,
    -2.22474487139, 2.22474487139, 1.0, 0.0,
    -1.1721513422464978, 3.0862664687972017, 0.0, 0.0,
    -3.0862664687972017, 1.1721513422464978, 0.0, 0.0,
    -1.0, -2.22474487139, -2.22474487139, 0.0,
    1.0, -2.22474487139, -2.22474487139, 0.0,
    0.0, -3.0862664687972017, -1.1721513422464978, 0.0,
    0.0, -1.1721513422464978, -3.0862664687972017, 0.0,
    -1.0, -2.22474487139, 2.22474487139, 0.0,
    1.0, -2.22474487139, 2.22474487139, 0.0,
    0.0, -1.1721513422464978, 3.0862664687972017, 0.0,
    0.0, -3.0862664687972017, 1.1721513422464978, 0.0,
    -2.22474487139, -2.22474487139, -1.0, 0.0,
    -2.22474487139, -2.22474487139, 1.0, 0.0,
    -3.0862664687972017, -1.1721513422464978, 0.0, 0.0,
    -1.1721513422464978, -3.0862664687972017, 0.0, 0.0,
    -2.22474487139, -1.0, -2.22474487139, 0.0,
    -2.22474487139, 1.0, -2.22474487139, 0.0,
    -1.1721513422464978, 0.0, -3.0862664687972017, 0.0,
    -3.0862664687972017, 0.0, -1.1721513422464978, 0.0,
    -2.22474487139, -1.0, 2.22474487139, 0.0,
    -2.22474487139, 1.0, 2.22474487139, 0.0,
    -3.0862664687972017, 0.0, 1.1721513422464978, 0.0,
    -1.1721513422464978, 0.0, 3.0862664687972017, 0.0,
    -1.0, 2.22474487139, -2.22474487139, 0.0,
    1.0, 2.22474487139, -2.22474487139, 0.0,
    0.0, 1.1721513422464978, -3.0862664687972017, 0.0,
    0.0, 3.0862664687972017, -1.1721513422464978, 0.0,
    -1.0, 2.22474487139, 2.22474487139, 0.0,
    1.0, 2.22474487139, 2.22474487139, 0.0,
    0.0, 3.0862664687972017, 1.1721513422464978, 0.0,
    0.0, 1.1721513422464978, 3.0862664687972017, 0.0,
    2.22474487139, -2.22474487139, -1.0, 0.0,
    2.22474487139, -2.22474487139, 1.0, 0.0,
    1.1721513422464978, -3.0862664687972017, 0.0, 0.0,
    3.0862664687972017, -1.1721513422464978, 0.0, 0.0,
    2.22474487139, -1.0, -2.22474487139, 0.0,
    2.22474487139, 1.0, -2.22474487139, 0.0,
    3.0862664687972017, 0.0, -1.1721513422464978, 0.0,
    1.1721513422464978, 0.0, -3.0862664687972017, 0.0,
    2.22474487139, -1.0, 2.22474487139, 0.0,
    2.22474487139, 1.0, 2.22474487139, 0.0,
    1.1721513422464978, 0.0, 3.0862664687972017, 0.0,
    3.0862664687972017, 0.0, 1.1721513422464978, 0.0,
];

function tile(source: number[], length: number, normalizer: number): Float64Array {
    const out = new Float64Array(length);
    for (let i = 0, j = 0; i < length; i++, j++) {
        if (j === source.length) j = 0;
        out[i] = source[j] / normalizer;
    }
    return out;
}

const GRADIENTS_2D = tile(GRAD_2D, N_GRADS_2D * 2, NORMALIZER_2D);
const GRADIENTS_3D = tile(GRAD_3D, N_GRADS_3D * 4, NORMALIZER_3D);

function grad2(seed: bigint, xsvp: bigint, ysvp: bigint, dx: number, dy: number): number {
    let hash = BigInt.asIntN(64, seed ^ xsvp ^ ysvp);
    hash = BigInt.asIntN(64, hash * HASH_MULTIPLIER);
    hash ^= hash >> BigInt(64 - N_GRADS_2D_EXPONENT + 1);
    const gi = Number(BigInt.asUintN(32, hash)) & ((N_GRADS_2D - 1) << 1);
    return GRADIENTS_2D[gi] * dx + GRADIENTS_2D[gi | 1] * dy;
}

function grad3(seed: bigint, xrvp: bigint, yrvp: bigint, zrvp: bigint, dx: number, dy: number, dz: number): number {
    let hash = BigInt.asIntN(64, (seed ^ xrvp) ^ (yrvp ^ zrvp));
    hash = BigInt.asIntN(64, hash * HASH_MULTIPLIER);
    hash ^= hash >> BigInt(64 - N_GRADS_3D_EXPONENT + 2);
    const gi = Number(BigInt.asUintN(32, hash)) & ((N_GRADS_3D - 1) << 2);
    return GRADIENTS_3D[gi] * dx + GRADIENTS_3D[gi | 1] * dy + GRADIENTS_3D[gi | 2] * dz;
}

/** 2D OpenSimplex2S noise, standard lattice orientation. */
export function noise2(seed: bigint, x: number, y: number): number {
    const s = SKEW_2D * (x + y);
    return noise2UnskewedBase(seed, x + s, y + s);
}

function noise2UnskewedBase(seed: bigint, xs: number, ys: number): number {
    const xsb = Math.floor(xs), ysb = Math.floor(ys);
    const xi = xs - xsb, yi = ys - ysb;

    // Prime pre-multiplication for hash.
    const xsbp = BigInt(xsb) * PRIME_X, ysbp = BigInt(ysb) * PRIME_Y;

    // Unskew.
    const t = (xi + yi) * UNSKEW_2D;
    const dx0 = xi + t, dy0 = yi + t;

    // First vertex.
    const a0 = RSQUARED_2D - dx0 * dx0 - dy0 * dy0;
    let value = (a0 * a0) * (a0 * a0) * grad2(seed, xsbp, ysbp, dx0, dy0);

    // Second vertex.
    const a1 = (2 * (1 + 2 * UNSKEW_2D) * (1 / UNSKEW_2D + 2)) * t
        + ((-2 * (1 + 2 * UNSKEW_2D) * (1 + 2 * UNSKEW_2D)) + a0);
    const dx1 = dx0 - (1 + 2 * UNSKEW_2D);
    const dy1 = dy0 - (1 + 2 * UNSKEW_2D);
    value += (a1 * a1) * (a1 * a1) * grad2(seed, xsbp + PRIME_X, ysbp + PRIME_Y, dx1, dy1);

    // Third and fourth vertices.
    const xmyi = xi - yi;
    if (t < UNSKEW_2D) {
        if (xi + xmyi > 1) {
            const dx2 = dx0 - (3 * UNSKEW_2D + 2);
            const dy2 = dy0 - (3 * UNSKEW_2D + 1);
            const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * grad2(seed, xsbp + (PRIME_X << 1n), ysbp + PRIME_Y, dx2, dy2);
            }
        } else {
            const dx2 = dx0 - UNSKEW_2D;
            const dy2 = dy0 - (UNSKEW_2D + 1);
            const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * grad2(seed, xsbp, ysbp + PRIME_Y, dx2, dy2);
            }
        }

        if (yi - xmyi > 1) {
            const dx3 = dx0 - (3 * UNSKEW_2D + 1);
            const dy3 = dy0 - (3 * UNSKEW_2D + 2);
            const a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
            if (a3 > 0) {
                value += (a3 * a3) * (a3 * a3) * grad2(seed, xsbp + PRIME_X, ysbp + (PRIME_Y << 1n), dx3, dy3);
            }
        } else {
            const dx3 = dx0 - (UNSKEW_2D + 1);
            const dy3 = dy0 - UNSKEW_2D;
            const a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
            if (a3 > 0) {
                value += (a3 * a3) * (a3 * a3) * grad2(seed, xsbp + PRIME_X, ysbp, dx3, dy3);
            }
        }
    } else {
        if (xi + xmyi < 0) {
            const dx2 = dx0 + (1 + UNSKEW_2D);
            const dy2 = dy0 + UNSKEW_2D;
            const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * grad2(seed, xsbp - PRIME_X, ysbp, dx2, dy2);
            }
        } else {
            const dx2 = dx0 - (UNSKEW_2D + 1);
            const dy2 = dy0 - UNSKEW_2D;
            const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * grad2(seed, xsbp + PRIME_X, ysbp, dx2, dy2);
            }
        }

        if (yi < xmyi) {
            const dx2 = dx0 + UNSKEW_2D;
            const dy2 = dy0 + (UNSKEW_2D + 1);
            const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * grad2(seed, xsbp, ysbp - PRIME_Y, dx2, dy2);
            }
        } else {
            const dx2 = dx0 - UNSKEW_2D;
            const dy2 = dy0 - (UNSKEW_2D + 1);
            const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * grad2(seed, xsbp, ysbp + PRIME_Y, dx2, dy2);
            }
        }
    }

    return value;
}

/** 3D OpenSimplex2S noise with better visual isotropy in (X, Y) - Z is the "different" axis. */
export function noise3ImproveXY(seed: bigint, x: number, y: number, z: number): number {
    // Re-orient the cubic lattices without skewing, so Z points up the main
    // lattice diagonal and the XY planes move out of alignment with the faces.
    const xy = x + y;
    const s2 = xy * ROTATE3_ORTHOGONALIZER;
    const zz = z * ROOT3OVER3;
    const xr = x + s2 + zz;
    const yr = y + s2 + zz;
    const zr = xy * -ROOT3OVER3 + zz;

    return noise3UnrotatedBase(seed, xr, yr, zr);
}

/** Overlapping cubic lattices forming the re-oriented BCC lattice. */
function noise3UnrotatedBase(seed: bigint, xr: number, yr: number, zr: number): number {
    const xrb = Math.floor(xr), yrb = Math.floor(yr), zrb = Math.floor(zr);
    const xi = xr - xrb, yi = yr - yrb, zi = zr - zrb;

    // Prime pre-multiplication for hash. Also flip seed for second lattice copy.
    const xrbp = BigInt(xrb) * PRIME_X, yrbp = BigInt(yrb) * PRIME_Y, zrbp = BigInt(zrb) * PRIME_Z;
    const seed2 = BigInt.asIntN(64, seed ^ SEED_FLIP_3D);

    // -1 if positive, 0 if negative.
    const xNMask = Math.trunc(-0.5 - xi), yNMask = Math.trunc(-0.5 - yi), zNMask = Math.trunc(-0.5 - zi);
    const xNm = BigInt(xNMask), yNm = BigInt(yNMask), zNm = BigInt(zNMask);
    const xNmInv = BigInt(~xNMask), yNmInv = BigInt(~yNMask), zNmInv = BigInt(~zNMask);

    // First vertex.
    const x0 = xi + xNMask;
    const y0 = yi + yNMask;
    const z0 = zi + zNMask;
    const a0 = RSQUARED_3D - x0 * x0 - y0 * y0 - z0 * z0;
    let value = (a0 * a0) * (a0 * a0)
        * grad3(seed, xrbp + (xNm & PRIME_X), yrbp + (yNm & PRIME_Y), zrbp + (zNm & PRIME_Z), x0, y0, z0);

    // Second vertex.
    const x1 = xi - 0.5;
    const y1 = yi - 0.5;
    const z1 = zi - 0.5;
    const a1 = RSQUARED_3D - x1 * x1 - y1 * y1 - z1 * z1;
    value += (a1 * a1) * (a1 * a1)
        * grad3(seed2, xrbp + PRIME_X, yrbp + PRIME_Y, zrbp + PRIME_Z, x1, y1, z1);

    // Shortcuts for building the remaining falloffs, derived by subtracting the
    // polynomials with the offsets plugged in.
    const xAFlipMask0 = ((xNMask | 1) << 1) * x1;
    const yAFlipMask0 = ((yNMask | 1) << 1) * y1;
    const zAFlipMask0 = ((zNMask | 1) << 1) * z1;
    const xAFlipMask1 = (-2 - (xNMask << 2)) * x1 - 1.0;
    const yAFlipMask1 = (-2 - (yNMask << 2)) * y1 - 1.0;
    const zAFlipMask1 = (-2 - (zNMask << 2)) * z1 - 1.0;

    let skip5 = false;
    const a2 = xAFlipMask0 + a0;
    if (a2 > 0) {
        const x2 = x0 - (xNMask | 1);
        value += (a2 * a2) * (a2 * a2)
            * grad3(seed, xrbp + (xNmInv & PRIME_X), yrbp + (yNm & PRIME_Y), zrbp + (zNm & PRIME_Z), x2, y0, z0);
    } else {
        const a3 = yAFlipMask0 + zAFlipMask0 + a0;
        if (a3 > 0) {
            const y3 = y0 - (yNMask | 1);
            const z3 = z0 - (zNMask | 1);
            value += (a3 * a3) * (a3 * a3)
                * grad3(seed, xrbp + (xNm & PRIME_X), yrbp + (yNmInv & PRIME_Y), zrbp + (zNmInv & PRIME_Z), x0, y3, z3);
        }

        const a4 = xAFlipMask1 + a1;
        if (a4 > 0) {
            const x4 = (xNMask | 1) + x1;
            value += (a4 * a4) * (a4 * a4)
                * grad3(seed2, xrbp + (xNm & (PRIME_X << 1n)), yrbp + PRIME_Y, zrbp + PRIME_Z, x4, y1, z1);
            skip5 = true;
        }
    }

    let skip9 = false;
    const a6 = yAFlipMask0 + a0;
    if (a6 > 0) {
        const y6 = y0 - (yNMask | 1);
        value += (a6 * a6) * (a6 * a6)
            * grad3(seed, xrbp + (xNm & PRIME_X), yrbp + (yNmInv & PRIME_Y), zrbp + (zNm & PRIME_Z), x0, y6, z0);
    } else {
        const a7 = xAFlipMask0 + zAFlipMask0 + a0;
        if (a7 > 0) {
            const x7 = x0 - (xNMask | 1);
            const z7 = z0 - (zNMask | 1);
            value += (a7 * a7) * (a7 * a7)
                * grad3(seed, xrbp + (xNmInv & PRIME_X), yrbp + (yNm & PRIME_Y), zrbp + (zNmInv & PRIME_Z), x7, y0, z7);
        }

        const a8 = yAFlipMask1 + a1;
        if (a8 > 0) {
            const y8 = (yNMask | 1) + y1;
            value += (a8 * a8) * (a8 * a8)
                * grad3(seed2, xrbp + PRIME_X, yrbp + (yNm & (PRIME_Y << 1n)), zrbp + PRIME_Z, x1, y8, z1);
            skip9 = true;
        }
    }

    let skipD = false;
    const aA = zAFlipMask0 + a0;
    if (aA > 0) {
        const zA = z0 - (zNMask | 1);
        value += (aA * aA) * (aA * aA)
            * grad3(seed, xrbp + (xNm & PRIME_X), yrbp + (yNm & PRIME_Y), zrbp + (zNmInv & PRIME_Z), x0, y0, zA);
    } else {
        const aB = xAFlipMask0 + yAFlipMask0 + a0;
        if (aB > 0) {
            const xB = x0 - (xNMask | 1);
            const yB = y0 - (yNMask | 1);
            value += (aB * aB) * (aB * aB)
                * grad3(seed, xrbp + (xNmInv & PRIME_X), yrbp + (yNmInv & PRIME_Y), zrbp + (zNm & PRIME_Z), xB, yB, z0);
        }

        const aC = zAFlipMask1 + a1;
        if (aC > 0) {
            const zC = (zNMask | 1) + z1;
            value += (aC * aC) * (aC * aC)
                * grad3(seed2, xrbp + PRIME_X, yrbp + PRIME_Y, zrbp + (zNm & (PRIME_Z << 1n)), x1, y1, zC);
            skipD = true;
        }
    }

    if (!skip5) {
        const a5 = yAFlipMask1 + zAFlipMask1 + a1;
        if (a5 > 0) {
            const y5 = (yNMask | 1) + y1;
            const z5 = (zNMask | 1) + z1;
            value += (a5 * a5) * (a5 * a5)
                * grad3(seed2, xrbp + PRIME_X, yrbp + (yNm & (PRIME_Y << 1n)), zrbp + (zNm & (PRIME_Z << 1n)), x1, y5, z5);
        }
    }

    if (!skip9) {
        const a9 = xAFlipMask1 + zAFlipMask1 + a1;
        if (a9 > 0) {
            const x9 = (xNMask | 1) + x1;
            const z9 = (zNMask | 1) + z1;
            value += (a9 * a9) * (a9 * a9)
                * grad3(seed2, xrbp + (xNm & (PRIME_X << 1n)), yrbp + PRIME_Y, zrbp + (zNm & (PRIME_Z << 1n)), x9, y1, z9);
        }
    }

    if (!skipD) {
        const aD = xAFlipMask1 + yAFlipMask1 + a1;
        if (aD > 0) {
            const xD = (xNMask | 1) + x1;
            const yD = (yNMask | 1) + y1;
            value += (aD * aD) * (aD * aD)
                * grad3(seed2, xrbp + (xNm & (PRIME_X << 1n)), yrbp + (yNm & (PRIME_Y << 1n)), zrbp + PRIME_Z, xD, yD, z1);
        }
    }

    return value;
}
