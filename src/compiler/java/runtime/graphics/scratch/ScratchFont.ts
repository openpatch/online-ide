import ubuntuMonoUrl from "/assets/fonts/UbuntuMono-Regular.ttf";

/**
 * The desktop library draws all of its text in UbuntuMono. The .ttf is bundled
 * by src/development/scratchAssetsGenerator.js, but a bundled file is not a
 * usable font until it is registered with the document — without this every
 * `fontFamily: "UbuntuMono, monospace"` in the library silently fell back to
 * the browser's default monospace, so bubbles and Text came out in the wrong
 * typeface and at a slightly different size from the desktop render.
 */
export const SCRATCH_FONT_FAMILY = "UbuntuMono, monospace";

let loadPromise: Promise<void> | undefined;

export function loadScratchFont(): Promise<void> {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
        const fonts = (document as any).fonts;
        if (!fonts || typeof FontFace === "undefined") return;
        try {
            const face = new FontFace("UbuntuMono", `url(${ubuntuMonoUrl})`);
            await face.load();
            fonts.add(face);
        } catch (e) {
            // a missing font is not worth failing a program over
            console.warn("Scratch: UbuntuMono konnte nicht geladen werden / could not be loaded", e);
        }
    })();
    return loadPromise;
}
