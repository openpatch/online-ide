import * as PIXI from "pixi.js";
import { isAssetFile } from "../../../../../client/workspace/AssetFile";
import type { Workspace } from "../../../../../client/workspace/Workspace";

/**
 * The files of the workspace a Scratch program can load by path: its own
 * pictures, sounds and fonts.
 *
 * On the desktop `addCostume("hero", "sprites/hero.png")` reads a file next to
 * the program. Here that file is a workspace asset — uploaded, or put there by
 * the page embedding the IDE (Hyperbook's `@file dest="sprites/hero.png"`) —
 * and its text is a data URL. Everything in the workspace is decoded once, when
 * the first stage of a run is built, so that the synchronous lookups the
 * library already makes (ScratchCostumes.getTexture, ScratchSounds.resolveUrl,
 * Text.addFont) can find a file by the same path the desktop program uses.
 *
 * What kind a file is comes from its data URL, since that is what the browser
 * will decode: an OGG may stand in for a WAV of the same name, which is useful
 * when the original is too large to put in a page.
 */
export class ScratchWorkspaceAssets {
    private static textures: Map<string, PIXI.Texture> = new Map();
    private static sounds: Map<string, { url: string, format?: string }> = new Map();
    private static fonts: Map<string, string> = new Map();

    /** Decoded images and fonts by data URL, so a second run is instant. */
    private static textureCache: Map<string, Promise<PIXI.Texture>> = new Map();
    private static fontCache: Map<string, Promise<string>> = new Map();

    private static loadPromise: Promise<void> = Promise.resolve();

    /** Re-read the workspace; called once per run, by its first stage. */
    static load(workspace: Workspace | undefined): Promise<void> {
        this.textures = new Map();
        this.sounds = new Map();
        this.fonts = new Map();
        if (!workspace) return this.loadPromise = Promise.resolve();

        const loads: Promise<void>[] = [];
        for (const file of workspace.getFiles()) {
            if (file.isFolder || !isAssetFile(file)) continue;
            const path = normalize([...workspace.getPath(file), file.name].join("/"));
            const dataUrl = file.getText();
            const mime = mimeOf(dataUrl);

            if (mime.startsWith("image/")) {
                loads.push(this.texture(dataUrl).then(
                    texture => { this.textures.set(path, texture); },
                    e => console.warn(`Scratch: could not load image '${path}'`, e)));
            } else if (mime.startsWith("audio/") || mime === "application/ogg") {
                this.sounds.set(path, { url: dataUrl, format: audioFormat(mime, path) });
            } else if (mime.startsWith("font/") || /\.(ttf|otf|woff2?)$/i.test(path)) {
                loads.push(this.font(dataUrl).then(
                    family => { this.fonts.set(path, family); },
                    e => console.warn(`Scratch: could not load font '${path}'`, e)));
            }
        }
        return this.loadPromise = Promise.all(loads).then(() => undefined);
    }

    /** Resolves once the files of the current run are decoded. */
    static ready(): Promise<void> {
        return this.loadPromise;
    }

    static getTexture(path: string): PIXI.Texture | undefined {
        return this.textures.get(normalize(path));
    }

    static getSound(path: string): { url: string, format?: string } | undefined {
        return this.sounds.get(normalize(path));
    }

    /** The CSS font family a workspace font file was registered under. */
    static getFontFamily(path: string): string | undefined {
        return this.fonts.get(normalize(path));
    }

    private static texture(dataUrl: string): Promise<PIXI.Texture> {
        let pending = this.textureCache.get(dataUrl);
        if (!pending) {
            pending = PIXI.Assets.load<PIXI.Texture>({ src: dataUrl, loadParser: "loadTextures" }).then(texture => {
                if (!texture) throw new Error("The file is not a supported image");
                texture.source.minFilter = "linear";
                texture.source.magFilter = "linear";
                return texture;
            });
            this.textureCache.set(dataUrl, pending);
            pending.catch(() => this.textureCache.delete(dataUrl));
        }
        return pending;
    }

    private static font(dataUrl: string): Promise<string> {
        let pending = this.fontCache.get(dataUrl);
        if (!pending) {
            const family = "ScratchWorkspaceFont" + this.fontCache.size;
            pending = (async () => {
                const face = new FontFace(family, `url(${dataUrl})`);
                await face.load();
                (document as any).fonts.add(face);
                return family;
            })();
            this.fontCache.set(dataUrl, pending);
            pending.catch(() => this.fontCache.delete(dataUrl));
        }
        return pending;
    }
}

/** "./a/b.png", "/a/b.png" and "a/b.png" all name the same file. */
function normalize(path: string): string {
    return path.replace(/^\.\//, "").replace(/^\/+/, "");
}

function mimeOf(dataUrl: string): string {
    const match = /^data:([^;,]*)/.exec(dataUrl);
    return (match?.[1] ?? "").toLowerCase();
}

/**
 * Howler picks a codec by file extension, and a data URL has none it can read
 * reliably ("audio/x-wav" is not a codec name), so it is told the format.
 */
function audioFormat(mime: string, path: string): string | undefined {
    const subtype = mime.substring(mime.indexOf("/") + 1);
    switch (subtype) {
        case "wav": case "wave": case "x-wav": case "vnd.wave": return "wav";
        case "mpeg": case "mp3": return "mp3";
        case "ogg": case "vorbis": return "ogg";
        case "opus": return "opus";
        case "webm": return "webm";
        case "flac": case "x-flac": return "flac";
        case "mp4": case "aac": case "x-m4a": return "m4a";
    }
    const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
    return extension;
}
