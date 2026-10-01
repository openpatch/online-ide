import { afterEach, describe, expect, test } from 'vitest';
import { resolveAssetUrl, setAssetBase } from '../compiler/java/runtime/graphics/scratch/ScratchAssetUrls';

describe('Scratch asset paths', () => {

    afterEach(() => setAssetBase(undefined));

    test('a relative path starts from the configured project folder', () => {
        setAssetBase("/kapitel/spielwerkstatt");
        const url = new URL(resolveAssetUrl("assets/actor/held.png"));
        expect(url.pathname).toBe("/kapitel/spielwerkstatt/assets/actor/held.png");
    });

    test('the folder may be given with or without a trailing slash', () => {
        setAssetBase("/kapitel/spielwerkstatt/");
        expect(new URL(resolveAssetUrl("./assets/a.ogg")).pathname).toBe("/kapitel/spielwerkstatt/assets/a.ogg");
    });

    test('the folder may be a full URL', () => {
        setAssetBase("https://example.org/buch/werkstatt");
        expect(resolveAssetUrl("assets/a.png")).toBe("https://example.org/buch/werkstatt/assets/a.png");
    });

    test('without a folder a relative path starts from the page, as in the browser', () => {
        expect(resolveAssetUrl("assets/a.png")).toBe(new URL("assets/a.png", document.baseURI).href);
    });

    test('absolute paths, URLs and data URLs are left alone', () => {
        setAssetBase("/kapitel/spielwerkstatt");
        expect(resolveAssetUrl("/bilder/a.png")).toBe("/bilder/a.png");
        expect(resolveAssetUrl("https://example.org/a.png")).toBe("https://example.org/a.png");
        expect(resolveAssetUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    });
});
