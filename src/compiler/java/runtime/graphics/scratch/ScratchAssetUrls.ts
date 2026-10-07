/**
 * Where a relative path such as `addCostume("held", "assets/held.png")` points.
 *
 * On the desktop such a path is read relative to the project folder. In the
 * browser there is no project folder, so the page embedding the IDE may name a
 * base URL standing in for it (MainEmbedded's `assetBaseUrl`; Hyperbook gives
 * the folder of the page's Markdown file). Then the same program, with an
 * `assets` folder next to it, runs on the desktop and in the book alike.
 *
 * Without a base, a relative path is resolved against the page as a browser
 * would. It must not be left to the loaders: PIXI resolves a path relative to
 * an extensionless page URL as if the page were a folder
 * (".../seite" + "assets/x.png" -> ".../seite/assets/x.png").
 *
 * Absolute paths ("/x.png"), URLs with a scheme and data URLs are left alone.
 */

let assetBase: string | undefined;

/**
 * The relative paths runs have asked for, so that a project export can take
 * along files whose names a program builds at run time ("walk" + i + ".png").
 */
const requested: Set<string> = new Set();

export function requestedAssetPaths(): string[] {
    return [...requested];
}

/** Called by the first stage of a run with what the IDE was configured with. */
export function setAssetBase(base: string | undefined) {
    assetBase = base ? (base.endsWith("/") ? base : base + "/") : undefined;
}

export function resolveAssetUrl(path: string): string {
    if (!path || path.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
    requested.add(path);
    const pageUrl = typeof document !== "undefined" ? document.baseURI : undefined;
    try {
        const base = assetBase ? new URL(assetBase, pageUrl).href : pageUrl;
        return base ? new URL(path, base).href : path;
    } catch (e) {
        return path;
    }
}
